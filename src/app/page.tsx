"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { PeriodSelector } from '../components/PeriodSelector';

type Period = '24h' | '7d' | 'all';

export default function HomePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('24h');
  
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, {
    period: selectedPeriod,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💸 Pump Loss
              </h1>
              <p className="text-gray-600 mt-1">
                Live leaderboard of the biggest PumpSwap trading losses
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Live updates every few seconds
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="mb-6">
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Losers</div>
            <div className="text-2xl font-bold text-red-600">
              {leaderboard?.length || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Biggest Loss</div>
            <div className="text-2xl font-bold text-red-600">
              {leaderboard?.[0]?.pnlAmount 
                ? `${Math.abs(leaderboard[0].pnlAmount).toFixed(2)} SOL`
                : '0 SOL'
              }
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Period</div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedPeriod === '24h' ? '24 Hours' : 
               selectedPeriod === '7d' ? '7 Days' : 'All Time'}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Loss Leaderboard
            </h2>
            <p className="text-sm text-gray-600">
              Ranked by total realized losses in {selectedPeriod === '24h' ? 'the last 24 hours' : 
              selectedPeriod === '7d' ? 'the last 7 days' : 'all time'}
            </p>
          </div>
          
          <LeaderboardTable 
            data={leaderboard || []} 
            period={selectedPeriod}
            loading={leaderboard === undefined}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Data sourced from PumpSwap AMM on Solana. Updates in real-time via Helius webhooks.
          </p>
          <p className="mt-1">
            ⚠️ For entertainment purposes only. Not financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
}