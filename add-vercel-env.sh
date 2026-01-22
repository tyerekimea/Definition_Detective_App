#!/bin/bash

echo "🔐 Adding Environment Variables to Vercel..."
echo ""
echo "This will add all environment variables from .env.local to Vercel"
echo ""

# Read from .env.local and add to Vercel
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" =~ ^# ]]; then
    continue
  fi
  
  # Only add variables that start with NEXT_PUBLIC_, OPENAI_, GOOGLE_, PAYSTACK_, or FIREBASE_
  if [[ "$key" =~ ^(NEXT_PUBLIC_|OPENAI_|GOOGLE_|PAYSTACK_|FIREBASE_) ]]; then
    echo "Adding: $key"
    echo "$value" | vercel env add "$key" production --yes 2>/dev/null || echo "  ⚠️  Already exists or failed"
  fi
done < .env.local

echo ""
echo "✅ Environment variables added!"
echo ""
echo "Now redeploy to apply changes:"
echo "  vercel --prod"
