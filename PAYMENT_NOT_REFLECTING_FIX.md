# 🔧 Fix: Payments Not Reflecting in App

## Problem

Payments succeed on Paystack but don't reflect in the app (hints not added, premium not granted).

## Root Causes

### 1. Firebase Admin Not Initialized ⚠️ MOST LIKELY

**Symptom:** Verification API fails silently

**Check:**
```bash
vercel logs | grep "Firebase"
```

**Look for:**
- "Firebase app not initialized"
- "Firestore is not defined"
- "getFirestore is not a function"

### 2. Missing Callback Page

**Issue:** Callback URL points to `/payment/callback` which doesn't exist

### 3. Verification API Failing

**Issue:** Backend verification succeeds but database update fails

---

## Complete Fix

### Step 1: Check Firebase Admin Initialization

Create/update `src/lib/firebase-admin.ts`:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

export { getFirestore, getAuth };
```

### Step 2: Add Missing Environment Variables

Check if these are set in Vercel:

```bash
vercel env ls
```

**Required:**
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

**To add:**
```bash
# Get from Firebase Console → Project Settings → Service Accounts
# Download JSON, then:

echo "YOUR_CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL production
echo "YOUR_PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY production
```

### Step 3: Update Verification Route

Update `src/app/api/paystack/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore } from '@/lib/firebase-admin'; // Import from our init file
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  console.log('🔍 Verification request for reference:', reference);

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    const userId = req.headers.get('x-user-id');
    console.log('👤 User ID from header:', userId);

    // Verify with Paystack
    let result;
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        console.log(`🔄 Verification attempt ${retries + 1}/${maxRetries}`);
        result = await verifyTransaction(reference);
        console.log('✅ Paystack verification successful');
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Verification attempt ${retries + 1} failed:`, error.message);
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!result) {
      console.error('❌ All verification attempts failed');
      throw lastError || new Error('Failed to verify transaction after retries');
    }

    if (result.data.status !== 'success') {
      console.error('❌ Payment status not success:', result.data.status);
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
          data: result.data
        },
        { status: 400 }
      );
    }

    console.log('💰 Payment verified, processing database update...');

    const firestore = getFirestore();
    const { metadata } = result.data;
    const paymentUserId = metadata?.userId;

    console.log('📦 Payment metadata:', metadata);

    if (!paymentUserId) {
      console.error('❌ Missing userId in metadata');
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    if (userId && userId !== paymentUserId) {
      console.error('❌ User ID mismatch:', { userId, paymentUserId });
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    console.log('💳 Payment details:', { amount, paymentType, userId: paymentUserId });

    if (!paymentType) {
      console.error('❌ Missing payment type');
      return NextResponse.json(
        { error: 'Unknown payment type' },
        { status: 400 }
      );
    }

    // Update user based on payment type
    try {
      if (paymentType === 'subscription') {
        console.log('👑 Granting premium access...');
        await firestore.collection('userProfiles').doc(paymentUserId).set({
          subscriptionStatus: 'active',
          subscriptionReference: reference,
          subscriptionAmount: amount,
          isPremium: true,
          updatedAt: new Date(),
        }, { merge: true });
        console.log('✅ Premium access granted');
      } else if (paymentType === 'hint_pack') {
        const hintsToAdd = metadata.hints || 0;
        console.log(`💡 Adding ${hintsToAdd} hints...`);
        
        // Get current hints first
        const userDoc = await firestore.collection('userProfiles').doc(paymentUserId).get();
        const currentHints = userDoc.data()?.hints || 0;
        
        await firestore.collection('userProfiles').doc(paymentUserId).set({
          hints: currentHints + hintsToAdd,
          hintsLastUpdated: new Date(),
          updatedAt: new Date(),
        }, { merge: true });
        
        console.log(`✅ Hints added. New total: ${currentHints + hintsToAdd}`);
      } else {
        console.error('❌ Unknown payment type:', paymentType);
        return NextResponse.json(
          { error: 'Unknown payment type: ' + paymentType },
          { status: 400 }
        );
      }

      // Store transaction record
      console.log('📝 Recording transaction...');
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
      console.log('✅ Transaction recorded');

      console.log('🎉 Payment processing complete!');

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference,
          amount,
          type: paymentType,
          status: result.data.status,
        },
      });
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify payment',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### Step 4: Create Callback Page

Create `src/app/payment/callback/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'use';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found');
      setTimeout(() => router.push('/payment/failed'), 2000);
      return;
    }

    verifyPayment(reference);
  }, [searchParams, user]);

  const verifyPayment = async (reference: string) => {
    try {
      const token = await user?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user?.uid || '',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/paystack/verify?reference=${reference}`,
        { headers }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage('Payment verified successfully!');
        setTimeout(() => router.push(`/payment/success?reference=${reference}`), 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Verification failed');
        setTimeout(() => router.push('/payment/failed'), 2000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Verification failed');
      setTimeout(() => router.push('/payment/failed'), 2000);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Verifying Payment</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-green-600">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

### Step 5: Test the Fix

```bash
# 1. Deploy changes
git add .
git commit -m "Fix payment verification and add logging"
git push origin main
vercel --prod

# 2. Test payment
# Go to: https://definition-detective-app.vercel.app/store
# Buy hints with test card

# 3. Watch logs
vercel logs --follow

# Look for:
# ✅ Firebase Admin initialized
# 🔍 Verification request for reference: DD_...
# ✅ Paystack verification successful
# 💡 Adding 10 hints...
# ✅ Hints added
# 🎉 Payment processing complete!
```

---

## Debugging Checklist

### Check Environment Variables

```bash
vercel env ls
```

**Must have:**
- ✅ PAYSTACK_SECRET_KEY
- ✅ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- ✅ FIREBASE_CLIENT_EMAIL
- ✅ FIREBASE_PRIVATE_KEY
- ✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID

### Check Vercel Logs

```bash
vercel logs --follow
```

**Look for:**
- Firebase initialization errors
- Verification request logs
- Database update logs
- Any error messages

### Check Paystack Dashboard

https://dashboard.paystack.com/transactions

**Verify:**
- Payment shows as "Success"
- Metadata includes userId and type
- Amount is correct

### Check Firebase Console

https://console.firebase.google.com/

**Verify:**
- User profile exists
- Hints field exists
- Firestore rules allow writes

---

## Common Issues & Fixes

### Issue 1: "Firebase app not initialized"

**Fix:**
```bash
# Add Firebase credentials
echo "YOUR_CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL production
echo "YOUR_PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY production
vercel --prod
```

### Issue 2: "Firestore permission denied"

**Fix:** Update Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null;
      allow write: if request.auth.token.admin == true; // For admin
    }
    
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Issue 3: Hints not incrementing

**Fix:** Use `.set()` with `merge: true` instead of `.update()`:
```typescript
await firestore.collection('userProfiles').doc(userId).set({
  hints: currentHints + hintsToAdd,
  updatedAt: new Date(),
}, { merge: true });
```

### Issue 4: Verification succeeds but database not updated

**Check:**
1. Firebase Admin initialized?
2. Firestore rules allow writes?
3. User profile document exists?
4. Correct collection names?

---

## Quick Test

```bash
# 1. Make test payment
# Card: 4084084084084081

# 2. Watch logs in real-time
vercel logs --follow

# 3. Check Firebase Console
# Go to userProfiles → your user
# Verify hints increased

# 4. Check transactions collection
# Should see new transaction record
```

---

## Manual Fix (Emergency)

If payment succeeded but didn't reflect:

1. **Get transaction reference** from Paystack dashboard
2. **Manually update Firestore:**

```javascript
// In Firebase Console
const userId = "USER_ID_HERE";
const currentHints = 100; // Current value
const hintsToAdd = 10;

// Update hints
db.collection('userProfiles').doc(userId).update({
  hints: currentHints + hintsToAdd,
  hintsLastUpdated: new Date(),
  updatedAt: new Date()
});

// Add transaction record
db.collection('transactions').add({
  userId: userId,
  reference: "DD_123456",
  amount: 1000,
  type: "hint_pack",
  status: "success",
  verifiedAt: new Date(),
  verifiedBy: "manual",
  createdAt: new Date()
});
```

---

## Prevention

To prevent future issues:

1. ✅ Always check Vercel logs after deployment
2. ✅ Test payments in test mode first
3. ✅ Monitor Firebase Console for updates
4. ✅ Set up Paystack webhooks as backup
5. ✅ Keep environment variables updated

---

**Most likely fix:** Add Firebase Admin credentials and redeploy!
