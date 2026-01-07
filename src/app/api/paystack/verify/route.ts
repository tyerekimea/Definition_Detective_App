import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Verify transaction with Paystack
    const result = await verifyTransaction(reference);

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', status: result.data.status },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const { metadata } = result.data;
    const userId = metadata.userId;

    // Update user based on payment type
    if (metadata.type === 'subscription') {
      // Handle subscription payment
      await firestore.collection('userProfiles').doc(userId).update({
        subscriptionStatus: 'active',
        subscriptionReference: reference,
        subscriptionAmount: fromKobo(result.data.amount),
        isPremium: true,
        updatedAt: new Date(),
      });
    } else if (metadata.type === 'hint_pack') {
      // Handle hint pack purchase
      const hintsToAdd = metadata.hints || 0;
      await firestore.collection('userProfiles').doc(userId).update({
        hints: FieldValue.increment(hintsToAdd),
        updatedAt: new Date(),
      });
    }

    // Store transaction record
    await firestore.collection('transactions').add({
      userId,
      reference,
      amount: fromKobo(result.data.amount),
      type: metadata.type,
      status: 'success',
      paystackData: result.data,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: result.data,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
