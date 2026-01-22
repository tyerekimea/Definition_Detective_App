/**
 * Admin User Management
 * Handles super admin privileges and access control
 */

// Super admin email addresses
const SUPER_ADMINS = [
  'admin@definitiondetective.com',
  'tyerekimea@gmail.com', // Add your email here
  // Add more admin emails as needed
];

// Admin user IDs (Firebase UIDs)
const ADMIN_USER_IDS = [
  // Add Firebase UIDs here for additional security
  // Example: 'abc123xyz456'
];

/**
 * Check if user is a super admin by email
 */
export function isAdminByEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMINS.includes(email.toLowerCase());
}

/**
 * Check if user is a super admin by UID
 */
export function isAdminByUid(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return ADMIN_USER_IDS.includes(uid);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: { email?: string | null; uid?: string | null } | null): boolean {
  if (!user) return false;
  return isAdminByEmail(user.email) || isAdminByUid(user.uid);
}

/**
 * Admin permissions
 */
export const AdminPermissions = {
  // User management
  VIEW_ALL_USERS: 'view_all_users',
  EDIT_USER_PROFILE: 'edit_user_profile',
  DELETE_USER: 'delete_user',
  GRANT_PREMIUM: 'grant_premium',
  ADD_HINTS: 'add_hints',
  
  // Game management
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_WORDS: 'manage_words',
  VIEW_TRANSACTIONS: 'view_transactions',
  
  // System
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  MANAGE_ADMINS: 'manage_admins',
} as const;

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: { email?: string | null; uid?: string | null } | null,
  permission: string
): boolean {
  // Only admins have permissions
  return isAdmin(user);
}

/**
 * Get admin level
 */
export function getAdminLevel(user: { email?: string | null; uid?: string | null } | null): 'super' | 'none' {
  if (isAdmin(user)) return 'super';
  return 'none';
}
