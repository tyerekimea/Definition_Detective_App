import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

/**
 * API Route to clear current user's word history
 * 
 * Usage: GET /api/clear-my-words?token=FIREBASE_ID_TOKEN
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Firebase ID token required' },
        { status: 401 }
      );
    }
    
    // Verify the token and get user ID
    initAdminApp();
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Clear the user's word history
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    
    await userProfileRef.update({
      usedWords: [],
    });
    
    return NextResponse.json({
      success: true,
      message: 'Word history cleared successfully',
      userId: userId,
    });
  } catch (error: any) {
    console.error('[clear-my-words] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
