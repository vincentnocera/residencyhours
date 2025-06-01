#!/bin/bash

echo "Setting up environment variables for Residency Hours..."
echo ""
echo "Please provide your Supabase credentials:"
echo "(You can find these in your Supabase project dashboard under Settings > API)"
echo ""

read -p "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Anon/Public Key: " SUPABASE_ANON_KEY

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOF

echo ""
echo "✅ Environment variables saved to .env.local"
echo ""
echo "Next steps:"
echo "1. Run the SQL in SUPABASE_SETUP.md in your Supabase SQL editor"
echo "2. Start the development server with: npm run dev" 