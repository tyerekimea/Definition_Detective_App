'use server';

import { getAuth, getFirestore, FieldValue } from '@/lib/firebase-admin';
import { isAdmin } from './admin';

/**
 * Grant premium access to a user
 */
export async function grantPremiumAccess(userId: string, adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  
  await firestore.collection('userProfiles').doc(userId).set({
    isPremium: true,
    subscriptionStatus: 'active',
    subscriptionReference: `ADMIN_GRANT_${Date.now()}`,
    grantedBy: adminEmail,
    grantedAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  return { success: true, message: 'Premium access granted' };
}

/**
 * Add hints to a user
 */
export async function addHintsToUser(userId: string, hintsToAdd: number, adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  
  await firestore.collection('userProfiles').doc(userId).update({
    hints: FieldValue.increment(hintsToAdd),
    hintsLastUpdated: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, message: `Added ${hintsToAdd} hints` };
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  const usersSnapshot = await firestore.collection('userProfiles').limit(100).get();
  
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return users;
}

/**
 * Get user statistics (admin only)
 */
export async function getUserStats(adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  
  const usersSnapshot = await firestore.collection('userProfiles').get();
  const transactionsSnapshot = await firestore.collection('transactions').get();
  
  const totalUsers = usersSnapshot.size;
  const premiumUsers = usersSnapshot.docs.filter(doc => doc.data().isPremium).length;
  const totalTransactions = transactionsSnapshot.size;
  const totalRevenue = transactionsSnapshot.docs.reduce((sum, doc) => {
    return sum + (doc.data().amount || 0);
  }, 0);

  return {
    totalUsers,
    premiumUsers,
    freeUsers: totalUsers - premiumUsers,
    totalTransactions,
    totalRevenue,
  };
}

/**
 * Get recent transactions (admin only)
 */
export async function getRecentTransactions(adminEmail: string, limit = 50) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  const transactionsSnapshot = await firestore
    .collection('transactions')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  const transactions = transactionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return transactions;
}

/**
 * Update user profile (admin only)
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    isPremium?: boolean;
    hints?: number;
    level?: number;
    score?: number;
  },
  adminEmail: string
) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const firestore = getFirestore();
  
  await firestore.collection('userProfiles').doc(userId).update({
    ...updates,
    updatedAt: new Date(),
    lastModifiedBy: adminEmail,
  });

  return { success: true, message: 'User profile updated' };
}

/**
 * Delete user account (admin only)
 */
export async function deleteUserAccount(userId: string, adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const auth = getAuth();
  const firestore = getFirestore();
  
  // Delete from Firebase Auth
  await auth.deleteUser(userId);
  
  // Delete from Firestore
  await firestore.collection('userProfiles').doc(userId).delete();
  
  // Delete user's transactions
  const transactionsSnapshot = await firestore
    .collection('transactions')
    .where('userId', '==', userId)
    .get();
  
  const batch = firestore.batch();
  transactionsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  return { success: true, message: 'User account deleted' };
}

/**
 * Set custom claims for admin users
 */
export async function setAdminClaims(userId: string, adminEmail: string) {
  // Verify admin
  if (!isAdmin({ email: adminEmail })) {
    throw new Error('Unauthorized: Admin access required');
  }

  const auth = getAuth();
  
  await auth.setCustomUserClaims(userId, {
    admin: true,
    role: 'super_admin',
  });

  return { success: true, message: 'Admin claims set' };
}
