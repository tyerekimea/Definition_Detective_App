#!/bin/bash

echo "🚀 Building Definition Detective for Mobile..."
echo ""

# Step 1: Backup API routes
echo "📦 Backing up API routes..."
mkdir -p .mobile-build-backup
cp -r src/app/api .mobile-build-backup/ 2>/dev/null || true

# Step 2: Remove API routes temporarily
echo "🗑️  Temporarily removing API routes..."
rm -rf src/app/api

# Step 3: Build with static export
echo "🔨 Building static export..."
MOBILE_BUILD=true npm run build

BUILD_STATUS=$?

# Step 4: Restore API routes
echo "♻️  Restoring API routes..."
cp -r .mobile-build-backup/api src/app/ 2>/dev/null || true
rm -rf .mobile-build-backup

if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Step 5: Sync with Capacitor
echo "📱 Syncing with Capacitor..."
npx cap sync

echo ""
echo "✅ Mobile build complete!"
echo ""
echo "Next steps:"
echo "  - For Android: npm run android"
echo "  - For iOS: npm run ios"
echo ""
echo "⚠️  Note: This build doesn't include API routes."
echo "   For full functionality, deploy your web app and configure"
echo "   the mobile app to use the deployed API."
