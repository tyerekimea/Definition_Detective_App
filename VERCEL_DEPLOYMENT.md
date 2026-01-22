# 🚀 Vercel Deployment Guide

## Quick Deploy (5 Minutes)

### Step 1: Login to Vercel

Run this in your terminal:

```bash
vercel login
```

You'll see options:
- **Email** - Enter your email, check inbox for magic link
- **GitHub** - Login with GitHub (recommended)
- **GitLab** - Login with GitLab
- **Bitbucket** - Login with Bitbucket

**Recommended:** Choose GitHub for easiest setup.

---

### Step 2: Deploy

After logging in, run:

```bash
cd /workspaces/Definition_Detective_App
vercel
```

You'll be asked:

**"Set up and deploy?"** → Press `Y`

**"Which scope?"** → Choose your account

**"Link to existing project?"** → Press `N` (first time)

**"What's your project's name?"** → Press Enter (use default: `definition-detective-app`)

**"In which directory is your code located?"** → Press Enter (use `.`)

**"Want to override the settings?"** → Press `N`

Vercel will:
1. Build your app (~2-3 minutes)
2. Deploy to production
3. Give you a URL like: `https://definition-detective-app.vercel.app`

---

### Step 3: Test on Your Phone

1. **Copy the URL** from the terminal output
2. **Open on your Android phone** in Chrome
3. **Tap the menu** (⋮ three dots)
4. **Tap "Add to Home Screen"** or "Install app"
5. **Test the game!**

---

## 🔧 Environment Variables

Vercel needs your environment variables. You have two options:

### Option A: Add via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to Settings → Environment Variables
4. Add each variable from your `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
OPENAI_API_KEY
GOOGLE_GENAI_API_KEY
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
```

5. Redeploy: `vercel --prod`

### Option B: Add via CLI

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste value when prompted
# Repeat for each variable
```

---

## 📱 Installing as PWA on Android

### Method 1: Chrome (Recommended)

1. Open your Vercel URL in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home Screen"
4. Name it "Definition Detective"
5. Tap "Add"

The app icon will appear on your home screen!

### Method 2: Install Prompt

Some browsers show an automatic install prompt:
- Look for a banner at the bottom
- Tap "Install"

---

## 🎯 What You Get

**With PWA:**
- ✅ App icon on home screen
- ✅ Full-screen experience
- ✅ Works offline (with service worker)
- ✅ Push notifications (if configured)
- ✅ Fast loading
- ✅ Automatic updates

**Limitations:**
- ❌ Not in Play Store
- ❌ Some native features limited
- ❌ Requires internet for first load

---

## 🔄 Updating Your App

### Automatic Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update game"
git push origin main
```

Vercel will:
1. Detect the push
2. Build automatically
3. Deploy to production
4. Users get updates automatically

### Manual Deployment

```bash
vercel --prod
```

---

## 🐛 Troubleshooting

### "Build failed"

Check the build logs in Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click the failed deployment
4. Check logs for errors

Common issues:
- Missing environment variables
- Build errors (run `npm run build` locally first)
- TypeScript errors

### "App not working on phone"

1. Check browser console (Chrome DevTools)
2. Verify environment variables are set
3. Check if API routes are accessible
4. Test on desktop first

### "Cannot add to home screen"

- Use Chrome browser (best PWA support)
- Make sure you're on HTTPS (Vercel provides this)
- Try clearing browser cache

---

## 📊 Vercel Dashboard

Access your dashboard: https://vercel.com/dashboard

**Features:**
- View deployments
- Check build logs
- Monitor analytics
- Manage domains
- Configure environment variables
- View performance metrics

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `definitiondetective.com`)
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (~24 hours)

**Free domains from Vercel:**
- `your-project.vercel.app`
- `your-project-git-main.vercel.app`
- `your-project-username.vercel.app`

---

## 💰 Pricing

**Hobby Plan (Free):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Analytics

**Pro Plan ($20/month):**
- Everything in Hobby
- More bandwidth
- Team collaboration
- Advanced analytics
- Priority support

For your app, **Hobby plan is perfect** to start!

---

## 🎬 Quick Commands Reference

```bash
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Add environment variable
vercel env add VARIABLE_NAME

# Pull environment variables
vercel env pull

# Remove deployment
vercel rm deployment-url
```

---

## ✅ Deployment Checklist

Before deploying:

- [ ] All code committed to GitHub
- [ ] `npm run build` works locally
- [ ] Environment variables ready
- [ ] Firebase project configured
- [ ] Paystack keys available
- [ ] OpenAI API key active

After deploying:

- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Add environment variables
- [ ] Test all features work
- [ ] Install as PWA
- [ ] Share with testers

---

## 🚀 Deploy Now!

Ready? Run these commands:

```bash
# 1. Login (if not already)
vercel login

# 2. Deploy
cd /workspaces/Definition_Detective_App
vercel

# 3. Get your URL and test!
```

---

## 📱 After Deployment

**Your URL will be:**
```
https://definition-detective-app-[random].vercel.app
```

**To test on Android:**
1. Open URL in Chrome on your phone
2. Menu → "Add to Home Screen"
3. Play the game!

**To build APK later:**
1. Use the Vercel URL as your API endpoint
2. Update `capacitor.config.json`
3. Build APK with GitHub Actions
4. Install on phone

---

## 💡 Pro Tips

1. **Preview Deployments:** Every branch gets its own URL
2. **Instant Rollbacks:** Revert to any previous deployment
3. **Analytics:** Monitor performance and usage
4. **Edge Network:** Fast loading worldwide
5. **Automatic HTTPS:** Secure by default

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live app accessible worldwide
- ✅ Automatic HTTPS
- ✅ Fast CDN delivery
- ✅ Automatic deployments from GitHub
- ✅ PWA installable on any device

**Next:** Test on your phone, then set up GitHub Actions for native APK!

---

**Need help?** Check Vercel docs: https://vercel.com/docs
