import { Helius } from 'helius-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Helius client
export const helius = new Helius(process.env.HELIUS_API_KEY!);

// Create connection using your RPC endpoint
export const connection = new Connection(process.env.HELIUS_RPC_URL!);

// PumpSwap Program ID
export const PUMPSWAP_PROGRAM_ID = new PublicKey(process.env.PUMPSWAP_PROGRAM_ID!);

// Types for our application
export interface PumpSwapTransaction {
  signature: string;
  blockTime: number;
  slot: number;
  trader: string;
  tokenMint: string;
  direction: 'BUY' | 'SELL';
  tokenAmount: number;
  solAmount: number;
  fee: number;
}

export interface TradeData {
  signature: string;
  blockTime: number;
  traderAddress: string;
  tokenMint: string;
  direction: 'BUY' | 'SELL';
  tokenAmount: number;
  solAmount: number;
}

/**
 * Parse a Solana transaction to extract PumpSwap trade data
 */
export async function parseTransaction(signature: string): Promise<TradeData | null> {
  try {
    const transaction = await connection.getTransaction(signature, {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction || !transaction.meta) {
      return null;
    }

    // Check if this transaction involves the PumpSwap program
    const isPumpSwapTx = transaction.transaction.message.instructions.some(
      (instruction: any) => 
        instruction.programId === PUMPSWAP_PROGRAM_ID.toString()
    );

    if (!isPumpSwapTx) {
      return null;
    }

    // Extract trader (first signer)
    const traderAddress = transaction.transaction.message.accountKeys[0]?.pubkey?.toString();
    if (!traderAddress) {
      return null;
    }

    // Analyze balance changes to determine trade details
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const preTokenBalances = transaction.meta.preTokenBalances || [];
    const postTokenBalances = transaction.meta.postTokenBalances || [];

    // Find SOL balance change for the trader
    const traderIndex = transaction.transaction.message.accountKeys.findIndex(
      (key: any) => key.pubkey === traderAddress
    );

    if (traderIndex === -1) {
      return null;
    }

    const solBalanceChange = postBalances[traderIndex] - preBalances[traderIndex];
    const fee = transaction.meta.fee;
    const netSolChange = solBalanceChange + fee; // Add back the fee

    // Find token balance changes
    let tokenMint = '';
    let tokenBalanceChange = 0;

    // Compare pre and post token balances
    for (const postBalance of postTokenBalances) {
      if (postBalance.owner === traderAddress) {
        const preBalance = preTokenBalances.find(
          (pre) => pre.mint === postBalance.mint && pre.owner === traderAddress
        );
        
        const preAmount = preBalance ? preBalance.uiTokenAmount.uiAmount || 0 : 0;
        const postAmount = postBalance.uiTokenAmount.uiAmount || 0;
        const change = postAmount - preAmount;

        if (Math.abs(change) > 0) {
          tokenMint = postBalance.mint;
          tokenBalanceChange = change;
          break;
        }
      }
    }

    if (!tokenMint || tokenBalanceChange === 0) {
      return null;
    }

    // Determine trade direction and amounts
    const direction: 'BUY' | 'SELL' = tokenBalanceChange > 0 ? 'BUY' : 'SELL';
    const tokenAmount = Math.abs(tokenBalanceChange);
    const solAmount = Math.abs(netSolChange) / 1e9; // Convert lamports to SOL

    return {
      signature,
      blockTime: transaction.blockTime || 0,
      traderAddress,
      tokenMint,
      direction,
      tokenAmount,
      solAmount,
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return null;
  }
}

/**
 * Set up webhook to monitor PumpSwap transactions
 */
export async function setupPumpSwapWebhook(webhookUrl: string) {
  try {
    const webhook = await helius.createWebhook({
      webhookURL: webhookUrl,
      transactionTypes: ['Any'], // Monitor all transaction types
      accountAddresses: [PUMPSWAP_PROGRAM_ID.toString()],
      webhookType: 'enhanced',
    });

    console.log('Webhook created:', webhook);
    return webhook;
  } catch (error) {
    console.error('Error creating webhook:', error);
    throw error;
  }
}

/**
 * Get historical transactions for a wallet
 */
export async function getWalletHistory(walletAddress: string, limit = 100) {
  try {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(walletAddress),
      { limit }
    );

    const trades: TradeData[] = [];
    
    for (const sig of signatures) {
      const trade = await parseTransaction(sig.signature);
      if (trade) {
        trades.push(trade);
      }
    }

    return trades;
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    return [];
  }
}