import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import { fromKobo } from '@/lib/paystack';

/**
 * Paystack Webhook Handler
 * 
 * This endpoint receives payment notifications from Paystack
 * URL: https://definition-detective-app.vercel.app/api/pay
 * 
 * Events handled:
 * - charge.success: Payment completed successfully
 * - subscription.disable: Subscription cancelled
 * - subscription.not_renew: Subscription not renewing
 */
export async function POST(req: NextRequest) {
  console.log('🔔 [WEBHOOK] Received Paystack webhook');
  
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    console.log('🔐 [WEBHOOK] Verifying signature...');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('❌ [WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ [WEBHOOK] Signature verified');

    const event = JSON.parse(body);
    const firestore = getFirestore();

    console.log('📨 [WEBHOOK] Event type:', event.event);
    console.log('📦 [WEBHOOK] Event data:', JSON.stringify(event.data, null, 2));

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, amount, customer } = event.data;
        const userId = metadata?.userId;

        console.log('💰 [WEBHOOK] Processing successful charge');
        console.log('📋 [WEBHOOK] Reference:', reference);
        console.log('👤 [WEBHOOK] User ID:', userId);

        if (!userId) {
          console.error('❌ [WEBHOOK] Missing userId in metadata:', metadata);
          return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
        }

        const paymentType = metadata.type;
        console.log('🏷️  [WEBHOOK] Payment type:', paymentType);

        try {
          if (paymentType === 'subscription') {
            console.log('👑 [WEBHOOK] Granting premium subscription...');
            await firestore.collection('userProfiles').doc(userId).set({
              subscriptionStatus: 'active',
              subscriptionReference: reference,
              isPremium: true,
              subscriptionAmount: fromKobo(amount),
              updatedAt: new Date(),
            }, { merge: true });
            console.log('✅ [WEBHOOK] Premium subscription granted');
          } else if (paymentType === 'hint_pack') {
            const hintsToAdd = metadata.hints || 0;
            console.log(`💡 [WEBHOOK] Adding ${hintsToAdd} hints to user ${userId}...`);
            
            // Get current hints
            const userRef = firestore.collection('userProfiles').doc(userId);
            const userDoc = await userRef.get();
            const currentHints = userDoc.data()?.hints || 0;
            
            await userRef.set({
              hints: currentHints + hintsToAdd,
              hintsLastUpdated: new Date(),
              updatedAt: new Date(),
            }, { merge: true });
            
            console.log(`✅ [WEBHOOK] Hints added. Previous: ${currentHints}, Added: ${hintsToAdd}, New total: ${currentHints + hintsToAdd}`);
          } else {
            console.warn('⚠️  [WEBHOOK] Unknown payment type:', paymentType);
          }

          // Log transaction
          console.log('📝 [WEBHOOK] Recording transaction...');
          await firestore.collection('transactions').add({
            userId,
            reference,
            amount: fromKobo(amount),
            type: paymentType,
            status: 'success',
            source: 'webhook',
            customerEmail: customer?.email,
            paystackData: event.data,
            createdAt: new Date(),
          });
          console.log('✅ [WEBHOOK] Transaction recorded');

          console.log('🎉 [WEBHOOK] Payment webhook processed successfully');
        } catch (dbError: any) {
          console.error('❌ [WEBHOOK] Database error:', dbError);
          console.error('❌ [WEBHOOK] Error details:', {
            message: dbError.message,
            code: dbError.code,
            stack: dbError.stack,
          });
          
          // Store failed webhook event for retry
          await firestore.collection('failedWebhooks').add({
            reference,
            event: event.event,
            data: event.data,
            error: dbError.message,
            createdAt: new Date(),
            retryCount: 0,
          });
          
          throw dbError;
        }
        break;
      }

      case 'subscription.disable': {
        const { subscription_code, customer } = event.data;
        
        console.log('🚫 [WEBHOOK] Processing subscription disable');
        console.log('📋 [WEBHOOK] Subscription code:', subscription_code);
        
        try {
          // Find user by subscription code
          const usersSnapshot = await firestore
            .collection('userProfiles')
            .where('subscriptionReference', '==', subscription_code)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.set({
              subscriptionStatus: 'canceled',
              isPremium: false,
              updatedAt: new Date(),
            }, { merge: true });
            console.log('✅ [WEBHOOK] Subscription disabled for user:', userDoc.id);
          } else {
            console.warn('⚠️  [WEBHOOK] User not found for subscription:', subscription_code);
          }
        } catch (error: any) {
          console.error('❌ [WEBHOOK] Error processing subscription.disable:', error);
          throw error;
        }
        break;
      }

      case 'subscription.not_renew': {
        const { subscription_code } = event.data;
        
        console.log('⏰ [WEBHOOK] Processing subscription not renewing');
        console.log('📋 [WEBHOOK] Subscription code:', subscription_code);
        
        try {
          const usersSnapshot = await firestore
            .collection('userProfiles')
            .where('subscriptionReference', '==', subscription_code)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.set({
              subscriptionStatus: 'expiring',
              updatedAt: new Date(),
            }, { merge: true });
            console.log('✅ [WEBHOOK] Subscription marked as expiring:', userDoc.id);
          }
        } catch (error: any) {
          console.error('❌ [WEBHOOK] Error processing subscription.not_renew:', error);
          throw error;
        }
        break;
      }

      default:
        console.log('ℹ️  [WEBHOOK] Unhandled event type:', event.event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Error:', error);
    console.error('❌ [WEBHOOK] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    
    // Return 200 to acknowledge webhook even if there's an error
    // Paystack will retry failed webhooks
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Paystack Webhook Endpoint',
    url: 'https://definition-detective-app.vercel.app/api/pay',
    methods: ['POST'],
    events: [
      'charge.success',
      'subscription.disable',
      'subscription.not_renew',
    ],
  });
}
