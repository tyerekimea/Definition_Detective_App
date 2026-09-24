# 🚀 Mobile Build - Quick Start

## The Problem
Your app has API routes, which don't work with static export needed for mobile.

## The Solution
Deploy your web app first, then mobile will use that API.

---

## Option 1: Deploy to Vercel (5 minutes) ⭐ RECOMMENDED

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy (follow prompts)
vercel

# 3. You'll get a URL like: https://definition-detective.vercel.app
```

Once deployed:

```bash
# 4. Create production env file
echo "NEXT_PUBLIC_API_URL=https://your-vercel-url.vercel.app" > .env.production

# 5. Build for mobile
npm run build
npx cap sync android

# 6. Open in Android Studio
npm run android
```

---

## Option 2: Local Development (Testing Only)

```bash
# 1. Get your local IP address
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100

# 2. Start dev server
npm run dev

# 3. Edit capacitor.config.json - add this:
{
  "server": {
    "url": "http://192.168.1.100:3000",
    "cleartext": true
  }
}

# 4. Sync and run
npx cap sync android
npm run android
```

**Note:** Phone and computer must be on same WiFi network.

---

## Build APK for Testing

```bash
cd android
./gradlew assembleDebug

# APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Transfer this APK to your phone to install.

---

## What's Next?

After mobile build works:
1. Test all features on device
2. Update app icons (android/app/src/main/res/)
3. Configure signing for release
4. Build release APK
5. Submit to Play Store

---

## Troubleshooting

**"Cannot connect to server"**
- Check your deployed URL is accessible
- Verify .env.production has correct URL
- Check phone has internet connection

**"Gradle build failed"**
- Update Android SDK in Android Studio
- Run: `cd android && ./gradlew clean`

**"App crashes on startup"**
- Check Android logs: `npx cap run android -l`
- Verify Firebase config is correct

---

## Quick Commands Reference

```bash
# Deploy to Vercel
vercel

# Build web app
npm run build

# Sync to mobile
npx cap sync

# Open Android Studio
npm run android

# Build debug APK
cd android && ./gradlew assembleDebug

# View Android logs
npx cap run android -l
```

---

**Start with Option 1 (Vercel) - it's the easiest!** 🎯
