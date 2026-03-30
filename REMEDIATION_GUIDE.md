# 🔧 Security Vulnerability Remediation Guide

## Phase 1: Emergency Actions (TODAY - This Hour)

### Step 1: Revoke Exposed API Keys

#### Google Generative AI
**Exposed Key:** `[REDACTED - KEY REVOKED]`

**Steps:**
1. Go to https://makersuite.google.com/app/apikey
2. Find the key `[REDACTED - KEY REVOKED]`
3. Click the trash icon to delete
4. Create a new API key
5. Copy the new key

**Timeline:** 5 minutes

---

#### Firebase API Key
**Exposed Key:** `[REDACTED - KEY REVOKED]`

**Steps:**
1. Go to https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/general
2. Scroll to "Your Web App"
3. Look at "Authorized JavaScript origins" and "Authorized redirect URIs"
4. Delete the current API key and create a new one:
   - Go to https://console.cloud.google.com/project/studio-4536174912-ee6ca/apis/credentials
   - Click "Create Credentials" → "API Key"
5. Copy the new key

**Timeline:** 5 minutes

---

#### Firebase Private Key (Service Account)
**Exposed Key:** (in `.env.local`)

**Steps:**
1. Go to https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/serviceaccounts/adminsdk
2. Find the service account starting with `firebase-adminsdk`
3. Click on it
4. Find the key with `private_key_id` matching the one in `.env.local`
5. Click the trash icon on the right
6. Confirm deletion
7. Generate a new private key:
   - Click "Generate new private key"
   - A JSON file downloads
8. Extract from the JSON:
   - `private_key`: Long key starting with `-----BEGIN PRIVATE KEY-----`
   - `client_email`: Should look like `firebase-adminsdk-xxxxx@studio-4536174912-ee6ca.iam.gserviceaccount.com`

**Timeline:** 5-10 minutes

---

#### Paystack Secret Key
**Exposed Key:** `[REDACTED - KEY REVOKED]`

**Steps:**
1. Go to https://dashboard.paystack.co/settings/developer
2. Find "API Keys" section
3. Look for the live secret key starting with `[REDACTED - KEY REVOKED]`
4. Click the red trash/delete icon
5. Confirm deletion
6. Generate new keys:
   - API Keys table shows both public and secret
   - Copy the new secret key (starts with `sk_live_` or `sk_test_`)

**⚠️ CRITICAL:** Check if this was used fraudulently:
- Go to https://dashboard.paystack.co/
- Click "Transactions"
- Review recent transactions for unusual activity
- Report any fraud: support@paystack.co

**Timeline:** 10 minutes + fraud review

---

### Step 2: Update Local Environment

```bash
# 1. Open .env.local in VS Code
code /home/yerekimea/Desktop/Definition_Detective_App/.env.local

# 2. Replace with new values (keep same keys, just update values):
# Old:
# GOOGLE_GENAI_API_KEY=AIzaSyDJYGcg35D8UScTEAZlzhEObiUJ3b7Vrg0

# New:
# GOOGLE_GENAI_API_KEY=<NEW_KEY_FROM_STEP_1>

# 3. Save file (Ctrl+S)
```

**Keys to Update:**
- `GOOGLE_GENAI_API_KEY` → New Google key
- `GEMINI_API_KEY` → New Google key  
- `NEXT_PUBLIC_FIREBASE_API_KEY` → New Firebase key
- `FIREBASE_PRIVATE_KEY` → New Firebase private key
- `FIREBASE_CLIENT_EMAIL` → New Firebase client email
- `PAYSTACK_SECRET_KEY` → New Paystack secret key

**Timeline:** 5 minutes

---

### Step 3: Update Vercel Environment Variables

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Add each environment variable to production

# Add Google keys
vercel env add GOOGLE_GENAI_API_KEY
# Paste: <NEW_GOOGLE_KEY>
# Select: production, preview, development

vercel env add GEMINI_API_KEY
# Paste: <NEW_GOOGLE_KEY>
# Select: production, preview, development

# Add Firebase keys
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste: <NEW_FIREBASE_KEY>
# Select: production, preview, development

vercel env add FIREBASE_PRIVATE_KEY
# Paste: <NEW_FIREBASE_PRIVATE_KEY>
# Select: production only (secret)

vercel env add FIREBASE_CLIENT_EMAIL
# Paste: <NEW_FIREBASE_EMAIL>
# Select: production, preview, development

# Add Paystack keys
vercel env add PAYSTACK_SECRET_KEY
# Paste: <NEW_PAYSTACK_SECRET>
# Select: production only (secret)

# 4. View all environment variables to verify
vercel env ls
```

**Timeline:** 10 minutes

---

### Step 4: Verify Git History for Exposed Secrets

```bash
# Check if secrets are in git history
cd /home/yerekimea/Desktop/Definition_Detective_App

# Method 1: Using git log
git log -p --all | grep -E "AIzaSy|sk_live|sk_test|-----BEGIN PRIVATE"

# Method 2: Using git-secrets (recommended)
npm install -g git-secrets
git secrets --scan

# Method 3: Using trufflehog
npm install -g trufflehog
trufflehog git file://. --issue-type secret
```

**If secrets found in history:**
```bash
# Option 1: Force push to rewrite history (destructive)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Use git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path .env.local

# After cleaning:
git push --force-with-lease
```

**⚠️ This is destructive, coordinate with team first**

**Timeline:** 10-20 minutes

---

### Step 5: Verify Deployment

```bash
# 1. Trigger deployment with new env vars
vercel --prod

# 2. Verify app works
# Open https://definition-detective-app.vercel.app

# 3. Check that features work:
# - Sign up / login
# - Play game
# - Payment flow (test cards)
```

**Timeline:** 5-10 minutes

---

## Phase 2: Critical Code Fixes (THIS WEEK)

### Fix 1: Add Authentication to `/api/paystack/verify`

**Current Issue:** Accepts any user ID from header

**File:** `src/app/api/paystack/verify/route.ts`

**Current Code (VULNERABLE):**
```typescript
const userId = req.headers.get('x-user-id');
```

**Fixed Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // ✅ NEW: Verify Firebase ID token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - token required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // ✅ NOW userId is verified to belong to authenticated user
    const userId = decodedToken.uid;

    // ... rest of verification logic (unchanged)
    // Verify transaction with Paystack
    const result = await verifyTransaction(reference);

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // ... update user profile in Firestore
    const firestore = getFirestore();
    const { metadata, amount } = result.data;

    // Verify metadata user matches authenticated user
    if (metadata?.userId !== userId) {
      return NextResponse.json(
        { error: 'Payment metadata mismatch' },
        { status: 400 }
      );
    }

    // ... continue with payment processing
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
```

**Update Client Call:**
```typescript
// In: src/app/payment/success/page.tsx
// OLD:
const response = await fetch(`/api/paystack/verify?reference=${ref}`, {
  headers: {
    'x-user-id': user?.uid || '',
  },
});

// NEW:
const idToken = await user?.getIdToken();
const response = await fetch(`/api/paystack/verify?reference=${ref}`, {
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});
```

**Timeline:** 30 minutes

---

### Fix 2: Secure `/api/clear-words` and `/api/clear-my-words`

**File:** `src/app/api/clear-words/route.ts`

**Current (VULNERABLE):**
```typescript
const { userId } = body; // No auth check
```

**Fixed:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { clearUserWordHistory } from '@/lib/word-generator';

export async function POST(request: NextRequest) {
  try {
    // ✅ Step 1: Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decodedToken = await getAuth().verifyIdToken(
      authHeader.slice(7)
    );
    const authenticatedUserId = decodedToken.uid;

    // ✅ Step 2: Get user ID and verify it matches
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // ✅ Step 3: Authorization - user can only clear own data
    if (userId !== authenticatedUserId) {
      console.warn(
        `Unauthorized attempt to clear words for user ${userId} by ${authenticatedUserId}`
      );
      return NextResponse.json(
        { error: 'Cannot clear another user\'s data' },
        { status: 403 }
      );
    }

    // ✅ Now safe to proceed
    const result = await clearUserWordHistory(userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[clear-words] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Timeline:** 20 minutes

---

### Fix 3: Update Firebase Security Rules

**File:** `firestore.rules`

**Current (VULNERABLE):**
```firestore
match /leaderboardEntries/{leaderboardEntryId} {
    allow read: if true;
    allow create, update: if isSignedIn();
}
```

**Fixed:**
```firestore
match /leaderboardEntries/{leaderboardEntryId} {
    // Anyone can read public leaderboard
    allow read: if true;
    
    // Only creator can create and update their entry
    allow create: if isSignedIn() && 
                    request.resource.data.userId == request.auth.uid &&
                    request.resource.data.score >= 0 &&
                    request.resource.data.score <= 5000;
    
    allow update: if isSignedIn() && 
                    resource.data.userId == request.auth.uid &&
                    request.resource.data.score > resource.data.score &&
                    request.resource.data.score <= resource.data.score + 100;
    
    allow delete: if isOwner(resource.data.userId);
}
```

**Deploy:** 
```bash
firebase deploy --only firestore:rules
```

**Timeline:** 15 minutes

---

### Fix 4: Remove or Secure Debug Endpoint

**File:** `.mobile-build-backup/app/api/debug/route.ts` (delete or secure)

**Option A: Delete (Recommended)**
```bash
rm src/app/api/debug/route.ts
```

**Option B: Secure It**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // ✅ Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // ✅ Only allow from localhost
  const host = req.headers.get('host') || '';
  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return NextResponse.json(
      { error: 'Only accessible from localhost' },
      { status: 403 }
    );
  }

  // ✅ Don't expose key details
  return NextResponse.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    // Remove: hasGeminiKey, geminiKeyLength, etc.
  });
}
```

**Timeline:** 10 minutes

---

## Phase 3: Hardening (NEXT WEEK)

### Add HTTPS Security Headers

**File:** `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // ✅ NEW: Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HTTPS enforcement
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },

  // ... rest of config
};

export default nextConfig;
```

**Timeline:** 20 minutes

---

### Add Rate Limiting to Payment APIs

**Install dependency:**
```bash
npm install --save @upstash/ratelimit @upstash/redis
```

**Create middleware:** `src/lib/ratelimit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    5, // 5 requests
    '1 m' // per minute
  ),
});

export async function checkRateLimit(identifier: string) {
  try {
    const { success, remaining } = await ratelimit.limit(identifier);
    return { success, remaining };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - don't block if service unavailable
    return { success: true, remaining: 0 };
  }
}
```

**Use in API route:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  // ✅ Check rate limit by IP
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success, remaining } = await checkRateLimit(`payment:${ip}`);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // ... continue with handler
}
```

**Timeline:** 30 minutes

---

### Input Validation with Zod

**Install:** (Already in project)
```bash
npm list zod
```

**Update payment verification:**
```typescript
import { z } from 'zod';

const PaymentMetadataSchema = z.object({
  userId: z.string().min(1).max(200),
  type: z.enum(['subscription', 'hint_pack']),
  plan: z.enum(['monthly', 'yearly']).optional(),
  hints: z.number().int().positive().max(1000).optional(),
});

type PaymentMetadata = z.infer<typeof PaymentMetadataSchema>;

export async function POST(req: NextRequest) {
  try {
    const event = JSON.parse(body);
    const { metadata } = event.data;

    // ✅ Validate metadata
    const validatedMetadata = PaymentMetadataSchema.parse(metadata);

    // Use validatedMetadata safely
    const { userId, type } = validatedMetadata;
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.errors },
        { status: 400 }
      );
    }
    // ... handle other errors
  }
}
```

**Timeline:** 40 minutes

---

## Phase 4: Monitoring & Audit

### Set Up Security Logging

```typescript
// lib/security-logger.ts
export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'VALIDATION_FAILURE' | 'RATE_LIMIT' | 'UNAUTHORIZED_ACCESS';
  timestamp: Date;
  userId?: string;
  ip?: string;
  resource: string;
  details: Record<string, any>;
}

export async function logSecurityEvent(event: SecurityEvent) {
  const firestore = getFirestore();

  await firestore.collection('security_logs').add({
    ...event,
    timestamp: new Date(),
  });

  // Also log to external service (e.g., Sentry, DataDog)
  console.warn('[SECURITY]', event);
}
```

**Use in authentication failures:**
```typescript
import { logSecurityEvent } from '@/lib/security-logger';

if (!authHeader) {
  await logSecurityEvent({
    type: 'AUTH_FAILURE',
    resource: '/api/paystack/verify',
    ip: req.headers.get('x-forwarded-for') || '',
    details: { reason: 'missing_token' },
  });

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**Timeline:** 1 hour

---

## Testing Checklist

### Security Testing

```bash
# Test 1: Verify authentication is required
curl -X GET "http://localhost:3000/api/paystack/verify?reference=test" \
  -H "x-user-id: fake-user"
# Should return: 401 Unauthorized

# Test 2: Verify with valid token
const token = await auth.currentUser?.getIdToken()
curl -X GET "http://localhost:3000/api/paystack/verify?reference=test" \
  -H "Authorization: Bearer $token"
# Should verify signature

# Test 3: Test rate limiting
for i in {1..10}; do
  curl -X POST "http://localhost:3000/api/paystack/initialize"
done
# After 5 requests should get: 429 Too Many Requests

# Test 4: Verify HTTPS headers
curl -I https://definition-detective-app.vercel.app
# Should include: Strict-Transport-Security, X-Content-Type-Options, etc.
```

**Timeline:** 30 minutes

---

## Summary Timeline

| Phase | Tasks | Timeline |
|-------|-------|----------|
| 1 | Revoke & rotate keys | **2 hours** |
| 2 | Code security fixes | **3-4 hours** |
| 3 | Hardening & monitoring | **3-4 hours** |
| 4 | Testing & validation | **1-2 hours** |
| **Total** | **All phases** | **~12 hours** |

---

## Success Criteria

After remediation, verify:
- ✅ All API keys rotated
- ✅ Authentication required on sensitive endpoints  
- ✅ Firebase rules restrict user access
- ✅ Debug endpoint secured/removed
- ✅ Rate limiting in place
- ✅ HTTPS headers configured
- ✅ Input validation on all endpoints
- ✅ No secrets in git history
- ✅ Security logging active
- ✅ All tests passing

