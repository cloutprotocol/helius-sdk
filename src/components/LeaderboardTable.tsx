"use client";

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  pnlAmount: number;
  lossTradeCount: number;
  biggestLossToken?: string;
  lastLossTime?: number;
  allTimeLoss: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  period: '24h' | '7d' | 'all';
  loading: boolean;
}

export function LeaderboardTable({ data, period, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No losses found</h3>
          <p className="text-sm">
            No trading losses recorded for the selected period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wallet
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PNL ({period})
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              All-Time Loss
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loss Trades
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Biggest Loss Token
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Loss
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((entry) => (
            <tr key={entry.walletAddress} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  {entry.rank === 1 && <span className="mr-2">🥇</span>}
                  {entry.rank === 2 && <span className="mr-2">🥈</span>}
                  {entry.rank === 3 && <span className="mr-2">🥉</span>}
                  {entry.rank}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link 
                  href={`/wallet/${entry.walletAddress}`}
                  className="text-blue-600 hover:text-blue-800 font-mono"
                >
                  {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-4)}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                {Math.abs(entry.pnlAmount).toFixed(2)} SOL
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                {Math.abs(entry.allTimeLoss).toFixed(2)} SOL
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {entry.lossTradeCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {entry.biggestLossToken ? (
                  <span title={entry.biggestLossToken}>
                    {entry.biggestLossToken.slice(0, 8)}...
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {entry.lastLossTime ? (
                  <span title={new Date(entry.lastLossTime * 1000).toLocaleString()}>
                    {formatDistanceToNow(new Date(entry.lastLossTime * 1000), { addSuffix: true })}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}