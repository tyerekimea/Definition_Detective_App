import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/verify-auth.server';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { uid } = auth;

  const body = await req.json().catch(() => null);
  const targetUserId = body?.userId;

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // ✅ Callers can only clear their own word history — never someone else's
  if (targetUserId !== uid) {
    return NextResponse.json(
      { error: "Cannot clear another user's data" },
      { status: 403 }
    );
  }

  // ... proceed with clearing word history for `uid` here

  return NextResponse.json({ cleared: true });
}
