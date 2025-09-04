import { mutation } from "./_generated/server";

// Add some test data to see the leaderboard working
export const addTestData = mutation({
  handler: async (ctx) => {
    // Add some test trades
    const testTrades = [
      {
        signature: "test_sig_1",
        blockTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        traderAddress: "trader_1_address_example_12345",
        tokenMint: "token_mint_1_example_67890",
        direction: "SELL" as const,
        tokenAmount: 1000,
        solAmount: 2.5,
      },
      {
        signature: "test_sig_2", 
        blockTime: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        traderAddress: "trader_2_address_example_54321",
        tokenMint: "token_mint_2_example_09876",
        direction: "SELL" as const,
        tokenAmount: 500,
        solAmount: 1.8,
      },
      {
        signature: "test_sig_3",
        blockTime: Math.floor(Date.now() / 1000) - 1800, // 30 min ago
        traderAddress: "trader_1_address_example_12345",
        tokenMint: "token_mint_1_example_67890", 
        direction: "SELL" as const,
        tokenAmount: 800,
        solAmount: 1.2,
      }
    ];

    // Insert test trades
    for (const trade of testTrades) {
      await ctx.db.insert("trades", trade);
    }

    // Add some test cost basis data
    await ctx.db.insert("tokenCostBasis", {
      walletAddress: "trader_1_address_example_12345",
      tokenMint: "token_mint_1_example_67890",
      totalTokensHeld: 0, // Sold all
      weightedAvgCostSol: 0.003, // 0.003 SOL per token
      lastUpdated: Math.floor(Date.now() / 1000),
    });

    await ctx.db.insert("tokenCostBasis", {
      walletAddress: "trader_2_address_example_54321", 
      tokenMint: "token_mint_2_example_09876",
      totalTokensHeld: 0, // Sold all
      weightedAvgCostSol: 0.004, // 0.004 SOL per token
      lastUpdated: Math.floor(Date.now() / 1000),
    });

    // Add some test PNL data (losses)
    await ctx.db.insert("realizedPnl", {
      tradeSignature: "test_sig_1",
      walletAddress: "trader_1_address_example_12345",
      tokenMint: "token_mint_1_example_67890",
      tokensSold: 1000,
      solReceived: 2.5,
      costBasisSol: 3.0, // Cost basis: 1000 * 0.003 = 3.0 SOL
      pnlSol: -0.5, // Loss: 2.5 - 3.0 = -0.5 SOL
      blockTime: Math.floor(Date.now() / 1000) - 3600,
    });

    await ctx.db.insert("realizedPnl", {
      tradeSignature: "test_sig_2",
      walletAddress: "trader_2_address_example_54321",
      tokenMint: "token_mint_2_example_09876", 
      tokensSold: 500,
      solReceived: 1.8,
      costBasisSol: 2.0, // Cost basis: 500 * 0.004 = 2.0 SOL
      pnlSol: -0.2, // Loss: 1.8 - 2.0 = -0.2 SOL
      blockTime: Math.floor(Date.now() / 1000) - 7200,
    });

    await ctx.db.insert("realizedPnl", {
      tradeSignature: "test_sig_3",
      walletAddress: "trader_1_address_example_12345",
      tokenMint: "token_mint_1_example_67890",
      tokensSold: 800,
      solReceived: 1.2,
      costBasisSol: 2.4, // Cost basis: 800 * 0.003 = 2.4 SOL  
      pnlSol: -1.2, // Loss: 1.2 - 2.4 = -1.2 SOL
      blockTime: Math.floor(Date.now() / 1000) - 1800,
    });

    // Add wallet info
    await ctx.db.insert("wallets", {
      address: "trader_1_address_example_12345",
      firstSeen: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      lastSeen: Math.floor(Date.now() / 1000) - 1800, // 30 min ago
      totalTrades: 2,
      totalVolumeSol: 3.7, // 2.5 + 1.2
    });

    await ctx.db.insert("wallets", {
      address: "trader_2_address_example_54321",
      firstSeen: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
      lastSeen: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      totalTrades: 1,
      totalVolumeSol: 1.8,
    });

    return "Test data added successfully!";
  },
});

// Clear all test data
export const clearTestData = mutation({
  handler: async (ctx) => {
    // Get all test records and delete them
    const trades = await ctx.db.query("trades").collect();
    const pnl = await ctx.db.query("realizedPnl").collect();
    const costBasis = await ctx.db.query("tokenCostBasis").collect();
    const wallets = await ctx.db.query("wallets").collect();
    const cache = await ctx.db.query("leaderboardCache").collect();

    // Delete all records
    for (const record of [...trades, ...pnl, ...costBasis, ...wallets, ...cache]) {
      await ctx.db.delete(record._id);
    }

    return "All test data cleared!";
  },
});