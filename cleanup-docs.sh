#!/usr/bin/env bash
set -euo pipefail
# Run from the ROOT of your Definition_Detective_App working copy.
# Reorganizes 86 root-level .md files into a clean structure:
#   /                -> README.md, PRIVACY_POLICY.md, TERMS_OF_SERVICE.md only
#   /docs/           -> genuinely reusable setup/reference docs
#   /docs/archive/   -> one-off fix/debug/session logs, with a generated index

mkdir -p docs docs/archive

# Stays at repo root — legal/entry-point docs, expected there by convention
# (app stores, AdSense review, GitHub's own README rendering).
KEEP_ROOT=(
  README.md
  PRIVACY_POLICY.md
  TERMS_OF_SERVICE.md
)

# Genuinely reusable reference material — someone (including future you)
# will actually open these again to do a task, not just to see how a past
# bug was fixed.
DOCS_ACTIVE=(
  GETTING_STARTED.md
  FIREBASE_SETUP.md
  MOBILE_BUILD_GUIDE.md
  BUILD_APK_INSTRUCTIONS.md
  PLAYSTORE_DEPLOYMENT_CHECKLIST.md
  PLAYSTORE_LEGAL_DOCS_GUIDE.md
  WEBHOOK_SETUP_GUIDE.md
  VERCEL_DEPLOYMENT.md
  ADMIN_SETUP_GUIDE.md
  SECURITY_CHECKLIST.md
  SECURITY_AUDIT_REPORT.md
  REMEDIATION_GUIDE.md
  STATUS.md
)

echo "### Building archive index ###"
{
  echo "# Archived docs"
  echo ""
  echo "One-off fix logs, debug sessions, and superseded guides from past"
  echo "development. Kept for history; none of these should be treated as"
  echo "current instructions — check /docs/ or the README for that."
  echo ""
} > docs/archive/INDEX.md

moved_root=0
moved_active=0
moved_archive=0

for f in *.md; do
  [ -e "$f" ] || continue

  if printf '%s\n' "${KEEP_ROOT[@]}" | grep -qx "$f"; then
    moved_root=$((moved_root+1))
    continue
  fi

  if printf '%s\n' "${DOCS_ACTIVE[@]}" | grep -qx "$f"; then
    git mv "$f" "docs/$f"
    moved_active=$((moved_active+1))
    continue
  fi

  # Everything else -> archive, with a one-line index entry
  first_line=$(grep -m1 '^#' "$f" 2>/dev/null | sed -E 's/^#+ *//' | cut -c1-100 || true)
  echo "- **$f** — ${first_line:-"(no summary line found)"}" >> docs/archive/INDEX.md
  git mv "$f" "docs/archive/$f"
  moved_archive=$((moved_archive+1))
done

echo ""
echo "Kept at root:      $moved_root"
echo "Moved to docs/:     $moved_active"
echo "Moved to archive/:  $moved_archive"
echo ""
echo "Review docs/archive/INDEX.md, then:"
echo "  git commit -am 'docs: archive one-off fix/debug logs, keep active reference in docs/'"
