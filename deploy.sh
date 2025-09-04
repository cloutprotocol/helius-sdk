#!/bin/bash

# PumpLoss Vercel Deployment Script

echo "🚀 Starting PumpLoss deployment to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project locally first to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
    
    # Deploy to Vercel
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    
    echo "🎉 Deployment complete!"
    echo "📝 Don't forget to set your environment variables in Vercel dashboard:"
    echo "   - HELIUS_API_KEY"
    echo "   - HELIUS_RPC_URL"
    echo "   - PUMPSWAP_PROGRAM_ID"
    echo "   - CONVEX_DEPLOYMENT"
    echo "   - NEXT_PUBLIC_CONVEX_URL"
else
    echo "❌ Local build failed. Please fix the errors before deploying."
    exit 1
fi