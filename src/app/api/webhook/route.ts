import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple rate limiting
let requestCount = 0;
let lastReset = Date.now();

export async function POST(request: NextRequest) {
  try {
    // Reset counter every minute
    const now = Date.now();
    if (now - lastReset > 60000) {
      requestCount = 0;
      lastReset = now;
    }
    
    requestCount++;
    
    // Rate limit: max 30 requests per minute
    if (requestCount > 30) {
      console.log(`🚫 Rate limited: ${requestCount} requests this minute`);
      return NextResponse.json({ 
        success: true, 
        rateLimited: true,
        processed: 0 
      });
    }
    
    const body = await request.json();
    console.log(`🎣 Webhook received: ${body.length || 1} transactions (${requestCount}/30 this minute)`);
    
    // Handle array of transactions or single transaction
    const transactions = Array.isArray(body) ? body : [body];
    
    // Filter for meaningful trades only
    const filteredTransactions = transactions.filter(tx => {
      const nativeTransfers = tx.nativeTransfers || [];
      const tokenTransfers = tx.tokenTransfers || [];
      
      // Only process transactions between 1-100 SOL (exclude dust and mega whales)
      const hasSignificantSol = nativeTransfers.some(transfer => {
        const solAmount = Math.abs(transfer.amount || 0);
        return solAmount >= 1000000000 &&    // >= 1 SOL
               solAmount <= 100000000000;    // <= 100 SOL
      });
      
      // Only process if there are both SOL and token transfers
      const hasTokenTransfer = tokenTransfers.length > 0;
      
      return hasSignificantSol && hasTokenTransfer;
    });
    
    // Sampling: only process every 10th transaction to reduce load
    const sampledTransactions = filteredTransactions.filter((_, index) => index % 10 === 0);
    
    // Further limit to prevent overload
    const maxTransactions = 3;
    const transactionsToProcess = sampledTransactions.slice(0, maxTransactions);
    
    console.log(`📊 Filtered ${transactions.length} → ${filteredTransactions.length} → ${transactionsToProcess.length} transactions`);
    
    if (filteredTransactions.length > maxTransactions) {
      console.log(`⚠️ Limiting processing to ${maxTransactions} transactions (filtered ${filteredTransactions.length})`);
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

// Global cache to prevent duplicate metadata fetches
const metadataFetchCache = new Set();

async function fetchTokenMetadata(tokenMint: string) {
  try {
    // Skip if already fetching or recently fetched
    if (metadataFetchCache.has(tokenMint)) {
      return;
    }
    
    // Check if we already have metadata for this token
    const existingMetadata = await convex.query(api.trades.getTokenMetadata, { mint: tokenMint });
    if (existingMetadata) {
      return; // Already have metadata
    }
    
    // Add to cache to prevent duplicate requests
    metadataFetchCache.add(tokenMint);
    
    // Only fetch metadata for tokens we see multiple times (reduces API calls)
    // This is a simple heuristic - you could make it more sophisticated
    
    // For now, skip metadata fetching to reduce API calls
    console.log(`⏭️ Skipping metadata fetch for ${tokenMint.slice(0, 8)} to reduce API costs`);
    
    // Remove from cache after 5 minutes
    setTimeout(() => {
      metadataFetchCache.delete(tokenMint);
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.warn(`Failed to fetch token metadata for ${tokenMint}:`, error);
    metadataFetchCache.delete(tokenMint); // Remove from cache on error
  }
}

function extractTradeFromTransfers(
  signature: string,
  blockTime: number,
  nativeTransfers: any[],
  tokenTransfers: any[]
) {
  try {
    // Look for SOL transfers (native transfers) - must be 1+ SOL
    const solTransfer = nativeTransfers.find(transfer => {
      const solAmount = Math.abs(transfer.amount || 0);
      return solAmount >= 1000000000 && solAmount <= 100000000000; // 1-100 SOL
    });
    
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
    
    // Final validation: ensure trade meets our 1-100 SOL requirement
    if (solAmount < 1 || solAmount > 100) {
      console.log(`❌ Trade ${solAmount} SOL outside 1-100 SOL range, skipping`);
      return null;
    }
    
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
    
    // More robust trade direction detection for PumpSwap
    // Look for the user wallet (not program accounts)
    const programAccounts = new Set([
      'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA', // PumpSwap program
      '11111111111111111111111111111111', // System program
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token program
    ]);
    
    // Find the user address (not a program account)
    const allAddresses = [solFromUser, solToUser, tokenFromUser, tokenToUser].filter(Boolean);
    const userAddress = allAddresses.find(addr => !programAccounts.has(addr));
    
    if (!userAddress) {
      console.log(`❌ No user address found in transfers`);
      return null;
    }
    
    traderAddress = userAddress;
    
    // Determine direction based on user's role in transfers
    const userSentSol = solFromUser === userAddress;
    const userReceivedSol = solToUser === userAddress;
    const userSentTokens = tokenFromUser === userAddress;
    const userReceivedTokens = tokenToUser === userAddress;
    
    if (userSentSol && userReceivedTokens) {
      direction = 'BUY';
      console.log(`✅ BUY: User sent SOL and received tokens`);
    } else if (userSentTokens && userReceivedSol) {
      direction = 'SELL';
      console.log(`✅ SELL: User sent tokens and received SOL`);
    } else {
      // Fallback logic
      if (userSentSol || userReceivedTokens) {
        direction = 'BUY';
        console.log(`⚠️ Fallback BUY: User involved in SOL->Token flow`);
      } else {
        direction = 'SELL';
        console.log(`⚠️ Fallback SELL: User involved in Token->SOL flow`);
      }
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
    program: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA'
  });
}