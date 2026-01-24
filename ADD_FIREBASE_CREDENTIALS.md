# 🔑 Add Firebase Credentials to Vercel - Step by Step

## Quick Overview

You need to add 2 environment variables to Vercel:
1. `FIREBASE_CLIENT_EMAIL`
2. `FIREBASE_PRIVATE_KEY`

---

## Method 1: Via Vercel Dashboard (Easiest) ⭐

### Step 1: Get Firebase Service Account Credentials

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/serviceaccounts/adminsdk

2. **Generate Private Key:**
   - Click the **"Generate new private key"** button
   - Click **"Generate key"** in the confirmation dialog
   - A JSON file will download (e.g., `studio-4536174912-ee6ca-firebase-adminsdk-xxxxx.json`)

3. **Open the downloaded JSON file** in a text editor

The file looks like this:
```json
{
  "type": "service_account",
  "project_id": "studio-4536174912-ee6ca",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@studio-4536174912-ee6ca.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 2: Add to Vercel Dashboard

1. **Open Vercel Dashboard:**
   - Go to: https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app/settings/environment-variables

2. **Add FIREBASE_CLIENT_EMAIL:**
   - Click **"Add New"** button
   - **Name:** `FIREBASE_CLIENT_EMAIL`
   - **Value:** Copy the `client_email` from JSON (e.g., `firebase-adminsdk-xxxxx@studio-4536174912-ee6ca.iam.gserviceaccount.com`)
   - **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click **"Save"**

3. **Add FIREBASE_PRIVATE_KEY:**
   - Click **"Add New"** button again
   - **Name:** `FIREBASE_PRIVATE_KEY`
   - **Value:** Copy the ENTIRE `private_key` from JSON including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   
   **IMPORTANT:** Copy it exactly as shown in the JSON, including the `\n` characters. It should look like:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n
   ```
   
   - **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click **"Save"**

### Step 3: Redeploy

1. **Go to Deployments tab:**
   - https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app

2. **Click the "..." menu** on the latest deployment

3. **Click "Redeploy"**

4. **Wait for deployment** to complete (~2 minutes)

---

## Method 2: Via Vercel CLI (Alternative)

### Step 1: Get Firebase Credentials (Same as Method 1)

Download the JSON file from Firebase Console.

### Step 2: Add via CLI

```bash
cd /workspaces/Definition_Detective_App

# Add FIREBASE_CLIENT_EMAIL
# Replace with your actual email from the JSON
echo "firebase-adminsdk-xxxxx@studio-4536174912-ee6ca.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production

# Add FIREBASE_PRIVATE_KEY
# Copy the entire private_key value from JSON (including BEGIN and END lines)
echo "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----" | vercel env add FIREBASE_PRIVATE_KEY production
```

### Step 3: Redeploy

```bash
vercel --prod
```

---

## Method 3: Using a Script (Automated)

### Step 1: Create Helper Script

```bash
cd /workspaces/Definition_Detective_App

cat > add-firebase-env.sh << 'EOF'
#!/bin/bash

echo "🔑 Firebase Credentials Setup for Vercel"
echo ""

# Check if JSON file exists
if [ ! -f "$1" ]; then
  echo "❌ Error: Firebase JSON file not found"
  echo ""
  echo "Usage: ./add-firebase-env.sh path/to/firebase-service-account.json"
  echo ""
  echo "Steps:"
  echo "1. Download service account JSON from Firebase Console"
  echo "2. Run: ./add-firebase-env.sh downloaded-file.json"
  exit 1
fi

JSON_FILE="$1"

echo "📄 Reading credentials from: $JSON_FILE"
echo ""

# Extract values from JSON
CLIENT_EMAIL=$(cat "$JSON_FILE" | grep -o '"client_email": "[^"]*' | cut -d'"' -f4)
PRIVATE_KEY=$(cat "$JSON_FILE" | grep -o '"private_key": "[^"]*' | cut -d'"' -f4)

if [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: Could not extract credentials from JSON file"
  exit 1
fi

echo "✅ Found client_email: $CLIENT_EMAIL"
echo "✅ Found private_key: (hidden for security)"
echo ""

# Add to Vercel
echo "📤 Adding FIREBASE_CLIENT_EMAIL to Vercel..."
echo "$CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL production

echo ""
echo "📤 Adding FIREBASE_PRIVATE_KEY to Vercel..."
echo "$PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY production

echo ""
echo "✅ Credentials added successfully!"
echo ""
echo "Next steps:"
echo "1. Run: vercel --prod"
echo "2. Test payment"
echo "3. Check logs: vercel logs --follow"
EOF

chmod +x add-firebase-env.sh
```

### Step 2: Run Script

```bash
# Download Firebase JSON first, then:
./add-firebase-env.sh path/to/your-firebase-service-account.json
```

### Step 3: Redeploy

```bash
vercel --prod
```

---

## Verification

### Check if Variables are Set

```bash
vercel env ls | grep FIREBASE
```

**Should show:**
```
FIREBASE_CLIENT_EMAIL                       Encrypted           Production, Preview, Development
FIREBASE_PRIVATE_KEY                        Encrypted           Production, Preview, Development
```

### Check Deployment Logs

```bash
vercel logs | grep Firebase
```

**Should show:**
```
✅ Firebase Admin initialized successfully
```

**Should NOT show:**
```
❌ Missing Firebase credentials
⚠️  Missing Firebase credentials, using default initialization
```

---

## Common Issues

### Issue 1: "Invalid private key"

**Cause:** Private key not copied correctly

**Fix:**
- Make sure to copy the ENTIRE key including:
  - `-----BEGIN PRIVATE KEY-----`
  - All the encoded text
  - `-----END PRIVATE KEY-----`
- Include the `\n` characters as they appear in JSON
- Don't add extra spaces or line breaks

**Correct format:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n
```

### Issue 2: "client_email not found"

**Cause:** Wrong value copied

**Fix:**
- Copy the exact value from `client_email` field in JSON
- Should look like: `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`
- Don't include quotes

### Issue 3: Variables not showing in deployment

**Cause:** Need to redeploy after adding variables

**Fix:**
```bash
vercel --prod
```

### Issue 4: "Permission denied" errors

**Cause:** Service account doesn't have permissions

**Fix:**
1. Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/iam
2. Find your service account email
3. Ensure it has "Firebase Admin SDK Administrator Service Agent" role

---

## Security Best Practices

### ✅ Do

- Store credentials in environment variables only
- Never commit credentials to Git
- Use Vercel's encrypted storage
- Rotate keys periodically
- Limit service account permissions

### ❌ Don't

- Hardcode credentials in code
- Share credentials publicly
- Commit JSON file to repository
- Use same credentials for multiple projects
- Give unnecessary permissions

---

## Testing After Adding Credentials

### Test 1: Check Initialization

```bash
# Deploy and check logs
vercel --prod
vercel logs | grep Firebase
```

**Expected:**
```
✅ Firebase Admin initialized successfully
```

### Test 2: Make a Payment

1. Go to: https://definition-detective-app.vercel.app/store
2. Buy hints with test card: `4084084084084081`
3. Watch logs: `vercel logs --follow`

**Expected:**
```
✅ Firebase Admin initialized successfully
🔍 [VERIFY] Payment verification request
✅ [VERIFY] Paystack verification successful
💡 [VERIFY] Adding 10 hints...
✅ [VERIFY] Hints updated
🎉 [VERIFY] Payment processing complete!
```

### Test 3: Check Database

1. Go to: https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore
2. Open `userProfiles` collection
3. Find your user
4. Verify `hints` field increased

---

## Quick Reference

### Firebase Console URLs

**Service Accounts:**
https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/serviceaccounts/adminsdk

**IAM Permissions:**
https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/iam

**Firestore Database:**
https://console.firebase.google.com/project/studio-4536174912-ee6ca/firestore

### Vercel Dashboard URLs

**Environment Variables:**
https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app/settings/environment-variables

**Deployments:**
https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app

**Logs:**
https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app/logs

---

## Summary

**Steps:**
1. ✅ Download Firebase service account JSON
2. ✅ Add `FIREBASE_CLIENT_EMAIL` to Vercel
3. ✅ Add `FIREBASE_PRIVATE_KEY` to Vercel
4. ✅ Redeploy app
5. ✅ Test payment
6. ✅ Verify in logs and database

**Time needed:** 5-10 minutes

**Difficulty:** Easy (just copy and paste)

---

## Need Help?

**Can't find Firebase Console?**
- Direct link: https://console.firebase.google.com/project/studio-4536174912-ee6ca/settings/serviceaccounts/adminsdk

**Can't find Vercel settings?**
- Direct link: https://vercel.com/tonbra-yerekimeas-projects/definition-detective-app/settings/environment-variables

**Still having issues?**
- Check the logs: `vercel logs --follow`
- Look for error messages
- Verify JSON file is correct
- Try Method 1 (Dashboard) - it's the easiest!

---

**Ready to add credentials?** Use Method 1 (Vercel Dashboard) - it's the easiest and most reliable! 🚀
