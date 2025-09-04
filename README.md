# Pump Loss - Live PumpSwap Trading Loss Leaderboard

A real-time web application that displays the biggest trading losses on PumpSwap AMM (Solana). Built with Next.js, Convex, and Helius SDK.

## 🚀 Features

- **Real-time leaderboard** of biggest trading losses
- **Live data ingestion** from Solana blockchain via Helius webhooks
- **Accurate PNL calculations** using Weighted Average Cost methodology
- **Wallet detail views** with comprehensive trading history
- **Multiple time periods**: 24h, 7d, All-time
- **Responsive design** optimized for all devices

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless database with real-time subscriptions)
- **Blockchain**: Helius SDK, Solana Web3.js
- **Deployment**: Vercel + Convex Cloud

## 📋 Prerequisites

- Node.js 18+
- Helius API key (get one at [helius.xyz](https://helius.xyz))
- Convex account (sign up at [convex.dev](https://convex.dev))

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd pump-loss
npm install
```

### 2. Set up Convex

```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex project
npx convex dev
```

This will:
- Create a new Convex deployment
- Generate the `convex/_generated` folder
- Set up your `.env.local` with Convex URLs

### 3. Configure Environment Variables

Update your `.env.local` file:

```env
# Helius Configuration (already set)
HELIUS_API_KEY=293b7c61-f831-4427-82a3-c87d62af1e8c
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=293b7c61-f831-4427-82a3-c87d62af1e8c

# Convex Configuration (set by convex dev)
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# PumpSwap Configuration
PUMPSWAP_PROGRAM_ID=pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret-here
```

### 4. Set up Helius Webhook

Create a webhook to monitor PumpSwap transactions:

```bash
# Run this script to set up the webhook
node scripts/setup-webhook.js
```

Or manually create via Helius dashboard:
- **Webhook URL**: `https://your-domain.vercel.app/api/webhook`
- **Account Addresses**: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
- **Transaction Types**: `Any`
- **Webhook Type**: `Enhanced`

### 5. Start Development

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Next.js frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📊 How It Works

### Data Flow

1. **Helius Webhooks** → Monitor PumpSwap program transactions
2. **Webhook Handler** → Parse and validate incoming transactions
3. **Convex Functions** → Process trades and calculate PNL
4. **Real-time Updates** → Push changes to connected clients
5. **Frontend** → Display live leaderboard

### PNL Calculation

- Uses **Weighted Average Cost (WAC)** methodology
- Triggered only on **SELL** transactions
- Formula: `Realized PNL = SOL Received - (Tokens Sold × WAC)`
- Tracks cost basis per wallet per token

## 🚀 Deployment

### Deploy to Vercel

```bash
# Deploy Convex functions
npx convex deploy --prod

# Deploy frontend to Vercel
vercel deploy --prod
```

### Update Webhook URL

After deployment, update your Helius webhook URL to point to your production domain:
`https://your-domain.vercel.app/api/webhook`

## 📁 Project Structure

```
pump-loss/
├── convex/                 # Convex backend functions
│   ├── schema.ts          # Database schema
│   ├── trades.ts          # Trade processing logic
│   └── leaderboard.ts     # Leaderboard queries
├── lib/                   # Utility libraries
│   └── helius.ts         # Helius SDK integration
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/webhook/  # Webhook endpoint
│   │   └── page.tsx      # Main leaderboard page
│   └── components/       # React components
├── .env.local            # Environment variables
└── package.json
```

## 🔧 Key Components

### Convex Schema
- `trades`: All PumpSwap transactions
- `wallets`: Wallet metadata
- `tokenCostBasis`: Cost basis tracking
- `realizedPnl`: PNL calculation results
- `leaderboardCache`: Performance optimization

### API Endpoints
- `POST /api/webhook`: Helius webhook handler
- Convex queries: Real-time leaderboard data

## 📈 Performance Optimizations

- **Caching**: Leaderboard results cached for 5 minutes
- **Indexing**: Optimized database indexes for fast queries
- **Real-time**: Convex subscriptions for instant updates
- **Serverless**: Auto-scaling with Convex and Vercel

## 🛡️ Security & Reliability

- **Webhook verification**: Validates Helius signatures
- **Idempotent processing**: Handles duplicate transactions
- **Error handling**: Comprehensive error recovery
- **Rate limiting**: Protects against abuse

## 🔍 Monitoring

- **Convex Dashboard**: Real-time function metrics
- **Vercel Analytics**: Frontend performance
- **Custom logging**: Transaction processing status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimers

- For entertainment and educational purposes only
- Not financial advice
- Data accuracy not guaranteed
- Use at your own risk

---

Built with ❤️ for the Solana degen community