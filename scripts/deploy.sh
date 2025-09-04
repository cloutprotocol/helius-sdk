#!/bin/bash

echo "🚀 Deploying Pump Loss to Production"
echo "=================================="

# Step 1: Deploy Convex functions
echo "📦 Deploying Convex functions..."
npx convex deploy --prod

if [ $? -ne 0 ]; then
    echo "❌ Convex deployment failed"
    exit 1
fi

echo "✅ Convex deployed successfully"

# Step 2: Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Vercel deployment failed"
    exit 1
fi

echo "✅ Vercel deployed successfully"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Create Helius webhook pointing to your Vercel URL"
echo "3. Test the webhook endpoint"
echo "4. Monitor for live data"
echo ""
echo "🔗 Useful Links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Convex Dashboard: https://dashboard.convex.dev"
echo "- Helius Dashboard: https://dev.helius.xyz/dashboard"