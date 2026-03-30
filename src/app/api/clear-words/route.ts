import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { clearUserWordHistory } from '@/lib/word-generator';

/**
 * Clear User Word History Endpoint
 * 
 * SECURITY: Requires Firebase ID token for authentication
 * Users can only clear their own word history, not others'
 * 
 * Usage:
 * POST /api/clear-words
 * Header: Authorization: Bearer <FIREBASE_ID_TOKEN>
 * Body: { userId: "user_id_to_clear" }
 * 
 * NOTE: userId in body must match authenticated user UID
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY FIX #1: Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[clear-words] Unauthorized attempt - missing token');
      return NextResponse.json(
        { success: false, message: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (tokenError: any) {
      console.warn('[clear-words] Token verification failed:', tokenError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX #2: Get authenticated user ID from token
    const authenticatedUserId = decodedToken.uid;
    console.log(`[clear-words] Authenticated user: ${authenticatedUserId}`);

    // Parse and validate request body
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    // ✅ SECURITY FIX #3: Authorization - verify user can only clear their own data
    if (userId !== authenticatedUserId) {
      console.warn(
        `[clear-words] Unauthorized attempt: user ${authenticatedUserId} tried to clear data for ${userId}`
      );
      return NextResponse.json(
        { success: false, message: 'Cannot clear another user\'s word history' },
        { status: 403 }
      );
    }

    console.log(`[clear-words] Clearing word history for user: ${userId}`);
    
    // ✅ SECURITY FIX #4: Only clear after all validations pass
    const result = await clearUserWordHistory(userId);
    
    console.log(`[clear-words] Successfully cleared history for user: ${userId}`);
    return NextResponse.json({
      success: true,
      message: 'Word history cleared successfully',
      userId,
    });
  } catch (error: any) {
    console.error('[clear-words] Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
