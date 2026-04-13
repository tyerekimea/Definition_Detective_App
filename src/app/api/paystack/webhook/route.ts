import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import { fromKobo } from '@/lib/paystack';
import { calculateSubscriptionEndDate, inferSubscriptionPlan, parseDateLike } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('[paystack/webhook] Missing PAYSTACK_SECRET_KEY env var');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!signature) {
    console.warn('[paystack/webhook] Missing signature header');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const expectedHash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedHash, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const hasValidLength = expectedBuffer.length === signatureBuffer.length;

  if (!hasValidLength || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    console.warn('[paystack/webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (error: any) {
    console.error('[paystack/webhook] Invalid JSON body', error.message);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const firestore = getFirestore();

  try {
    const { event: eventType, data } = event;

    if (!data || !data.reference || !data.metadata || !data.metadata.userId) {
      console.error('[paystack/webhook] Missing required data in payload', event);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const userId = data.metadata.userId;
    const type = data.metadata.type;
    const amount = fromKobo(data.amount);

    if (eventType === 'charge.success') {
      if (type === 'subscription') {
        let plan = inferSubscriptionPlan(data.metadata.plan ?? data.metadata.interval, amount);
        if (!plan) plan = 'monthly';

        const start = parseDateLike(data.paid_at) || new Date();
        const end = calculateSubscriptionEndDate(start, plan);

        await firestore.collection('userProfiles').doc(userId).set({
          subscriptionStatus: 'active',
          subscriptionReference: data.reference,
          isPremium: true,
          subscriptionAmount: amount,
          subscriptionPlan: plan,
          subscriptionStartDate: start.toISOString(),
          subscriptionEndDate: end.toISOString(),
          updatedAt: new Date(),
        }, { merge: true });
      } else if (type === 'hint_pack') {
        const hintsToAdd = Number(data.metadata.hints) || 0;
        if (hintsToAdd > 0) {
          await firestore.collection('userProfiles').doc(userId).update({
            hints: FieldValue.increment(hintsToAdd),
            hintsLastUpdated: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      await firestore.collection('transactions').add({
        userId,
        reference: data.reference,
        amount,
        type,
        status: 'success',
        source: 'webhook',
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error: any) {
    console.error('[paystack/webhook] Error processing event:', error);

    try {
      await firestore.collection('failedWebhooks').add({
        payload: event,
        error: error.message,
        createdAt: new Date(),
        retryCount: 0,
      });
    } catch (e) {
      console.error('[paystack/webhook] Failed to save failed webhook:', e);
    }

    // Always respond 200 to webhook provider; our app tracks failed events
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
