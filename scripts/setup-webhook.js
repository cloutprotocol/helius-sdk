#!/usr/bin/env node

/**
 * Setup Helius Webhook for PumpLoss
 * This script creates a webhook to monitor PumpSwap transactions
 */

const { Helius, TransactionType, WebhookType } = require('helius-sdk');

async function setupWebhook() {
  const helius = new Helius(process.env.HELIUS_API_KEY);
  
  const webhookUrl = 'https://helius-sdk.vercel.app/api/webhook';
  const pumpSwapProgramId = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';
  
  try {
    console.log('🔗 Creating Helius webhook...');
    console.log('Webhook URL:', webhookUrl);
    console.log('Program ID:', pumpSwapProgramId);
    
    const webhook = await helius.createWebhook({
      webhookURL: webhookUrl,
      transactionTypes: [TransactionType.ANY],
      accountAddresses: [pumpSwapProgramId],
      webhookType: WebhookType.ENHANCED,
    });
    
    console.log('✅ Webhook created successfully!');
    console.log('Webhook ID:', webhook.webhookID);
    console.log('Webhook URL:', webhook.webhookURL);
    console.log('Account Addresses:', webhook.accountAddresses);
    
    return webhook;
  } catch (error) {
    console.error('❌ Error creating webhook:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupWebhook()
    .then(() => {
      console.log('🎉 Webhook setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupWebhook };