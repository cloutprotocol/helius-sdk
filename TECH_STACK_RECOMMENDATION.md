# Pump Loss - Technology Stack Recommendation

## Overview

This document outlines the recommended technology stack for building Pump Loss v1.0, optimized for real-time data processing, scalability, and developer experience.

## 🏗️ Architecture Decision

### Why This Stack?

1. **Convex Database**: Perfect for real-time applications with built-in subscriptions, serverless scaling, and TypeScript support
2. **Next.js 14**: Full-stack framework with excellent Vercel integration and modern React features
3. **Helius SDK**: Best-in-class Solana data provider with webhook support
4. **Vercel**: Seamless deployment with edge functions and global CDN

## 📊 Complete Technology Stack

### Frontend Layer
```typescript
// Core Framework
- Next.js 14 (App Router)
- React 18
- TypeScript

// Styling & UI
- Tailwind CSS
- Radix UI (headless components)
- Lucide React (icons)
- Framer Motion (animations)

// State Management
- Zustand (lightweight state)
- React Query/TanStack Query (server state)

// Real-time Updates
- Convex React hooks (built-in real-time)
- WebSocket fallback if needed

// Charts & Visualization
- Recharts (React charts)
- D3.js (custom visualizations)

// Utilities
- date-fns (date manipulation)
- clsx (conditional classes)
- zod (runtime validation)
```

### Backend Layer
```typescript
// Runtime & Framework
- Node.js 18+
- Next.js API Routes
- TypeScript

// Database & Real-time
- Convex (serverless database)
- Built-in real-time subscriptions
- Automatic scaling

// Blockchain Integration
- Helius SDK
- @solana/web3.js
- Webhook processing

// Utilities
- zod (validation)
- date-fns (date handling)
```

### Infrastructure & DevOps
```yaml
# Deployment
- Vercel (frontend + API routes)
- Convex Cloud (database)

# Monitoring & Analytics
- Vercel Analytics
- Convex Dashboard
- Sentry (error tracking)

# Development
- GitHub (version control)
- GitHub Actions (CI/CD)
- ESLint + Prettier
- Husky (git hooks)
```

## 🔧 Project Structure

```
pump-loss/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── convex/
│   ├── _generated/
│   ├── schema.ts
│   ├── functions/
│   │   ├── trades.ts
│   │   ├── leaderboard.ts
│   │   ├── webhooks.ts
│   │   └── pnl.ts
│   └── lib/
│       ├── helius.ts
│       └── calculations.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── wallet/
│   │   │   └── [address]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── webhooks/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── leaderboard/
│   │   ├── wallet/
│   │   └── charts/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   └── hooks/
│       ├── useLeaderboard.ts
│       └── useWalletData.ts
├── public/
└── types/
    └── global.d.ts
```

## 🚀 Key Implementation Details

### 1. Convex Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trades: defineTable({
    signature: v.string(),
    blockTime: v.number(),
    traderAddress: v.string(),
    tokenMint: v.string(),
    direction: v.union(v.literal("BUY"), v.literal("SELL")),
    tokenAmount: v.number(),
    solAmount: v.number(),
  })
    .index("by_signature", ["signature"])
    .index("by_trader", ["traderAddress"])
    .index("by_time", ["blockTime"]),

  wallets: defineTable({
    address: v.string(),
    firstSeen: v.number(),
    lastSeen: v.number(),
  }).index("by_address", ["address"]),

  tokenCostBasis: defineTable({
    walletAddress: v.string(),
    tokenMint: v.string(),
    totalTokensHeld: v.number(),
    weightedAvgCostSol: v.number(),
  })
    .index("by_wallet_token", ["walletAddress", "tokenMint"]),

  realizedPnl: defineTable({
    tradeSignature: v.string(),
    walletAddress: v.string(),
    tokenMint: v.string(),
    tokensSold: v.number(),
    solReceived: v.number(),
    costBasisOfSoldTokens: v.number(),
    pnlSol: v.number(),
    blockTime: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_time", ["blockTime"])
    .index("by_pnl", ["pnlSol"]),
});
```

### 2. Helius Webhook Integration

```typescript
// convex/functions/webhooks.ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const handleWebhook = httpAction(async (ctx, request) => {
  const webhookData = await request.json();
  
  // Process each transaction in the webhook
  for (const transaction of webhookData) {
    await ctx.runMutation(internal.trades.processTransaction, {
      transaction,
    });
  }
  
  return new Response("OK", { status: 200 });
});
```

### 3. Real-time Leaderboard Query

```typescript
// convex/functions/leaderboard.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getLeaderboard = query({
  args: { 
    period: v.union(v.literal("24h"), v.literal("7d"), v.literal("all")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { period, limit = 100 } = args;
    
    const timeThreshold = getTimeThreshold(period);
    
    // Aggregate PNL by wallet for the specified period
    const pnlData = await ctx.db
      .query("realizedPnl")
      .withIndex("by_time", (q) => 
        timeThreshold ? q.gte("blockTime", timeThreshold) : q
      )
      .collect();
    
    // Group by wallet and calculate totals
    const walletPnl = new Map<string, number>();
    
    for (const pnl of pnlData) {
      if (pnl.pnlSol < 0) { // Only losses
        const current = walletPnl.get(pnl.walletAddress) || 0;
        walletPnl.set(pnl.walletAddress, current + pnl.pnlSol);
      }
    }
    
    // Sort by biggest losses and return top N
    return Array.from(walletPnl.entries())
      .sort(([,a], [,b]) => a - b) // Sort ascending (most negative first)
      .slice(0, limit)
      .map(([address, pnl], index) => ({
        rank: index + 1,
        walletAddress: address,
        pnl24h: pnl,
        // Additional fields would be calculated here
      }));
  },
});

function getTimeThreshold(period: string): number | null {
  const now = Date.now();
  switch (period) {
    case "24h": return now - 24 * 60 * 60 * 1000;
    case "7d": return now - 7 * 24 * 60 * 60 * 1000;
    case "all": return null;
    default: return null;
  }
}
```

### 4. Frontend Leaderboard Component

```typescript
// src/components/leaderboard/LeaderboardTable.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function LeaderboardTable({ period }: { period: "24h" | "7d" | "all" }) {
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, { period });
  
  if (!leaderboard) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wallet
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PNL ({period})
            </th>
            {/* Additional columns */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leaderboard.map((entry) => (
            <tr key={entry.walletAddress} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {entry.rank}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                <a href={`/wallet/${entry.walletAddress}`}>
                  {entry.walletAddress.slice(0, 8)}...
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                {entry.pnl24h.toFixed(2)} SOL
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🔄 Data Flow Architecture

### 1. Real-time Data Ingestion
```
Solana Blockchain → Helius Webhooks → Next.js API Route → Convex Mutation → Real-time UI Update
```

### 2. PNL Calculation Pipeline
```
Transaction → Parse Instruction → Update Cost Basis → Calculate PNL → Store Result → Trigger UI Update
```

### 3. Frontend Data Flow
```
User Request → Convex Query → Real-time Subscription → Automatic UI Updates
```

## 📈 Scalability Considerations

### Database Scaling
- **Convex**: Automatic scaling, no configuration needed
- **Indexing**: Proper indexes on frequently queried fields
- **Caching**: Built-in query result caching

### API Scaling
- **Vercel**: Automatic edge function scaling
- **Rate Limiting**: Implement per-IP limits
- **CDN**: Static assets served from global CDN

### Real-time Updates
- **Convex Subscriptions**: Efficient real-time updates
- **Connection Management**: Automatic reconnection handling
- **Selective Updates**: Only send relevant changes to clients

## 🛡️ Security & Reliability

### Data Integrity
- **Webhook Verification**: Validate Helius webhook signatures
- **Idempotent Processing**: Handle duplicate transactions
- **Error Recovery**: Retry failed operations

### Performance Monitoring
- **Convex Dashboard**: Built-in performance metrics
- **Vercel Analytics**: Frontend performance tracking
- **Custom Metrics**: Track data latency and accuracy

## 💰 Cost Estimation

### Monthly Costs (estimated for moderate traffic)
- **Convex**: $0-25/month (generous free tier)
- **Vercel**: $0-20/month (hobby plan sufficient initially)
- **Helius**: $99/month (Pro plan for webhooks)
- **Total**: ~$120-150/month

### Scaling Costs
- Convex and Vercel scale automatically with usage
- Predictable pricing based on actual consumption
- No upfront infrastructure costs

## 🚀 Getting Started

### 1. Setup Commands
```bash
# Create Next.js project
npx create-next-app@latest pump-loss --typescript --tailwind --app

# Install Convex
npm install convex
npx convex dev

# Install additional dependencies
npm install @radix-ui/react-* lucide-react recharts zustand zod
```

### 2. Environment Variables
```env
# .env.local
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
HELIUS_API_KEY=your-helius-api-key
WEBHOOK_SECRET=your-webhook-secret
```

### 3. Development Workflow
```bash
# Start development servers
npm run dev          # Next.js frontend
npx convex dev       # Convex backend

# Deploy
npx convex deploy    # Deploy Convex functions
vercel deploy        # Deploy frontend
```

This technology stack provides a robust, scalable foundation for Pump Loss v1.0 with excellent developer experience and built-in real-time capabilities.