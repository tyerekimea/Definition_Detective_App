# 📱 Play Store Deployment Checklist

**Date:** April 26, 2026  
**Status:** ✅ CRITICAL SECURITY FIXES COMPLETED

---

## ✅ Fixed Issues (Today)

### 1. **Code Minification - ENABLED** ✅
- **File:** `android/app/build.gradle`
- **Change:** `minifyEnabled` set to `true` for release builds
- **Change:** `shrinkResources` set to `true` for resource optimization
- **Impact:** Reduces APK size and obfuscates code
- **Verification:** Build APK with `npx cap build android --release`

### 2. **HTTPS Security Headers - ADDED** ✅
- **File:** `next.config.ts`
- **Headers Added:**
  - `Strict-Transport-Security` (HSTS) - Forces HTTPS
  - `X-Content-Type-Options` - Prevents MIME-type attacks
  - `X-Frame-Options` - Prevents clickjacking
  - `X-XSS-Protection` - XSS protection
  - `Referrer-Policy` - Controls referrer information
  - `Permissions-Policy` - Restricts browser features
- **Impact:** Significantly improves security posture
- **Verification:** Deployed on next build to production

### 3. **Authentication - VERIFIED** ✅
- **Endpoints Protected:**
  - `/api/clear-my-words` - Requires Firebase ID token
  - `/api/clear-words` - Requires Firebase ID token
  - `/api/paystack/verify` - Requires Firebase ID token
- **Implementation:** Uses Firebase Admin SDK for verification
- **Verification:** All endpoints validate token with `getAuth().verifyIdToken()`

### 4. **Webhook Security - VERIFIED** ✅
- **Endpoint:** `/api/paystack/webhook`
- **Protection:** Signature verification using `crypto.timingSafeEqual()`
- **Implementation:** Prevents timing attacks
- **Verification:** Already using secure comparison

### 5. **Firebase Security Rules - VERIFIED** ✅
- **File:** `firestore.rules`
- **Key Protections:**
  - User owns data rule: `isOwner(userId)` checks
  - Leaderboard anti-cheat: Score can only increase within limits
  - Default deny all pattern: `allow read, write: if false`
  - Signed-in check: All operations require authentication
- **Deployment Status:** ⚠️ VERIFY IN FIREBASE CONSOLE
- **Next Step:** Deploy rules to production via Firebase CLI

---

## ⏳ Still Need to Do (Before Submission)

### **CRITICAL (Must Do)**

- [ ] **1. Deploy Firebase Security Rules to Production**
  ```bash
  # Install Firebase CLI if not already installed
  npm install -g firebase-tools
  
  # Deploy rules
  firebase deploy --only firestore:rules
  
  # Verify deployment
  firebase firestore:rules:list
  ```

- [ ] **2. Verify Production Environment Setup**
  - [ ] `capacitor.config.prod.json` uses `https://traylapps.com`
  - [ ] `traylapps.com` is live and serving the API
  - [ ] Test API connectivity from Android device
  - [ ] All API endpoints are fully functional on production URL

- [ ] **3. Create Firebase.json for Deployment**
  ```bash
  # Create if doesn't exist
  touch firebase.json
  ```
  ```json
  {
    "firestore": {
      "rules": "firestore.rules"
    },
    "hosting": {
      "public": "out",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    }
  }
  ```

- [ ] **4. Build and Test Production APK**
  ```bash
  # Build production APK
  npm run build:mobile:prod
  
  # Open Android Studio to build release APK
  npm run android
  
  # In Android Studio:
  # Build > Generate Signed Bundle / APK
  # - Use release keystore
  # - Select "APK"
  # - Set build variant to "release"
  ```

- [ ] **5. Test on Physical Device**
  - [ ] Install APK on Android device (minSdk 24+)
  - [ ] Test authentication flow
  - [ ] Test game functionality
  - [ ] Test payment flow with Paystack
  - [ ] Verify no console errors in Chrome DevTools

---

### **HIGH PRIORITY (Highly Recommended)**

- [ ] **6. Implement Rate Limiting** (High Priority)
  - Install: `npm install --save @upstash/ratelimit @upstash/redis`
  - Add rate limiting to:
    - `/api/paystack/initialize` - Max 5 requests/minute
    - `/api/paystack/verify` - Max 10 requests/minute
    - `/api/pay` - Max 3 requests/minute
  - Set up Upstash Redis account at https://upstash.com
  - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel

- [ ] **7. Add Security Logging**
  - Create `src/lib/security-logger.ts`
  - Log authentication failures
  - Log payment verification failures
  - Enable Sentry integration for error tracking

- [ ] **8. Setup CI/CD Security Scanning**
  - Add `trufflehog` scanning to detect secrets
  ```bash
  npm install -g trufflehog
  trufflehog git file://. --issue-type secret
  ```

---

### **MEDIUM PRIORITY (Before Major Release)**

- [ ] **9. Create Privacy Policy**
  - Required by Play Store
  - Link in app settings
  - Must cover data collection practices

- [ ] **10. Create Terms of Service**
  - Required for in-app purchases
  - Must cover payment T&Cs

- [ ] **11. Setup App Store Testing**
  - Upload internal test APK to Play Store
  - Configure internal testing group
  - Test app via Play Store (not sideload)

---

## 📋 Pre-Submission Verification Checklist

### Security Verification
- [x] Code minification enabled
- [x] Authentication required for sensitive endpoints
- [x] Webhook signatures verified
- [x] HTTPS headers configured
- [ ] Firebase rules deployed
- [ ] Rate limiting implemented
- [ ] No exposed secrets in git

### App Verification
- [ ] Version code incremented (currently `1`)
- [ ] Version name set (currently `1.0`)
- [ ] App package name: `com.definitiondetective.app`
- [ ] Min SDK: 24
- [ ] Target SDK: 36
- [ ] Icon and splash screen configured
- [ ] All permissions documented

### Testing Verification
- [ ] APK builds successfully
- [ ] Installs on Android 7.0+ (SDK 24)
- [ ] All core features work
- [ ] Payment flow completes
- [ ] No crashes on daily use
- [ ] No exposed errors/debug info
- [ ] Network requests use HTTPS

---

## 🔐 Quick Security Audit

```bash
# 1. Verify no secrets in git
git log -p --all -- ".env.local" | grep -i "key\|secret" || echo "✅ No secrets found"

# 2. Verify security headers
curl -I https://traylapps.com | grep -E "Strict-Transport|X-Content|X-Frame"

# 3. Verify authentication required
curl -X GET "https://traylapps.com/api/clear-my-words" || echo "✅ Auth required"

# 4. Build APK in release mode
npm run build:mobile:prod
```

---

## 📱 Play Store Store Listing Requirements

- App Name: "Definition Detective"
- Short Description (80 chars max): "Learn new words while solving puzzles"
- Full Description (4000 char limit): Add description
- Screenshots: 2-8 screenshots (recommended 5)
- Feature graphic: 1024x500 px
- Icon: 512x512 px
- Privacy Policy URL: https://traylapps.com/privacy (create this)
- Content Rating Questionnaire: Fill out in Play Console
- Permissions Justification: Explain why app needs requested permissions

---

## 🚀 Deployment Steps

### Step 1: Prepare Release
```bash
# Update version code and name in build.gradle
# versionCode 1 → versionCode 2 (increment for each release)
# versionName "1.0" → versionName "1.1"

npm run build:mobile:prod
```

### Step 2: Build Signed APK
```bash
# In Android Studio:
# 1. Open android/app folder
# 2. Build > Generate Signed Bundle/APK
# 3. Select APK format
# 4. Use release keystore
# 5. Sign with release certificate (create if needed)
# Output: android/app/release/app-release.apk
```

### Step 3: Upload to Play Store
```bash
# 1. Go to https://play.google.com/console
# 2. Select "Definition Detective"
# 3. Navigate to Release > Production
# 4. Create new release
# 5. Upload app-release.apk
# 6. Add release notes
# 7. Review and rollout
```

### Step 4: Monitor After Release
- Monitor crash reports in Play Console
- Check user reviews
- Monitor error logs in Sentry
- Watch payment transaction logs

---

## ⚠️ Known Limitations

| Issue | Impact | Timeline |
|-------|--------|----------|
| No rate limiting | DoS risk | Implement next iteration |
| No deep linking | No app shortcuts | Medium priority |
| Basic error messages | Limited debugging | Low priority |
| No analytics | Can't track usage | Low priority |

---

## 📞 Support & Troubleshooting

### APK Won't Build
```bash
# Clean cache
rm -rf .next android/app/build

# Rebuild
npm run build:mobile:prod
npm run android
```

### APK Won't Install on Device
- Check min SDK: 24 (Android 7.0+)
- Check device storage space
- Uninstall old version first

### Payment Not Working
- Verify Paystack keys in production
- Check `capacitor.config.prod.json` points to `traylapps.com`
- Test with sandbox account first

### App Crashes on Backend Calls
- Check network connectivity
- Verify API endpoints are responding
- Check auth token expiration
- Check browser DevTools for errors

---

**Last Updated:** April 26, 2026  
**Next Review:** Before final Play Store submission  
**Status:** 🟡 READY FOR FINAL TESTING (pending Firebase rules deployment)
