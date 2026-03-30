import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from '@/lib/firebase-admin';

/**
 * Clear Current User's Word History
 * 
 * SECURITY: Requires Firebase ID token for authentication
 * Users can only clear their own data
 * 
 * Usage:
 * POST /api/clear-my-words
 * Header: Authorization: Bearer <FIREBASE_ID_TOKEN>
 * 
 * NOTE: This endpoint uses the authenticated user's ID from the token,
 * so no userId parameter is needed or accepted
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY FIX #1: Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[clear-my-words] Unauthorized attempt - missing token');
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
      console.warn('[clear-my-words] Token verification failed:', tokenError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX #2: Get authenticated user ID directly from token
    // This prevents any user spoofing attempts
    const userId = decodedToken.uid;
    console.log(`[clear-my-words] Clearing history for user: ${userId}`);

    try {
      // ✅ SECURITY FIX #3: Use authenticated user ID directly (no parameters accepted)
      const firestore = getFirestore();
      const userProfileRef = firestore.collection('userProfiles').doc(userId);
      
      // Update the main user profile document
      await userProfileRef.update({
        usedWords: [],
        wordHistoryCleared: new Date(),
      });

      // Delete all documents in the usedWords subcollection
      const usedWordsRef = userProfileRef.collection('usedWords');
      const pageSize = 50;
      let deletedCount = 0;

      while (true) {
        const snapshot = await usedWordsRef.limit(pageSize).get();
        if (snapshot.empty) break;

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
      }

      console.log(`[clear-my-words] Cleared ${deletedCount} word records for user: ${userId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Your word history has been cleared successfully',
        userId,
        deletedRecords: deletedCount,
      });
    } catch (dbError: any) {
      console.error('[clear-my-words] Database error:', dbError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to clear word history' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[clear-my-words] Unexpected error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Alternative GET endpoint for backward compatibility
 * Supports both Bearer token and query parameter token
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY FIX #1: Try authorization header first (preferred)
    let token = '';
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      // Fallback to query parameter (less secure but for backward compatibility)
      const searchParams = request.nextUrl.searchParams;
      token = searchParams.get('token') || '';
    }

    if (!token) {
      console.warn('[clear-my-words] GET Unauthorized - no token provided');
      return NextResponse.json(
        { success: false, message: 'Unauthorized - authentication token required' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX #2: Verify the token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (tokenError: any) {
      console.warn('[clear-my-words] GET Token verification failed:', tokenError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX #3: Get authenticated user ID from token
    const userId = decodedToken.uid;
    console.log(`[clear-my-words] GET: Clearing history for user: ${userId}`);

    try {
      const firestore = getFirestore();
      const userProfileRef = firestore.collection('userProfiles').doc(userId);
      
      // Update the main user profile document
      await userProfileRef.update({
        usedWords: [],
        wordHistoryCleared: new Date(),
      });

      // Delete all documents in the usedWords subcollection
      const usedWordsRef = userProfileRef.collection('usedWords');
      const pageSize = 50;
      let deletedCount = 0;

      while (true) {
        const snapshot = await usedWordsRef.limit(pageSize).get();
        if (snapshot.empty) break;

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
      }

      console.log(`[clear-my-words] GET: Cleared ${deletedCount} word records for user: ${userId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Your word history has been cleared successfully',
        userId,
        deletedRecords: deletedCount,
      });
    } catch (dbError: any) {
      console.error('[clear-my-words] GET Database error:', dbError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to clear word history' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[clear-my-words] GET Unexpected error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
