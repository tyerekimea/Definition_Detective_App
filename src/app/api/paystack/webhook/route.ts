import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fromKobo } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const firestore = getFirestore();

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, amount, customer } = event.data;
        const userId = metadata.userId;

        if (metadata.type === 'subscription') {
          await firestore.collection('userProfiles').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionReference: reference,
            isPremium: true,
            updatedAt: new Date(),
          });
        } else if (metadata.type === 'hint_pack') {
          const hintsToAdd = metadata.hints || 0;
          await firestore.collection('userProfiles').doc(userId).update({
            hints: FieldValue.increment(hintsToAdd),
            updatedAt: new Date(),
          });
        }

        // Log transaction
        await firestore.collection('transactions').add({
          userId,
          reference,
          amount: fromKobo(amount),
          type: metadata.type,
          status: 'success',
          customerEmail: customer.email,
          createdAt: new Date(),
        });
        break;
      }

      case 'subscription.disable': {
        const { subscription_code, customer } = event.data;
        
        // Find user by subscription code
        const usersSnapshot = await firestore
          .collection('userProfiles')
          .where('subscriptionReference', '==', subscription_code)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'canceled',
            isPremium: false,
            updatedAt: new Date(),
          });
        }
        break;
      }

      case 'subscription.not_renew': {
        // Handle subscription not renewing
        const { subscription_code } = event.data;
        
        const usersSnapshot = await firestore
          .collection('userProfiles')
          .where('subscriptionReference', '==', subscription_code)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'expiring',
            updatedAt: new Date(),
          });
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
