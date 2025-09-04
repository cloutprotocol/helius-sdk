# Comprehensive Trading Analytics Schema

## 🎯 Expanded Requirements

Now tracking:
- ✅ **Losses** (original focus)
- ✅ **Wins** (profitable trades)
- ✅ **Token Performance** (per-token analytics)
- ✅ **Trader Behavior** (patterns, streaks, risk profiles)
- ✅ **Market Intelligence** (token trends, correlation analysis)
- ✅ **Portfolio Tracking** (holdings, diversification)

## 📊 Enhanced Convex Schema

```typescript
// convex/schema.ts - Comprehensive Analytics
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core trading data (enhanced)
  trades: defineTable({
    signature: v.string(),
    blockTime: v.number(),
    slot: v.number(),
    traderAddress: v.string(),
    tokenMint: v.string(),
    direction: v.union(v.literal("BUY"), v.literal("SELL")),
    tokenAmount: v.number(),
    solAmount: v.number(),
    pricePerToken: v.number(), // SOL per token
    marketCap: v.optional(v.number()), // Token market cap at time of trade
    liquidityPool: v.optional(v.string()), // Pool address
  })
    .index("by_signature", ["signature"])
    .index("by_trader", ["traderAddress"])
    .index("by_token", ["tokenMint"])
    .index("by_time", ["blockTime"])
    .index("by_trader_token", ["traderAddress", "tokenMint"])
    .index("by_token_time", ["tokenMint", "blockTime"]),

  // Comprehensive PNL tracking
  realizedPnl: defineTable({
    tradeSignature: v.string(),
    walletAddress: v.string(),
    tokenMint: v.string(),
    tokensSold: v.number(),
    solReceived: v.number(),
    costBasisSol: v.number(),
    pnlSol: v.number(),
    pnlPercentage: v.number(), // % gain/loss
    holdDurationSeconds: v.number(), // How long held before selling
    blockTime: v.number(),
    isWin: v.boolean(), // true if pnlSol > 0
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_token", ["tokenMint"])
    .index("by_time", ["blockTime"])
    .index("by_pnl", ["pnlSol"])
    .index("by_wins", ["isWin", "pnlSol"])
    .index("by_wallet_token", ["walletAddress", "tokenMint"])
    .index("by_wallet_time", ["walletAddress", "blockTime"]),

  // Token cost basis tracking (enhanced)
  tokenCostBasis: defineTable({
    walletAddress: v.string(),
    tokenMint: v.string(),
    totalTokensHeld: v.number(),
    weightedAvgCostSol: v.number(),
    totalInvestedSol: v.number(),
    firstBuyTime: v.number(),
    lastBuyTime: v.number(),
    buyCount: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_wallet_token", ["walletAddress", "tokenMint"])
    .index("by_wallet", ["walletAddress"])
    .index("by_token", ["tokenMint"]),

  // Comprehensive trader statistics
  traderStats: defineTable({
    walletAddress: v.string(),
    
    // Trading volume
    totalTrades: v.number(),
    totalVolumeSol: v.number(),
    
    // PNL metrics
    totalPnlSol: v.number(),
    totalWinsSol: v.number(),
    totalLossesSol: v.number(),
    
    // Win/Loss ratios
    winCount: v.number(),
    lossCount: v.number(),
    winRate: v.number(), // winCount / totalTrades
    
    // Trade size metrics
    avgTradeSizeSol: v.number(),
    maxTradeSizeSol: v.number(),
    minTradeSizeSol: v.number(),
    
    // Streak tracking
    currentWinStreak: v.number(),
    currentLossStreak: v.number(),
    maxWinStreak: v.number(),
    maxLossStreak: v.number(),
    
    // Risk metrics
    biggestWinSol: v.number(),
    biggestLossSol: v.number(),
    avgWinSizeSol: v.number(),
    avgLossSizeSol: v.number(),
    riskScore: v.number(), // 0-100 calculated risk score
    
    // Portfolio metrics
    uniqueTokensTraded: v.number(),
    currentHoldings: v.number(), // Number of different tokens held
    portfolioValueSol: v.number(), // Current unrealized value
    
    // Time metrics
    firstTradeTime: v.number(),
    lastTradeTime: v.number(),
    activeDays: v.number(),
    avgTradesPerDay: v.number(),
    
    lastUpdated: v.number(),
  }).index("by_wallet", ["walletAddress"])
    .index("by_total_pnl", ["totalPnlSol"])
    .index("by_win_rate", ["winRate"])
    .index("by_risk_score", ["riskScore"]),

  // Token analytics and performance
  tokenStats: defineTable({
    tokenMint: v.string(),
    
    // Basic metrics
    totalTrades: v.number(),
    totalVolumeSol: v.number(),
    uniqueTraders: v.number(),
    
    // Price metrics
    currentPriceSol: v.number(),
    highestPriceSol: v.number(),
    lowestPriceSol: v.number(),
    priceChange24h: v.number(), // Percentage change
    
    // Trading metrics
    totalBuys: v.number(),
    totalSells: v.number(),
    buyVolumeRatio: v.number(), // buys / (buys + sells)
    
    // PNL metrics for this token
    totalPnlSol: v.number(),
    totalWinsSol: v.number(),
    totalLossesSol: v.number(),
    winnerCount: v.number(), // Traders who made profit
    loserCount: v.number(), // Traders who made losses
    
    // Risk metrics
    avgHoldDurationSeconds: v.number(),
    volatilityScore: v.number(), // Price volatility measure
    riskLevel: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH")),
    
    // Market metrics
    marketCapSol: v.optional(v.number()),
    liquiditySol: v.optional(v.number()),
    
    // Time metrics
    firstTradeTime: v.number(),
    lastTradeTime: v.number(),
    
    lastUpdated: v.number(),
  }).index("by_token", ["tokenMint"])
    .index("by_volume", ["totalVolumeSol"])
    .index("by_pnl", ["totalPnlSol"])
    .index("by_risk", ["riskLevel"])
    .index("by_traders", ["uniqueTraders"]),

  // Multiple leaderboards
  leaderboards: defineTable({
    type: v.union(
      v.literal("biggest_losers"),
      v.literal("biggest_winners"), 
      v.literal("most_active"),
      v.literal("highest_winrate"),
      v.literal("riskiest_traders"),
      v.literal("token_winners"),
      v.literal("token_losers")
    ),
    period: v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("all")),
    data: v.array(v.object({
      rank: v.number(),
      address: v.string(), // wallet or token address
      value: v.number(), // the metric being ranked
      metadata: v.optional(v.object({
        winRate: v.optional(v.number()),
        tradeCount: v.optional(v.number()),
        riskScore: v.optional(v.number()),
        tokenSymbol: v.optional(v.string()),
      }))
    })),
    lastUpdated: v.number(),
  }).index("by_type_period", ["type", "period"]),

  // Token metadata and enrichment
  tokenMetadata: defineTable({
    mint: v.string(),
    symbol: v.optional(v.string()),
    name: v.optional(v.string()),
    decimals: v.number(),
    logoUri: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    twitter: v.optional(v.string()),
    telegram: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    creatorAddress: v.optional(v.string()),
    isVerified: v.boolean(),
    tags: v.optional(v.array(v.string())), // ["meme", "gaming", "defi"]
    lastUpdated: v.number(),
  }).index("by_mint", ["mint"])
    .index("by_symbol", ["symbol"])
    .index("by_verified", ["isVerified"]),

  // Trading sessions and behavior patterns
  tradingSessions: defineTable({
    walletAddress: v.string(),
    sessionStart: v.number(),
    sessionEnd: v.number(),
    tradesInSession: v.number(),
    volumeInSession: v.number(),
    pnlInSession: v.number(),
    tokensTraded: v.array(v.string()),
    sessionType: v.union(
      v.literal("scalping"), // Many quick trades
      v.literal("swing"), // Medium-term holds
      v.literal("hodl"), // Long-term holds
      v.literal("panic") // Rapid selling
    ),
  }).index("by_wallet", ["walletAddress"])
    .index("by_session_start", ["sessionStart"])
    .index("by_type", ["sessionType"]),

  // Market events and correlations
  marketEvents: defineTable({
    eventTime: v.number(),
    eventType: v.union(
      v.literal("token_launch"),
      v.literal("major_dump"),
      v.literal("major_pump"),
      v.literal("whale_activity"),
      v.literal("volume_spike")
    ),
    tokenMint: v.optional(v.string()),
    description: v.string(),
    impactScore: v.number(), // 1-10 impact on market
    affectedTraders: v.number(),
    volumeImpact: v.number(),
  }).index("by_time", ["eventTime"])
    .index("by_type", ["eventType"])
    .index("by_token", ["tokenMint"]),
});
```

## 🏆 Multiple Leaderboard Types

```typescript
// Enhanced leaderboard system
export const leaderboardTypes = {
  // Loss-focused (original)
  biggest_losers: {
    title: "💸 Biggest Losers",
    description: "Traders with the largest losses",
    metric: "totalLossesSol",
    order: "desc" // Most negative first
  },
  
  // Win-focused (new)
  biggest_winners: {
    title: "🏆 Biggest Winners", 
    description: "Traders with the largest gains",
    metric: "totalWinsSol",
    order: "desc"
  },
  
  // Activity-focused
  most_active: {
    title: "🔥 Most Active",
    description: "Highest volume traders",
    metric: "totalVolumeSol", 
    order: "desc"
  },
  
  // Skill-focused
  highest_winrate: {
    title: "🎯 Highest Win Rate",
    description: "Most successful traders by percentage",
    metric: "winRate",
    order: "desc",
    filter: "totalTrades >= 10" // Minimum trades for credibility
  },
  
  // Risk-focused
  riskiest_traders: {
    title: "⚡ Riskiest Traders",
    description: "Highest risk score traders",
    metric: "riskScore",
    order: "desc"
  },
  
  // Token-focused
  token_winners: {
    title: "🚀 Best Performing Tokens",
    description: "Tokens generating most profits",
    metric: "totalWinsSol",
    order: "desc"
  },
  
  token_losers: {
    title: "📉 Worst Performing Tokens", 
    description: "Tokens generating most losses",
    metric: "totalLossesSol",
    order: "desc"
  }
};
```

## 📊 Advanced Analytics Queries

```typescript
// convex/analytics.ts - Advanced queries
import { query } from "./_generated/server";
import { v } from "convex/values";

// Get comprehensive trader profile
export const getTraderProfile = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("traderStats")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .first();
    
    const recentTrades = await ctx.db
      .query("trades")
      .withIndex("by_trader", q => q.eq("traderAddress", args.walletAddress))
      .order("desc")
      .take(50);
    
    const currentHoldings = await ctx.db
      .query("tokenCostBasis")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .filter(q => q.gt(q.field("totalTokensHeld"), 0))
      .collect();
    
    const recentPnl = await ctx.db
      .query("realizedPnl")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .take(100);
    
    return {
      stats,
      recentTrades,
      currentHoldings,
      recentPnl,
      // Calculated metrics
      profitFactor: stats ? Math.abs(stats.totalWinsSol / stats.totalLossesSol) : 0,
      sharpeRatio: calculateSharpeRatio(recentPnl),
      riskAdjustedReturn: calculateRiskAdjustedReturn(stats),
    };
  }
});

// Get token performance analysis
export const getTokenAnalysis = query({
  args: { tokenMint: v.string() },
  handler: async (ctx, args) => {
    const tokenStats = await ctx.db
      .query("tokenStats")
      .withIndex("by_token", q => q.eq("tokenMint", args.tokenMint))
      .first();
    
    const metadata = await ctx.db
      .query("tokenMetadata")
      .withIndex("by_mint", q => q.eq("mint", args.tokenMint))
      .first();
    
    const recentTrades = await ctx.db
      .query("trades")
      .withIndex("by_token", q => q.eq("tokenMint", args.tokenMint))
      .order("desc")
      .take(100);
    
    const topWinners = await ctx.db
      .query("realizedPnl")
      .withIndex("by_token", q => q.eq("tokenMint", args.tokenMint))
      .filter(q => q.gt(q.field("pnlSol"), 0))
      .order("desc")
      .take(10);
    
    const topLosers = await ctx.db
      .query("realizedPnl")
      .withIndex("by_token", q => q.eq("tokenMint", args.tokenMint))
      .filter(q => q.lt(q.field("pnlSol"), 0))
      .order("asc")
      .take(10);
    
    return {
      tokenStats,
      metadata,
      recentTrades,
      topWinners,
      topLosers,
      // Calculated metrics
      successRate: tokenStats ? (tokenStats.winnerCount / (tokenStats.winnerCount + tokenStats.loserCount)) : 0,
      avgReturnPercentage: calculateAvgReturn(topWinners, topLosers),
      riskRewardRatio: calculateRiskReward(tokenStats),
    };
  }
});

// Get market overview and trends
export const getMarketOverview = query({
  handler: async (ctx) => {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    
    // Recent market activity
    const recentTrades = await ctx.db
      .query("trades")
      .withIndex("by_time")
      .filter(q => q.gte(q.field("blockTime"), last24h / 1000))
      .collect();
    
    // Top performing tokens
    const topTokens = await ctx.db
      .query("tokenStats")
      .withIndex("by_volume")
      .order("desc")
      .take(20);
    
    // Market events
    const recentEvents = await ctx.db
      .query("marketEvents")
      .withIndex("by_time")
      .filter(q => q.gte(q.field("eventTime"), last24h))
      .order("desc")
      .take(10);
    
    return {
      marketMetrics: {
        totalTrades24h: recentTrades.length,
        totalVolume24h: recentTrades.reduce((sum, t) => sum + t.solAmount, 0),
        uniqueTraders24h: new Set(recentTrades.map(t => t.traderAddress)).size,
        uniqueTokens24h: new Set(recentTrades.map(t => t.tokenMint)).size,
      },
      topTokens,
      recentEvents,
      trendingTokens: calculateTrendingTokens(topTokens),
    };
  }
});
```

## 🎯 Enhanced Frontend Components

```typescript
// Multiple leaderboard tabs
export function EnhancedLeaderboard() {
  const [activeTab, setActiveTab] = useState('biggest_losers');
  const [period, setPeriod] = useState('24h');
  
  const leaderboardData = useQuery(api.leaderboards.getLeaderboard, {
    type: activeTab,
    period: period
  });
  
  return (
    <div className="space-y-6">
      {/* Leaderboard Type Selector */}
      <div className="flex space-x-2 overflow-x-auto">
        {Object.entries(leaderboardTypes).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {config.title}
          </button>
        ))}
      </div>
      
      {/* Period Selector */}
      <PeriodSelector period={period} onChange={setPeriod} />
      
      {/* Leaderboard Table */}
      <LeaderboardTable 
        data={leaderboardData} 
        type={activeTab}
        period={period}
      />
    </div>
  );
}

// Comprehensive trader profile
export function TraderProfile({ address }: { address: string }) {
  const profile = useQuery(api.analytics.getTraderProfile, { walletAddress: address });
  
  if (!profile) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Overview */}
      <div className="lg:col-span-1">
        <StatsCard stats={profile.stats} />
        <RiskScoreCard riskScore={profile.stats?.riskScore} />
      </div>
      
      {/* Trading History */}
      <div className="lg:col-span-2">
        <TradingHistoryChart trades={profile.recentTrades} />
        <PnlChart pnlHistory={profile.recentPnl} />
      </div>
      
      {/* Current Holdings */}
      <div className="lg:col-span-3">
        <PortfolioTable holdings={profile.currentHoldings} />
      </div>
    </div>
  );
}
```

This comprehensive schema now tracks everything you mentioned:
- ✅ **Wins & Losses**: Detailed PNL tracking with win/loss classification
- ✅ **Token Analytics**: Performance metrics for every token
- ✅ **Trader Behavior**: Risk scores, streaks, patterns
- ✅ **Multiple Leaderboards**: Winners, losers, most active, highest win rate
- ✅ **Portfolio Tracking**: Current holdings, diversification
- ✅ **Market Intelligence**: Trends, correlations, events

Ready to implement this comprehensive analytics system?