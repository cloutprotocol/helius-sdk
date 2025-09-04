import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Simple trades table
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
    .index("by_time", ["blockTime"])
    .index("by_trader_token", ["traderAddress", "tokenMint"]),

  // Simple cost basis tracking
  tokenCostBasis: defineTable({
    walletAddress: v.string(),
    tokenMint: v.string(),
    totalTokensHeld: v.number(),
    weightedAvgCostSol: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_wallet_token", ["walletAddress", "tokenMint"])
    .index("by_wallet", ["walletAddress"]),

  // Simple PNL tracking (losses only for MVP)
  realizedPnl: defineTable({
    tradeSignature: v.string(),
    walletAddress: v.string(),
    tokenMint: v.string(),
    tokensSold: v.number(),
    solReceived: v.number(),
    costBasisSol: v.number(),
    pnlSol: v.number(),
    blockTime: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_time", ["blockTime"])
    .index("by_pnl", ["pnlSol"])
    .index("by_wallet_time", ["walletAddress", "blockTime"]),

  // Simple leaderboard cache
  leaderboardCache: defineTable({
    period: v.union(v.literal("24h"), v.literal("7d"), v.literal("all")),
    data: v.array(v.object({
      rank: v.number(),
      walletAddress: v.string(),
      pnlAmount: v.number(),
      lossTradeCount: v.number(),
      biggestLossToken: v.optional(v.string()),
      lastLossTime: v.optional(v.number()),
      allTimeLoss: v.number(),
    })),
    lastUpdated: v.number(),
  }).index("by_period", ["period"]),

  // Basic wallet info
  wallets: defineTable({
    address: v.string(),
    firstSeen: v.number(),
    lastSeen: v.number(),
    totalTrades: v.number(),
    totalVolumeSol: v.number(),
  }).index("by_address", ["address"]),

  // Basic token metadata
  tokenMetadata: defineTable({
    mint: v.string(),
    symbol: v.optional(v.string()),
    name: v.optional(v.string()),
    decimals: v.number(),
    lastUpdated: v.number(),
  }).index("by_mint", ["mint"]),
});