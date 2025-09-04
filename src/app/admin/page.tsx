"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function AdminPage() {
  const recentTrades = useQuery(api.trades.getRecentTrades, { limit: 10 });
  const debugState = useQuery(api.trades.debugDatabaseState);
  const clearAllData = useMutation(api.debug.clearAllData);
  const [clearing, setClearing] = useState(false);

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear ALL data? This cannot be undone.")) {
      return;
    }
    
    setClearing(true);
    try {
      const result = await clearAllData();
      alert(result);
    } catch (error) {
      alert("Error clearing data: " + error);
    }
    setClearing(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Debug Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Status</h2>
        {debugState ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold">Total Trades (Sample)</h3>
                <p className="text-2xl">{debugState.totalTrades}</p>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <h3 className="font-semibold">BUY Trades</h3>
                <p className="text-2xl text-green-600">{debugState.buyTrades}</p>
              </div>
              <div className="bg-red-100 p-4 rounded">
                <h3 className="font-semibold">SELL Trades</h3>
                <p className="text-2xl text-red-600">{debugState.sellTrades}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded">
                <h3 className="font-semibold">Cost Basis Records</h3>
                <p className="text-2xl text-blue-600">{debugState.tokenCostBasisRecords}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded">
                <h3 className="font-semibold">Realized PnL Records</h3>
                <p className="text-2xl text-purple-600">{debugState.realizedPnlRecords}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded">
                <h3 className="font-semibold">Token Metadata Records</h3>
                <p className="text-2xl text-yellow-600">{debugState.tokenMetadataRecords}</p>
              </div>
            </div>
            
            {debugState.note && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                ℹ️ {debugState.note}
              </div>
            )}
            
            <div className="mb-4">
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Clear All Data"}
              </button>
            </div>
          </>
        ) : (
          <p>Loading debug info...</p>
        )}
        
        {/* Issues */}
        {debugState && (
          <div className="space-y-2">
            {debugState.sellTrades === 0 && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                ❌ No SELL trades detected - realizedPnl cannot be calculated
              </div>
            )}
            {debugState.tokenMetadataRecords === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                ❌ No token metadata records - tokens won't have names/symbols
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
        {recentTrades ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Signature</th>
                  <th className="px-4 py-2 text-left">Direction</th>
                  <th className="px-4 py-2 text-left">Token Amount</th>
                  <th className="px-4 py-2 text-left">SOL Amount</th>
                  <th className="px-4 py-2 text-left">Trader</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade._id} className="border-t">
                    <td className="px-4 py-2 font-mono text-sm">
                      {trade.signature.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        trade.direction === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2">{trade.tokenAmount.toFixed(4)}</td>
                    <td className="px-4 py-2">{trade.solAmount.toFixed(6)}</td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {trade.traderAddress.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-2">
                      {new Date(trade.blockTime * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Loading trades...</p>
        )}
      </div>
    </div>
  );
}