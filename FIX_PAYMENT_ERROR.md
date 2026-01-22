# 🔧 Fix Payment "Invalid Field" Error

## Problem

Payment verification is failing with "invalid field" error because the **Paystack Secret Key** is missing.

## Root Cause

The `PAYSTACK_SECRET_KEY` environment variable is:
- ❌ Empty in `.env.local`
- ❌ Not set in Vercel

Paystack API requires this secret key to verify transactions.

---

## Solution

### Step 1: Get Your Paystack Secret Key

1. **Login to Paystack Dashboard:**
   - Go to: https://dashboard.paystack.com/
   - Login with your account

2. **Get Your Secret Key:**
   - Go to Settings → API Keys & Webhooks
   - Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

**Important:** 
- Use `sk_test_` for testing
- Use `sk_live_` for production

---

### Step 2: Add to Vercel

Run this command (replace `YOUR_SECRET_KEY` with your actual key):

```bash
cd /workspaces/Definition_Detective_App
echo "YOUR_SECRET_KEY" | vercel env add PAYSTACK_SECRET_KEY production
```

**Example:**
```bash
echo "sk_test_abc123xyz456" | vercel env add PAYSTACK_SECRET_KEY production
```

---

### Step 3: Redeploy

After adding the secret key, redeploy:

```bash
vercel --prod
```

This will rebuild your app with the new environment variable.

---

### Step 4: Test Payment

1. Open your app: https://definition-detective-app.vercel.app
2. Try to make a payment
3. Payment should now work!

---

## Alternative: Add via Vercel Dashboard

If you prefer using the web interface:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables"

3. **Add Variable:**
   - Name: `PAYSTACK_SECRET_KEY`
   - Value: Your Paystack secret key (e.g., `sk_test_abc123...`)
   - Environments: Check "Production", "Preview", "Development"
   - Click "Save"

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## Verify It's Working

### Check Environment Variables

```bash
vercel env ls | grep PAYSTACK
```

You should see:
```
PAYSTACK_SECRET_KEY                         Encrypted           Production, Preview, Development
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY             Encrypted           Production, Preview, Development
```

### Test Payment Flow

1. Go to your app
2. Try to purchase hints or subscribe
3. Complete payment with test card:
   - Card: `4084084084084081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`
   - OTP: `123456`

4. Payment should succeed!

---

## Common Issues

### "Invalid field" still appearing

**Check:**
- Secret key is correct (no extra spaces)
- Secret key matches your Paystack account
- You redeployed after adding the key

**Fix:**
```bash
# Remove old key
vercel env rm PAYSTACK_SECRET_KEY production

# Add new key
echo "YOUR_CORRECT_KEY" | vercel env add PAYSTACK_SECRET_KEY production

# Redeploy
vercel --prod
```

### "Unauthorized" error

**Cause:** Using wrong key (test vs live)

**Fix:**
- For testing: Use `sk_test_...`
- For production: Use `sk_live_...`

### Payment succeeds but verification fails

**Check:**
- Metadata is being sent correctly
- User ID is in metadata
- Payment type is specified

---

## Test vs Live Mode

### Test Mode (Development)

Use test keys:
- Public: `pk_test_...`
- Secret: `sk_test_...`

Test cards work, no real money charged.

### Live Mode (Production)

Use live keys:
- Public: `pk_live_...`
- Secret: `sk_live_...`

Real cards, real money charged.

---

## Security Notes

⚠️ **NEVER commit secret keys to Git!**

✅ **Good:**
- Store in environment variables
- Use Vercel secrets
- Keep in `.env.local` (gitignored)

❌ **Bad:**
- Hardcode in source code
- Commit to GitHub
- Share publicly

---

## Quick Fix Commands

```bash
# 1. Get your Paystack secret key from dashboard
# 2. Add to Vercel
echo "sk_test_YOUR_KEY_HERE" | vercel env add PAYSTACK_SECRET_KEY production

# 3. Redeploy
vercel --prod

# 4. Test payment
# Open: https://definition-detective-app.vercel.app
```

---

## Current Status

**What's Working:**
- ✅ Paystack public key configured
- ✅ Payment initialization
- ✅ Payment UI

**What's Missing:**
- ❌ Paystack secret key
- ❌ Payment verification

**After Fix:**
- ✅ Complete payment flow
- ✅ Hint purchases
- ✅ Subscriptions

---

## Need Your Paystack Keys?

1. **Login:** https://dashboard.paystack.com/
2. **Navigate:** Settings → API Keys & Webhooks
3. **Copy:**
   - Test Public Key: `pk_test_...`
   - Test Secret Key: `sk_test_...`
   - Live Public Key: `pk_live_...`
   - Live Secret Key: `sk_live_...`

---

## After Adding Secret Key

Your payment flow will work:

1. User clicks "Buy Hints" or "Subscribe"
2. Paystack payment modal opens
3. User enters card details
4. Payment processes
5. **Verification succeeds** ✅
6. User gets hints/premium access
7. Database updates

---

**Ready to fix?** Get your Paystack secret key and run:

```bash
echo "YOUR_SECRET_KEY" | vercel env add PAYSTACK_SECRET_KEY production
vercel --prod
```

Then test the payment! 💳
