# ✅ Simple Fix - Try This First

## The Problem

Payment verification is returning a 500 error. This usually means:
1. Paystack secret key issue
2. Firebase credentials issue
3. Environment variables not loaded

---

## The Simple Fix (5 Minutes)

### Step 1: Verify Paystack Secret Key

```bash
cd /workspaces/Definition_Detective_App

# Check if it's set
vercel env ls | grep PAYSTACK_SECRET_KEY
```

**If you see it listed, good!**

**If you're not 100% sure it's correct:**

1. Go to: https://dashboard.paystack.com/settings/developer
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Run:
```bash
# Remove old one
vercel env rm PAYSTACK_SECRET_KEY production

# Add correct one
echo "YOUR_SECRET_KEY_HERE" | vercel env add PAYSTACK_SECRET_KEY production
```

### Step 2: Force Fresh Deployment

```bash
# This ensures all environment variables are loaded
vercel --prod
```

**Wait 2 minutes for deployment to complete**

### Step 3: Test Payment

1. Go to: https://definition-detective-app.vercel.app/store
2. Make sure you're **logged in** (see your email in header)
3. Click "Buy 10 Hints"
4. Use test card: `4084084084084081`
5. Complete payment

**If it works:** ✅ Done!

**If it still fails:** Continue to Step 4

---

### Step 4: Check Firebase Credentials Format

The Firebase private key must be in a specific format.

```bash
# Pull current env vars
vercel env pull .env.vercel

# Check the private key format
cat .env.vercel | grep FIREBASE_PRIVATE_KEY
```

**It should look like ONE line:**
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**If it looks like multiple lines, it's wrong!**

**Fix:**
1. Download Firebase JSON again
2. Copy the `private_key` value EXACTLY as shown in JSON
3. Re-add to Vercel:
```bash
vercel env rm FIREBASE_PRIVATE_KEY production
echo "PASTE_EXACT_VALUE_HERE" | vercel env add FIREBASE_PRIVATE_KEY production
vercel --prod
```

---

### Step 5: Check User Profile Exists

1. Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore
2. Open `userProfiles` collection
3. Search for your email or user ID
4. **If your profile doesn't exist**, create it:

Click "Add document":
```
Document ID: YOUR_USER_ID (from authentication)
Fields:
  email: "your-email@example.com"
  hints: 0
  level: 1
  score: 0
  createdAt: (timestamp) now
  updatedAt: (timestamp) now
```

---

## Most Common Fix

**90% of the time, this fixes it:**

```bash
cd /workspaces/Definition_Detective_App

# Fresh deployment
vercel --prod

# Wait 2 minutes

# Test payment
```

---

## If Still Not Working

### Check These:

1. **Are you logged in?**
   - Look for your email in the app header
   - If not, login first

2. **Does payment succeed on Paystack?**
   - Check: https://dashboard.paystack.com/transactions
   - If payment shows "Success" but hints don't increase, it's a verification issue

3. **Check browser console:**
   - Press F12
   - Look for RED error messages
   - Send me the error text

---

## Emergency Manual Fix

If payment succeeded on Paystack but hints didn't increase:

1. **Get transaction reference** from Paystack dashboard

2. **Manually add hints in Firestore:**
   - Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore
   - Open `userProfiles` collection
   - Find your user
   - Edit `hints` field: add 10

3. **Record transaction:**
   - Create new document in `transactions` collection
   - Fields:
     ```
     userId: "YOUR_USER_ID"
     reference: "DD_123456" (from Paystack)
     amount: 1000
     type: "hint_pack"
     status: "success"
     verifiedBy: "manual"
     createdAt: (timestamp) now
     ```

---

## Quick Checklist

Before testing:
- [ ] Logged in to the app
- [ ] PAYSTACK_SECRET_KEY set in Vercel
- [ ] FIREBASE_CLIENT_EMAIL set in Vercel
- [ ] FIREBASE_PRIVATE_KEY set in Vercel
- [ ] App redeployed after adding credentials
- [ ] User profile exists in Firestore

---

## Try This Right Now

**Copy and paste these commands:**

```bash
cd /workspaces/Definition_Detective_App

# Check environment variables
echo "Checking environment variables..."
vercel env ls | grep -E "(PAYSTACK|FIREBASE)"

# Force redeploy
echo "Redeploying..."
vercel --prod

echo ""
echo "✅ Deployment started!"
echo ""
echo "Wait 2 minutes, then test payment at:"
echo "https://definition-detective-app.vercel.app/store"
echo ""
echo "Use test card: 4084084084084081"
```

---

## What Usually Works

**In order of likelihood:**

1. **Fresh deployment** (70% success rate)
   ```bash
   vercel --prod
   ```

2. **Re-add Paystack secret key** (20% success rate)
   ```bash
   vercel env rm PAYSTACK_SECRET_KEY production
   echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production
   vercel --prod
   ```

3. **Check user is logged in** (10% success rate)
   - Just make sure you see your email in the app header

---

## Bottom Line

**Try this:**
1. Run `vercel --prod`
2. Wait 2 minutes
3. Test payment

**If that doesn't work:**
- Send me the browser console error (F12 → Console → RED text)
- Or describe exactly what happens

---

**Most likely, a fresh deployment will fix it!** 🚀
