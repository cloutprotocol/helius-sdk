// Live PumpSwap Transaction Monitor
// Tests real-time processing and scalability

const { Connection, PublicKey } = require('@solana/web3.js');

const HELIUS_API_KEY = '293b7c61-f831-4427-82a3-c87d62af1e8c';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUMPSWAP_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

class LiveMonitor {
  constructor() {
    this.connection = new Connection(HELIUS_RPC_URL);
    this.programId = new PublicKey(PUMPSWAP_PROGRAM_ID);
    this.isRunning = false;
    this.stats = {
      totalTransactions: 0,
      successfulParses: 0,
      errors: 0,
      startTime: Date.now(),
      lastSignatures: new Set(),
      processingTimes: [],
      uniqueTraders: new Set(),
      totalVolume: 0,
      losses: [],
      gains: []
    };
  }

  async start() {
    console.log('🚀 Starting Live PumpSwap Monitor');
    console.log('📊 Monitoring for scalability and real-time performance\n');
    
    this.isRunning = true;
    this.printHeader();
    
    // Start monitoring loop
    while (this.isRunning) {
      await this.checkForNewTransactions();
      await this.sleep(2000); // Check every 2 seconds
    }
  }

  async checkForNewTransactions() {
    const startTime = Date.now();
    
    try {
      // Get recent signatures
      const signatures = await this.connection.getSignaturesForAddress(
        this.programId, 
        { limit: 20 } // Increased limit to catch more activity
      );

      let newTransactions = 0;
      
      for (const sig of signatures) {
        if (!this.stats.lastSignatures.has(sig.signature)) {
          this.stats.lastSignatures.add(sig.signature);
          newTransactions++;
          
          // Process transaction in background (non-blocking)
          this.processTransaction(sig.signature).catch(err => {
            this.stats.errors++;
          });
        }
      }

      // Clean old signatures to prevent memory leak
      if (this.stats.lastSignatures.size > 1000) {
        const sigArray = Array.from(this.stats.lastSignatures);
        this.stats.lastSignatures = new Set(sigArray.slice(-500));
      }

      const processingTime = Date.now() - startTime;
      this.stats.processingTimes.push(processingTime);
      
      if (newTransactions > 0) {
        console.log(`🔄 Found ${newTransactions} new transactions (${processingTime}ms)`);
      }

    } catch (error) {
      this.stats.errors++;
      console.log(`❌ Error checking transactions: ${error.message}`);
    }
  }

  async processTransaction(signature) {
    const startTime = Date.now();
    
    try {
      this.stats.totalTransactions++;
      
      const tx = await this.connection.getTransaction(signature, {
        encoding: 'jsonParsed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta) {
        return;
      }

      // Extract basic trade info
      const tradeData = this.extractTradeData(tx);
      
      if (tradeData) {
        this.stats.successfulParses++;
        this.stats.uniqueTraders.add(tradeData.trader);
        this.stats.totalVolume += tradeData.solAmount;
        
        // Simulate PNL calculation
        const mockPnl = this.simulatePNL(tradeData);
        
        if (mockPnl < 0) {
          this.stats.losses.push({
            trader: tradeData.trader,
            amount: Math.abs(mockPnl),
            signature: signature.slice(0, 8)
          });
        } else if (mockPnl > 0) {
          this.stats.gains.push({
            trader: tradeData.trader,
            amount: mockPnl,
            signature: signature.slice(0, 8)
          });
        }

        const processingTime = Date.now() - startTime;
        
        console.log(`💱 ${tradeData.direction} | ${tradeData.trader.slice(0, 8)}... | ${tradeData.solAmount.toFixed(4)} SOL | PNL: ${mockPnl > 0 ? '+' : ''}${mockPnl.toFixed(4)} ${mockPnl < 0 ? '🔴' : mockPnl > 0 ? '🟢' : '⚪'} | ${processingTime}ms`);
      }

    } catch (error) {
      this.stats.errors++;
    }
  }

  extractTradeData(tx) {
    try {
      // Get trader (first signer)
      const trader = tx.transaction.message.accountKeys[0]?.pubkey?.toString();
      if (!trader) return null;

      // Analyze balance changes
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      // Find trader's account index
      const traderIndex = tx.transaction.message.accountKeys.findIndex(
        key => key.pubkey === trader
      );

      if (traderIndex === -1) return null;

      // Calculate SOL change
      const solChange = postBalances[traderIndex] - preBalances[traderIndex];
      const fee = tx.meta.fee;
      const netSolChange = solChange + fee;

      // Find token changes
      let tokenChange = 0;
      let tokenMint = '';

      for (const postBalance of postTokenBalances) {
        if (postBalance.owner === trader) {
          const preBalance = preTokenBalances.find(
            pre => pre.mint === postBalance.mint && pre.owner === trader
          );
          
          const preAmount = preBalance ? preBalance.uiTokenAmount.uiAmount || 0 : 0;
          const postAmount = postBalance.uiTokenAmount.uiAmount || 0;
          const change = postAmount - preAmount;

          if (Math.abs(change) > 0) {
            tokenChange = change;
            tokenMint = postBalance.mint;
            break;
          }
        }
      }

      if (tokenChange === 0) return null;

      return {
        trader,
        direction: tokenChange > 0 ? 'BUY' : 'SELL',
        tokenAmount: Math.abs(tokenChange),
        solAmount: Math.abs(netSolChange) / 1e9,
        tokenMint,
        blockTime: tx.blockTime
      };

    } catch (error) {
      return null;
    }
  }

  simulatePNL(tradeData) {
    // Mock PNL calculation for demo
    // In reality, this would use stored cost basis
    const randomFactor = (Math.random() - 0.5) * 0.4; // ±20% variation
    const basePnl = tradeData.solAmount * randomFactor;
    
    // Bias towards losses for demo (60% chance of loss)
    return Math.random() < 0.6 ? -Math.abs(basePnl) : Math.abs(basePnl);
  }

  printHeader() {
    console.log('📊 Live Transaction Feed:');
    console.log('   Format: TYPE | TRADER | SOL_AMOUNT | PNL | PROCESSING_TIME');
    console.log('   🔴 = Loss, 🟢 = Gain, ⚪ = Break-even\n');
  }

  printStats() {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const tps = this.stats.totalTransactions / runtime;
    const avgProcessingTime = this.stats.processingTimes.length > 0 
      ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length 
      : 0;

    console.log('\n📈 Performance Statistics:');
    console.log(`   ⏱️  Runtime: ${runtime.toFixed(1)}s`);
    console.log(`   📊 Total transactions: ${this.stats.totalTransactions}`);
    console.log(`   ✅ Successful parses: ${this.stats.successfulParses}`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    console.log(`   🚀 Processing rate: ${tps.toFixed(2)} tx/sec`);
    console.log(`   ⚡ Avg processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`   👥 Unique traders: ${this.stats.uniqueTraders.size}`);
    console.log(`   💰 Total volume: ${this.stats.totalVolume.toFixed(2)} SOL`);
    
    // Top losses
    const topLosses = this.stats.losses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    if (topLosses.length > 0) {
      console.log('\n🔴 Biggest Losses:');
      topLosses.forEach((loss, i) => {
        console.log(`   ${i + 1}. ${loss.trader.slice(0, 8)}... -${loss.amount.toFixed(4)} SOL (${loss.signature}...)`);
      });
    }

    // Performance assessment
    console.log('\n🎯 Scalability Assessment:');
    if (tps > 10) {
      console.log('   ✅ HIGH THROUGHPUT: Can handle 100s of transactions');
    } else if (tps > 1) {
      console.log('   ✅ GOOD THROUGHPUT: Can handle current load');
    } else {
      console.log('   ⚠️  LOW THROUGHPUT: May need optimization');
    }

    if (avgProcessingTime < 100) {
      console.log('   ✅ FAST PROCESSING: Sub-100ms average');
    } else if (avgProcessingTime < 500) {
      console.log('   ✅ ACCEPTABLE PROCESSING: Sub-500ms average');
    } else {
      console.log('   ⚠️  SLOW PROCESSING: May cause delays');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 Stopping monitor...');
    this.printStats();
  }
}

// Start the monitor
const monitor = new LiveMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
  setTimeout(() => process.exit(0), 1000);
});

// Auto-stop after 60 seconds for demo
setTimeout(() => {
  monitor.stop();
  setTimeout(() => process.exit(0), 1000);
}, 60000);

monitor.start().catch(console.error);