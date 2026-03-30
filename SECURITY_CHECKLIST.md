# 🚨 CRITICAL: Security Issues - Quick Reference

## ⚠️ EXPOSED SECRETS - IMMEDIATE ACTION REQUIRED

### Exposed API Keys (Revoke NOW)

| Service | Exposed Key | Status | Action |
|---------|------------|--------|--------|
| **Google AI** | `[REDACTED - KEY REVOKED]` | 🔴 ACTIVE | Revoke at https://makersuite.google.com |
| **Firebase API** | `[REDACTED - KEY REVOKED]` | 🔴 ACTIVE | Revoke in Firebase Console |
| **Firebase Private Key** | `[REDACTED - KEY REVOKED]` | 🔴 ACTIVE | Regenerate service account |
| **Paystack Secret** | `[REDACTED - KEY REVOKED]` | 🔴 ACTIVE | Revoke at https://dashboard.paystack.co |

### Steps (in order):

**1. In Next 30 Minutes:**
```bash
# Check for fraud on Paystack
# https://dashboard.paystack.co/transactions

# Revoke each key (see SECURITY_AUDIT_REPORT.md for detailed steps)
- Google API Key ✓
- Firebase API Key ✓  
- Firebase Private Key ✓
- Paystack Secret Key ✓

# Generate brand new keys
- Google API Key ✓
- Firebase API Key ✓
- Firebase Private Key ✓
- Paystack Secret Key ✓
```

**2. Update `.env.local`:**
```bash
# Copy new values only (don't commit to git)
GOOGLE_GENAI_API_KEY=<NEW>
GEMINI_API_KEY=<NEW>
NEXT_PUBLIC_FIREBASE_API_KEY=<NEW>
FIREBASE_PRIVATE_KEY=<NEW>
FIREBASE_CLIENT_EMAIL=<NEW>
PAYSTACK_SECRET_KEY=<NEW>
```

**3. Update Vercel Secrets:**
```bash
vercel env add GOOGLE_GENAI_API_KEY <new_key>
vercel env add FIREBASE_PRIVATE_KEY <new_key> 
vercel env add PAYSTACK_SECRET_KEY <new_key>
# ... etc for all keys
```

**4. Verify Deployment:**
```bash
vercel --prod
# Test basic functionality
```

---

## 🔴 CRITICAL CODE VULNERABILITIES

### Missing Authentication (8 Issues)

| Endpoint | Issue | Fix Time |
|----------|-------|----------|
| `/api/paystack/verify` | No token verification | 30 min |
| `/api/clear-words` | No auth check | 20 min |
| `/api/clear-my-words` | Weak validation | 20 min |
| `/api/pay` (webhook) | Basic signature only | 20 min |
| `/api/paystack/initialize` | No rate limiting | 15 min |
| `/api/paystack/retry-webhooks` | Timing attack risk | 10 min |
| Debug endpoint | Exposes env details | 10 min |
| `firestore.rules` | Too permissive | 15 min |

**Priority Fix Order:**
1. Add Firebase token verification to `/api/paystack/verify` ⭐ CRITICAL
2. Add authorization checks to user data operations
3. Update Firebase security rules
4. Remove/secure debug endpoint

---

## Quick Fix Snippets

### Add Token Verification
```typescript
// Add to any endpoint that needs auth
import { getAuth } from 'firebase-admin/auth';

const authHeader = req.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const decodedToken = await getAuth().verifyIdToken(authHeader.slice(7));
const userId = decodedToken.uid;
```

### Verify User Owns Data
```typescript
// After getting userId from token
if (requestedUserId !== userId) {
  return NextResponse.json(
    { error: 'Cannot access another user\'s data' },
    { status: 403 }
  );
}
```

### Validate Input with Zod
```typescript
import { z } from 'zod';

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive().max(10000),
});

const validated = schema.parse(input); // Throws on invalid
```

---

## 📟 Verification Commands

```bash
# Check for exposed secrets in git
git log -p --all | grep -E "AIzaSy|sk_live|-----BEGIN PRIVATE"

# List Vercel environment variables
vercel env ls

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/paystack/initialize
done

# Verify HTTPS headers
curl -I https://definition-detective-app.vercel.app
```

---

## 📋 Completion Checklist

### This Hour (Emergency)
- [ ] Revoked Google API key
- [ ] Revoked Firebase API key
- [ ] Regenerated Firebase private key
- [ ] Revoked Paystack secret key
- [ ] Checked Paystack for fraud
- [ ] Updated `.env.local` with new keys
- [ ] Pushed to Vercel
- [ ] Verified app works

### Today (Code Fixes)
- [ ] Added token verification to `/api/paystack/verify`
- [ ] Added auth checks to `/api/clear-words`
- [ ] Updated `/api/clear-my-words` authorization
- [ ] Removed or secured debug endpoint
- [ ] Updated Firestore security rules
- [ ] Tested all changes locally
- [ ] Deployed fixes to production

### This Week (Hardening)
- [ ] Added HTTPS security headers
- [ ] Implemented rate limiting
- [ ] Added input validation (Zod)
- [ ] Set up security logging
- [ ] Reviewed all API endpoints
- [ ] Security test coverage

---

## ⚠️ DO NOT

- ❌ Commit `.env.local` to git
- ❌ Expose API keys in client code
- ❌ Log API keys or tokens
- ❌ Use same keys across environments
- ❌ Trust client-provided user IDs
- ❌ Mix test and live keys

---

## ✅ DO

- ✅ Store secrets in environment variables
- ✅ Verify authentication on sensitive endpoints
- ✅ Validate all user input
- ✅ Use different keys per environment
- ✅ Rotate keys quarterly
- ✅ Monitor for unusual activity
- ✅ Log security events

---

## Support Links

- [Security Audit Report](./SECURITY_AUDIT_REPORT.md) - Detailed vulnerability analysis
- [Remediation Guide](./REMEDIATION_GUIDE.md) - Step-by-step fix instructions
- [Firebase Security](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Reporting

Found another vulnerability? Create an issue with:
- Description of the issue
- Severity level (Critical/High/Medium/Low)
- Reproduction steps
- Suggested fix
- Impact analysis

