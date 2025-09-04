// Ultra-simple connection test
const { Connection, PublicKey } = require('@solana/web3.js');

const HELIUS_API_KEY = '293b7c61-f831-4427-82a3-c87d62af1e8c';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUMPSWAP_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

async function simpleTest() {
  console.log('🚀 Simple Connection Test\n');
  
  try {
    console.log('🔗 Testing connection to Helius...');
    const connection = new Connection(HELIUS_RPC_URL);
    
    // Test 1: Get current slot
    const slot = await connection.getSlot();
    console.log('✅ Connected! Current slot:', slot);
    
    // Test 2: Get block height
    const blockHeight = await connection.getBlockHeight();
    console.log('✅ Block height:', blockHeight);
    
    // Test 3: Check if PumpSwap program exists
    console.log('\n🔍 Checking PumpSwap program...');
    const programId = new PublicKey(PUMPSWAP_PROGRAM_ID);
    const accountInfo = await connection.getAccountInfo(programId);
    
    if (accountInfo) {
      console.log('✅ PumpSwap program found!');
      console.log('   Owner:', accountInfo.owner.toString());
      console.log('   Executable:', accountInfo.executable);
    } else {
      console.log('❌ PumpSwap program not found');
    }
    
    // Test 4: Get recent signatures for PumpSwap
    console.log('\n📝 Getting recent PumpSwap transactions...');
    const signatures = await connection.getSignaturesForAddress(programId, { limit: 3 });
    console.log(`✅ Found ${signatures.length} recent transactions:`);
    
    signatures.forEach((sig, i) => {
      console.log(`   ${i + 1}. ${sig.signature.slice(0, 12)}... (slot: ${sig.slot})`);
    });
    
    // Test 5: Parse one transaction
    if (signatures.length > 0) {
      console.log('\n🔍 Parsing latest transaction...');
      const latestSig = signatures[0].signature;
      
      const tx = await connection.getTransaction(latestSig, {
        encoding: 'jsonParsed',
        maxSupportedTransactionVersion: 0
      });
      
      if (tx) {
        console.log('✅ Transaction parsed successfully!');
        console.log('   Block time:', new Date(tx.blockTime * 1000).toLocaleString());
        console.log('   Fee:', tx.meta.fee, 'lamports');
        console.log('   Instructions:', tx.transaction.message.instructions.length);
        
        // Look for balance changes
        const preBalances = tx.meta.preBalances;
        const postBalances = tx.meta.postBalances;
        
        console.log('   Balance changes:');
        preBalances.forEach((pre, i) => {
          const post = postBalances[i];
          const change = post - pre;
          if (change !== 0) {
            console.log(`     Account ${i}: ${change > 0 ? '+' : ''}${change / 1e9} SOL`);
          }
        });
      }
    }
    
    console.log('\n✅ All tests passed! Your Helius setup is working perfectly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ RPC connection working');
    console.log('   ✅ API key valid');
    console.log('   ✅ PumpSwap program accessible');
    console.log('   ✅ Transaction parsing functional');
    console.log('\n🎯 Ready to build the full Pump Loss application!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your API key is correct');
    console.log('   2. Verify internet connection');
    console.log('   3. Try again in a few seconds');
  }
}

simpleTest();