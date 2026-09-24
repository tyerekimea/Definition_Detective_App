import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/verify-auth.server';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  // ✅ Require a real, verified Firebase token — no more trusting x-user-id
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { uid } = auth;

  // Verify the transaction with Paystack
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!paystackRes.ok) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 502 });
  }

  const data = await paystackRes.json();
  const metadataUserId = data?.data?.metadata?.userId;

  // ✅ Confirm the payment actually belongs to the authenticated caller
  if (!metadataUserId || metadataUserId !== uid) {
    console.error('[PAYSTACK] uid mismatch on verify', { uid, metadataUserId, reference });
    return NextResponse.json({ error: 'Reference does not belong to this account' }, { status: 403 });
  }

  if (data?.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not successful' }, { status: 402 });
  }

  // ... proceed to grant premium/hints for `uid` here

  return NextResponse.json({ verified: true });
}
