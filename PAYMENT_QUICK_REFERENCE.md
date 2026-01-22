# 💳 Payment Process - Quick Reference

## 🎯 Simple Overview

```
User → Paystack → Verify → Database → Success
```

---

## 📊 Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESS                          │
└─────────────────────────────────────────────────────────────┘

1. USER ACTION
   ┌──────────────┐
   │ User clicks  │
   │ "Buy Hints"  │
   └──────┬───────┘
          │
          ▼
2. FRONTEND
   ┌──────────────────────┐
   │ PaystackButton       │
   │ - Creates config     │
   │ - Opens modal        │
   └──────┬───────────────┘
          │
          ▼
3. PAYSTACK
   ┌──────────────────────┐
   │ Payment Modal        │
   │ - User enters card   │
   │ - Processes payment  │
   └──────┬───────────────┘
          │
          ▼
4. CALLBACK
   ┌──────────────────────┐
   │ handleSuccess()      │
   │ - Gets reference     │
   │ - Calls verify API   │
   └──────┬───────────────┘
          │
          ▼
5. BACKEND VERIFY
   ┌──────────────────────┐
   │ /api/paystack/verify │
   │ - Calls Paystack API │
   │ - Validates payment  │
   └──────┬───────────────┘
          │
          ▼
6. DATABASE UPDATE
   ┌──────────────────────┐
   │ Firestore            │
   │ - Add hints          │
   │ - Record transaction │
   └──────┬───────────────┘
          │
          ▼
7. SUCCESS
   ┌──────────────────────┐
   │ Success Page         │
   │ - Show confirmation  │
   │ - User can continue  │
   └──────────────────────┘
```

---

## 🔑 Key Components

### Frontend
```typescript
// src/components/payment/PaystackButton.tsx
<PaystackButton
  amount={1000}           // ₦1,000
  email={user.email}
  type="hint_pack"
  metadata={{ hints: 10 }}
/>
```

### Backend Verification
```typescript
// src/app/api/paystack/verify/route.ts
GET /api/paystack/verify?reference=DD_123456

1. Verify with Paystack API
2. Check payment status
3. Update database
4. Return success
```

### Database Update
```typescript
// Firestore
userProfiles/{userId}
  hints: +10
  hintsLastUpdated: now()

transactions/
  reference: DD_123456
  amount: 1000
  status: success
```

---

## 💰 Payment Types

### Hint Pack
```
Type: "hint_pack"
Metadata: { hints: 10 }
Update: hints += 10
```

### Subscription
```
Type: "subscription"
Metadata: { }
Update: isPremium = true
```

---

## 🧪 Test Cards

```
✅ Success:
   Card: 4084084084084081
   CVV: 408
   PIN: 0000
   OTP: 123456

❌ Decline:
   Card: 5060666666666666666

⚠️ Insufficient:
   Card: 5078000000000000
```

---

## 🔐 Security

```
1. User initiates payment
   ↓
2. Paystack processes (secure)
   ↓
3. Frontend gets callback
   ↓
4. Backend verifies independently ← CRITICAL
   ↓
5. Only backend updates database ← SECURE
```

**Why?** Never trust client-side confirmation!

---

## 📝 Transaction Data

### What's Stored

```json
{
  "userId": "abc123",
  "reference": "DD_1234567890_123456",
  "amount": 1000,
  "type": "hint_pack",
  "status": "success",
  "verifiedAt": "2025-01-22T10:30:00Z",
  "createdAt": "2025-01-22T10:30:00Z"
}
```

### Where It's Stored

```
Firestore:
  /userProfiles/{userId}
    - hints: number
    - isPremium: boolean
    - subscriptionStatus: string
  
  /transactions/{transactionId}
    - All transaction details
```

---

## ⚡ Quick Troubleshooting

### Payment fails?
```
1. Check Paystack secret key is set
2. Verify user is logged in
3. Check Vercel logs
4. Test with test card
```

### Hints not added?
```
1. Check verification succeeded
2. Check Firestore rules
3. Check user profile exists
4. View Vercel logs
```

### "Invalid field" error?
```
1. Add PAYSTACK_SECRET_KEY to Vercel
2. Redeploy app
3. Try again
```

---

## 📊 Monitoring

### Paystack Dashboard
```
https://dashboard.paystack.com/transactions
- View all payments
- Check status
- See revenue
```

### Vercel Logs
```bash
vercel logs --follow
# Watch for verification logs
```

### Firebase Console
```
https://console.firebase.google.com/
- Check user profiles
- View transactions
- Verify updates
```

---

## 🎯 Payment Flow Summary

| Step | Component | Action | Time |
|------|-----------|--------|------|
| 1 | User | Clicks buy | 0s |
| 2 | Frontend | Opens modal | 0.5s |
| 3 | Paystack | Processes card | 2-5s |
| 4 | Frontend | Gets callback | 0.1s |
| 5 | Backend | Verifies payment | 1-2s |
| 6 | Database | Updates records | 0.5s |
| 7 | Frontend | Shows success | 0.1s |
| **Total** | | **~4-9 seconds** | |

---

## 🔄 Retry Logic

```
Verification fails?
  ↓
Wait 1 second
  ↓
Retry (attempt 2)
  ↓
Wait 2 seconds
  ↓
Retry (attempt 3)
  ↓
If still fails → Show error
```

**Total retries:** 3 attempts
**Max wait time:** 3 seconds

---

## 💡 Key Files

```
Frontend:
  src/components/payment/PaystackButton.tsx

Backend:
  src/app/api/paystack/verify/route.ts
  src/lib/paystack.ts

Pages:
  src/app/store/page.tsx
  src/app/subscribe/page.tsx
  src/app/payment/success/page.tsx
  src/app/payment/failed/page.tsx
```

---

## ✅ Checklist

Before going live:

- [ ] Paystack secret key set in Vercel
- [ ] Test payments work
- [ ] Hints are added correctly
- [ ] Premium access granted
- [ ] Transactions recorded
- [ ] Error handling works
- [ ] Success page shows
- [ ] Failed page shows

---

## 🚀 Quick Test

```bash
# 1. Open app
https://definition-detective-app.vercel.app/store

# 2. Click "Buy 10 Hints"

# 3. Enter test card
Card: 4084084084084081
CVV: 408
Expiry: 12/25
PIN: 0000
OTP: 123456

# 4. Complete payment

# 5. Check hints increased
Go to profile → Should see +10 hints

# 6. Check Firestore
Firebase Console → userProfiles → Your user
Should see hints updated
```

---

## 📞 Support

**Payment not working?**
1. Check `PAYMENT_FLOW_GUIDE.md` for details
2. Check `PAYMENT_DEBUG_GUIDE.md` for troubleshooting
3. View Vercel logs
4. Check Paystack dashboard

**Still stuck?**
- Review error messages
- Check environment variables
- Test with different card
- Clear browser cache

---

**Quick Reference Complete!** 

For detailed explanation, see `PAYMENT_FLOW_GUIDE.md`
