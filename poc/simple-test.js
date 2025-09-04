// Simple Proof of Concept for Pump Loss
// Tests Helius connection and basic transaction parsing

const { Helius } = require('helius-sdk');
const { Connection, PublicKey } = require('@solana/web3.js');

// Your Helius configuration
const HELIUS_API_KEY = '293b7c61-f831-4427-82a3-c87d62af1e8c';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUMPSWAP_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

// Initialize clients
const helius = new Helius(HELIUS_API_KEY, 'mainnet-beta');
const connection = new Connection(HELIUS_RPC_URL);

async function testConnection() {
  console.log('🔗 Testing Helius connection...');
  
  try {
    // Test basic RPC connection
    const slot = await connection.getSlot();
    console.log('✅ Connected to Solana! Current slot:', slot);
    
    // Test Helius SDK with a simple RPC call
    const blockHeight = await connection.getBlockHeight();
    console.log('✅ Helius RPC working! Block height:', blockHeight);
    
    // Test if we can get account info (validates API key)
    const balance = await connection.getBalance(new PublicKey('11111111111111111111111111111112'));
    console.log('✅ API key valid! System program balance:', balance);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function findPumpSwapTransactions() {
  console.log('\n🔍 Looking for recent PumpSwap transactions...');
  
  try {
    // Get recent signatures for the PumpSwap program
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(PUMPSWAP_PROGRAM_ID),
      { limit: 5 }
    );
    
    console.log(`✅ Found ${signatures.length} recent transactions`);
    
    // Parse the first few transactions
    for (let i = 0; i < Math.min(3, signatures.length); i++) {
      const sig = signatures[i];
      console.log(`\n📝 Parsing transaction ${i + 1}: ${sig.signature.slice(0, 8)}...`);
      
      const tradeData = await parseTransaction(sig.signature);
      if (tradeData) {
        console.log('✅ Trade found:', {
          trader: `${tradeData.traderAddress.slice(0, 8)}...`,
          direction: tradeData.direction,
          tokenAmount: tradeData.tokenAmount.toFixed(2),
          solAmount: tradeData.solAmount.toFixed(4),
          token: `${tradeData.tokenMint.slice(0, 8)}...`
        });
      } else {
        console.log('⚠️  No trade data extracted');
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding transactions:', error.message);
  }
}

async function parseTransaction(signature) {
  try {
    const transaction = await connection.getTransaction(signature, {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction || !transaction.meta) {
      return null;
    }

    // Check if this involves PumpSwap
    const isPumpSwapTx = transaction.transaction.message.instructions.some(
      (instruction) => instruction.programId === PUMPSWAP_PROGRAM_ID
    );

    if (!isPumpSwapTx) {
      return null;
    }

    // Get the trader (first signer)
    const traderAddress = transaction.transaction.message.accountKeys[0]?.pubkey?.toString();
    if (!traderAddress) return null;

    // Analyze balance changes
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const preTokenBalances = transaction.meta.preTokenBalances || [];
    const postTokenBalances = transaction.meta.postTokenBalances || [];

    // Find trader's account index
    const traderIndex = transaction.transaction.message.accountKeys.findIndex(
      (key) => key.pubkey === traderAddress
    );

    if (traderIndex === -1) return null;

    // Calculate SOL balance change
    const solBalanceChange = postBalances[traderIndex] - preBalances[traderIndex];
    const fee = transaction.meta.fee;
    const netSolChange = solBalanceChange + fee;

    // Find token balance changes
    let tokenMint = '';
    let tokenBalanceChange = 0;

    for (const postBalance of postTokenBalances) {
      if (postBalance.owner === traderAddress) {
        const preBalance = preTokenBalances.find(
          (pre) => pre.mint === postBalance.mint && pre.owner === traderAddress
        );
        
        const preAmount = preBalance ? preBalance.uiTokenAmount.uiAmount || 0 : 0;
        const postAmount = postBalance.uiTokenAmount.uiAmount || 0;
        const change = postAmount - preAmount;

        if (Math.abs(change) > 0) {
          tokenMint = postBalance.mint;
          tokenBalanceChange = change;
          break;
        }
      }
    }

    if (!tokenMint || tokenBalanceChange === 0) {
      return null;
    }

    // Determine trade direction
    const direction = tokenBalanceChange > 0 ? 'BUY' : 'SELL';
    const tokenAmount = Math.abs(tokenBalanceChange);
    const solAmount = Math.abs(netSolChange) / 1e9; // Convert lamports to SOL

    return {
      signature,
      blockTime: transaction.blockTime || 0,
      traderAddress,
      tokenMint,
      direction,
      tokenAmount,
      solAmount,
    };
  } catch (error) {
    console.error('Error parsing transaction:', error.message);
    return null;
  }
}

async function simulatePNLCalculation() {
  console.log('\n💰 Simulating PNL calculation...');
  
  // Mock data for demonstration
  const mockTrades = [
    { direction: 'BUY', tokenAmount: 1000, solAmount: 1.5, timestamp: Date.now() - 3600000 },
    { direction: 'BUY', tokenAmount: 500, solAmount: 1.0, timestamp: Date.now() - 1800000 },
    { direction: 'SELL', tokenAmount: 800, solAmount: 1.8, timestamp: Date.now() - 900000 },
  ];
  
  let totalTokensHeld = 0;
  let weightedAvgCost = 0;
  let totalPnl = 0;
  
  console.log('📊 Processing mock trades:');
  
  for (const trade of mockTrades) {
    if (trade.direction === 'BUY') {
      // Update weighted average cost
      const totalCost = (totalTokensHeld * weightedAvgCost) + trade.solAmount;
      totalTokensHeld += trade.tokenAmount;
      weightedAvgCost = totalCost / totalTokensHeld;
      
      console.log(`  📈 BUY: ${trade.tokenAmount} tokens for ${trade.solAmount} SOL`);
      console.log(`     New WAC: ${weightedAvgCost.toFixed(6)} SOL per token`);
    } else {
      // Calculate PNL for SELL
      const costBasis = trade.tokenAmount * weightedAvgCost;
      const pnl = trade.solAmount - costBasis;
      totalPnl += pnl;
      totalTokensHeld -= trade.tokenAmount;
      
      console.log(`  📉 SELL: ${trade.tokenAmount} tokens for ${trade.solAmount} SOL`);
      console.log(`     Cost basis: ${costBasis.toFixed(4)} SOL`);
      console.log(`     PNL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(4)} SOL ${pnl > 0 ? '🟢' : '🔴'}`);
    }
  }
  
  console.log(`\n💸 Total PNL: ${totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(4)} SOL`);
  console.log(`📦 Tokens remaining: ${totalTokensHeld}`);
}

async function main() {
  console.log('🚀 Pump Loss - Proof of Concept\n');
  
  // Test 1: Connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without connection');
    return;
  }
  
  // Test 2: Find real transactions
  await findPumpSwapTransactions();
  
  // Test 3: PNL calculation demo
  await simulatePNLCalculation();
  
  console.log('\n✅ Proof of concept complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Set up Convex database');
  console.log('  2. Create webhook endpoint');
  console.log('  3. Build frontend leaderboard');
  console.log('  4. Deploy to production');
}

// Run the proof of concept
main().catch(console.error);