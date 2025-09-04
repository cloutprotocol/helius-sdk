"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DebugPage() {
  const debugState = useQuery(api.trades.debugDatabaseState);

  if (!debugState) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Debug Info</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Total Trades</h3>
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

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Issues Identified</h2>
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
          {debugState.buyTrades > 0 && debugState.tokenCostBasisRecords === 0 && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
              ❌ BUY trades exist but no cost basis records - data inconsistency
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Signature</th>
                <th className="px-4 py-2 text-left">Direction</th>
                <th className="px-4 py-2 text-left">Token Amount</th>
                <th className="px-4 py-2 text-left">SOL Amount</th>
                <th className="px-4 py-2 text-left">Trader</th>
              </tr>
            </thead>
            <tbody>
              {debugState.recentTrades.map((trade, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">{trade.signature}...</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      trade.direction === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-4 py-2">{trade.tokenAmount.toFixed(4)}</td>
                  <td className="px-4 py-2">{trade.solAmount.toFixed(6)}</td>
                  <td className="px-4 py-2 font-mono text-sm">{trade.trader}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}