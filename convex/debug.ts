import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Debug function to check database state
export const debugDatabaseState = query({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("trades").collect();
    const tokenCostBasis = await ctx.db.query("tokenCostBasis").collect();
    const realizedPnl = await ctx.db.query("realizedPnl").collect();
    const tokenMetadata = await ctx.db.query("tokenMetadata").collect();
    
    // Count by direction
    const buyTrades = trades.filter(t => t.direction === "BUY").length;
    const sellTrades = trades.filter(t => t.direction === "SELL").length;
    
    return {
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      tokenCostBasisRecords: tokenCostBasis.length,
      realizedPnlRecords: realizedPnl.length,
      tokenMetadataRecords: tokenMetadata.length,
      recentTrades: trades.slice(-5).map(t => ({
        signature: t.signature.slice(0, 8),
        direction: t.direction,
        tokenAmount: t.tokenAmount,
        solAmount: t.solAmount,
        trader: t.traderAddress.slice(0, 8)
      }))
    };
  },
});

// Add token metadata for a mint
export const addTokenMetadata = mutation({
  args: {
    mint: v.string(),
    symbol: v.optional(v.string()),
    name: v.optional(v.string()),
    decimals: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if metadata already exists
    const existing = await ctx.db
      .query("tokenMetadata")
      .withIndex("by_mint", (q) => q.eq("mint", args.mint))
      .first();
    
    if (existing) {
      // Update existing metadata
      await ctx.db.patch(existing._id, {
        symbol: args.symbol || existing.symbol,
        name: args.name || existing.name,
        decimals: args.decimals || existing.decimals,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      // Create new metadata record
      return await ctx.db.insert("tokenMetadata", {
        mint: args.mint,
        symbol: args.symbol,
        name: args.name,
        decimals: args.decimals || 9, // Default to 9 decimals for SPL tokens
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get all unique token mints from trades (limited sample)
export const getUniqueTokenMints = query({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("trades").take(1000);
    const mintSet = new Set(trades.map(t => t.tokenMint));
    const uniqueMints = Array.from(mintSet);
    
    return uniqueMints.map(mint => ({
      mint,
      tradeCount: trades.filter(t => t.tokenMint === mint).length,
      hasMetadata: false // We'll check this separately
    }));
  },
});

// Clear all data (use with caution)
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in batches to avoid timeout
    const trades = await ctx.db.query("trades").take(1000);
    const tokenCostBasis = await ctx.db.query("tokenCostBasis").take(1000);
    const realizedPnl = await ctx.db.query("realizedPnl").take(1000);
    const tokenMetadata = await ctx.db.query("tokenMetadata").take(1000);
    const wallets = await ctx.db.query("wallets").take(1000);
    
    // Delete all records
    for (const trade of trades) {
      await ctx.db.delete(trade._id);
    }
    for (const basis of tokenCostBasis) {
      await ctx.db.delete(basis._id);
    }
    for (const pnl of realizedPnl) {
      await ctx.db.delete(pnl._id);
    }
    for (const metadata of tokenMetadata) {
      await ctx.db.delete(metadata._id);
    }
    for (const wallet of wallets) {
      await ctx.db.delete(wallet._id);
    }
    
    return `Cleared ${trades.length} trades, ${tokenCostBasis.length} cost basis, ${realizedPnl.length} PnL, ${tokenMetadata.length} metadata, ${wallets.length} wallets`;
  },
});