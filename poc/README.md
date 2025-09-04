# Pump Loss - Proof of Concept

A simple proof of concept to test the core functionality of Pump Loss before building the full application.

## 🎯 What This Tests

1. **Helius Connection** - Verify your API key works
2. **Transaction Parsing** - Extract trade data from PumpSwap transactions  
3. **PNL Calculation** - Demonstrate Weighted Average Cost methodology
4. **Webhook Integration** - Test real-time data ingestion

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd poc
npm install
```

### 2. Run Basic Test
```bash
npm test
```

This will:
- ✅ Test your Helius connection
- 🔍 Find recent PumpSwap transactions
- 📊 Parse transaction data
- 💰 Simulate PNL calculations

### 3. Test Webhooks (Optional)
```bash
npm run webhook-test
```

This starts a local server to receive webhooks. You'll need to:
1. Set up a webhook in your Helius dashboard
2. Point it to `http://localhost:3001/webhook`
3. Monitor for real-time transactions

## 📋 Expected Output

### Basic Test Results
```
🚀 Pump Loss - Proof of Concept

🔗 Testing Helius connection...
✅ Connected to Solana! Current slot: 295847392
✅ Helius SDK working! Current TPS: 2847

🔍 Looking for recent PumpSwap transactions...
✅ Found 5 recent transactions

📝 Parsing transaction 1: a1b2c3d4...
✅ Trade found: {
  trader: 'Abc12345...',
  direction: 'BUY',
  tokenAmount: '1000.00',
  solAmount: '0.5420',
  token: 'Def67890...'
}

💰 Simulating PNL calculation...
📊 Processing mock trades:
  📈 BUY: 1000 tokens for 1.5 SOL
     New WAC: 0.001500 SOL per token
  📈 BUY: 500 tokens for 1.0 SOL
     New WAC: 0.001667 SOL per token  
  📉 SELL: 800 tokens for 1.8 SOL
     Cost basis: 1.3333 SOL
     PNL: +0.4667 SOL 🟢

💸 Total PNL: +0.4667 SOL
📦 Tokens remaining: 700

✅ Proof of concept complete!
```

## 🔧 What Each Test Does

### Connection Test
- Verifies your Helius API key
- Tests RPC endpoint connectivity
- Confirms SDK functionality

### Transaction Parsing
- Finds real PumpSwap transactions
- Extracts trader, amounts, and direction
- Demonstrates balance change analysis

### PNL Simulation
- Shows Weighted Average Cost calculation
- Demonstrates buy/sell processing
- Calculates realized profits/losses

### Webhook Test
- Creates local webhook server
- Processes real-time transaction data
- Shows live data ingestion flow

## 🐛 Troubleshooting

### Connection Issues
```
❌ Connection failed: Invalid API key
```
**Solution**: Check your API key in the script

### No Transactions Found
```
✅ Found 0 recent transactions
```
**Solution**: PumpSwap might be quiet. This is normal during low activity periods.

### Webhook Setup Failed
```
❌ Failed to create webhook: Rate limit exceeded
```
**Solution**: Set up the webhook manually in your Helius dashboard

## 📊 Understanding the Output

### Trade Direction
- **BUY**: User spent SOL to get tokens
- **SELL**: User sold tokens for SOL

### PNL Calculation
- **Cost Basis**: Average price paid for tokens
- **Realized PNL**: Profit/loss when selling
- **WAC**: Weighted Average Cost methodology

### Balance Changes
- **SOL Amount**: Native Solana balance change
- **Token Amount**: SPL token balance change
- **Fee**: Transaction fee (excluded from PNL in v1.0)

## 🎯 Next Steps

If the POC works successfully:

1. **✅ Connection verified** → Your Helius setup is correct
2. **✅ Parsing works** → Transaction analysis is functional  
3. **✅ PNL calculated** → Core logic is sound
4. **✅ Webhooks tested** → Real-time data flow confirmed

You're ready to build the full application with:
- Convex database for persistence
- Next.js frontend for the leaderboard
- Production webhook handling
- Real-time UI updates

## 🔍 Files Explained

- `simple-test.js` - Main POC script with all tests
- `webhook-test.js` - Local webhook server for testing
- `package.json` - Dependencies and scripts

Run these tests first to validate your setup before building the complete application!