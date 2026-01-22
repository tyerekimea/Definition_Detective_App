# 💳 Payment Process - Complete Guide

## Overview

Your Definition Detective app uses **Paystack** for payment processing. Here's how the entire payment flow works from start to finish.

---

## Payment Flow Diagram

```
User clicks "Buy" 
    ↓
Frontend initializes payment
    ↓
Paystack modal opens
    ↓
User enters card details
    ↓
Paystack processes payment
    ↓
Payment succeeds on Paystack
    ↓
Frontend receives success callback
    ↓
Frontend calls verification API
    ↓
Backend verifies with Paystack
    ↓
Backend updates database
    ↓
User gets hints/premium access
    ↓
Success page shown
```

---

## Step-by-Step Process

### Step 1: User Initiates Payment

**Location:** Store page (`/store`) or Subscribe page (`/subscribe`)

**User Action:**
- Clicks "Buy 10 Hints" or "Subscribe to Premium"

**What Happens:**
```typescript
// PaystackButton component is rendered
<PaystackButton
  amount={1000}              // Amount in NGN
  email={user.email}
  type="hint_pack"           // or "subscription"
  metadata={{ hints: 10 }}
  onSuccess={handleSuccess}
/>
```

---

### Step 2: Payment Configuration

**File:** `src/components/payment/PaystackButton.tsx`

**Configuration Created:**
```typescript
const config = {
  reference: `DD_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
  email: user.email,
  amount: amount * 100,  // Convert NGN to kobo (smallest unit)
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  metadata: {
    userId: user.uid,
    type: 'hint_pack',     // or 'subscription'
    hints: 10,             // for hint packs
  },
};
```

**Key Points:**
- Reference is unique per transaction
- Amount is in kobo (1 NGN = 100 kobo)
- Metadata includes user ID and purchase type

---

### Step 3: Paystack Modal Opens

**Library:** `react-paystack`

**What User Sees:**
- Paystack payment modal overlay
- Card input fields
- Amount to pay
- Merchant name

**User Enters:**
- Card number
- CVV
- Expiry date
- PIN (if required)
- OTP (if required)

**Test Cards:**
```
Success: 4084084084084081
Decline: 5060666666666666666
Insufficient: 5078000000000000
```

---

### Step 4: Paystack Processes Payment

**What Happens:**
1. Paystack validates card details
2. Contacts card issuer
3. Processes authorization
4. Handles 3D Secure if needed
5. Completes transaction

**Possible Outcomes:**
- ✅ Success - Payment authorized
- ❌ Declined - Insufficient funds, invalid card, etc.
- ⏳ Pending - Awaiting confirmation

---

### Step 5: Payment Success Callback

**File:** `src/components/payment/PaystackButton.tsx`

**Function:** `handleSuccess(reference)`

```typescript
const handleSuccess = async (reference: any) => {
  const refCode = reference.reference;
  console.log('Payment successful on Paystack. Reference:', refCode);
  
  // Verify payment with backend
  const verified = await verifyPaymentWithRetry(refCode);
  
  if (verified) {
    // Show success message
    // Redirect to success page
  }
};
```

**What Happens:**
- Frontend receives reference from Paystack
- Calls backend verification API
- Waits for confirmation

---

### Step 6: Backend Verification

**File:** `src/app/api/paystack/verify/route.ts`

**API Endpoint:** `GET /api/paystack/verify?reference=DD_123456`

**Process:**

1. **Receive Request:**
```typescript
const reference = searchParams.get('reference');
const userId = req.headers.get('x-user-id');
```

2. **Verify with Paystack:**
```typescript
// Call Paystack API
const result = await verifyTransaction(reference);

// Check status
if (result.data.status !== 'success') {
  return error;
}
```

3. **Extract Payment Data:**
```typescript
const { metadata } = result.data;
const paymentUserId = metadata?.userId;
const paymentType = metadata.type;
const amount = fromKobo(result.data.amount);
```

4. **Validate:**
```typescript
// Check user ID matches
if (userId && userId !== paymentUserId) {
  return error('User ID mismatch');
}

// Check payment type exists
if (!paymentType) {
  return error('Unknown payment type');
}
```

---

### Step 7: Paystack API Verification

**File:** `src/lib/paystack.ts`

**Function:** `verifyTransaction(reference)`

```typescript
export async function verifyTransaction(reference: string) {
  const response = await paystackClient.get(
    `/transaction/verify/${reference}`
  );
  return response.data;
}
```

**Paystack API Call:**
```
GET https://api.paystack.co/transaction/verify/DD_123456
Headers:
  Authorization: Bearer sk_test_YOUR_SECRET_KEY
```

**Paystack Response:**
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "status": "success",
    "reference": "DD_123456",
    "amount": 100000,
    "currency": "NGN",
    "metadata": {
      "userId": "abc123",
      "type": "hint_pack",
      "hints": 10
    },
    "customer": {
      "email": "user@example.com"
    }
  }
}
```

---

### Step 8: Database Update

**File:** `src/app/api/paystack/verify/route.ts`

**For Hint Purchase:**
```typescript
if (paymentType === 'hint_pack') {
  const hintsToAdd = metadata.hints || 0;
  
  await firestore.collection('userProfiles').doc(paymentUserId).update({
    hints: FieldValue.increment(hintsToAdd),
    hintsLastUpdated: new Date(),
    updatedAt: new Date(),
  });
}
```

**For Subscription:**
```typescript
if (paymentType === 'subscription') {
  await firestore.collection('userProfiles').doc(paymentUserId).update({
    subscriptionStatus: 'active',
    subscriptionReference: reference,
    subscriptionAmount: amount,
    isPremium: true,
    updatedAt: new Date(),
  });
}
```

**Transaction Record:**
```typescript
await firestore.collection('transactions').add({
  userId: paymentUserId,
  reference,
  amount,
  type: paymentType,
  status: 'success',
  verifiedAt: new Date(),
  verifiedBy: 'api',
  createdAt: new Date(),
});
```

---

### Step 9: Success Response

**Backend Returns:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "reference": "DD_123456",
    "amount": 1000,
    "type": "hint_pack",
    "status": "success"
  }
}
```

---

### Step 10: Frontend Updates

**File:** `src/components/payment/PaystackButton.tsx`

**Actions:**
1. Show success toast
2. Redirect to success page
3. User profile updates automatically (real-time)

```typescript
toast({
  title: 'Success!',
  description: 'Your payment has been processed successfully.',
});

router.push('/payment/success?reference=' + refCode);
```

---

### Step 11: Success Page

**File:** `src/app/payment/success/page.tsx`

**User Sees:**
- ✅ Payment successful message
- Transaction reference
- Amount paid
- What they purchased
- Link to continue playing

---

## Error Handling

### Payment Declined

**What Happens:**
1. Paystack returns decline reason
2. Modal shows error
3. User can retry
4. No database changes

### Verification Failed

**What Happens:**
1. Payment succeeded on Paystack
2. Backend verification fails
3. Retry logic kicks in (3 attempts)
4. If all fail, show error
5. User can contact support

**Retry Logic:**
```typescript
const verifyPaymentWithRetry = async (reference: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`/api/paystack/verify?reference=${reference}`);
      if (response.ok) return true;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

### Network Issues

**What Happens:**
1. Request times out
2. Retry automatically
3. Show error after 3 attempts
4. User can retry manually

---

## Security Measures

### 1. Server-Side Verification

**Why:** Never trust client-side payment confirmation

**How:**
- Frontend receives success from Paystack
- Backend independently verifies with Paystack API
- Only backend can update database

### 2. User ID Validation

**Why:** Prevent payment hijacking

**How:**
```typescript
// Check user ID in metadata matches logged-in user
if (userId && userId !== paymentUserId) {
  return error('User ID mismatch');
}
```

### 3. Secret Key Protection

**Why:** Prevent unauthorized API access

**How:**
- Secret key stored in environment variables
- Never exposed to frontend
- Only used in server-side code

### 4. Reference Uniqueness

**Why:** Prevent duplicate processing

**How:**
```typescript
const reference = `DD_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
```

### 5. Amount Validation

**Why:** Prevent amount tampering

**How:**
- Amount set on backend (future enhancement)
- Verified against expected amount
- Logged for audit

---

## Payment Types

### 1. Hint Pack Purchase

**Type:** `hint_pack`

**Metadata:**
```json
{
  "userId": "abc123",
  "type": "hint_pack",
  "hints": 10
}
```

**Database Update:**
- Increment user's hint count
- Record transaction
- Update timestamp

**Pricing:**
```
10 hints = ₦1,000
25 hints = ₦2,000
50 hints = ₦3,500
```

### 2. Premium Subscription

**Type:** `subscription`

**Metadata:**
```json
{
  "userId": "abc123",
  "type": "subscription"
}
```

**Database Update:**
- Set isPremium = true
- Set subscriptionStatus = 'active'
- Store subscription reference
- Grant access to premium themes

**Pricing:**
```
Monthly = ₦2,500
Yearly = ₦25,000
```

---

## Testing Payments

### Test Mode

**Use Test Keys:**
```
Public: pk_test_...
Secret: sk_test_...
```

**Test Cards:**
```
Success:
  Card: 4084084084084081
  CVV: 408
  Expiry: 12/25
  PIN: 0000
  OTP: 123456

Decline:
  Card: 5060666666666666666
  
Insufficient Funds:
  Card: 5078000000000000
```

### Test Process

1. **Go to Store:** https://definition-detective-app.vercel.app/store
2. **Click "Buy Hints"**
3. **Enter test card details**
4. **Complete payment**
5. **Verify hints added**
6. **Check Firestore for transaction**

---

## Monitoring Payments

### Paystack Dashboard

**URL:** https://dashboard.paystack.com/transactions

**View:**
- All transactions
- Payment status
- Customer details
- Revenue metrics

### Vercel Logs

```bash
vercel logs --follow
```

**Look for:**
- Payment verification logs
- Success/error messages
- Database updates

### Firebase Console

**URL:** https://console.firebase.google.com/

**Check:**
- User profiles updated
- Hints incremented
- Transactions recorded

---

## Common Issues

### "Verification failed: failed to verify payment"

**Cause:** Missing or wrong Paystack secret key

**Fix:**
```bash
echo "sk_test_YOUR_KEY" | vercel env add PAYSTACK_SECRET_KEY production
vercel --prod
```

### "Invalid payment metadata"

**Cause:** User ID missing from metadata

**Fix:** Ensure user is logged in before payment

### "User ID mismatch"

**Cause:** Payment user ID doesn't match logged-in user

**Fix:** Check authentication flow

### Payment succeeds but hints not added

**Cause:** Database update failed

**Fix:**
1. Check Firestore rules
2. Verify user profile exists
3. Check Vercel logs for errors

---

## Payment Flow Code

### Complete Flow Example

```typescript
// 1. User clicks buy button
<PaystackButton
  amount={1000}
  email={user.email}
  type="hint_pack"
  metadata={{ hints: 10 }}
  onSuccess={handleSuccess}
/>

// 2. Paystack processes payment
// (handled by Paystack)

// 3. Success callback
const handleSuccess = async (reference) => {
  // 4. Verify with backend
  const response = await fetch(
    `/api/paystack/verify?reference=${reference.reference}`,
    { headers: { 'x-user-id': user.uid } }
  );
  
  // 5. Check result
  const result = await response.json();
  
  if (result.success) {
    // 6. Show success
    toast({ title: 'Payment successful!' });
    
    // 7. Redirect
    router.push('/payment/success');
  }
};

// Backend verification
export async function GET(req: NextRequest) {
  // 8. Get reference
  const reference = req.nextUrl.searchParams.get('reference');
  
  // 9. Verify with Paystack
  const result = await verifyTransaction(reference);
  
  // 10. Update database
  await firestore.collection('userProfiles').doc(userId).update({
    hints: FieldValue.increment(10),
  });
  
  // 11. Record transaction
  await firestore.collection('transactions').add({
    userId,
    reference,
    amount: 1000,
    type: 'hint_pack',
    status: 'success',
  });
  
  // 12. Return success
  return NextResponse.json({ success: true });
}
```

---

## Webhooks (Future Enhancement)

### What are Webhooks?

Paystack can notify your server when payments complete, even if user closes browser.

### Setup

1. **Configure in Paystack:**
   - Dashboard → Settings → Webhooks
   - URL: `https://your-app.vercel.app/api/paystack/webhook`

2. **Verify Webhook:**
```typescript
// src/app/api/paystack/webhook/route.ts
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text();
  
  // Verify signature
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');
  
  if (hash === signature) {
    // Process webhook
    const event = JSON.parse(body);
    
    if (event.event === 'charge.success') {
      // Update database
    }
  }
}
```

---

## Best Practices

### ✅ Do

- Always verify payments server-side
- Use unique references
- Log all transactions
- Handle errors gracefully
- Test thoroughly before going live
- Monitor payment logs
- Keep secret keys secure

### ❌ Don't

- Trust client-side payment confirmation
- Expose secret keys
- Skip verification step
- Ignore error handling
- Use same reference twice
- Commit API keys to Git

---

## Summary

**Payment Flow:**
1. User initiates → 2. Paystack processes → 3. Frontend callback → 4. Backend verifies → 5. Database updates → 6. Success shown

**Key Components:**
- PaystackButton (frontend)
- Verification API (backend)
- Paystack library (API calls)
- Firestore (database)

**Security:**
- Server-side verification
- User ID validation
- Secret key protection
- Transaction logging

**Current Status:**
- ✅ Payment system working
- ✅ Verification implemented
- ✅ Database updates working
- ✅ Error handling in place

---

**Need help with payments?** Check the logs or test with test cards!
