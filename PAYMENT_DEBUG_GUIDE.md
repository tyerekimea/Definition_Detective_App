# 🔍 Payment Verification Debug Guide

## Error: "verification failed: failed to verify payment"

This error occurs when the backend cannot verify the payment with Paystack API.

---

## Root Causes (In Order of Likelihood)

### 1. Missing Paystack Secret Key ⚠️ MOST LIKELY

**Symptom:** Paystack API returns 401 Unauthorized or "invalid field"

**Check:**
```bash
vercel env ls | grep PAYSTACK_SECRET_KEY
```

**If missing or empty:**
```bash
# Add your secret key
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production

# Redeploy
vercel --prod
```

---

### 2. Wrong Paystack Secret Key

**Symptom:** 401 Unauthorized from Paystack

**Check:**
- Are you using test key (`sk_test_`) with test public key (`pk_test_`)?
- Are you using live key (`sk_live_`) with live public key (`pk_live_`)?
- Is the key from the correct Paystack account?

**Fix:**
```bash
# Remove wrong key
vercel env rm PAYSTACK_SECRET_KEY production

# Add correct key
echo "sk_test_CORRECT_KEY" | vercel env add PAYSTACK_SECRET_KEY production

# Redeploy
vercel --prod
```

---

### 3. Firebase Admin Not Initialized

**Symptom:** Error about Firestore or Firebase Admin

**Check:** Firebase Admin SDK initialization

**Fix:** Ensure Firebase Admin is properly initialized in your app.

---

### 4. Network/Timeout Issues

**Symptom:** Intermittent failures, timeout errors

**Check:** Vercel function logs for timeout errors

**Fix:** Already implemented retry logic (3 attempts with 1s delay)

---

## Quick Diagnostic Steps

### Step 1: Check Environment Variables

```bash
cd /workspaces/Definition_Detective_App
vercel env ls
```

**You should see:**
```
PAYSTACK_SECRET_KEY                         Encrypted           Production
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY             Encrypted           Production
```

**If `PAYSTACK_SECRET_KEY` is missing:** That's your problem!

---

### Step 2: Check Vercel Logs

```bash
vercel logs --follow
```

Then try a payment and watch for errors.

**Look for:**
- `401 Unauthorized` → Wrong/missing secret key
- `Invalid field` → Empty secret key
- `Network error` → Timeout/connectivity
- `Firebase error` → Database issue

---

### Step 3: Test Paystack API Directly

Create a test file to verify your Paystack credentials:

```bash
cat > test-paystack.ts << 'EOF'
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

async function testPaystack() {
  try {
    console.log('Testing Paystack API...');
    console.log('Secret key:', PAYSTACK_SECRET_KEY ? 'Set (length: ' + PAYSTACK_SECRET_KEY.length + ')' : 'MISSING');
    
    const response = await axios.get('https://api.paystack.co/transaction', {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });
    
    console.log('✅ Paystack API working!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.error('❌ Paystack API error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
}

testPaystack();
EOF

npx tsx test-paystack.ts
```

**Expected results:**
- ✅ If working: Shows transaction list
- ❌ If broken: Shows 401 or "invalid field"

---

## Complete Fix Procedure

### Step 1: Get Your Paystack Keys

1. Go to: https://dashboard.paystack.com/
2. Login
3. Settings → API Keys & Webhooks
4. Copy both keys:
   - **Test Public Key:** `pk_test_...`
   - **Test Secret Key:** `sk_test_...`

---

### Step 2: Add Secret Key to Vercel

```bash
cd /workspaces/Definition_Detective_App

# Add secret key (replace with your actual key)
echo "sk_test_YOUR_ACTUAL_KEY_HERE" | vercel env add PAYSTACK_SECRET_KEY production

# Verify it was added
vercel env ls | grep PAYSTACK
```

**You should see:**
```
PAYSTACK_SECRET_KEY                         Encrypted           Production
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY             Encrypted           Production
```

---

### Step 3: Update Public Key (If Needed)

If your public key is also wrong:

```bash
# Remove old public key
vercel env rm NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY production

# Add correct public key
echo "pk_test_YOUR_PUBLIC_KEY" | vercel env add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY production
```

---

### Step 4: Redeploy

```bash
vercel --prod
```

Wait ~2 minutes for deployment.

---

### Step 5: Test Payment

1. Open: https://definition-detective-app.vercel.app
2. Go to Store or Subscribe page
3. Click "Buy" or "Subscribe"
4. Use test card:
   - **Card:** `4084084084084081`
   - **CVV:** `408`
   - **Expiry:** `12/25` (any future date)
   - **PIN:** `0000`
   - **OTP:** `123456`

**Expected:** Payment succeeds and verification works!

---

## Debugging Checklist

Before testing payment:

- [ ] `PAYSTACK_SECRET_KEY` is set in Vercel
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set in Vercel
- [ ] Both keys are from the same Paystack account
- [ ] Both keys are same mode (test or live)
- [ ] App has been redeployed after adding keys
- [ ] Firebase is properly configured
- [ ] User is logged in

---

## Common Error Messages

### "Reference is required"
**Cause:** Payment reference not passed to verification endpoint
**Fix:** Check PaystackButton component is passing reference correctly

### "Invalid payment metadata"
**Cause:** userId missing from payment metadata
**Fix:** Ensure user is logged in before payment

### "User ID mismatch"
**Cause:** Payment userId doesn't match logged-in user
**Fix:** Check authentication flow

### "Unknown payment type"
**Cause:** Payment type not specified or invalid
**Fix:** Ensure type is 'subscription' or 'hint_pack'

### "Failed to verify transaction after retries"
**Cause:** Paystack API not responding or wrong credentials
**Fix:** Check secret key and network connectivity

---

## Test Mode vs Live Mode

### Test Mode (Development)

**Keys:**
- Public: `pk_test_...`
- Secret: `sk_test_...`

**Test Cards:**
- Success: `4084084084084081`
- Decline: `5060666666666666666`
- Insufficient funds: `5078000000000000`

**Behavior:**
- No real money charged
- Instant verification
- Test webhooks

### Live Mode (Production)

**Keys:**
- Public: `pk_live_...`
- Secret: `sk_live_...`

**Cards:**
- Real cards only
- Real money charged
- Real webhooks

**Before going live:**
- [ ] Test thoroughly in test mode
- [ ] Update to live keys
- [ ] Test with small amount
- [ ] Monitor transactions

---

## Verification Flow

Here's what happens when payment is made:

1. **User clicks "Pay"**
   - PaystackButton opens Paystack modal
   - User enters card details
   - Paystack processes payment

2. **Payment succeeds on Paystack**
   - Paystack returns reference
   - `handleSuccess` is called

3. **Frontend calls verification API**
   ```
   GET /api/paystack/verify?reference=DD_123456
   Headers: x-user-id, Authorization
   ```

4. **Backend verifies with Paystack**
   ```
   GET https://api.paystack.co/transaction/verify/DD_123456
   Headers: Authorization: Bearer sk_test_...
   ```

5. **Backend updates database**
   - Updates user profile (hints or premium)
   - Creates transaction record

6. **Success response sent to frontend**
   - User redirected to success page
   - Toast notification shown

**If any step fails:** User sees error message

---

## Manual Verification (Emergency)

If automatic verification fails, you can manually verify:

### Step 1: Get Transaction Reference

From Paystack dashboard or user report.

### Step 2: Verify on Paystack

1. Go to: https://dashboard.paystack.com/transactions
2. Search for reference
3. Check status

### Step 3: Manually Update Database

If payment succeeded but verification failed:

```typescript
// In Firebase Console or admin script
const firestore = getFirestore();

// For hint purchase
await firestore.collection('userProfiles').doc(userId).update({
  hints: FieldValue.increment(10), // or whatever amount
  hintsLastUpdated: new Date(),
});

// For subscription
await firestore.collection('userProfiles').doc(userId).update({
  subscriptionStatus: 'active',
  isPremium: true,
  subscriptionReference: 'DD_123456',
});
```

---

## Prevention

To avoid verification issues:

1. **Always set environment variables before deploying**
2. **Test in test mode first**
3. **Monitor Vercel logs**
4. **Set up Paystack webhooks** (for redundancy)
5. **Implement proper error handling**
6. **Add retry logic** (already implemented)

---

## Still Not Working?

### Check Vercel Logs

```bash
vercel logs --follow
```

### Check Paystack Dashboard

https://dashboard.paystack.com/transactions

### Check Firebase Console

https://console.firebase.google.com/

### Contact Support

If all else fails:
- Paystack Support: support@paystack.com
- Check Paystack status: https://status.paystack.com/

---

## Quick Fix Command

```bash
# Complete fix in one go
cd /workspaces/Definition_Detective_App

# Add secret key (replace with yours)
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production

# Redeploy
vercel --prod

# Test after 2 minutes
```

---

**Most likely fix:** Add your Paystack secret key to Vercel and redeploy!
