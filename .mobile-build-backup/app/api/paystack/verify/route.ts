import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  console.log('🔍 [VERIFY] Payment verification request:', reference);

  if (!reference) {
    console.error('❌ [VERIFY] No reference provided');
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    // Get user ID from header (set by client)
    const userId = req.headers.get('x-user-id');
    console.log('👤 [VERIFY] User ID from header:', userId);

    // Add retry logic for Paystack verification
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
          await new Promise(resolve => setTimeout(resolve, 1000));
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
          data: result.data
        },
        { status: 400 }
      );
    }

    console.log('💾 [VERIFY] Initializing Firestore...');
    const firestore = getFirestore();
    const { metadata } = result.data;
    const paymentUserId = metadata?.userId;

    console.log('📦 [VERIFY] Payment metadata:', JSON.stringify(metadata, null, 2));

    // Validate metadata
    if (!paymentUserId) {
      console.error('❌ [VERIFY] Missing userId in metadata:', metadata);
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // If user ID header is provided, verify it matches
    if (userId && userId !== paymentUserId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    console.log('💳 [VERIFY] Payment details:', { amount, paymentType, userId: paymentUserId });

    if (!paymentType) {
      console.error('❌ [VERIFY] Missing payment type');
      return NextResponse.json(
        { error: 'Unknown payment type' },
        { status: 400 }
      );
    }

    // Update user based on payment type
    try {
      if (paymentType === 'subscription') {
        console.log('👑 [VERIFY] Granting premium access...');
        await firestore.collection('userProfiles').doc(paymentUserId).set({
          subscriptionStatus: 'active',
          subscriptionReference: reference,
          subscriptionAmount: amount,
          isPremium: true,
          updatedAt: new Date(),
        }, { merge: true });
        console.log('✅ [VERIFY] Premium access granted');
      } else if (paymentType === 'hint_pack') {
        const hintsToAdd = metadata.hints || 0;
        console.log(`💡 [VERIFY] Adding ${hintsToAdd} hints to user ${paymentUserId}...`);
        
        // Use set with merge instead of update to avoid errors if document doesn't exist
        const userRef = firestore.collection('userProfiles').doc(paymentUserId);
        const userDoc = await userRef.get();
        const currentHints = userDoc.data()?.hints || 0;
        
        await userRef.set({
          hints: currentHints + hintsToAdd,
          hintsLastUpdated: new Date(),
          updatedAt: new Date(),
        }, { merge: true });
        
        console.log(`✅ [VERIFY] Hints updated. Previous: ${currentHints}, Added: ${hintsToAdd}, New total: ${currentHints + hintsToAdd}`);
      } else {
        console.error('❌ [VERIFY] Unknown payment type:', paymentType);
        return NextResponse.json(
          { error: 'Unknown payment type: ' + paymentType },
          { status: 400 }
        );
      }

      // Store transaction record
      console.log('📝 [VERIFY] Recording transaction...');
      await firestore.collection('transactions').add({
        userId: paymentUserId,
        reference,
        amount,
        type: paymentType,
        status: 'success',
        verifiedAt: new Date(),
        verifiedBy: 'api',
        createdAt: new Date(),
      });
      console.log('✅ [VERIFY] Transaction recorded');

      console.log('🎉 [VERIFY] Payment processing complete!');

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference,
          amount,
          type: paymentType,
          status: result.data.status,
        },
      });
    } catch (dbError: any) {
      console.error('❌ [VERIFY] Database error:', dbError);
      console.error('❌ [VERIFY] Error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify payment',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
