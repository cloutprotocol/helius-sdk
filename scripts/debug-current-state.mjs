import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function debugCurrentState() {
  try {
    console.log("🔍 Checking current database state...\n");
    
    const state = await convex.query(api.debug.debugDatabaseState);
    
    console.log("📊 DATABASE SUMMARY:");
    console.log(`Total Trades: ${state.totalTrades}`);
    console.log(`BUY Trades: ${state.buyTrades}`);
    console.log(`SELL Trades: ${state.sellTrades}`);
    console.log(`Token Cost Basis Records: ${state.tokenCostBasisRecords}`);
    console.log(`Realized PnL Records: ${state.realizedPnlRecords}`);
    console.log(`Token Metadata Records: ${state.tokenMetadataRecords}\n`);
    
    console.log("🔄 RECENT TRADES:");
    state.recentTrades.forEach(trade => {
      console.log(`${trade.signature}... | ${trade.direction} | ${trade.tokenAmount} tokens | ${trade.solAmount} SOL | ${trade.trader}...`);
    });
    
    console.log("\n🎯 ISSUES IDENTIFIED:");
    if (state.sellTrades === 0) {
      console.log("❌ No SELL trades detected - realizedPnl cannot be calculated");
    }
    if (state.tokenMetadataRecords === 0) {
      console.log("❌ No token metadata records - tokens won't have names/symbols");
    }
    if (state.buyTrades > 0 && state.tokenCostBasisRecords === 0) {
      console.log("❌ BUY trades exist but no cost basis records - data inconsistency");
    }
    
    // Get unique token mints
    const mints = await convex.query(api.debug.getUniqueTokenMints);
    console.log(`\n🪙 UNIQUE TOKENS: ${mints.length}`);
    mints.slice(0, 5).forEach(mint => {
      console.log(`${mint.mint.slice(0, 8)}... (${mint.tradeCount} trades)`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugCurrentState();