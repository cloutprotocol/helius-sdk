"use client";

import { useState } from 'react';

export default function WebhookTestPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    if (!webhookUrl) {
      setTestResult('Please enter a webhook URL');
      return;
    }

    setLoading(true);
    setTestResult('Testing webhook...');

    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
      });

      const data = await response.text();
      
      if (response.ok) {
        setTestResult(`✅ Webhook is accessible!\n\nResponse: ${data}`);
      } else {
        setTestResult(`❌ Webhook returned error: ${response.status}\n\nResponse: ${data}`);
      }
    } catch (error) {
      setTestResult(`❌ Failed to reach webhook: ${error}`);
    }

    setLoading(false);
  };

  const sendTestTransaction = async () => {
    if (!webhookUrl) {
      setTestResult('Please enter a webhook URL');
      return;
    }

    setLoading(true);
    setTestResult('Sending test transaction...');

    const testTransaction = {
      signature: "test_webhook_" + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      nativeTransfers: [{
        fromUserAccount: "test_trader_address_12345",
        toUserAccount: "pumpswap_program_address",
        amount: 1500000000 // 1.5 SOL in lamports
      }],
      tokenTransfers: [{
        fromUserAccount: "pumpswap_program_address", 
        toUserAccount: "test_trader_address_12345",
        mint: "test_token_mint_67890",
        tokenAmount: 1000
      }]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([testTransaction])
      });

      const data = await response.text();
      
      if (response.ok) {
        setTestResult(`✅ Test transaction sent successfully!\n\nResponse: ${data}`);
      } else {
        setTestResult(`❌ Test transaction failed: ${response.status}\n\nResponse: ${data}`);
      }
    } catch (error) {
      setTestResult(`❌ Failed to send test transaction: ${error}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎣 Webhook Testing
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Your Webhook Endpoint</h2>
            <p className="text-gray-600 mb-4">
              Enter your webhook URL to test if it's accessible and working correctly.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.vercel.app/api/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={testWebhook}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test GET Request'}
            </button>
            
            <button
              onClick={sendTestTransaction}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test Transaction'}
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Deployment Checklist:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Deploy Convex functions with <code>npx convex deploy --prod</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Deploy to Vercel with <code>vercel --prod</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Set environment variables in Vercel dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Test webhook endpoint (use buttons above)</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Create Helius webhook in dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Monitor for live data coming in</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Helius Webhook Settings:</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <div><strong>Webhook URL:</strong> https://your-app.vercel.app/api/webhook</div>
              <div><strong>Webhook Type:</strong> Enhanced</div>
              <div><strong>Transaction Types:</strong> Any</div>
              <div><strong>Account Addresses:</strong> pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA</div>
            </div>
          </div>

          <div className="text-center space-x-4">
            <a 
              href="/admin"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Admin
            </a>
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}