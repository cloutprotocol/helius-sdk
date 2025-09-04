// Webhook Test - Simple HTTP server to test webhook functionality
const http = require('http');
const { Helius } = require('helius-sdk');

const HELIUS_API_KEY = '293b7c61-f831-4427-82a3-c87d62af1e8c';
const PUMPSWAP_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

const helius = new Helius(HELIUS_API_KEY);

// Simple HTTP server to receive webhooks
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const webhookData = JSON.parse(body);
        console.log('\n🎣 Webhook received!');
        console.log('📊 Data:', JSON.stringify(webhookData, null, 2));
        
        // Process the webhook data
        await processWebhookData(webhookData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.writeHead(500);
        res.end('Error processing webhook');
      }
    });
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>🎣 Pump Loss Webhook Test Server</h1>
      <p>Server is running and ready to receive webhooks!</p>
      <p>Webhook URL: <code>http://localhost:3001/webhook</code></p>
      <p>Monitoring PumpSwap program: <code>${PUMPSWAP_PROGRAM_ID}</code></p>
    `);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function processWebhookData(data) {
  console.log('🔄 Processing webhook data...');
  
  // Handle different webhook formats
  if (Array.isArray(data)) {
    for (const transaction of data) {
      await processTransaction(transaction);
    }
  } else {
    await processTransaction(data);
  }
}

async function processTransaction(transaction) {
  console.log(`📝 Processing transaction: ${transaction.signature?.slice(0, 8)}...`);
  
  // Extract basic info
  const info = {
    signature: transaction.signature,
    type: transaction.type,
    timestamp: transaction.timestamp,
    slot: transaction.slot,
  };
  
  console.log('ℹ️  Transaction info:', info);
  
  // Look for swap events
  if (transaction.events) {
    for (const event of transaction.events) {
      if (event.type === 'SWAP' || event.type === 'TRADE') {
        console.log('💱 Swap event found:', {
          type: event.type,
          source: event.source,
          tokenMint: event.tokenMint,
        });
      }
    }
  }
  
  // Mock PNL calculation
  console.log('💰 Mock PNL calculation: -1.23 SOL (LOSS)');
}

async function setupWebhook() {
  console.log('🔧 Setting up webhook...');
  
  try {
    // Note: This will create a webhook pointing to localhost
    // In production, you'd use your actual domain
    const webhook = await helius.createWebhook({
      webhookURL: 'http://localhost:3001/webhook',
      transactionTypes: ['Any'],
      accountAddresses: [PUMPSWAP_PROGRAM_ID],
      webhookType: 'enhanced',
    });
    
    console.log('✅ Webhook created:', webhook);
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create webhook:', error.message);
    
    // Show manual setup instructions
    console.log('\n📋 Manual webhook setup:');
    console.log('1. Go to https://dev.helius.xyz/dashboard');
    console.log('2. Create a new webhook with these settings:');
    console.log('   - URL: http://localhost:3001/webhook');
    console.log('   - Account: pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA');
    console.log('   - Type: Enhanced');
    console.log('   - Transaction Types: Any');
  }
}

// Start the server
const PORT = 3001;
server.listen(PORT, async () => {
  console.log('🚀 Webhook test server started!');
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🎣 Webhook endpoint: http://localhost:${PORT}/webhook`);
  
  // Try to set up the webhook automatically
  await setupWebhook();
  
  console.log('\n⏳ Waiting for webhooks...');
  console.log('💡 Tip: Make some trades on PumpSwap to see webhooks in action!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});