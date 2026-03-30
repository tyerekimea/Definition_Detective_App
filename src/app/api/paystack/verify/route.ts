import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { calculateSubscriptionEndDate, inferSubscriptionPlan, parseDateLike } from '@/lib/subscription';

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
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  console.log('🔍 [VERIFY] Payment verification request:', reference);

  // ✅ SECURITY FIX #1: Validate reference parameter
  if (!reference) {
    console.error('❌ [VERIFY] No reference provided');
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    // ✅ SECURITY FIX #2: Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [VERIFY] Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - authentication token required' },
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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
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
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
        },
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
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
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
      return NextResponse.json(
        { error: 'Cannot verify another user\'s payment' },
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

      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        reference,
        amount,
        type: paymentType,
      },
    });
  } catch (error: any) {
    console.error('❌ [VERIFY] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
