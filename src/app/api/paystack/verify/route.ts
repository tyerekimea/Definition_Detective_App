import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { calculateSubscriptionEndDate, inferSubscriptionPlan, parseDateLike } from '@/lib/subscription';

const BASE_VERIFY_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-user-id',
  'Access-Control-Max-Age': '86400',
};

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, '');
}

function getAllowedOrigins(): Set<string> {
  const explicit = process.env.PAYSTACK_VERIFY_ALLOWED_ORIGINS
    ?.split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  if (explicit?.length) {
    return new Set(explicit);
  }

  return new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_API_BASE_URL,
      'https://traylapps.com',
      'https://www.traylapps.com',
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeOrigin(value))
  );
}

const ALLOWED_VERIFY_ORIGINS = getAllowedOrigins();

function resolveAllowedOrigin(req: NextRequest): string | null {
  const requestOrigin = req.headers.get('origin');
  if (!requestOrigin) {
    return null;
  }
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  return ALLOWED_VERIFY_ORIGINS.has(normalizedOrigin) ? normalizedOrigin : null;
}

function addCorsHeaders(response: NextResponse, allowedOrigin: string | null) {
  Object.entries(BASE_VERIFY_CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('Vary', 'Origin');
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }
}

function jsonWithCors(
  body: unknown,
  allowedOrigin: string | null,
  init?: { status?: number }
) {
  const response = NextResponse.json(body, init);
  addCorsHeaders(response, allowedOrigin);
  return response;
}

export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get('origin');
  const allowedOrigin = resolveAllowedOrigin(req);

  if (requestOrigin && !allowedOrigin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });
  addCorsHeaders(response, allowedOrigin);
  return response;
}

/**
 * Payment Verification Endpoint
 * 
 * SECURITY: Requires Firebase ID token for authentication
 * Only the authenticated user can verify their own payments
 * 
 * Usage:
 * GET /api/paystack/verify?reference=<REFERENCE>
 * Header: Authorization: Bearer <FIREBASE_ID_TOKEN>
 */
export async function GET(req: NextRequest) {
  const requestOrigin = req.headers.get('origin');
  const allowedOrigin = resolveAllowedOrigin(req);

  if (requestOrigin && !allowedOrigin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  console.log('🔍 [VERIFY] Payment verification request:', reference);

  // ✅ SECURITY FIX #1: Validate reference parameter
  if (!reference) {
    console.error('❌ [VERIFY] No reference provided');
    return jsonWithCors({ error: 'Reference is required' }, allowedOrigin, { status: 400 });
  }

  try {
    // ✅ SECURITY FIX #2: Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [VERIFY] Missing or invalid authorization header');
      return jsonWithCors(
        { error: 'Unauthorized - authentication token required' },
        allowedOrigin,
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(token);
      console.log('✅ [VERIFY] Token verified for user:', decodedToken.uid);
    } catch (tokenError: any) {
      console.error('❌ [VERIFY] Token verification failed:', tokenError.message);
      return jsonWithCors(
        { error: 'Invalid or expired token' },
        allowedOrigin,
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX #3: Use authenticated user ID from token
    const authenticatedUserId = decodedToken.uid;
    console.log('👤 [VERIFY] Authenticated user:', authenticatedUserId);

    // Add retry logic for Paystack verification (3 attempts with backoff)
    let result;
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        console.log(`🔄 [VERIFY] Attempt ${retries + 1}/${maxRetries} to verify with Paystack`);
        result = await verifyTransaction(reference);
        console.log('✅ [VERIFY] Paystack verification successful');
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [VERIFY] Attempt ${retries + 1} failed:`, error.message);
        retries++;
        if (retries < maxRetries) {
          // Exponential backoff: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, retries * 1000));
        }
      }
    }

    if (!result) {
      console.error('❌ [VERIFY] All verification attempts failed');
      throw lastError || new Error('Failed to verify transaction after retries');
    }

    console.log('📊 [VERIFY] Payment status:', result.data.status);

    if (result.data.status !== 'success') {
      console.error('❌ [VERIFY] Payment not successful:', result.data.status);
      return jsonWithCors(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
        },
        allowedOrigin,
        { status: 400 }
      );
    }

    console.log('💾 [VERIFY] Initializing Firestore...');
    const firestore = getFirestore();
    const { metadata } = result.data;
    const paymentUserId = metadata?.userId;

    console.log('📦 [VERIFY] Payment metadata:', JSON.stringify(metadata, null, 2));

    // ✅ SECURITY FIX #4: Validate metadata has user ID
    if (!paymentUserId) {
      console.error('❌ [VERIFY] Missing userId in metadata:', metadata);
      return jsonWithCors(
        { error: 'Invalid payment metadata' },
        allowedOrigin,
        { status: 400 }
      );
    }

    // ✅ SECURITY FIX #5: Verify that authenticated user matches payment user
    // Only a user can verify their own payment
    if (authenticatedUserId !== paymentUserId) {
      console.error(
        '❌ [VERIFY] User mismatch:',
        `Authenticated: ${authenticatedUserId}, Payment: ${paymentUserId}`
      );
      return jsonWithCors(
        { error: 'Cannot verify another user\'s payment' },
        allowedOrigin,
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    console.log('💳 [VERIFY] Payment details:', { amount, paymentType, userId: paymentUserId });

    // Update user profile based on payment type
    try {
      if (paymentType === 'subscription') {
        let subscriptionPlan = inferSubscriptionPlan(
          metadata?.plan ?? metadata?.interval,
          amount
        );
        if (!subscriptionPlan) {
          subscriptionPlan = 'monthly';
          console.warn('⚠️ [VERIFY] Missing/invalid subscription plan. Inferred:', subscriptionPlan);
        }

        const subscriptionStartDate = parseDateLike(result.data.paid_at) || new Date();
        const subscriptionEndDate = calculateSubscriptionEndDate(subscriptionStartDate, subscriptionPlan);

        await firestore.collection('userProfiles').doc(paymentUserId).set({
          subscriptionStatus: 'active',
          subscriptionReference: reference,
          isPremium: true,
          subscriptionAmount: amount,
          subscriptionPlan,
          subscriptionStartDate: subscriptionStartDate.toISOString(),
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          updatedAt: new Date(),
        }, { merge: true });

        console.log('✅ [VERIFY] Premium subscription granted');
      } else if (paymentType === 'hint_pack') {
        const hintsToAdd = metadata.hints || 0;
        
        if (hintsToAdd > 0) {
          await firestore.collection('userProfiles').doc(paymentUserId).update({
            hints: FieldValue.increment(hintsToAdd),
            hintsLastUpdated: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ [VERIFY] Added ${hintsToAdd} hints`);
        }
      } else {
        console.warn('⚠️ [VERIFY] Unknown payment type:', paymentType);
      }

      // Log transaction
      await firestore.collection('transactions').add({
        userId: paymentUserId,
        reference,
        amount,
        type: paymentType,
        status: 'success',
        source: 'verify_api',
        customerEmail: result.data.customer?.email,
        createdAt: new Date(),
      });

      console.log('✅ [VERIFY] Payment verification completed successfully');
    } catch (dbError: any) {
      console.error('❌ [VERIFY] Database error:', dbError.message);
      
      // Store failed webhook for retry
      try {
        await firestore.collection('failedWebhooks').add({
          reference,
          event: 'verify_api_failure',
          data: result.data,
          error: dbError.message,
          createdAt: new Date(),
          retryCount: 0,
        });
      } catch (e) {
        console.error('❌ [VERIFY] Failed to log error:', e);
      }

      return jsonWithCors(
        { error: 'Failed to process payment' },
        allowedOrigin,
        { status: 500 }
      );
    }

    return jsonWithCors({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        reference,
        amount,
        type: paymentType,
      },
    }, allowedOrigin);
  } catch (error: any) {
    console.error('❌ [VERIFY] Unexpected error:', error.message);
    return jsonWithCors(
      { error: 'Internal server error' },
      allowedOrigin,
      { status: 500 }
    );
  }
}
