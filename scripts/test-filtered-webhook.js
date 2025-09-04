// Test webhook with 1+ SOL transaction
const testTransaction = {
  signature: "testFiltered123456789",
  timestamp: Math.floor(Date.now() / 1000),
  nativeTransfers: [
    {
      fromUserAccount: "trader123456789",
      toUserAccount: "pump456789",
      amount: 2000000000 // 2 SOL in lamports (should pass filter)
    }
  ],
  tokenTransfers: [
    {
      fromUserAccount: "pump456789", 
      toUserAccount: "trader123456789",
      tokenAmount: 1000000,
      mint: "tokenFiltered123456789"
    }
  ]
};

async function testFilteredWebhook() {
  try {
    console.log("🧪 Testing webhook with 2 SOL transaction (should pass filter)...");
    
    const response = await fetch('https://helius-sdk.vercel.app/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTransaction)
    });
    
    const result = await response.json();
    console.log("✅ Response:", result);
    
    // Test with small transaction that should be filtered out
    const smallTransaction = {
      ...testTransaction,
      signature: "testSmall123456789",
      nativeTransfers: [{
        ...testTransaction.nativeTransfers[0],
        amount: 100000000 // 0.1 SOL (should be filtered out)
      }]
    };
    
    console.log("\n🧪 Testing webhook with 0.1 SOL transaction (should be filtered out)...");
    
    const response2 = await fetch('https://helius-sdk.vercel.app/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smallTransaction)
    });
    
    const result2 = await response2.json();
    console.log("✅ Response:", result2);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testFilteredWebhook();