"use client";

interface PeriodSelectorProps {
  selectedPeriod: '24h' | '7d' | 'all';
  onPeriodChange: (period: '24h' | '7d' | 'all') => void;
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const periods = [
    { value: '24h' as const, label: '24 Hours' },
    { value: '7d' as const, label: '7 Days' },
    { value: 'all' as const, label: 'All Time' },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${selectedPeriod === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}