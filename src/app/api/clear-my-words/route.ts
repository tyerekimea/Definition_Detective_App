import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/verify-auth.server';

export async function POST(req: NextRequest) {
  // ✅ requireAuth fully verifies the token signature/expiry via Firebase Admin,
  // it doesn't just check the header is present
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { uid } = auth;

  // No userId needed from the body at all — always act on the authenticated uid
  // ... proceed with clearing word history for `uid` here

  return NextResponse.json({ cleared: true });
}
