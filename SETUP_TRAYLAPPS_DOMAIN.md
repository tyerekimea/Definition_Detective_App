# 🌐 Setup traylapps.com Domain on Vercel

## ✅ Code Deployed!

Your code has been pushed to GitHub and Vercel is deploying it now.

**Project**: definition-detective-app  
**Vercel Project ID**: prj_BP1iQnZh0XPu9aY8nN021NrN2CEH

## 🎯 Add Custom Domain (2 Methods)

### Method 1: Vercel Dashboard (Recommended - Easiest)

#### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your project: **definition-detective-app**
3. Click on it

#### Step 2: Add Domain
1. Click **Settings** tab
2. Click **Domains** in the sidebar
3. Click **Add Domain** button
4. Enter: `traylapps.com`
5. Click **Add**

#### Step 3: Configure DNS

Vercel will show you DNS records to add. You'll see something like:

**For Root Domain (traylapps.com)**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW (www.traylapps.com)**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Step 4: Add DNS Records to Your Domain Provider

Go to where you bought `traylapps.com` (e.g., Namecheap, GoDaddy, Cloudflare):

1. Find **DNS Settings** or **DNS Management**
2. Add the A record for root domain
3. Add the CNAME record for www
4. Save changes

**DNS propagation takes 5 minutes to 48 hours** (usually 15-30 minutes)

---

### Method 2: Vercel CLI (Faster)

```bash
# Add domain
vercel domains add traylapps.com

# Add www subdomain
vercel domains add www.traylapps.com
```

Then follow the DNS instructions shown.

---

## 📋 DNS Configuration Examples

### If Using Namecheap

1. Go to: https://ap.www.namecheap.com/domains/list/
2. Click **Manage** next to traylapps.com
3. Go to **Advanced DNS** tab
4. Click **Add New Record**

**Record 1 (Root Domain)**:
- Type: `A Record`
- Host: `@`
- Value: `76.76.21.21`
- TTL: `Automatic`

**Record 2 (WWW)**:
- Type: `CNAME Record`
- Host: `www`
- Value: `cname.vercel-dns.com`
- TTL: `Automatic`

### If Using GoDaddy

1. Go to: https://dcc.godaddy.com/domains
2. Click on **traylapps.com**
3. Click **DNS** → **Manage Zones**
4. Click **Add**

**Record 1**:
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`
- TTL: `1 Hour`

**Record 2**:
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: `1 Hour`

### If Using Cloudflare

1. Go to: https://dash.cloudflare.com/
2. Select **traylapps.com**
3. Click **DNS** tab
4. Click **Add record**

**Record 1**:
- Type: `A`
- Name: `@`
- IPv4 address: `76.76.21.21`
- Proxy status: `DNS only` (gray cloud)

**Record 2**:
- Type: `CNAME`
- Name: `www`
- Target: `cname.vercel-dns.com`
- Proxy status: `DNS only` (gray cloud)

---

## 🔍 Verify Domain Setup

### Check DNS Propagation

Visit: https://dnschecker.org/

Enter: `traylapps.com`

Look for:
- A record pointing to `76.76.21.21`
- CNAME for www pointing to `cname.vercel-dns.com`

### Check in Terminal

```bash
# Check A record
dig traylapps.com

# Check CNAME
dig www.traylapps.com

# Or use nslookup
nslookup traylapps.com
nslookup www.traylapps.com
```

---

## ⏱️ Timeline

**Immediate** (0-2 minutes):
- ✅ Code deployed to Vercel
- ✅ Available at: https://definition-detective-app.vercel.app

**After DNS Setup** (15-30 minutes):
- ✅ traylapps.com points to your site
- ✅ SSL certificate auto-generated
- ✅ HTTPS enabled automatically

**After Verification** (30-60 minutes):
- ✅ Monetag verification works
- ✅ Ads start showing
- ✅ Revenue tracking begins

---

## 🎯 Quick Setup Checklist

- [ ] Code pushed to GitHub ✅ (Already done!)
- [ ] Vercel deployed ✅ (Deploying now...)
- [ ] Add domain in Vercel dashboard
- [ ] Get DNS records from Vercel
- [ ] Add A record to DNS provider
- [ ] Add CNAME record to DNS provider
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Visit traylapps.com to verify
- [ ] Check SSL certificate (should be automatic)
- [ ] Verify Monetag integration

---

## 🔐 SSL Certificate (Automatic)

Vercel automatically provides free SSL certificates via Let's Encrypt.

**After DNS propagates**:
1. Vercel detects your domain
2. Generates SSL certificate (2-5 minutes)
3. Your site is available at: https://traylapps.com
4. HTTP automatically redirects to HTTPS

---

## 🧪 Test After Setup

### 1. Visit Your Domain
```
https://traylapps.com
```

Should show your Definition Detective game!

### 2. Check Service Worker
```
https://traylapps.com/sw.js
```

Should show your Monetag service worker code.

### 3. Check Console
1. Visit https://traylapps.com
2. Press F12
3. Look for: `"Monetag SW registered"`

### 4. Verify Monetag
1. Go to Monetag dashboard
2. Enter domain: `traylapps.com`
3. Click **Verify**
4. Should work now! ✅

---

## 🎊 After Domain is Live

### Update Monetag Settings

1. Go to: https://publishers.monetag.com/
2. Update your site URL to: `traylapps.com`
3. Re-verify if needed
4. Ads will start showing!

### Test All Pages

- [ ] https://traylapps.com (Game page)
- [ ] https://traylapps.com/pricing (Pricing with ad)
- [ ] https://traylapps.com/profile (Profile with ad)
- [ ] https://traylapps.com/store (Store - no ad)

### Share Your Site!

Your game is now live at:
- 🌐 https://traylapps.com
- 🌐 https://www.traylapps.com

---

## 🆘 Troubleshooting

### Domain Not Working After 1 Hour?

**Check DNS Records**:
```bash
dig traylapps.com
```

Should show: `76.76.21.21`

**Common Issues**:
1. Wrong DNS records (double-check A and CNAME)
2. DNS not propagated yet (wait longer)
3. Cloudflare proxy enabled (disable orange cloud)
4. Old DNS cached (clear browser cache)

### SSL Certificate Not Working?

1. Wait 5-10 minutes after DNS propagates
2. Vercel auto-generates certificates
3. Check Vercel dashboard → Domains → SSL status
4. If stuck, remove and re-add domain

### Monetag Verification Still Failing?

1. Make sure you're using `traylapps.com` (not .vercel.app)
2. Wait for DNS to fully propagate
3. Check service worker is accessible
4. Try alternative verification method (meta tag)

---

## 📊 Current Status

✅ **Code**: Deployed to GitHub  
✅ **Vercel**: Deploying now (2-3 minutes)  
⏳ **Domain**: Needs DNS configuration  
⏳ **SSL**: Will auto-generate after DNS  
⏳ **Monetag**: Will verify after domain is live  

---

## 🚀 Next Steps (In Order)

### Right Now:
1. Go to Vercel dashboard
2. Add domain: `traylapps.com`
3. Copy DNS records

### In 5 Minutes:
1. Add DNS records to your domain provider
2. Save changes
3. Wait for propagation

### In 30 Minutes:
1. Visit https://traylapps.com
2. Verify site is live
3. Check service worker
4. Verify Monetag

### In 1 Hour:
1. Check Monetag dashboard for impressions
2. Share your site!
3. Start earning! 💰

---

## 💡 Pro Tips

1. **Use both domains**: Set up both `traylapps.com` and `www.traylapps.com`
2. **Vercel handles redirects**: www automatically redirects to root (or vice versa)
3. **SSL is free**: Vercel provides free SSL certificates
4. **DNS takes time**: Don't panic if it doesn't work immediately
5. **Clear cache**: Use incognito mode when testing

---

## 📞 Need Help?

**Vercel Support**:
- Dashboard: https://vercel.com/support
- Docs: https://vercel.com/docs/concepts/projects/domains

**DNS Help**:
- Check propagation: https://dnschecker.org/
- DNS guide: https://vercel.com/docs/concepts/projects/domains/add-a-domain

**Monetag Support**:
- Dashboard: https://publishers.monetag.com/support
- Verification help: Check alternative methods

---

## 🎉 You're Almost There!

Your code is deployed! Now just:
1. Add the domain in Vercel
2. Configure DNS
3. Wait 15-30 minutes
4. Your site will be live at traylapps.com! 🚀

Good luck! 💪
