# Pump Loss MVP - Simple Setup Guide

## 🎯 MVP Scope (Keep It Simple)

**Core Features Only:**
- ✅ Track PumpSwap trades via Helius webhooks
- ✅ Calculate PNL (losses only for now)
- ✅ Display simple leaderboard of biggest losers
- ✅ Real-time updates via Convex
- ✅ Basic wallet detail pages

**What We're NOT Building Yet:**
- ❌ Multiple leaderboard types
- ❌ Win tracking (losses only)
- ❌ Complex analytics
- ❌ Social features
- ❌ Advanced charts

## 🚀 Quick Setup Steps

### 1. Initialize Convex
```bash
cd pump-loss
npm install
npx convex dev
```

### 2. Set up Environment Variables
```bash
# .env.local (update with your Convex URLs)
HELIUS_API_KEY=293b7c61-f831-4427-82a3-c87d62af1e8c
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=293b7c61-f831-4427-82a3-c87d62af1e8c
PUMPSWAP_PROGRAM_ID=pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA

# These will be set by `npx convex dev`
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Start Development
```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend  
npm run dev
```

### 4. Set up Helius Webhook (After Deployment)
- Go to [Helius Dashboard](https://dev.helius.xyz/dashboard)
- Create webhook pointing to: `https://your-app.vercel.app/api/webhook`
- Monitor program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
- Type: Enhanced

## 📁 Simplified File Structure

```
pump-loss/
├── convex/
│   ├── schema.ts          # Simple schema (losses only)
│   ├── trades.ts          # Trade processing
│   └── leaderboard.ts     # Simple leaderboard
├── src/
│   ├── app/
│   │   ├── page.tsx       # Main leaderboard page
│   │   └── api/webhook/   # Webhook handler
│   └── components/
│       ├── LeaderboardTable.tsx
│       └── PeriodSelector.tsx
├── lib/
│   └── helius.ts          # Helius integration
└── package.json
```

## ⚡ MVP Development Timeline

**Day 1-2**: Core backend (Convex schema + trade processing)
**Day 3-4**: Webhook integration + PNL calculation  
**Day 5-6**: Frontend leaderboard + real-time updates
**Day 7**: Testing + deployment

**Total: 1 week to working MVP**