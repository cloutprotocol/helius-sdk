"use client";

import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';

export default function AdminPage() {
  const addTestData = useMutation(api.testData.addTestData);
  const clearTestData = useMutation(api.testData.clearTestData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddTestData = async () => {
    setLoading(true);
    try {
      const result = await addTestData();
      setMessage(result);
    } catch (error) {
      setMessage('Error adding test data: ' + error);
    }
    setLoading(false);
  };

  const handleClearTestData = async () => {
    setLoading(true);
    try {
      const result = await clearTestData();
      setMessage(result);
    } catch (error) {
      setMessage('Error clearing test data: ' + error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Pump Loss Admin
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Data Management</h2>
            <p className="text-gray-600 mb-4">
              Add some test data to see the leaderboard in action, or clear all data to start fresh.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddTestData}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Test Data'}
            </button>
            
            <button
              onClick={handleClearTestData}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Test Data Includes:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 2 test traders with different loss amounts</li>
              <li>• 3 test trades (all losses for demo)</li>
              <li>• Trader 1: -1.7 SOL total loss (2 trades)</li>
              <li>• Trader 2: -0.2 SOL total loss (1 trade)</li>
              <li>• All trades within last 24 hours</li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Next Steps:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Click "Add Test Data" to populate the leaderboard</li>
              <li>2. Go back to the main page to see the leaderboard</li>
              <li>3. Set up Helius webhook for real data</li>
              <li>4. Deploy to production</li>
            </ol>
          </div>

          <div className="text-center">
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}