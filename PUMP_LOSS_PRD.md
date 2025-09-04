# Pump Loss v1.0 - Product Requirements Document

## Executive Summary

Pump Loss is a real-time web application that displays a live leaderboard of the largest realized PNL losses from trades on the PumpSwap AMM (Automated Market Maker) on Solana. The application provides transparency into memecoin trading losses, serving the crypto-native "degen" community with entertaining yet informative data about market extremes.

## 1. Product Overview

### 1.1 Core Functionality
- **Real-time leaderboard** of biggest trading losses on PumpSwap AMM
- **Live data ingestion** from Solana blockchain with <10 second latency
- **Accurate PNL calculations** using Weighted Average Cost (WAC) methodology
- **Wallet detail views** with comprehensive trading history
- **Real-time updates** via WebSocket connections

### 1.2 Target Audience
- Crypto-native traders and "degens"
- Memecoin community members
- Solana ecosystem participants
- Data-driven trading enthusiasts

### 1.3 Key Performance Indicators
- **Data Latency**: <10 seconds from blockchain to UI
- **Data Accuracy**: <0.1% discrepancy rate
- **Uptime**: >99.9% availability
- **User Engagement**: DAU and session duration metrics

## 2. Technical Architecture

### 2.1 High-Level Architecture
```
Solana Blockchain → Helius Webhooks → Processing Engine → Database → API → Frontend
                                   ↓
                              WebSocket Server ← Message Queue
```

### 2.2 Data Flow
1. **Helius Webhooks** monitor PumpSwap program transactions
2. **Processing Engine** enriches and calculates PNL
3. **Database** stores trades and aggregated data
4. **API** serves leaderboard data
5. **WebSocket** pushes real-time updates
6. **Frontend** displays live leaderboard

## 3. Core Features

### 3.1 Main Leaderboard
**Columns:**
- Rank (based on 24h PNL)
- Wallet Address (clickable)
- PNL (24h) in SOL
- All-Time Loss in SOL
- Biggest Loss Token
- Loss Trades Count (24h)
- Last Loss Timestamp

**Filtering:**
- Time windows: 24h, 7d, All-Time
- Default view: 24 hours
- Top 100 wallets displayed

### 3.2 Wallet Detail View
**URL Pattern:** `/wallet/{address}`

**Features:**
- Aggregate PNL summary (24h, 7d, All-Time)
- Loss distribution by token (pie/bar chart)
- Paginated transaction history
- All BUY/SELL trades on PumpSwap

### 3.3 Real-Time Updates
- WebSocket-based live updates
- No manual refresh required
- Instant reflection of new losses
- Optimistic UI updates

## 4. Technical Specifications

### 4.1 Data Sources
- **Primary**: Helius Webhooks for PumpSwap program
- **Program ID**: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
- **Method**: Real-time webhook notifications
- **Backup**: Periodic polling for data integrity

### 4.2 PNL Calculation Engine
- **Method**: Weighted Average Cost (WAC)
- **Trigger**: SELL transactions only
- **Formula**: `Realized PNL = SOL Received - (Tokens Sold × WAC)`
- **Scope**: Per-wallet, per-token basis
- **Currency**: SOL denomination only (v1.0)

### 4.3 Database Schema (Convex)
```typescript
// trades table
{
  _id: Id<"trades">,
  signature: string, // unique
  blockTime: number,
  traderAddress: string,
  tokenMint: string,
  direction: "BUY" | "SELL",
  tokenAmount: number,
  solAmount: number,
  _creationTime: number
}

// wallets table
{
  _id: Id<"wallets">,
  address: string, // unique
  firstSeen: number,
  lastSeen: number,
  _creationTime: number
}

// tokenCostBasis table
{
  _id: Id<"tokenCostBasis">,
  walletAddress: string,
  tokenMint: string,
  totalTokensHeld: number,
  weightedAvgCostSol: number,
  _creationTime: number
}

// realizedPnl table
{
  _id: Id<"realizedPnl">,
  tradeSignature: string,
  walletAddress: string,
  tokenMint: string,
  tokensSold: number,
  solReceived: number,
  costBasisOfSoldTokens: number,
  pnlSol: number,
  blockTime: number,
  _creationTime: number
}
```

### 4.4 API Endpoints
- `GET /api/leaderboard?period={24h|7d|all}` - Paginated leaderboard
- `GET /api/wallet/{address}/stats` - Wallet aggregate stats
- `GET /api/wallet/{address}/trades?page={n}` - Wallet trade history
- `WebSocket /ws` - Real-time updates

## 5. Technology Stack

### 5.1 Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: WebSocket client
- **Charts**: Recharts or Chart.js
- **Deployment**: Vercel

### 5.2 Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Next.js API routes
- **Database**: Convex (real-time, serverless)
- **Blockchain Data**: Helius SDK
- **WebSocket**: Socket.io or native WebSocket
- **Deployment**: Vercel (API routes)

### 5.3 Data Pipeline
- **Webhooks**: Helius Webhook service
- **Processing**: Convex functions (serverless)
- **Caching**: Convex built-in caching
- **Monitoring**: Convex dashboard + custom metrics

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Set up Convex database and schema
- Implement Helius webhook integration
- Build transaction parsing engine
- Create PNL calculation logic

### Phase 2: API & Real-time (Week 3)
- Develop REST API endpoints
- Implement WebSocket server
- Build aggregation queries
- Add real-time update system

### Phase 3: Frontend (Week 4)
- Create leaderboard UI
- Build wallet detail pages
- Implement real-time updates
- Add responsive design

### Phase 4: Polish & Deploy (Week 5)
- Performance optimization
- Error handling & monitoring
- Testing & QA
- Production deployment

## 7. Risk Mitigation

### 7.1 Data Integrity
- **Dual-path architecture**: Real-time + batch processing
- **Webhook reliability**: Retry mechanisms and dead letter queues
- **Data validation**: Cross-reference with direct RPC calls
- **Idempotent processing**: Handle duplicate transactions

### 7.2 Performance
- **Caching strategy**: Convex built-in + CDN
- **Database optimization**: Proper indexing and queries
- **Rate limiting**: Protect against abuse
- **Horizontal scaling**: Serverless auto-scaling

### 7.3 Monitoring
- **Uptime monitoring**: Health checks and alerts
- **Data latency tracking**: End-to-end timing
- **Error tracking**: Comprehensive logging
- **Performance metrics**: Response times and throughput

## 8. Success Metrics

### 8.1 Technical Metrics
- Data latency: <10 seconds (target: <5 seconds)
- API response time: <200ms (cached endpoints)
- Uptime: >99.9%
- Data accuracy: >99.9%

### 8.2 User Metrics
- Daily Active Users (DAU)
- Average session duration
- Page views per session
- Wallet detail page engagement

## 9. Future Enhancements (v1.1+)

### 9.1 Feature Additions
- **Unrealized PNL tracking** with real-time token prices
- **"Pump Gainz" leaderboard** for biggest winners
- **Advanced filtering** by token, wallet age, etc.
- **Wallet tagging & socials** integration
- **Mobile app** development

### 9.2 Technical Improvements
- **Fee inclusion** in PNL calculations
- **Multi-chain support** (other Solana AMMs)
- **Advanced analytics** and insights
- **API rate limiting** and premium tiers

## 10. Compliance & Legal

### 10.1 Data Privacy
- No personal data collection
- Public blockchain data only
- GDPR compliance for EU users
- Clear privacy policy

### 10.2 Disclaimers
- Educational/entertainment purpose
- Not financial advice
- Data accuracy disclaimers
- Risk warnings for trading

---

This PRD serves as the foundation for building Pump Loss v1.0, providing clear requirements, technical specifications, and implementation guidance for the development team.