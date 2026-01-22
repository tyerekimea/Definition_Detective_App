# 📱 Android Device Testing Guide

## ✅ Setup Complete!

Your app is configured to connect to your local dev server.

**Local IP:** 100.64.129.40
**Dev Server:** Running on port 3000

---

## 🚀 Option 1: Build APK and Install (Recommended)

### Step 1: Build Debug APK

```bash
cd android
./gradlew assembleDebug
```

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 2: Transfer APK to Phone

**Method A: USB Cable**
```bash
# Enable USB debugging on your phone first
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Method B: Cloud Transfer**
- Upload APK to Google Drive, Dropbox, or email
- Download on your phone
- Install (you may need to enable "Install from unknown sources")

**Method C: Direct Download**
- Host the APK file somewhere accessible
- Download directly on your phone

### Step 3: Important Network Setup

⚠️ **CRITICAL:** Your phone and computer must be on the **same network**

**For Codespaces/Cloud Development:**
- This won't work directly because your dev server is in the cloud
- See Option 2 below for cloud development

---

## 🌐 Option 2: For Cloud Development (Codespaces)

Since you're using GitHub Codespaces, your dev server is already accessible via a public URL.

### Step 1: Get Your Public URL

Your Codespace URL should be:
```
https://[codespace-name]-3000.app.github.dev
```

Check the PORTS tab in VS Code to get the exact URL.

### Step 2: Update Capacitor Config

Edit `capacitor.config.json`:
```json
{
  "server": {
    "url": "https://your-codespace-url-3000.app.github.dev",
    "cleartext": false,
    "androidScheme": "https"
  }
}
```

### Step 3: Sync and Build

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

### Step 4: Install on Phone

Transfer and install the APK as described in Option 1, Step 2.

---

## 🔧 Option 3: Use Android Studio (Full Development)

### Step 1: Open Project in Android Studio

```bash
npx cap open android
```

This will open Android Studio with your project.

### Step 2: Connect Your Device

1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. Connect phone via USB cable

3. In Android Studio, select your device from the dropdown

### Step 3: Run the App

Click the green "Run" button (▶️) in Android Studio

The app will install and launch on your device.

---

## 📋 Pre-Installation Checklist

Before building:

- [ ] Dev server is running (`npm run dev`)
- [ ] Capacitor config has correct server URL
- [ ] Android SDK is installed (if using Android Studio)
- [ ] Java 17+ is installed
- [ ] Phone has USB debugging enabled (if using USB)

---

## 🐛 Troubleshooting

### "Cannot connect to server"

**Check:**
1. Dev server is running: `curl http://localhost:3000`
2. Server URL in capacitor.config.json is correct
3. Phone and computer on same network (for local dev)
4. Firewall isn't blocking port 3000

**For Codespaces:**
- Use the public HTTPS URL from the PORTS tab
- Don't use the local IP (100.64.129.40)

### "Gradle build failed"

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### "App crashes on startup"

Check logs:
```bash
# If phone is connected via USB
adb logcat | grep -i capacitor
```

Or in Android Studio: View → Tool Windows → Logcat

### "Installation blocked"

Enable "Install from unknown sources":
- Settings → Security → Unknown Sources (enable)
- Or Settings → Apps → Special Access → Install Unknown Apps

---

## 🎯 Quick Commands

```bash
# Start dev server
npm run dev

# Sync Capacitor
npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug

# Install via USB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Open Android Studio
npx cap open android

# View logs
adb logcat | grep Capacitor
```

---

## 📱 Testing Checklist

Once installed, test:

- [ ] App launches successfully
- [ ] Can see the game interface
- [ ] Word generation works
- [ ] Hint generation works
- [ ] Keyboard input works
- [ ] Next Case button works
- [ ] Login/signup works
- [ ] Payment flow works (if testing)
- [ ] No crashes or errors

---

## 🌟 For Production Release

When ready for Play Store:

1. **Update app icons** (android/app/src/main/res/)
2. **Configure signing** (android/app/build.gradle)
3. **Build release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
4. **Test release build** thoroughly
5. **Submit to Play Store**

---

## 💡 Current Configuration

**App ID:** com.definitiondetective.app
**App Name:** Definition Detective
**Server URL:** http://100.64.129.40:3000 (local dev)
**Build Type:** Debug

**Note:** For Codespaces, update server URL to your public HTTPS URL!

---

## ❓ Need Help?

**Common Issues:**
- Network connectivity → Use Codespace public URL
- Build errors → Run `./gradlew clean`
- Installation blocked → Enable unknown sources
- App crashes → Check logs with `adb logcat`

**Resources:**
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Studio Guide](https://developer.android.com/studio/run/device)
- [ADB Commands](https://developer.android.com/studio/command-line/adb)

---

**Ready to build? Run:** `cd android && ./gradlew assembleDebug` 🚀
