import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get simple loss leaderboard
export const getLeaderboard = query({
  args: {
    period: v.union(v.literal("24h"), v.literal("7d"), v.literal("all")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { period, limit = 50 } = args; // Reduced for MVP efficiency
    
    // Try to get cached data first
    const cached = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_period", (q) => q.eq("period", period))
      .first();
    
    // If cache is fresh (less than 2 minutes old for MVP), return it
    const now = Date.now();
    if (cached && (now - cached.lastUpdated) < 2 * 60 * 1000) {
      return cached.data.slice(0, limit);
    }
    
    // Otherwise, calculate fresh data
    return await calculateLeaderboard(ctx, period, limit);
  },
});

// Calculate simple loss leaderboard from scratch
async function calculateLeaderboard(ctx: any, period: string, limit: number) {
  const timeThreshold = getTimeThreshold(period);
  
  // Get all PNL records for the period
  const pnlQuery = ctx.db.query("realizedPnl");
  const pnlRecords = timeThreshold 
    ? await pnlQuery.withIndex("by_time", (q: any) => q.gte("blockTime", timeThreshold)).collect()
    : await pnlQuery.collect();
  
  // Group by wallet and calculate aggregates
  const walletStats = new Map<string, {
    totalPnl: number;
    lossCount: number;
    biggestLoss: number;
    biggestLossToken?: string;
    lastLossTime?: number;
  }>();
  
  for (const pnl of pnlRecords) {
    const wallet = pnl.walletAddress;
    const current = walletStats.get(wallet) || {
      totalPnl: 0,
      lossCount: 0,
      biggestLoss: 0,
    };
    
    current.totalPnl += pnl.pnlSol;
    
    if (pnl.pnlSol < 0) {
      current.lossCount++;
      
      if (pnl.pnlSol < current.biggestLoss) {
        current.biggestLoss = pnl.pnlSol;
        current.biggestLossToken = pnl.tokenMint;
      }
      
      if (!current.lastLossTime || pnl.blockTime > current.lastLossTime) {
        current.lastLossTime = pnl.blockTime;
      }
    }
    
    walletStats.set(wallet, current);
  }
  
  // Get all-time losses for each wallet
  const allTimeLosses = new Map<string, number>();
  if (period !== "all") {
    const allPnlRecords = await ctx.db.query("realizedPnl").collect();
    for (const pnl of allPnlRecords) {
      if (pnl.pnlSol < 0) {
        const current = allTimeLosses.get(pnl.walletAddress) || 0;
        allTimeLosses.set(pnl.walletAddress, current + pnl.pnlSol);
      }
    }
  }
  
  // Convert to leaderboard format and sort by biggest losses
  const leaderboard = Array.from(walletStats.entries())
    .filter(([_, stats]) => stats.totalPnl < 0) // Only include wallets with losses
    .sort(([, a], [, b]) => a.totalPnl - b.totalPnl) // Sort by most negative PNL
    .slice(0, limit)
    .map(([walletAddress, stats], index) => ({
      rank: index + 1,
      walletAddress,
      pnlAmount: stats.totalPnl,
      lossTradeCount: stats.lossCount,
      biggestLossToken: stats.biggestLossToken,
      lastLossTime: stats.lastLossTime,
      allTimeLoss: period === "all" ? stats.totalPnl : (allTimeLosses.get(walletAddress) || 0),
    }));
  
  return leaderboard;
}

// Update leaderboard cache
export const updateLeaderboardCache = mutation({
  args: {
    period: v.union(v.literal("24h"), v.literal("7d"), v.literal("all")),
  },
  handler: async (ctx, args) => {
    const { period } = args;
    
    // Calculate fresh leaderboard data
    const data = await calculateLeaderboard(ctx, period, 1000); // Cache top 1000
    
    // Update or create cache entry
    const existing = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_period", (q) => q.eq("period", period))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        data,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("leaderboardCache", {
        period,
        data,
        lastUpdated: Date.now(),
      });
    }
    
    return data.length;
  },
});

// Get wallet statistics
export const getWalletStats = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { walletAddress } = args;
    
    // Get wallet metadata
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_address", (q) => q.eq("address", walletAddress))
      .first();
    
    // Get all PNL records for this wallet
    const pnlRecords = await ctx.db
      .query("realizedPnl")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .collect();
    
    // Calculate time-based statistics
    const now = Date.now();
    const day24h = now - 24 * 60 * 60 * 1000;
    const day7d = now - 7 * 24 * 60 * 60 * 1000;
    
    const stats = {
      pnl24h: 0,
      pnl7d: 0,
      pnlAllTime: 0,
      lossCount24h: 0,
      lossCount7d: 0,
      lossCountAllTime: 0,
      biggestLoss: 0,
      biggestLossToken: null as string | null,
    };
    
    for (const pnl of pnlRecords) {
      const blockTime = pnl.blockTime * 1000; // Convert to milliseconds
      
      stats.pnlAllTime += pnl.pnlSol;
      if (pnl.pnlSol < 0) {
        stats.lossCountAllTime++;
        
        if (pnl.pnlSol < stats.biggestLoss) {
          stats.biggestLoss = pnl.pnlSol;
          stats.biggestLossToken = pnl.tokenMint;
        }
      }
      
      if (blockTime >= day24h) {
        stats.pnl24h += pnl.pnlSol;
        if (pnl.pnlSol < 0) stats.lossCount24h++;
      }
      
      if (blockTime >= day7d) {
        stats.pnl7d += pnl.pnlSol;
        if (pnl.pnlSol < 0) stats.lossCount7d++;
      }
    }
    
    return {
      wallet,
      stats,
      totalTrades: wallet?.totalTrades || 0,
      totalVolume: wallet?.totalVolumeSol || 0,
    };
  },
});

// Helper function to get time threshold
function getTimeThreshold(period: string): number | null {
  const now = Date.now() / 1000; // Convert to seconds for blockchain timestamps
  switch (period) {
    case "24h": return now - 24 * 60 * 60;
    case "7d": return now - 7 * 24 * 60 * 60;
    case "all": return null;
    default: return null;
  }
}