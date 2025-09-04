import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎣 Webhook received:', body.length || 1, 'transactions');
    
    // Handle array of transactions or single transaction
    const transactions = Array.isArray(body) ? body : [body];
    
    // MVP: Limit processing to prevent excessive load
    const maxTransactions = 10;
    const transactionsToProcess = transactions.slice(0, maxTransactions);
    
    if (transactions.length > maxTransactions) {
      console.log(`⚠️ Limiting processing to ${maxTransactions} transactions (received ${transactions.length})`);
    }
    
    let processed = 0;
    let errors = 0;
    
    for (const transaction of transactionsToProcess) {
      try {
        await processTransaction(transaction);
        processed++;
      } catch (error) {
        console.error('Error processing transaction:', error);
        errors++;
      }
    }
    
    console.log(`✅ Processed ${processed} transactions, ${errors} errors`);
    return NextResponse.json({ 
      success: true, 
      processed, 
      errors 
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function processTransaction(transaction: any) {
  // Extract basic transaction info
  const signature = transaction.signature;
  const blockTime = transaction.timestamp || transaction.blockTime || Math.floor(Date.now() / 1000);
  
  if (!signature) {
    console.warn('⚠️  No signature found in transaction');
    return;
  }
  
  console.log(`🔍 Processing transaction: ${signature.slice(0, 8)}...`);
  
  // Look for account changes that indicate trades
  const accountData = transaction.accountData || [];
  const nativeTransfers = transaction.nativeTransfers || [];
  const tokenTransfers = transaction.tokenTransfers || [];
  
  // Try to extract trade data from transfers
  const tradeData = extractTradeFromTransfers(
    signature,
    blockTime,
    nativeTransfers,
    tokenTransfers
  );
  
  if (tradeData) {
    console.log(`💱 Trade detected: ${tradeData.direction} ${tradeData.tokenAmount} tokens for ${tradeData.solAmount} SOL`);
    
    // Store the trade in Convex (single efficient mutation)
    await convex.mutation(api.trades.processTrade, tradeData);
    console.log(`✅ Trade stored: ${signature.slice(0, 8)}...`);
  } else {
    console.log(`⚪ No trade data found in: ${signature.slice(0, 8)}...`);
  }
}

function extractTradeFromTransfers(
  signature: string,
  blockTime: number,
  nativeTransfers: any[],
  tokenTransfers: any[]
) {
  try {
    // Look for SOL transfers (native transfers)
    const solTransfer = nativeTransfers.find(transfer => 
      transfer.amount && Math.abs(transfer.amount) > 1000000 // > 0.001 SOL
    );
    
    // Look for token transfers
    const tokenTransfer = tokenTransfers.find(transfer =>
      transfer.tokenAmount && transfer.tokenAmount > 0
    );
    
    if (!solTransfer || !tokenTransfer) {
      return null;
    }
    
    // Determine trader address (usually the 'from' address in transfers)
    const traderAddress = solTransfer.fromUserAccount || tokenTransfer.fromUserAccount;
    
    if (!traderAddress) {
      return null;
    }
    
    // Determine trade direction based on transfer direction
    const solAmount = Math.abs(solTransfer.amount) / 1e9; // Convert lamports to SOL
    const tokenAmount = tokenTransfer.tokenAmount;
    const tokenMint = tokenTransfer.mint;
    
    // If user is sending SOL and receiving tokens = BUY
    // If user is sending tokens and receiving SOL = SELL
    const direction = solTransfer.fromUserAccount === traderAddress ? 'BUY' : 'SELL';
    
    return {
      signature,
      blockTime,
      traderAddress,
      tokenMint,
      direction: direction as 'BUY' | 'SELL',
      tokenAmount,
      solAmount,
    };
    
  } catch (error) {
    console.error('Error extracting trade from transfers:', error);
    return null;
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ 
    status: 'Pump Loss webhook endpoint active',
    timestamp: new Date().toISOString(),
    program: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA'
  });
}