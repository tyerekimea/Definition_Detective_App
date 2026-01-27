# 🔧 Clear Your Word History NOW

## Quick Fix (2 Steps)

### Step 1: Get Your Firebase Auth Token

1. Visit: https://traylapps.com
2. Press **F12** (open console)
3. Paste this and press Enter:

```javascript
// Get your Firebase ID token
firebase.auth().currentUser.getIdToken().then(token => {
  console.log('Your token:', token);
  console.log('\n\nNow run this command:');
  console.log(`fetch('/api/clear-my-words?token=${token}').then(r => r.json()).then(console.log)`);
});
```

### Step 2: Clear Your Words

Copy the command from Step 1 output and run it. It will look like:

```javascript
fetch('/api/clear-my-words?token=YOUR_LONG_TOKEN_HERE').then(r => r.json()).then(console.log)
```

You should see:
```
{success: true, message: "Word history cleared successfully"}
```

### Step 3: Refresh and Play!

Refresh the page and play - you should get NEW words! ✅

---

## Alternative: Manual Firebase Clear

If the above doesn't work:

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Go to **Firestore Database**
4. Find **userProfiles** collection
5. Find your user document (your email or UID)
6. Click on it
7. Find the **usedWords** field
8. Click the **trash icon** to delete it
9. Or click **edit** and change it to `[]`
10. Save

---

## Even Simpler: Just Log Out

1. Click "Logout" in top right
2. Log back in
3. This might reset your profile
4. Try playing

---

## Check If It Worked

After clearing:

1. Play a game
2. Win
3. Click "Next Case"
4. Check console for:
```
[getRecentUsedWords] Total used words in DB: 0
```

Should be 0 or very small number!

---

## Still Not Working?

Share these with me:

1. **Console logs** after trying to clear
2. **Error messages** if any
3. **What you see** when you play

I'll help you fix it! 💪
