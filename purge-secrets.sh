#!/usr/bin/env bash
set -euo pipefail

# Purges the 3 confirmed leaked Google API keys from Definition_Detective_App's
# entire git history, and drops .env.local from history if it's ever present.
#
# ⚠️ This rewrites every commit hash. Anyone with a clone must re-clone after.
# Run this from a FRESH clone you don't mind discarding if something goes wrong.

REPO_URL="https://github.com/tyerekimea/Definition_Detective_App.git"
WORKDIR="Definition_Detective_App-purge"

pip install --user git-filter-repo --break-system-packages -q 2>/dev/null || \
  pip install --user git-filter-repo -q

echo "Cloning a fresh mirror..."
git clone --mirror "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"

cat > ../secret-replacements.txt << 'EOF'
AIzaSyB0eOC2aIfTz90nbeg5ggR5D9uKmciaX7k==>***GOOGLE_API_KEY_REMOVED***
AIzaSyDJYGcg35D8UScTEAZlzhEObiUJ3b7Vrg0==>***GOOGLE_API_KEY_REMOVED***
AIzaSyDdx1Qxmt89XJmQTLYuUw96E32_Yu07iPs==>***GOOGLE_API_KEY_REMOVED***
EOF

echo "Rewriting history (redacting keys + dropping .env.local everywhere)..."
git filter-repo \
  --replace-text ../secret-replacements.txt \
  --path .env.local --invert-paths \
  --force

echo ""
echo "Verifying no leaked key remains in any commit..."
if git rev-list --objects --all \
   | git cat-file --batch-check='%(objecttype) %(objectname) %(rest)' \
   | awk '$1=="blob"{print $2}' \
   | xargs -I{} git cat-file -p {} 2>/dev/null \
   | grep -aoE "AIzaSyB0eOC2aIfTz90nbeg5ggR5D9uKmciaX7k|AIzaSyDJYGcg35D8UScTEAZlzhEObiUJ3b7Vrg0|AIzaSyDdx1Qxmt89XJmQTLYuUw96E32_Yu07iPs" \
   | grep -q .; then
  echo "❌ A key is still present — DO NOT PUSH. Investigate before continuing."
  exit 1
else
  echo "✅ Clean. No leaked key found in any commit."
fi

echo ""
echo "Next steps (do these BEFORE pushing):"
echo "  1. cd $WORKDIR"
echo "  2. Re-add your remote if needed: git remote -v"
echo "  3. ROTATE those 3 keys in Google AI Studio / Firebase console FIRST —"
echo "     purging history does not invalidate a key that's already been seen."
echo "  4. Force-push:  git push --force --all && git push --force --tags"
echo "  5. Tell every collaborator to delete their local clone and re-clone —"
echo "     the old history is still on their disk and in GitHub's cache/forks"
echo "     for a while, so rotation (step 3) is the part that actually matters."
