const PHASES = [
  { key: 'setup',      label: 'Setting Up' },
  { key: 'clue',       label: 'Give Clues' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'voting',     label: 'Voting' },
  { key: 'resolution', label: 'Results' },
];

// Returns 0-4 index of the currently active display phase
function getActivePhase(gameState) {
  if (gameState === 'setup') return 0;
  if (gameState === 'clue' || gameState === 'clue-complete') return 1;
  if (gameState === 'discussion') return 2;
  if (gameState === 'voting' || gameState === 'voting-complete' || gameState === 'voting-tiebreak') return 3;
  if (gameState === 'resolution') return 4;
  return -1;
}

function PhaseRow({ label, status }) {
  const dot =
    status === 'done'   ? 'bg-green-500' :
    status === 'active' ? 'bg-yellow-400 animate-pulse' :
                          'bg-gray-200';
  const text =
    status === 'done'   ? 'text-green-600 line-through' :
    status === 'active' ? 'text-yellow-700 font-bold' :
                          'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className={`text-xs ${text}`}>{label}</span>
    </div>
  );
}

export function RoundStatus({ roundHistory = [], currentRound, gameState }) {
  if (currentRound === 0) return null;

  const activePhase = getActivePhase(gameState);

  return (
    <div className="p-3">
      <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Round Status</h3>
      <div className="space-y-3">
        {Array.from({ length: currentRound }, (_, i) => i + 1).map((roundNum) => {
          // A round is fully completed if it appears in history OR it's a past round
          const inHistory = roundHistory.some(r => r.round === roundNum);
          const isPastRound = roundNum < currentRound;
          const isFullyDone = inHistory || isPastRound;
          const isCurrent = roundNum === currentRound && !isFullyDone;

          return (
            <div key={roundNum}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-semibold text-gray-500">Round {roundNum}</span>
                {isFullyDone && <span className="text-xs text-green-600 font-bold">✓</span>}
                {isCurrent && <span className="text-xs text-yellow-600 font-bold animate-pulse">●</span>}
              </div>
              <div className="pl-2 space-y-1 border-l-2 border-gray-100">
                {PHASES.map((phase, idx) => {
                  let status;
                  if (isFullyDone) {
                    status = 'done';
                  } else if (isCurrent) {
                    if (idx < activePhase) status = 'done';
                    else if (idx === activePhase) status = 'active';
                    else status = 'pending';
                  } else {
                    status = 'pending';
                  }
                  return <PhaseRow key={phase.key} label={phase.label} status={status} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
