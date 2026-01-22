# 🚨 URGENT: Fix Payment Verification

## The Problem

**`PAYSTACK_SECRET_KEY` is missing from Vercel!**

This is why you're getting "verification failed: failed to verify payment"

---

## The Fix (2 Minutes)

### Step 1: Get Your Paystack Secret Key

1. Open: https://dashboard.paystack.com/settings/developer
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

**For testing:** Use `sk_test_...`

---

### Step 2: Add to Vercel (Choose One Method)

#### Method A: Via CLI (Fastest)

```bash
cd /workspaces/Definition_Detective_App

# Replace YOUR_SECRET_KEY with your actual key
echo "YOUR_SECRET_KEY" | vercel env add PAYSTACK_SECRET_KEY production
```

**Example:**
```bash
echo "sk_test_abc123xyz456" | vercel env add PAYSTACK_SECRET_KEY production
```

#### Method B: Via Dashboard

1. Go to: https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app/settings/environment-variables

2. Click **"Add New"**

3. Enter:
   - Name: `PAYSTACK_SECRET_KEY`
   - Value: Your secret key (e.g., `sk_test_abc123...`)
   - Environments: Check **Production**

4. Click **"Save"**

---

### Step 3: Redeploy

```bash
vercel --prod
```

Wait 2 minutes for deployment.

---

### Step 4: Test

1. Open: https://definition-detective-app.vercel.app
2. Try to buy hints or subscribe
3. Use test card:
   - Card: `4084084084084081`
   - CVV: `408`
   - Expiry: `12/25`
   - PIN: `0000`
   - OTP: `123456`

**Payment should now work!** ✅

---

## Why This Happened

Your `.env.local` has:
```
PAYSTACK_SECRET_KEY=
```

This empty value was never added to Vercel, so the API can't verify payments.

---

## Verification

After adding the key, check it's there:

```bash
vercel env ls | grep PAYSTACK
```

You should see:
```
PAYSTACK_SECRET_KEY                         Encrypted           Production
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY             Encrypted           Production
```

---

## Quick Commands

```bash
# 1. Add secret key
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production

# 2. Redeploy
vercel --prod

# 3. Test payment after 2 minutes
```

---

**That's it!** Once you add the secret key and redeploy, payments will work.

**Need your Paystack key?** → https://dashboard.paystack.com/settings/developer
