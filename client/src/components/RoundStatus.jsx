// Phase order for a round
const PHASES = [
  { key: 'setup', label: 'Setting Up' },
  { key: 'clue', label: 'Give Clues' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'voting', label: 'Voting' },
  { key: 'resolution', label: 'Results' },
];

const PHASE_ORDER = ['setup', 'clue', 'clue-complete', 'discussion', 'voting', 'voting-complete', 'voting-tiebreak', 'resolution'];

function getCurrentPhaseIndex(gameState) {
  const idx = PHASE_ORDER.indexOf(gameState);
  return idx === -1 ? -1 : idx;
}

function getDisplayPhaseIndex(gameState) {
  // Map gameState to display phase index (0-4)
  if (gameState === 'setup') return 0;
  if (gameState === 'clue' || gameState === 'clue-complete') return 1;
  if (gameState === 'discussion') return 2;
  if (['voting', 'voting-complete', 'voting-tiebreak'].includes(gameState)) return 3;
  if (gameState === 'resolution') return 4;
  return -1;
}

function PhaseRow({ label, status }) {
  const dot = status === 'done'
    ? 'bg-green-500'
    : status === 'active'
    ? 'bg-yellow-400 animate-pulse'
    : 'bg-gray-200';
  const text = status === 'done'
    ? 'text-green-700 line-through'
    : status === 'active'
    ? 'text-yellow-700 font-bold'
    : 'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className={`text-xs ${text}`}>{label}</span>
    </div>
  );
}

export function RoundStatus({ roundHistory = [], currentRound, gameState }) {
  if (currentRound === 0) return null;

  const currentPhaseIdx = getDisplayPhaseIndex(gameState);

  return (
    <div className="p-3">
      <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Round Status</h3>
      <div className="space-y-3">
        {Array.from({ length: currentRound }, (_, i) => i + 1).map((roundNum) => {
          const isCompleted = roundNum < currentRound || roundHistory.find(r => r.round === roundNum);
          const isCurrent = roundNum === currentRound;

          return (
            <div key={roundNum}>
              <div className="text-xs font-semibold text-gray-500 mb-1">Round {roundNum}</div>
              <div className="pl-2 space-y-1 border-l-2 border-gray-100">
                {PHASES.map((phase, idx) => {
                  let status;
                  if (isCompleted && !isCurrent) {
                    status = 'done';
                  } else if (isCurrent) {
                    if (idx < currentPhaseIdx) status = 'done';
                    else if (idx === currentPhaseIdx) status = 'active';
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
