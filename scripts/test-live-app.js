#!/usr/bin/env node

/**
 * Test Live PumpLoss Application
 * Tests all endpoints and functionality
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://helius-sdk.vercel.app';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(data) 
              : data
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`🧪 Testing ${name}...`);
    const response = await makeRequest(url);
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${name}: OK (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${name}: Failed (${response.status})`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log(`💥 ${name}: Error - ${error.message}`);
    return false;
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('🧪 Testing Webhook Endpoint...');
    
    const testPayload = {
      type: 'transaction',
      data: {
        signature: 'test-signature-123',
        slot: 12345,
        blockTime: Date.now(),
        meta: {
          fee: 5000,
          preBalances: [1000000000, 0],
          postBalances: [999995000, 0],
          preTokenBalances: [],
          postTokenBalances: []
        },
        transaction: {
          message: {
            accountKeys: ['test-address-1', 'test-address-2'],
            instructions: [{
              programId: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
              accounts: [0, 1],
              data: 'test-data'
            }]
          }
        }
      }
    };
    
    const response = await makeRequest(`${BASE_URL}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    if (response.status === 200) {
      console.log('✅ Webhook Endpoint: OK');
      return true;
    } else {
      console.log(`❌ Webhook Endpoint: Failed (${response.status})`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log(`💥 Webhook Endpoint: Error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing PumpLoss Live Application');
  console.log('URL:', BASE_URL);
  console.log('=' .repeat(50));
  
  const tests = [
    ['Homepage', `${BASE_URL}`],
    ['Admin Dashboard', `${BASE_URL}/admin`],
    ['Webhook Test Page', `${BASE_URL}/admin/webhook-test`],
  ];
  
  let passed = 0;
  let total = tests.length + 1; // +1 for webhook POST test
  
  // Test GET endpoints
  for (const [name, url] of tests) {
    const success = await testEndpoint(name, url);
    if (success) passed++;
  }
  
  // Test webhook POST endpoint
  const webhookSuccess = await testWebhookEndpoint();
  if (webhookSuccess) passed++;
  
  console.log('=' .repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your app is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testEndpoint, testWebhookEndpoint };