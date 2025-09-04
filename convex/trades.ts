import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Process a new trade and update all related data
export const processTrade = mutation({
  args: {
    signature: v.string(),
    blockTime: v.number(),
    traderAddress: v.string(),
    tokenMint: v.string(),
    direction: v.union(v.literal("BUY"), v.literal("SELL")),
    tokenAmount: v.number(),
    solAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if trade already exists
    const existingTrade = await ctx.db
      .query("trades")
      .withIndex("by_signature", (q) => q.eq("signature", args.signature))
      .first();

    if (existingTrade) {
      return existingTrade._id;
    }

    // Insert the trade
    const tradeId = await ctx.db.insert("trades", args);

    // Update or create wallet record
    await updateWalletRecord(ctx, args.traderAddress, args.blockTime, args.solAmount);

    // Update cost basis and calculate PNL if it's a SELL
    if (args.direction === "SELL") {
      await processSellTrade(ctx, args);
    } else {
      await processBuyTrade(ctx, args);
    }

    return tradeId;
  },
});

// Update wallet metadata
async function updateWalletRecord(ctx: any, address: string, blockTime: number, solAmount: number) {
  const existingWallet = await ctx.db
    .query("wallets")
    .withIndex("by_address", (q: any) => q.eq("address", address))
    .first();

  if (existingWallet) {
    await ctx.db.patch(existingWallet._id, {
      lastSeen: blockTime,
      totalTrades: existingWallet.totalTrades + 1,
      totalVolumeSol: existingWallet.totalVolumeSol + solAmount,
    });
  } else {
    await ctx.db.insert("wallets", {
      address,
      firstSeen: blockTime,
      lastSeen: blockTime,
      totalTrades: 1,
      totalVolumeSol: solAmount,
    });
  }
}

// Process a BUY trade - update cost basis
async function processBuyTrade(ctx: any, trade: any) {
  const existingBasis = await ctx.db
    .query("tokenCostBasis")
    .withIndex("by_wallet_token", (q: any) => 
      q.eq("walletAddress", trade.traderAddress).eq("tokenMint", trade.tokenMint)
    )
    .first();

  if (existingBasis) {
    // Update weighted average cost
    const totalCost = (existingBasis.totalTokensHeld * existingBasis.weightedAvgCostSol) + trade.solAmount;
    const totalTokens = existingBasis.totalTokensHeld + trade.tokenAmount;
    const newWAC = totalCost / totalTokens;

    await ctx.db.patch(existingBasis._id, {
      totalTokensHeld: totalTokens,
      weightedAvgCostSol: newWAC,
      lastUpdated: trade.blockTime,
    });
  } else {
    // Create new cost basis record
    await ctx.db.insert("tokenCostBasis", {
      walletAddress: trade.traderAddress,
      tokenMint: trade.tokenMint,
      totalTokensHeld: trade.tokenAmount,
      weightedAvgCostSol: trade.solAmount / trade.tokenAmount,
      lastUpdated: trade.blockTime,
    });
  }
}

// Process a SELL trade - calculate PNL and update cost basis
async function processSellTrade(ctx: any, trade: any) {
  const costBasis = await ctx.db
    .query("tokenCostBasis")
    .withIndex("by_wallet_token", (q: any) => 
      q.eq("walletAddress", trade.traderAddress).eq("tokenMint", trade.tokenMint)
    )
    .first();

  if (!costBasis || costBasis.totalTokensHeld < trade.tokenAmount) {
    // No cost basis or insufficient tokens - skip PNL calculation
    console.warn(`Insufficient cost basis for sell trade: ${trade.signature}`);
    return;
  }

  // Calculate realized PNL
  const costBasisOfSoldTokens = trade.tokenAmount * costBasis.weightedAvgCostSol;
  const pnlSol = trade.solAmount - costBasisOfSoldTokens;

  // Record the PNL event
  await ctx.db.insert("realizedPnl", {
    tradeSignature: trade.signature,
    walletAddress: trade.traderAddress,
    tokenMint: trade.tokenMint,
    tokensSold: trade.tokenAmount,
    solReceived: trade.solAmount,
    costBasisOfSoldTokens,
    pnlSol,
    blockTime: trade.blockTime,
  });

  // Update cost basis (reduce holdings)
  const newTotalTokens = costBasis.totalTokensHeld - trade.tokenAmount;
  
  if (newTotalTokens <= 0) {
    // Sold all tokens - remove cost basis record
    await ctx.db.delete(costBasis._id);
  } else {
    // Update holdings (WAC stays the same)
    await ctx.db.patch(costBasis._id, {
      totalTokensHeld: newTotalTokens,
      lastUpdated: trade.blockTime,
    });
  }
}

// Get trades for a specific wallet
export const getWalletTrades = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, limit = 100 } = args;
    
    return await ctx.db
      .query("trades")
      .withIndex("by_trader", (q) => q.eq("traderAddress", walletAddress))
      .order("desc")
      .take(limit);
  },
});

// Get recent trades across all wallets
export const getRecentTrades = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50 } = args;
    
    return await ctx.db
      .query("trades")
      .withIndex("by_time")
      .order("desc")
      .take(limit);
  },
});