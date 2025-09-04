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
    logoUri: v.optional(v.string()),
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
        logoUri: args.logoUri || existing.logoUri,
      });
      return existing._id;
    } else {
      // Create new metadata record
      return await ctx.db.insert("tokenMetadata", args);
    }
  },
});

// Get all unique token mints from trades
export const getUniqueTokenMints = query({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("trades").collect();
    const uniqueMints = [...new Set(trades.map(t => t.tokenMint))];
    
    return uniqueMints.map(mint => ({
      mint,
      tradeCount: trades.filter(t => t.tokenMint === mint).length,
      hasMetadata: false // We'll check this separately
    }));
  },
});