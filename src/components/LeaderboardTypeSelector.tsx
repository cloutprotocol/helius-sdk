"use client";

interface LeaderboardTypeSelectorProps {
  selectedType: 'biggest_losers' | 'biggest_winners' | 'most_active' | 'highest_winrate' | 'token_winners' | 'token_losers';
  onTypeChange: (type: 'biggest_losers' | 'biggest_winners' | 'most_active' | 'highest_winrate' | 'token_winners' | 'token_losers') => void;
}

export function LeaderboardTypeSelector({ selectedType, onTypeChange }: LeaderboardTypeSelectorProps) {
  const leaderboardTypes = [
    { value: 'biggest_losers' as const, label: '💸 Biggest Losers', color: 'text-red-600' },
    { value: 'biggest_winners' as const, label: '🏆 Biggest Winners', color: 'text-green-600' },
    { value: 'most_active' as const, label: '🔥 Most Active', color: 'text-orange-600' },
    { value: 'highest_winrate' as const, label: '🎯 Highest Win Rate', color: 'text-blue-600' },
    { value: 'token_winners' as const, label: '🚀 Best Tokens', color: 'text-green-600' },
    { value: 'token_losers' as const, label: '📉 Worst Tokens', color: 'text-red-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {leaderboardTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${selectedType === type.value
              ? 'bg-white text-gray-900 shadow-md ring-2 ring-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
        >
          <span className={selectedType === type.value ? type.color : ''}>
            {type.label}
          </span>
        </button>
      ))}
    </div>
  );
}