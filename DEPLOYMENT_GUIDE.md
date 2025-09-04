# Pump Loss - Live Data Deployment Guide

## 🚀 Deploy to Production

### Step 1: Deploy Convex Functions
```bash
# Deploy your Convex backend to production
npx convex deploy --prod

# This will give you a production Convex URL
# Update your .env.local with the production URL
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy to Vercel
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up environment variables
```

### Step 3: Set Environment Variables in Vercel
In your Vercel dashboard, add these environment variables:

```env
HELIUS_API_KEY=293b7c61-f831-4427-82a3-c87d62af1e8c
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=293b7c61-f831-4427-82a3-c87d62af1e8c
PUMPSWAP_PROGRAM_ID=pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA
NEXT_PUBLIC_CONVEX_URL=https://exciting-nightingale-175.convex.cloud
CONVEX_DEPLOYMENT=your-production-deployment-name
```

### Step 4: Set Up Helius Webhook

1. **Go to Helius Dashboard**: https://dev.helius.xyz/dashboard
2. **Create New Webhook** with these settings:
   - **Webhook URL**: `https://your-app.vercel.app/api/webhook`
   - **Webhook Type**: `Enhanced`
   - **Transaction Types**: `Any`
   - **Account Addresses**: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
   - **Auth Header**: (optional, leave blank for now)

### Step 5: Test the Webhook

```bash
# Test your webhook endpoint
curl https://your-app.vercel.app/api/webhook

# Should return:
# {"status":"Pump Loss webhook endpoint active","timestamp":"...","program":"pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"}
```

## 🔧 Quick Local Testing

If you want to test webhooks locally first:

### Option 1: Use ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# In terminal 1: Start your app
npm run dev

# In terminal 2: Expose localhost
ngrok http 3000

# Use the ngrok URL for your webhook:
# https://abc123.ngrok.io/api/webhook
```

### Option 2: Use Vercel Dev
```bash
# Start Vercel dev server (gives you a public URL)
vercel dev

# Use the Vercel dev URL for your webhook
```

## 📊 Monitor Live Data

Once deployed and webhook is set up:

1. **Check webhook logs** in Vercel dashboard
2. **Monitor Convex dashboard** for new data
3. **Watch the leaderboard** update in real-time
4. **Clear test data** once real data starts flowing

## 🐛 Troubleshooting

### Webhook Not Receiving Data
- Check Helius dashboard for webhook status
- Verify webhook URL is correct and accessible
- Check Vercel function logs for errors

### Data Not Appearing in Leaderboard
- Check Convex dashboard for new records
- Verify PNL calculations are working
- Check for TypeScript/runtime errors

### Performance Issues
- Monitor Convex function execution times
- Check for rate limiting in Helius
- Consider adding caching if needed

## 🎯 Success Metrics

You'll know it's working when:
- ✅ Webhook receives POST requests from Helius
- ✅ New trades appear in Convex database
- ✅ PNL calculations create loss records
- ✅ Leaderboard updates with real traders
- ✅ Real-time updates work in browser

## 📈 Next Steps After Live Data

1. **Monitor for 24 hours** to ensure stability
2. **Add error alerting** (Sentry, etc.)
3. **Optimize performance** based on real usage
4. **Add more features** (wallet pages, etc.)
5. **Scale infrastructure** as needed

Ready to go live! 🚀