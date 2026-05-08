// Mock implementation for admin-actions.ts - used during mobile builds

export async function grantPremiumAccess(userId: string, adminEmail: string) {
  console.warn('[Mobile] Premium access grant not available in offline mode');
  return { success: false, message: 'Admin features not available offline' };
}

export async function addHintsToUser(userId: string, hintsToAdd: number, adminEmail: string) {
  console.warn('[Mobile] Add hints not available in offline mode');
  return { success: false, message: 'Admin features not available offline' };
}

export async function getAllUsers(adminEmail: string) {
  console.warn('[Mobile] Get all users not available in offline mode');
  return [];
}

export async function getUserStats(adminEmail: string) {
  console.warn('[Mobile] Get user stats not available in offline mode');
  return { totalUsers: 0, premiumUsers: 0, totalRevenue: 0 };
}

export async function getRecentTransactions(adminEmail: string, limit = 50) {
  console.warn('[Mobile] Get recent transactions not available in offline mode');
  return [];
}

export async function updateUserProfile(userId: string, updates: any, adminEmail: string) {
  console.warn('[Mobile] Update user profile not available in offline mode');
  return { success: false, message: 'Admin features not available offline' };
}

export async function deleteUserAccount(userId: string, adminEmail: string) {
  console.warn('[Mobile] Delete user account not available in offline mode');
  return { success: false, message: 'Admin features not available offline' };
}

export async function setAdminClaims(userId: string, adminEmail: string) {
  console.warn('[Mobile] Set admin claims not available in offline mode');
  return { success: false, message: 'Admin features not available offline' };
}

export async function logUserAction(userId: string | null, action: string, details?: any): Promise<void> {
  console.warn('[Mobile] Admin action logging not available in offline mode');
}

export async function trackEvent(eventName: string, data?: any): Promise<void> {
  console.warn('[Mobile] Event tracking not available in offline mode');
}

