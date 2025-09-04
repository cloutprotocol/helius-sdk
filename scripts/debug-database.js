const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function debugDatabase() {
  try {
    console.log("🔍 Debugging database contents...\n");
    
    const debug = await convex.query(api.debug.debugTrades);
    
    console.log("📊 Trade Summary:");
    console.log(`   Total trades: ${debug.summary.totalTrades}`);
    console.log(`   BUY trades: ${debug.summary.buyTrades}`);
    console.log(`   SELL trades: ${debug.summary.sellTrades}`);
    console.log(`   Cost basis records: ${debug.costBasisCount}`);
    console.log(`   PNL records: ${debug.pnlCount}\n`);
    
    console.log("📝 Recent Trades:");
    debug.recentTrades.forEach((trade, i) => {
      console.log(`   ${i + 1}. ${trade.signature}... - ${trade.direction}`);
      console.log(`      Trader: ${trade.trader}...`);
      console.log(`      Amount: ${trade.tokenAmount} tokens for ${trade.solAmount} SOL`);
      console.log(`      Time: ${trade.blockTime}\n`);
    });
    
    if (debug.summary.sellTrades === 0) {
      console.log("🎯 ISSUE FOUND: No SELL trades detected!");
      console.log("   This means either:");
      console.log("   1. All real trades are BUY trades (people only buying)");
      console.log("   2. SELL detection logic needs fixing");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugDatabase();