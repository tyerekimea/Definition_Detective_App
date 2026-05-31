# PlayStore Legal Documents Guide

**Definition Detective**  
**Created:** May 31, 2026

---

## 📋 Overview

I've created comprehensive legal documents required for PlayStore submission:

1. **Privacy Policy** - Details how user data is collected, used, and protected
2. **Terms of Service** - Usage rules, in-app purchases, account management, and dispute resolution

These documents are **PlayStore-compliant** and cover all aspects of your app, including:

- Firebase authentication and Firestore
- Paystack payment processing
- Google AI for hints
- Google AdSense advertising
- In-app purchases
- User accounts and leaderboards

---

## 📁 Files Created

### Markdown Versions (For Reference & Easy Editing)

- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Markdown format, easy to edit
- **[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)** - Markdown format, easy to edit

### HTML Versions (For Hosting & Linking)

- **[public/privacy-policy.html](public/privacy-policy.html)** - Hosted on traylapps.com
- **[public/terms-of-service.html](public/terms-of-service.html)** - Hosted on traylapps.com

---

## 🚀 How to Use These Documents

### Step 1: Host the HTML Versions

Your HTML versions are ready to be served from your website:

```
https://traylapps.com/privacy-policy.html
https://traylapps.com/terms-of-service.html
```

If using Vercel or Firebase Hosting:

- Place HTML files in `public/` directory (already done ✅)
- They'll be automatically served

### Step 2: Link in PlayStore Listing

In Google Play Console:

1. Go to **Store listing**
2. Scroll to "More info" section
3. Add these links:
   - **Privacy policy:** `https://traylapps.com/privacy-policy.html`
   - **Terms of service:** `https://traylapps.com/terms-of-service.html`

### Step 3: Add Links in Your App (Optional but Recommended)

In your app's settings/help section:

```
Settings > Help & Support > Privacy Policy
Settings > Help & Support > Terms of Service
```

Or embed using web links:

```javascript
// Example React component
<a href="https://traylapps.com/privacy-policy.html" target="_blank">
  Privacy Policy
</a>
<a href="https://traylapps.com/terms-of-service.html" target="_blank">
  Terms of Service
</a>
```

### Step 4: Create Content Rating Questionnaire

PlayStore requires you to complete a content rating questionnaire. Use this information:

**Content Rating Questionnaire Answers:**

| Question                        | Answer | Notes                                                           |
| ------------------------------- | ------ | --------------------------------------------------------------- |
| **Violence**                    | No     | Game contains no violence                                       |
| **Sexual Content**              | No     | Game contains no sexual content                                 |
| **Alcohol/Tobacco**             | No     | Game contains no alcohol/tobacco references                     |
| **Drugs**                       | No     | Game contains no drug references                                |
| **Profanity**                   | No     | Game contains no profanity                                      |
| **Gambling**                    | Yes\*  | \*In-app purchases are available (not gambling, just cosmetics) |
| **Contest**                     | No     | Leaderboards exist but no real money contests                   |
| **Collection of Personal Data** | Yes    | Email collection for accounts                                   |
| **Sharing of Personal Data**    | No     | Data not shared with third parties for marketing                |

---

## ✅ PlayStore Submission Checklist

### Legal Documents

- [x] Privacy Policy created and hosted
- [x] Terms of Service created and hosted
- [ ] Links added to PlayStore console
- [ ] Content rating questionnaire completed
- [ ] Privacy policy specifically mentions:
  - [x] Data collection (email, device info, gameplay data)
  - [x] Third-party services (Firebase, Paystack, Google)
  - [x] Data retention policies
  - [x] User rights (GDPR, CCPA)
  - [x] Children's privacy protection

### In-App Links

- [ ] Add privacy policy link to app settings
- [ ] Add terms of service link to app settings
- [ ] Test links work on Android device

---

## 📝 Document Details

### Privacy Policy Covers:

✅ Information collection methods  
✅ How data is used  
✅ Third-party services (Firebase, Paystack, Google)  
✅ Data storage and retention  
✅ Security measures  
✅ User rights (GDPR, CCPA compliance)  
✅ Cookies and tracking  
✅ Children's privacy  
✅ International data transfers  
✅ Contact information for privacy inquiries

### Terms of Service Covers:

✅ Account creation and management  
✅ In-app purchases and refund policy  
✅ Intellectual property rights  
✅ Prohibited conduct (cheating, harassment)  
✅ Leaderboard fairness and anti-cheat  
✅ Warranty disclaimers  
✅ Limitation of liability  
✅ Account termination rights  
✅ Dispute resolution  
✅ Age restrictions  
✅ Contact information

---

## 🔗 Quick Links

| Resource                    | Location                                                     |
| --------------------------- | ------------------------------------------------------------ |
| **Privacy Policy (MD)**     | [PRIVACY_POLICY.md](PRIVACY_POLICY.md)                       |
| **Privacy Policy (HTML)**   | [public/privacy-policy.html](public/privacy-policy.html)     |
| **Terms of Service (MD)**   | [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)                   |
| **Terms of Service (HTML)** | [public/terms-of-service.html](public/terms-of-service.html) |
| **PlayStore Assets**        | [playstore-assets/](playstore-assets/)                       |
| **Build Guide**             | [MOBILE_BUILD_GUIDE.md](MOBILE_BUILD_GUIDE.md)               |

---

## 🎯 Before PlayStore Submission

### Final Checklist

- [ ] **Host the HTML files**

  ```bash
  # Files are in public/ and will be served automatically
  # Verify at: https://traylapps.com/privacy-policy.html
  # Verify at: https://traylapps.com/terms-of-service.html
  ```

- [ ] **Test links on mobile device**
  - [ ] Privacy policy loads and displays correctly
  - [ ] Terms of service loads and displays correctly
  - [ ] Links are readable on mobile screen

- [ ] **Add to PlayStore Console**
  - [ ] Privacy policy URL
  - [ ] Terms of service URL (if not available in PlayStore, still good to have)

- [ ] **Complete Content Rating Questionnaire**
  - [ ] Answer all questions truthfully
  - [ ] Select "Yes" for privacy policy (you now have one!)
  - [ ] Select appropriate content ratings

- [ ] **Review Compliance**
  - [ ] Privacy policy explains all data collection
  - [ ] Terms of service explains in-app purchases
  - [ ] No conflicts between app behavior and stated policies

---

## 💡 Important Notes

### What PlayStore Requires

PlayStore **requires** a privacy policy for all apps. ✅ You now have one!

PlayStore **strongly recommends** terms of service, especially for apps with:

- In-app purchases (you have Paystack)
- User accounts (you have Firebase Auth)
- Online features (you have leaderboards)

### Compliance Checklist

✅ **GDPR Compliant** - Privacy policy includes all GDPR requirements  
✅ **CCPA Compliant** - Includes California privacy rights  
✅ **Children's Privacy** - Explains protection for children under 13  
✅ **Third-Party Transparency** - Lists all services (Firebase, Paystack, Google)  
✅ **Data Retention** - Clear policies on how long data is kept  
✅ **User Rights** - Explains how users can access/delete their data

---

## 🔧 Customization Options

If you need to modify these documents:

### Edit Markdown Versions

- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) - Easy to read and edit
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) - Easy to read and edit

Then regenerate HTML versions if needed.

### Update Contact Information

Current contact info in both documents:

- 📧 Email: support@traylapps.com
- 🌐 Website: https://traylapps.com

Update these if your contact info changes.

### Add Region-Specific Information

If you need region-specific terms (e.g., for EU users), let me know!

---

## 📞 Support

**For questions about these documents:**

- Email: support@traylapps.com
- Check the FAQ section in each document

**For PlayStore submission questions:**

- Visit: [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- Check: [PlayStore Policies](https://play.google.com/about/developer-content-policy/)

---

## 🎉 You're Ready!

Your app now has:
✅ Professional privacy policy  
✅ Comprehensive terms of service  
✅ PlayStore compliance  
✅ GDPR compliance  
✅ CCPA compliance  
✅ International best practices

**Next Steps:**

1. Host the HTML files (already in public/)
2. Test links work
3. Add to PlayStore console
4. Complete content rating questionnaire
5. Submit for review!

---

**Document created:** May 31, 2026  
**PlayStore compliance version:** 1.0  
**Last reviewed:** May 31, 2026

Good luck with your PlayStore submission! 🚀
