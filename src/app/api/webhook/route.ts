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
    
    // Fetch and store token metadata (async, don't block trade processing)
    fetchTokenMetadata(tradeData.tokenMint).catch(error => {
      console.warn(`Failed to fetch metadata for ${tradeData.tokenMint}:`, error);
    });
    
    console.log(`✅ Trade stored: ${signature.slice(0, 8)}...`);
  } else {
    console.log(`⚪ No trade data found in: ${signature.slice(0, 8)}...`);
  }
}

async function fetchTokenMetadata(tokenMint: string) {
  try {
    // Check if we already have metadata for this token
    const existingMetadata = await convex.query(api.trades.getTokenMetadata, { mint: tokenMint });
    if (existingMetadata) {
      return; // Already have metadata
    }
    
    // Fetch from Helius
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [tokenMint],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }
    
    const data = await response.json();
    const metadata = data[0]; // First result
    
    if (metadata && metadata.account) {
      // Store metadata in Convex
      await convex.mutation(api.trades.addTokenMetadata, {
        mint: tokenMint,
        symbol: metadata.onChainMetadata?.metadata?.symbol || undefined,
        name: metadata.onChainMetadata?.metadata?.name || undefined,
        decimals: metadata.onChainMetadata?.metadata?.decimals || undefined,
      });
      
      console.log(`📝 Stored metadata for ${metadata.onChainMetadata?.metadata?.symbol || tokenMint.slice(0, 8)}`);
    }
  } catch (error) {
    console.warn(`Failed to fetch token metadata for ${tokenMint}:`, error);
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
    
    const solAmount = Math.abs(solTransfer.amount) / 1e9; // Convert lamports to SOL
    const tokenAmount = tokenTransfer.tokenAmount;
    const tokenMint = tokenTransfer.mint;
    
    // Improved trade direction detection
    let traderAddress: string;
    let direction: 'BUY' | 'SELL';
    
    // Check if the same address appears in both transfers
    const solFromUser = solTransfer.fromUserAccount;
    const solToUser = solTransfer.toUserAccount;
    const tokenFromUser = tokenTransfer.fromUserAccount;
    const tokenToUser = tokenTransfer.toUserAccount;
    
    console.log(`🔍 Transfer analysis for ${signature.slice(0, 8)}:`);
    console.log(`  SOL: ${solFromUser?.slice(0, 8)} -> ${solToUser?.slice(0, 8)} (${solAmount} SOL)`);
    console.log(`  Token: ${tokenFromUser?.slice(0, 8)} -> ${tokenToUser?.slice(0, 8)} (${tokenAmount} tokens)`);
    
    // BUY: User sends SOL, receives tokens
    if (solFromUser && tokenToUser && solFromUser === tokenToUser) {
      traderAddress = solFromUser;
      direction = 'BUY';
    }
    // SELL: User sends tokens, receives SOL  
    else if (tokenFromUser && solToUser && tokenFromUser === solToUser) {
      traderAddress = tokenFromUser;
      direction = 'SELL';
    }
    // Fallback: Use the most common address
    else {
      const addresses = [solFromUser, solToUser, tokenFromUser, tokenToUser].filter(Boolean);
      traderAddress = addresses[0]; // Take first non-null address
      
      // Guess direction based on who's sending SOL vs tokens
      if (solFromUser && tokenToUser) {
        direction = 'BUY'; // Someone sent SOL, someone received tokens
      } else {
        direction = 'SELL'; // Default to SELL if unclear
      }
      
      console.log(`⚠️  Unclear trade direction, using fallback: ${direction}`);
    }
    
    if (!traderAddress) {
      console.log(`❌ No trader address found`);
      return null;
    }
    
    console.log(`✅ Detected ${direction} trade by ${traderAddress.slice(0, 8)}`);
    
    return {
      signature,
      blockTime,
      traderAddress,
      tokenMint,
      direction,
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
    program: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
  });
}