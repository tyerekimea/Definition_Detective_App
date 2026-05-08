# PlayStore Assets for Definition Detective

This directory contains all the assets required for publishing the Definition Detective app on Google Play Store.

## Directory Structure

```
playstore-assets/
├── screenshots/          # App screenshots for PlayStore listing
├── graphics/             # Feature graphics and promotional images
├── icons/                # App icon variants
├── app-listing.json      # App metadata and descriptions
├── generate-assets.py    # Script to generate icon variations
└── README.md            # This file
```

## Asset Requirements for Google Play Store

### 1. App Icon
- **Sizes Required:**
  - 192x192 px (Android app icon)
  - 512x512 px (For Play Store listing)
- **Format:** PNG with transparent background
- **Requirements:**
  - 32-bit PNG
  - No rounded corners (system applies them)
  - Full size, no padding

### 2. Feature Graphic
- **Dimensions:** 1024 x 500 px
- **Format:** PNG or JPEG
- **Purpose:** Main banner shown on PlayStore listing
- **Location:** `playstore-assets/graphics/feature-graphic.png`

### 3. Screenshots
- **Quantity:** 2-8 screenshots (at least 2 required)
- **Recommended:** 4-5 high-quality screenshots
- **Dimensions:**
  - **Phone:** 1080 x 1920 px (9:16 aspect ratio)
  - **Tablet:** 1200 x 1920 px (10:16 aspect ratio)
- **Format:** PNG or JPEG
- **Location:** `playstore-assets/screenshots/phone/`
- **Naming:** `screenshot-1.png`, `screenshot-2.png`, etc.

### 4. Promotional Graphics (Optional but Recommended)
- **Feature Graphic:** 1024 x 500 px
- **Promo Graphics:** 180 x 120 px
- **Video Thumbnail:** 1280 x 720 px

### 5. Metadata
- **App Title:** Max 50 characters
- **Short Description:** Max 80 characters
- **Full Description:** Max 4000 characters
- **Screenshots Captions:** Max 30 characters each

## File Locations

| Asset | Location | Size | Format |
|-------|----------|------|--------|
| App Icon | `icons/ic_launcher-512.png` | 512x512 | PNG |
| Feature Graphic | `graphics/feature-graphic.png` | 1024x500 | PNG/JPEG |
| Phone Screenshots | `screenshots/phone/` | 1080x1920 | PNG/JPEG |
| Tablet Screenshots | `screenshots/tablet/` | 1200x1920 | PNG/JPEG |
| Promo Graphic | `graphics/promo-graphic.png` | 180x120 | PNG/JPEG |

## Setup Instructions

### Step 1: Generate Icon Variants
Run the Python script to generate all icon sizes:
```bash
cd playstore-assets
python3 generate-assets.py
```

### Step 2: Add Custom Graphics
The generated assets use a default template. You can:
1. Replace with actual design files
2. Use design tools (Figma, Adobe XD, etc.)
3. Use online tools like Canva or PlayStore asset generators

### Step 3: Configure App Listing
Edit `app-listing.json` with your app's:
- Title
- Description
- Keywords
- Screenshots descriptions
- App category

### Step 4: Upload to PlayStore
1. Go to Google Play Console
2. Navigate to your app
3. Go to "Store listing"
4. Upload each asset type:
   - App icon
   - Feature graphic
   - Screenshots (phone, tablet, watch)
   - Promo graphics
5. Enter app listing text fields
6. Submit for review

## Current Assets Status

- ✅ App logo available: `../../public/logo-definition-detective.png`
- ⏳ Icons: Need to be generated or converted
- ⏳ Feature Graphic: Need to be created
- ⏳ Screenshots: Need to be captured from app
- ⏳ App Listing: Ready to be configured

## Next Steps

1. Run `generate-assets.py` to create icon variants
2. Design/create feature graphic (1024x500)
3. Capture screenshots from the running app
4. Fill in `app-listing.json` with app metadata
5. Upload to Google Play Console

## Asset Design Tips

### Logo/Icon Design
- Keep important elements centered and visible at all sizes
- Use contrasting colors for better visibility
- Avoid thin lines (may not render well at small sizes)
- Test at multiple sizes (48dp, 96dp, 192dp)

### Screenshots
- Show the most engaging features first
- Include 2-3 key screens that highlight functionality
- Add text overlays to explain features
- Use same device frame for consistency
- Optimal order: login → main feature → secondary feature → benefits

### Feature Graphic
- Use your logo prominently
- Include app name
- Highlight main value proposition
- Keep text readable (avoid dense information)
- Use consistent branding colors

## Resources

- [Google Play Console Developer Guide](https://support.google.com/googleplay/android-developer/answer/1078870)
- [App Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design)
- [Material Design Icon Guidelines](https://material.io/design/iconography/system-icons.html)
- [PlayStore Asset Generator Tools](https://romannurik.github.io/AndroidAssetStudio/)

## Contact & Support

For questions about asset requirements, refer to:
- Google Play Console Help Center
- Android Developer Documentation
- Material Design Guidelines
