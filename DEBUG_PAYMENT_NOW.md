# 🔍 Debug Payment Verification - Right Now

## Current Status

✅ Endpoints exist
✅ Firebase credentials added
✅ Paystack secret key set
❌ Verification returning 500 error

---

## Step 1: Check What Error is Happening

### Option A: Browser Console (Easiest)

1. **Open your app:** https://definition-detective-app.vercel.app/store

2. **Open browser console:**
   - Press `F12` or right-click → Inspect
   - Go to "Console" tab

3. **Try to buy hints:**
   - Click "Buy 10 Hints"
   - Enter test card: `4084084084084081`
   - Complete payment

4. **Look for error messages in console**

**Copy the error message and send it to me!**

### Option B: Check Vercel Logs

```bash
# Get latest deployment URL
vercel ls | head -5

# Check logs (replace with your URL)
vercel logs https://definition-detective-7ixm3ataf-tonbra-yerekimeas-projects.vercel.app
```

**Look for lines with:**
- `❌ [VERIFY]`
- `Error:`
- `Failed`

---

## Step 2: Common Issues & Quick Fixes

### Issue 1: "Failed to verify transaction after retries"

**Cause:** Paystack API call failing

**Check:**
```bash
# Verify secret key is set
vercel env ls | grep PAYSTACK_SECRET_KEY
```

**Fix:**
```bash
# If missing, add it
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production
vercel --prod
```

### Issue 2: "Firebase app not initialized"

**Cause:** Firebase credentials not working

**Check:**
```bash
# Verify credentials are set
vercel env ls | grep FIREBASE
```

**Should show:**
```
FIREBASE_CLIENT_EMAIL     Encrypted    Production
FIREBASE_PRIVATE_KEY      Encrypted    Production
```

**Fix:**
If missing, follow: `FIREBASE_CREDENTIALS_QUICKSTART.md`

### Issue 3: "Permission denied" or "Firestore error"

**Cause:** Firestore rules or user profile doesn't exist

**Check Firestore:**
1. Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore
2. Open `userProfiles` collection
3. Find your user ID
4. Check if document exists

**Fix:**
Create user profile if missing:
```javascript
// In Firebase Console
{
  email: "your-email@example.com",
  hints: 0,
  level: 1,
  score: 0,
  createdAt: new Date()
}
```

### Issue 4: "Invalid payment metadata"

**Cause:** User not logged in or metadata missing

**Fix:**
- Make sure you're logged in before making payment
- Check browser console for authentication errors

---

## Step 3: Test with Detailed Logging

### Enable Detailed Logs

The app already has comprehensive logging. To see it:

```bash
# Watch logs in real-time
vercel logs https://definition-detective-app.vercel.app --follow
```

**In another terminal, make a payment**

**Look for this sequence:**
```
🔍 [VERIFY] Payment verification request: DD_...
👤 [VERIFY] User ID from header: abc123
🔄 [VERIFY] Attempt 1/3 to verify with Paystack
✅ [VERIFY] Paystack verification successful
📊 [VERIFY] Payment status: success
💾 [VERIFY] Initializing Firestore...
📦 [VERIFY] Payment metadata: {...}
💳 [VERIFY] Payment details: {...}
💡 [VERIFY] Adding 10 hints to user...
✅ [VERIFY] Hints updated
🎉 [VERIFY] Payment processing complete!
```

**If you see ❌ anywhere, that's the problem!**

---

## Step 4: Manual Test Script

Run this to test the verification endpoint:

```bash
cd /workspaces/Definition_Detective_App
npx tsx test-payment-verification.ts
```

This will:
- Test if endpoints exist
- Check if they're responding
- Give you a checklist

---

## Step 5: Quick Diagnostic

Answer these questions:

1. **Are you logged in when making payment?**
   - [ ] Yes
   - [ ] No

2. **What error message do you see?**
   - Browser console: _______________
   - Toast notification: _______________

3. **Did you redeploy after adding Firebase credentials?**
   - [ ] Yes
   - [ ] No

4. **Can you see your user profile in Firestore?**
   - [ ] Yes
   - [ ] No
   - [ ] Don't know how to check

5. **What happens after payment?**
   - [ ] Success on Paystack, but hints don't increase
   - [ ] Error message shown
   - [ ] Page redirects to failed page
   - [ ] Nothing happens

---

## Step 6: Force Redeploy

Sometimes environment variables don't take effect until redeployment:

```bash
cd /workspaces/Definition_Detective_App

# Make a small change to force redeploy
echo "# Force redeploy" >> README.md

# Commit and push
git add .
git commit -m "Force redeploy to apply environment variables"
git push origin main

# Deploy
vercel --prod

# Wait 2 minutes, then test again
```

---

## Step 7: Check Paystack Dashboard

1. Go to: https://dashboard.paystack.com/transactions

2. Find your test payment

3. Check:
   - [ ] Status is "Success"
   - [ ] Metadata includes `userId`
   - [ ] Metadata includes `type` (hint_pack or subscription)
   - [ ] Amount is correct

4. If metadata is missing:
   - The problem is in the frontend (PaystackButton)
   - User might not be logged in

---

## Step 8: Test Webhook Separately

The webhook provides backup verification:

1. **Configure webhook in Paystack:**
   - Go to: https://dashboard.paystack.com/settings/developer
   - Set URL: `https://definition-detective-app.vercel.app/api/pay`
   - Save

2. **Test webhook:**
   - Click "Test Webhook" button
   - Select "charge.success"
   - Click "Send Test"

3. **Check response:**
   - Should show: `{"success": true}`

---

## Step 9: Emergency Manual Fix

If payment succeeded but hints didn't increase:

1. **Get transaction reference** from Paystack dashboard

2. **Manually update Firestore:**
   - Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore
   - Open `userProfiles` collection
   - Find your user
   - Update `hints` field (add 10)

3. **Record transaction:**
   - Create document in `transactions` collection
   - Add fields:
     ```javascript
     {
       userId: "YOUR_USER_ID",
       reference: "DD_123456",
       amount: 1000,
       type: "hint_pack",
       status: "success",
       verifiedBy: "manual",
       createdAt: new Date()
     }
     ```

---

## What I Need to Help You

To debug further, I need:

1. **Error message from browser console**
   - Open console (F12)
   - Make payment
   - Copy any red error messages

2. **Your user ID**
   - Check browser console
   - Look for: `User ID:` or `uid:`

3. **Transaction reference**
   - After payment, check Paystack dashboard
   - Copy the reference (starts with `DD_`)

4. **What you see**
   - Does payment succeed on Paystack?
   - Do you see any error messages?
   - What happens after payment?

---

## Quick Checklist

Before we debug further, verify:

- [ ] Logged in to the app
- [ ] PAYSTACK_SECRET_KEY set in Vercel
- [ ] FIREBASE_CLIENT_EMAIL set in Vercel
- [ ] FIREBASE_PRIVATE_KEY set in Vercel
- [ ] App redeployed after adding credentials
- [ ] User profile exists in Firestore
- [ ] Using test card: 4084084084084081
- [ ] Browser console open to see errors

---

## Most Likely Issues

Based on the 500 error, it's probably one of these:

### 1. Paystack Secret Key Wrong/Missing (60% likely)
**Test:**
```bash
vercel env ls | grep PAYSTACK_SECRET_KEY
```

**Fix:**
Add correct key from Paystack dashboard

### 2. Firebase Credentials Wrong (30% likely)
**Test:**
Check Vercel logs for "Firebase" errors

**Fix:**
Re-add credentials following the guide

### 3. User Not Logged In (5% likely)
**Test:**
Check if you see user email in app header

**Fix:**
Login before making payment

### 4. Firestore Rules (5% likely)
**Test:**
Check Firebase Console for permission errors

**Fix:**
Update Firestore rules to allow writes

---

## Next Steps

1. **Try the browser console method** (Step 1, Option A)
2. **Copy the error message**
3. **Send it to me**
4. **I'll give you the exact fix**

Or if you want to try fixing yourself:
1. Check the checklist above
2. Try force redeploying (Step 6)
3. Test again

---

**The error message from the browser console will tell us exactly what's wrong!**
