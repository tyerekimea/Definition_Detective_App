import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * Returns the authenticated uid, or a 401 NextResponse if verification fails.
 *
 * Usage in a route:
 *   const auth = await requireAuth(req);
 *   if (auth instanceof NextResponse) return auth; // request was rejected
 *   const { uid } = auth;
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch (err) {
    // Don't leak why verification failed (expired vs malformed vs revoked)
    console.error('[AUTH] Token verification failed:', {
      message: (err as Error).message,
    });
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

/**
 * Timing-safe comparison for shared-secret checks (webhook retry secrets etc).
 * Use instead of `a === b` to avoid leaking match length via response timing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
