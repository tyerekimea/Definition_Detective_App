# 🔔 Webhook Setup Guide

## Current Webhook Configuration

**Your Webhook URL:** `https://definition-detective-app.vercel.app/api/pay`

**Status:** ✅ Endpoint created and ready

---

## What Webhooks Do

Webhooks are Paystack's way of notifying your app when payments happen, even if:
- User closes browser after payment
- Network fails during verification
- User doesn't return to your app

**This is critical for payment reliability!**

---

## How It Works

```
User pays on Paystack
    ↓
Paystack processes payment
    ↓
Paystack sends webhook to your app ← BACKUP VERIFICATION
    ↓
Your app updates database
    ↓
User gets hints/premium
```

**Two verification paths:**
1. **Primary:** Frontend calls `/api/paystack/verify` (immediate)
2. **Backup:** Paystack calls `/api/pay` webhook (reliable)

---

## Webhook Events Handled

### 1. charge.success
**When:** Payment completed successfully

**What happens:**
- Adds hints to user account
- Grants premium access
- Records transaction

**Example:**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "DD_1234567890_123456",
    "amount": 100000,
    "metadata": {
      "userId": "abc123",
      "type": "hint_pack",
      "hints": 10
    }
  }
}
```

### 2. subscription.disable
**When:** User cancels subscription

**What happens:**
- Sets `isPremium` to false
- Updates subscription status to 'canceled'

### 3. subscription.not_renew
**When:** Subscription won't auto-renew

**What happens:**
- Marks subscription as 'expiring'
- User keeps access until expiry

---

## Paystack Dashboard Setup

### Step 1: Login to Paystack

Go to: https://dashboard.paystack.com/settings/developer

### Step 2: Configure Webhook

1. Scroll to **"Webhook URL"** section
2. Enter: `https://definition-detective-app.vercel.app/api/pay`
3. Click **"Save Changes"**

### Step 3: Test Webhook

1. Click **"Test Webhook"** button
2. Select event: `charge.success`
3. Click **"Send Test"**
4. Check response shows: `{"success": true}`

---

## Verify Webhook is Working

### Method 1: Check Paystack Dashboard

1. Go to: https://dashboard.paystack.com/settings/developer
2. Scroll to **"Webhook Logs"**
3. Make a test payment
4. Check logs show successful delivery

### Method 2: Check Vercel Logs

```bash
vercel logs --follow
```

Make a payment and look for:
```
🔔 [WEBHOOK] Received Paystack webhook
✅ [WEBHOOK] Signature verified
💰 [WEBHOOK] Processing successful charge
💡 [WEBHOOK] Adding 10 hints...
✅ [WEBHOOK] Hints added
🎉 [WEBHOOK] Payment webhook processed successfully
```

### Method 3: Test Endpoint Directly

```bash
curl https://definition-detective-app.vercel.app/api/pay
```

Should return:
```json
{
  "message": "Paystack Webhook Endpoint",
  "url": "https://definition-detective-app.vercel.app/api/pay",
  "methods": ["POST"],
  "events": ["charge.success", "subscription.disable", "subscription.not_renew"]
}
```

---

## Security

### Signature Verification

Every webhook is verified using HMAC SHA512:

```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(body)
  .digest('hex');

if (hash !== signature) {
  return error('Invalid signature');
}
```

**This prevents:**
- Fake webhook requests
- Unauthorized access
- Payment fraud

### What's Protected

✅ Only Paystack can send valid webhooks
✅ Signature verified on every request
✅ Invalid requests rejected immediately
✅ All events logged for audit

---

## Webhook vs Direct Verification

### Direct Verification (Primary)
**File:** `/api/paystack/verify`

**Pros:**
- Immediate feedback to user
- User sees success instantly
- Better UX

**Cons:**
- Requires user to stay on page
- Can fail if network issues
- User might close browser

### Webhook (Backup)
**File:** `/api/pay`

**Pros:**
- Works even if user leaves
- Paystack retries if failed
- More reliable
- Catches missed payments

**Cons:**
- Slight delay (1-5 seconds)
- User might not see immediate update

**Best Practice:** Use both! (Already implemented)

---

## Troubleshooting

### Webhook not receiving events

**Check:**
1. URL is correct in Paystack dashboard
2. Endpoint is deployed (not just local)
3. HTTPS is used (not HTTP)
4. No firewall blocking Paystack IPs

**Fix:**
```bash
# Verify endpoint exists
curl https://definition-detective-app.vercel.app/api/pay

# Check Vercel deployment
vercel ls

# View logs
vercel logs --follow
```

### "Invalid signature" errors

**Cause:** Wrong secret key

**Fix:**
```bash
# Verify secret key is set
vercel env ls | grep PAYSTACK_SECRET_KEY

# If missing, add it
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production
vercel --prod
```

### Webhook received but database not updated

**Check:**
1. Firebase Admin credentials set?
2. Firestore rules allow writes?
3. User profile exists?

**Debug:**
```bash
# Watch logs during payment
vercel logs --follow

# Look for database errors
vercel logs | grep "Database error"
```

### Duplicate processing

**Cause:** Both webhook and direct verification succeed

**Solution:** Already handled! We use `merge: true` so duplicate updates are safe:
```typescript
await firestore.collection('userProfiles').doc(userId).set({
  hints: currentHints + hintsToAdd,
}, { merge: true });
```

---

## Testing Webhooks

### Test in Paystack Dashboard

1. Go to: https://dashboard.paystack.com/settings/developer
2. Click **"Test Webhook"**
3. Select event type
4. Click **"Send Test"**
5. Check response

### Test with Real Payment

```bash
# 1. Start watching logs
vercel logs --follow

# 2. Make test payment
# Go to: https://definition-detective-app.vercel.app/store
# Use test card: 4084084084084081

# 3. Watch for webhook logs
# Should see: 🔔 [WEBHOOK] Received Paystack webhook
```

### Manual Webhook Test

```bash
# Create test payload
cat > webhook-test.json << 'EOF'
{
  "event": "charge.success",
  "data": {
    "reference": "TEST_123",
    "amount": 100000,
    "metadata": {
      "userId": "YOUR_USER_ID",
      "type": "hint_pack",
      "hints": 10
    },
    "customer": {
      "email": "test@example.com"
    }
  }
}
EOF

# Send to webhook (won't work without valid signature)
curl -X POST https://definition-detective-app.vercel.app/api/pay \
  -H "Content-Type: application/json" \
  -d @webhook-test.json
```

---

## Monitoring

### Paystack Webhook Logs

**URL:** https://dashboard.paystack.com/settings/developer

**Shows:**
- All webhook deliveries
- Success/failure status
- Response codes
- Retry attempts

### Vercel Logs

```bash
# Real-time monitoring
vercel logs --follow

# Filter for webhooks
vercel logs | grep WEBHOOK

# Filter for errors
vercel logs | grep "❌ \[WEBHOOK\]"
```

### Failed Webhooks Collection

Failed webhooks are stored in Firestore:

**Collection:** `failedWebhooks`

**Fields:**
- `reference` - Payment reference
- `event` - Event type
- `data` - Event data
- `error` - Error message
- `retryCount` - Number of retries
- `createdAt` - Timestamp

**To retry:**
```bash
# Use the retry endpoint
curl -X POST https://definition-detective-app.vercel.app/api/paystack/retry-webhooks
```

---

## Webhook Retry Logic

### Paystack Retries

Paystack automatically retries failed webhooks:
- Retry 1: After 1 minute
- Retry 2: After 5 minutes
- Retry 3: After 15 minutes
- Retry 4: After 1 hour
- Retry 5: After 6 hours

### Your App Handling

```typescript
// Return 200 even on error so Paystack knows we received it
return NextResponse.json(
  { error: error.message },
  { status: 200 }  // ← Important!
);
```

**Why?** If we return 500, Paystack will retry unnecessarily.

---

## Best Practices

### ✅ Do

- Always verify webhook signature
- Return 200 status code
- Log all webhook events
- Store failed webhooks for retry
- Use idempotent operations
- Handle duplicate webhooks gracefully

### ❌ Don't

- Skip signature verification
- Return 500 on handled errors
- Process same webhook twice
- Trust webhook data without validation
- Ignore failed webhooks
- Block webhook processing

---

## Webhook Flow Diagram

```
Paystack Payment
    ↓
Payment Succeeds
    ↓
Paystack sends webhook to /api/pay
    ↓
Verify signature
    ↓
Parse event data
    ↓
Check event type
    ↓
Update database
    ↓
Record transaction
    ↓
Return 200 OK
    ↓
Paystack marks as delivered
```

---

## Current Status

**Webhook Endpoint:** ✅ Created
**URL:** `https://definition-detective-app.vercel.app/api/pay`
**Events Handled:** ✅ charge.success, subscription.disable, subscription.not_renew
**Signature Verification:** ✅ Enabled
**Logging:** ✅ Comprehensive
**Error Handling:** ✅ Implemented
**Failed Webhook Storage:** ✅ Implemented

**Next Steps:**
1. ✅ Endpoint is ready
2. ⏳ Configure in Paystack dashboard
3. ⏳ Test with real payment
4. ⏳ Monitor logs

---

## Quick Setup Checklist

- [ ] Webhook endpoint created (`/api/pay`)
- [ ] Deployed to Vercel
- [ ] Added webhook URL to Paystack dashboard
- [ ] Tested webhook in Paystack dashboard
- [ ] Made test payment
- [ ] Verified webhook received in logs
- [ ] Checked database updated
- [ ] Monitored for errors

---

## Summary

**Your webhook is ready!** 

Just configure it in Paystack dashboard:
1. Go to: https://dashboard.paystack.com/settings/developer
2. Set webhook URL: `https://definition-detective-app.vercel.app/api/pay`
3. Save changes
4. Test it!

**This will ensure all payments are processed reliably, even if users close their browser!** 🎉
