// Simple webhook test with mock data
const testTransaction = {
  signature: "test123456789",
  timestamp: Math.floor(Date.now() / 1000),
  nativeTransfers: [
    {
      fromUserAccount: "trader123456789",
      toUserAccount: "pump456789",
      amount: 1000000000 // 1 SOL in lamports
    }
  ],
  tokenTransfers: [
    {
      fromUserAccount: "pump456789", 
      toUserAccount: "trader123456789",
      tokenAmount: 1000000,
      mint: "token123456789"
    }
  ]
};

async function testWebhook() {
  try {
    console.log("🧪 Testing webhook with mock BUY transaction...");
    
    const response = await fetch('https://helius-sdk.vercel.app/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTransaction)
    });
    
    const result = await response.json();
    console.log("✅ Response:", result);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testWebhook();