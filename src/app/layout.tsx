import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexProvider } from './ConvexProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pump Loss - Live PumpSwap Trading Loss Leaderboard',
  description: 'Real-time leaderboard of the biggest trading losses on PumpSwap AMM. Track memecoin trading performance on Solana.',
  keywords: ['solana', 'pumpswap', 'trading', 'losses', 'memecoin', 'defi', 'leaderboard'],
  openGraph: {
    title: 'Pump Loss - Live Trading Loss Leaderboard',
    description: 'Real-time leaderboard of the biggest trading losses on PumpSwap AMM',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pump Loss - Live Trading Loss Leaderboard',
    description: 'Real-time leaderboard of the biggest trading losses on PumpSwap AMM',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexProvider>
          {children}
        </ConvexProvider>
      </body>
    </html>
  );
}