import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

let app: App | undefined;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      console.log('🔧 Initializing Firebase Admin...', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
      });

      if (!projectId) {
        throw new Error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      }

      // If credentials are missing, try default initialization
      if (!clientEmail || !privateKey) {
        console.warn('⚠️  Missing Firebase credentials, using default initialization');
        app = initializeApp();
      } else {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }

      // Configure Firestore
      getAdminFirestore(app).settings({ ignoreUndefinedProperties: true });

      console.log('✅ Firebase Admin initialized successfully');
    } catch (error: any) {
      console.error('❌ Firebase Admin initialization failed:', error.message);
      throw error;
    }
  } else {
    app = getApps()[0];
  }
  
  return app;
}

// Initialize on import
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin on import:', error);
}

// Export Firestore instance
export function getFirestore() {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return getAdminFirestore(app!);
}

// Export Auth instance
export function getAuth() {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return getAdminAuth(app!);
}

// Legacy export for compatibility
export function initFirestore() {
  return initializeFirebaseAdmin();
}

export { FieldValue } from 'firebase-admin/firestore';
