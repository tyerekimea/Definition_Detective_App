#!/usr/bin/env tsx

/**
 * Create Super Admin User
 * 
 * This script creates a super admin user with full privileges
 * 
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password>
 * 
 * Example:
 *   npx tsx scripts/create-admin.ts admin@definitiondetective.com SecurePassword123!
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} catch (error) {
  console.log('Firebase already initialized or error:', error);
}

async function createAdminUser(email: string, password: string) {
  const auth = getAuth();
  const firestore = getFirestore();

  try {
    console.log('🔐 Creating super admin user...');
    console.log('Email:', email);

    // Create user in Firebase Auth
    let user;
    try {
      user = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'Super Admin',
      });
      console.log('✅ User created in Firebase Auth');
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  User already exists, fetching...');
        user = await auth.getUserByEmail(email);
      } else {
        throw error;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      admin: true,
      role: 'super_admin',
    });
    console.log('✅ Admin claims set');

    // Create/update user profile in Firestore
    await firestore.collection('userProfiles').doc(user.uid).set({
      email,
      displayName: 'Super Admin',
      isPremium: true,
      isAdmin: true,
      role: 'super_admin',
      hints: 999999,
      level: 1,
      score: 0,
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    console.log('✅ User profile created in Firestore');

    console.log('\n🎉 Super admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log('   UID:', user.uid);
    console.log('   Email:', email);
    console.log('   Role: Super Admin');
    console.log('   Premium: Yes');
    console.log('   Hints: 999,999');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🌐 Admin Dashboard:');
    console.log('   https://definition-detective-app.vercel.app/admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx tsx scripts/create-admin.ts <email> <password>');
  console.log('Example: npx tsx scripts/create-admin.ts admin@example.com SecurePass123!');
  process.exit(1);
}

const [email, password] = args;

// Validate email
if (!email.includes('@')) {
  console.error('❌ Invalid email address');
  process.exit(1);
}

// Validate password
if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

// Create admin user
createAdminUser(email, password)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
