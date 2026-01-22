# 👑 Super Admin Setup Guide

## Overview

This guide will help you create and manage super admin users with full access to the Definition Detective game.

---

## Quick Setup (3 Steps)

### Step 1: Update Admin Email List

Edit `src/lib/admin.ts` and add your email:

```typescript
const SUPER_ADMINS = [
  'admin@definitiondetective.com',
  'your-email@gmail.com', // Add your email here
];
```

### Step 2: Create Admin User

Run the creation script:

```bash
npx tsx scripts/create-admin.ts your-email@gmail.com YourSecurePassword123!
```

### Step 3: Deploy

```bash
git add .
git commit -m "Add admin user"
git push origin main
vercel --prod
```

---

## Admin Features

### Dashboard Access

**URL:** https://definition-detective-app.vercel.app/admin

**Features:**
- 📊 View user statistics
- 👥 Manage all users
- 💰 View transactions
- 🎁 Grant premium access
- 💡 Add hints to users
- 📈 Analytics dashboard

### Admin Permissions

Super admins can:

✅ **User Management:**
- View all users
- Edit user profiles
- Grant premium access
- Add hints to any user
- Delete user accounts

✅ **Analytics:**
- View total users
- See premium conversion rate
- Monitor transactions
- Track revenue

✅ **Game Management:**
- Manage word database
- View game analytics
- Access system logs

---

## Creating Admin Users

### Method 1: Using Script (Recommended)

```bash
# Create admin user
npx tsx scripts/create-admin.ts admin@example.com SecurePassword123!

# Output:
# ✅ User created in Firebase Auth
# ✅ Admin claims set
# ✅ User profile created in Firestore
# 🎉 Super admin user created successfully!
```

### Method 2: Manual Setup

1. **Create user in Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Authentication → Users → Add User
   - Enter email and password

2. **Add to admin list:**
   - Edit `src/lib/admin.ts`
   - Add email to `SUPER_ADMINS` array

3. **Set custom claims (optional):**
   ```typescript
   import { getAuth } from 'firebase-admin/auth';
   
   await getAuth().setCustomUserClaims(userId, {
     admin: true,
     role: 'super_admin',
   });
   ```

4. **Create Firestore profile:**
   - Go to Firestore Console
   - Collection: `userProfiles`
   - Document ID: User's UID
   - Fields:
     ```json
     {
       "email": "admin@example.com",
       "isAdmin": true,
       "isPremium": true,
       "role": "super_admin",
       "hints": 999999,
       "level": 1,
       "score": 0
     }
     ```

---

## Admin Dashboard Usage

### Accessing the Dashboard

1. Login with admin credentials
2. Navigate to: `/admin`
3. Dashboard loads automatically

**If not admin:** Redirected to home page

### Dashboard Sections

#### 1. Statistics Overview

View key metrics:
- Total users
- Premium users
- Conversion rate
- Total transactions
- Total revenue

#### 2. Quick Actions

**Grant Premium Access:**
- Select user
- Click "Grant Premium"
- User gets instant premium access

**Add Hints:**
- Enter user ID
- Specify number of hints
- Click "Add"

#### 3. User Management

View all users with:
- Email
- User ID
- Level and score
- Hint count
- Premium status

Actions:
- Grant premium
- Add hints
- View details

#### 4. Transaction History

View recent transactions:
- Amount
- Type (subscription/hint_pack)
- Status
- Reference
- Date

---

## Admin API Functions

### Grant Premium Access

```typescript
import { grantPremiumAccess } from '@/lib/admin-actions';

await grantPremiumAccess(userId, adminEmail);
```

### Add Hints to User

```typescript
import { addHintsToUser } from '@/lib/admin-actions';

await addHintsToUser(userId, 100, adminEmail);
```

### Get User Statistics

```typescript
import { getUserStats } from '@/lib/admin-actions';

const stats = await getUserStats(adminEmail);
// Returns: { totalUsers, premiumUsers, freeUsers, totalTransactions, totalRevenue }
```

### Get All Users

```typescript
import { getAllUsers } from '@/lib/admin-actions';

const users = await getAllUsers(adminEmail);
```

### Update User Profile

```typescript
import { updateUserProfile } from '@/lib/admin-actions';

await updateUserProfile(userId, {
  isPremium: true,
  hints: 500,
  level: 10,
  score: 5000,
}, adminEmail);
```

### Delete User Account

```typescript
import { deleteUserAccount } from '@/lib/admin-actions';

await deleteUserAccount(userId, adminEmail);
```

---

## Security

### Admin Verification

All admin actions verify:
1. User is logged in
2. User email is in `SUPER_ADMINS` list
3. User has valid Firebase token

**Unauthorized access:** Returns 401 error

### Best Practices

✅ **Do:**
- Use strong passwords (12+ characters)
- Enable 2FA on admin accounts
- Keep admin email list private
- Regularly review admin actions
- Use separate admin accounts

❌ **Don't:**
- Share admin credentials
- Commit admin emails to public repos
- Use weak passwords
- Grant admin access unnecessarily

---

## Adding Multiple Admins

Edit `src/lib/admin.ts`:

```typescript
const SUPER_ADMINS = [
  'admin@definitiondetective.com',
  'owner@example.com',
  'manager@example.com',
  // Add more as needed
];
```

Then create each admin user:

```bash
npx tsx scripts/create-admin.ts admin@definitiondetective.com Pass1234!
npx tsx scripts/create-admin.ts owner@example.com Pass5678!
npx tsx scripts/create-admin.ts manager@example.com Pass9012!
```

---

## Admin Levels (Future Enhancement)

Currently: Single "super_admin" level

**Planned levels:**
- `super_admin` - Full access
- `admin` - User management only
- `moderator` - View-only access
- `support` - Limited user support

To implement:

```typescript
// In src/lib/admin.ts
export const AdminLevels = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
} as const;

// Assign levels
const ADMIN_ROLES = {
  'super@example.com': 'super_admin',
  'admin@example.com': 'admin',
  'mod@example.com': 'moderator',
};
```

---

## Troubleshooting

### "Unauthorized: Admin access required"

**Cause:** Email not in admin list

**Fix:**
1. Add email to `SUPER_ADMINS` in `src/lib/admin.ts`
2. Redeploy app
3. Try again

### Admin dashboard redirects to home

**Cause:** Not logged in as admin

**Fix:**
1. Verify you're logged in
2. Check email is in admin list
3. Clear browser cache
4. Try again

### Cannot create admin user

**Cause:** Firebase credentials missing

**Fix:**
1. Check `.env.local` has Firebase config
2. Verify Firebase Admin SDK initialized
3. Check Firebase project permissions

### Admin actions fail

**Cause:** Firestore permissions or missing data

**Fix:**
1. Check Firestore rules allow admin access
2. Verify user profile exists
3. Check Firebase console for errors

---

## Monitoring Admin Actions

### View Logs

```bash
# Vercel logs
vercel logs --follow

# Filter for admin actions
vercel logs | grep "admin"
```

### Audit Trail

All admin actions include:
- Admin email
- Action type
- Timestamp
- Target user ID

Stored in Firestore:
```typescript
{
  action: 'grant_premium',
  adminEmail: 'admin@example.com',
  targetUserId: 'abc123',
  timestamp: new Date(),
  details: { ... }
}
```

---

## Testing Admin Features

### Test Checklist

- [ ] Create admin user
- [ ] Login as admin
- [ ] Access `/admin` dashboard
- [ ] View statistics
- [ ] Grant premium to test user
- [ ] Add hints to test user
- [ ] View transactions
- [ ] Update user profile
- [ ] Verify changes in Firebase Console

### Test Users

Create test users for testing admin features:

```bash
# Create test user
npx tsx scripts/create-admin.ts test@example.com TestPass123!

# Then use admin dashboard to:
# - Grant premium
# - Add hints
# - Update profile
```

---

## Deployment

### Before Deploying

1. ✅ Add your email to `SUPER_ADMINS`
2. ✅ Create admin user with script
3. ✅ Test locally
4. ✅ Verify Firebase permissions

### Deploy

```bash
git add .
git commit -m "Add super admin system"
git push origin main
vercel --prod
```

### After Deploying

1. Login at: https://definition-detective-app.vercel.app/login
2. Navigate to: https://definition-detective-app.vercel.app/admin
3. Verify dashboard loads
4. Test admin features

---

## Quick Reference

### Commands

```bash
# Create admin user
npx tsx scripts/create-admin.ts <email> <password>

# Deploy
vercel --prod

# View logs
vercel logs --follow
```

### URLs

- **Admin Dashboard:** `/admin`
- **Login:** `/login`
- **User Profile:** `/profile`

### Files

- **Admin Config:** `src/lib/admin.ts`
- **Admin Actions:** `src/lib/admin-actions.ts`
- **Admin Dashboard:** `src/app/admin/page.tsx`
- **Create Script:** `scripts/create-admin.ts`

---

## Support

**Issues?**
- Check Firebase Console for errors
- Review Vercel logs
- Verify admin email in config
- Test with different browser

**Need help?**
- Check documentation
- Review error messages
- Test in incognito mode
- Clear browser cache

---

## Next Steps

After setting up admin:

1. ✅ Create your admin account
2. ✅ Test admin dashboard
3. ✅ Grant yourself premium access
4. ✅ Add hints to your account
5. ✅ Monitor user activity
6. ✅ Review transactions
7. ✅ Manage users as needed

---

**Ready to create your admin account?**

```bash
npx tsx scripts/create-admin.ts your-email@gmail.com YourSecurePassword123!
```

Then login and access: https://definition-detective-app.vercel.app/admin 👑
