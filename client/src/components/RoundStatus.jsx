const STATUS_CONFIG = {
  initiated: { label: 'Initiated', className: 'bg-gray-100 text-gray-600' },
  started: { label: 'Started', className: 'bg-blue-100 text-blue-700' },
  inprogress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

function getRoundStatus(round, currentRound, gameState) {
  if (!round) return 'initiated';
  if (round.chameleonCaught !== undefined) return 'completed'; // from roundHistory
  if (round.roundNumber < currentRound) return 'completed';
  if (round.roundNumber === currentRound) {
    if (['resolution'].includes(gameState)) return 'completed';
    if (['clue', 'clue-complete', 'discussion', 'voting', 'voting-complete', 'voting-tiebreak'].includes(gameState)) return 'inprogress';
    if (gameState === 'setup') return 'started';
  }
  return 'initiated';
}

export function RoundStatus({ roundHistory = [], currentRound, gameState }) {
  if (currentRound === 0) return null;

  // Build rounds array: completed rounds from history + current round
  const rounds = [];
  for (let i = 1; i <= currentRound; i++) {
    const historyEntry = roundHistory.find(r => r.round === i);
    rounds.push({ roundNumber: i, historyEntry });
  }

  return (
    <div className="p-3">
      <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Round Status</h3>
      <div className="space-y-1">
        {rounds.map(({ roundNumber, historyEntry }) => {
          const status = historyEntry
            ? 'completed'
            : roundNumber < currentRound
            ? 'completed'
            : getRoundStatus(null, currentRound, gameState);

          const config = STATUS_CONFIG[status];

          return (
            <div key={roundNumber} className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600">Round {roundNumber}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
