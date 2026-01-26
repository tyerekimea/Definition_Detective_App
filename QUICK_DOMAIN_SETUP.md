# ⚡ Quick Domain Setup - traylapps.com

## ✅ Step 1: Code Deployed!
Your code is already pushed and deploying to Vercel now.

## 🌐 Step 2: Add Domain (Choose One Method)

### Option A: Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/dashboard
2. Click your project: **definition-detective-app**
3. Go to: **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `traylapps.com`
6. Click **Add**

### Option B: Command Line
```bash
vercel domains add traylapps.com
```

## 📝 Step 3: Configure DNS

Vercel will show you these DNS records:

### Add to Your Domain Provider (Namecheap/GoDaddy/etc):

**Record 1 - Root Domain**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**Record 2 - WWW Subdomain**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## ⏱️ Step 4: Wait (15-30 minutes)

DNS propagation takes time. Check status:
- https://dnschecker.org/ (enter: traylapps.com)

## ✅ Step 5: Verify

Visit: https://traylapps.com

Should show your game! 🎮

## 🔍 Step 6: Verify Monetag

1. Go to: https://publishers.monetag.com/
2. Enter domain: `traylapps.com`
3. Click **Verify**
4. Should work now! ✅

---

## 🎯 Quick Checklist

- [x] Code deployed ✅
- [ ] Domain added in Vercel
- [ ] DNS A record added
- [ ] DNS CNAME record added
- [ ] Wait 15-30 minutes
- [ ] Visit traylapps.com
- [ ] Verify Monetag
- [ ] Ads showing! 💰

---

## 🆘 Common Issues

**Domain not working?**
- Wait longer (DNS can take up to 48 hours)
- Check DNS records are correct
- Clear browser cache

**Monetag verification failing?**
- Make sure DNS has propagated
- Check https://traylapps.com/sw.js is accessible
- Try alternative verification method

---

## 📞 Where to Add DNS Records

**Namecheap**: https://ap.www.namecheap.com/domains/list/  
**GoDaddy**: https://dcc.godaddy.com/domains  
**Cloudflare**: https://dash.cloudflare.com/  

Look for: **DNS Settings**, **DNS Management**, or **Advanced DNS**

---

## 🎉 That's It!

Once DNS propagates:
- ✅ Site live at: https://traylapps.com
- ✅ SSL certificate auto-generated
- ✅ Monetag verification works
- ✅ Ads start showing
- ✅ Revenue tracking begins

**Full guide**: See `SETUP_TRAYLAPPS_DOMAIN.md`
