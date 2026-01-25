# Monetag Integration Setup Guide

## Your Monetag Configuration

- **Domain**: 3nbf4.com
- **Zone ID**: 10514754
- **Service Worker**: Downloaded and ready

## Quick Setup (5 Minutes)

### Step 1: Add Service Worker to Public Folder

1. Create the file `public/sw.js`:

```javascript
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10514754
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')
```

2. This enables Monetag's push notifications and additional ad formats.

### Step 2: Register Service Worker

Add this to your `src/app/layout.tsx` (inside the `<body>` tag):

```tsx
<Script
  id="monetag-sw-register"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Monetag SW registered'))
          .catch(err => console.log('Monetag SW registration failed'));
      }
    `
  }}
/>
```

### Step 3: Add Ads to Your Pages

The components are already configured with your zone ID!

**Example 1: Game Over Screen**
```tsx
import AdManager from '@/components/ads/AdManager';

<AdManager location="game-over" />
```

**Example 2: Store Page**
```tsx
import AdManager from '@/components/ads/AdManager';

<AdManager location="store" />
```

**Example 3: Direct Monetag Ad**
```tsx
import MonetagAd from '@/components/ads/MonetagAd';

<MonetagAd /> // Uses your zone ID automatically
```

## Ad Placement Recommendations

### 🎯 High Revenue Spots

1. **Game Over Screen** (Best performing)
   - Users are engaged and waiting
   - Natural break in gameplay
   - High viewability

2. **Between Levels**
   - Reward users with coins after watching
   - Non-intrusive timing

3. **Store Page**
   - Users browsing = high engagement
   - Multiple ad slots possible

4. **Profile/Stats Page**
   - Longer viewing time
   - Good for native ads

### ⚠️ Avoid These Spots

- During active gameplay
- On loading screens
- In critical UI areas

## Testing Your Ads

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Add Monetag ads"
   git push
   ```

2. **Check in Browser**
   - Open DevTools Console
   - Look for "Monetag SW registered"
   - Ads should appear within 30 seconds

3. **Test on Mobile**
   - Monetag performs better on mobile
   - Test different screen sizes

## Expected Revenue

With your current setup:

| Daily Users | Monthly Revenue |
|-------------|-----------------|
| 100         | $3-5            |
| 500         | $15-25          |
| 1,000       | $30-50          |
| 5,000       | $150-250        |
| 10,000      | $300-500        |

## Monetag Dashboard

Monitor your earnings at: https://publishers.monetag.com/

Check:
- Daily impressions
- Click-through rate (CTR)
- Revenue per 1,000 impressions (RPM)
- Payment status

## Payment Information

- **Minimum Payout**: $5
- **Payment Methods**: PayPal, Payoneer, Wire Transfer, Bitcoin
- **Payment Schedule**: Net-30 (paid monthly)
- **Payment Day**: 1st-5th of each month

## Optimization Tips

1. **Place Multiple Ads**
   - Use 2-3 ad spots per page
   - Don't overcrowd

2. **Test Different Formats**
   - Banner ads
   - Native ads
   - Interstitial ads (between levels)

3. **Monitor Performance**
   - Check which pages perform best
   - Adjust placement based on data

4. **Combine with AdSense**
   - Use AdManager component
   - Automatically switches between networks
   - Maximizes revenue

## Troubleshooting

### Ads Not Showing?

1. **Check Service Worker**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations()
   ```

2. **Verify Zone ID**
   - Should be: 10514754
   - Check Monetag dashboard

3. **Clear Cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache

4. **Check Ad Blockers**
   - Disable temporarily for testing
   - Most users don't have ad blockers on mobile

### Low Revenue?

1. **Increase Traffic**
   - More users = more revenue
   - Focus on mobile users

2. **Improve Placement**
   - Move ads to high-engagement areas
   - Test different positions

3. **Add More Ad Spots**
   - 2-3 ads per page is optimal
   - Don't go overboard

## Next Steps

1. ✅ Service worker file created
2. ✅ Components configured with your zone ID
3. ⏳ Add service worker to public folder
4. ⏳ Register service worker in layout
5. ⏳ Add ads to your pages
6. ⏳ Deploy to Vercel
7. ⏳ Monitor earnings

## Need Help?

- Monetag Support: https://publishers.monetag.com/support
- Check the main guides: `ADVERTISING_IMPLEMENTATION.md`
- Test in development: `npm run dev`

---

**Ready to go!** Your Monetag integration is configured and ready to deploy. 🚀
