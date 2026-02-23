const PHASES = [
  { key: 'setup',      label: 'Setup' },
  { key: 'clue',       label: 'Clues' },
  { key: 'discussion', label: 'Discuss' },
  { key: 'voting',     label: 'Voting' },
  { key: 'resolution', label: 'Results' },
];

function getActivePhase(gameState) {
  if (gameState === 'setup') return 0;
  if (gameState === 'clue' || gameState === 'clue-complete') return 1;
  if (gameState === 'discussion') return 2;
  if (gameState === 'voting' || gameState === 'voting-complete' || gameState === 'voting-tiebreak') return 3;
  if (gameState === 'resolution') return 4;
  return -1;
}

function PhaseStep({ label, status, isLast }) {
  const iconBg =
    status === 'done'   ? 'bg-green-500 border-green-500' :
    status === 'active' ? 'bg-yellow-400 border-yellow-400 shadow-md shadow-yellow-200' :
                          'bg-white border-gray-200';

  const icon =
    status === 'done'   ? (
      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) :
    status === 'active' ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> :
                          null;

  const labelColor =
    status === 'done'   ? 'text-green-700 font-medium' :
    status === 'active' ? 'text-yellow-700 font-bold' :
                          'text-gray-300';

  const lineColor =
    status === 'done' ? 'bg-green-400' : 'bg-gray-100';

  return (
    <div className="flex flex-col items-center flex-1">
      <div className="flex items-center w-full">
        {/* Step circle */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${iconBg}`}>
          {icon}
        </div>
        {/* Connector line */}
        {!isLast && <div className={`flex-1 h-0.5 transition-all ${lineColor}`} />}
      </div>
      <span className={`text-[9px] mt-1 leading-tight text-center ${labelColor}`}>{label}</span>
    </div>
  );
}

export function RoundStatus({ roundHistory = [], currentRound, gameState }) {
  if (currentRound === 0) return null;

  const activePhase = getActivePhase(gameState);

  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Progress</h3>
      <div className="space-y-4">
        {Array.from({ length: currentRound }, (_, i) => i + 1).map((roundNum) => {
          const inHistory = roundHistory.some(r => r.round === roundNum);
          const isPastRound = roundNum < currentRound;
          const isFullyDone = inHistory || isPastRound;
          const isCurrent = roundNum === currentRound && !isFullyDone;

          return (
            <div key={roundNum}>
              <div className="flex items-center gap-1.5 mb-2">
                {isFullyDone ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-green-600">Round {roundNum}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-yellow-700">Round {roundNum}</span>
                  </div>
                )}
              </div>

              {/* Phase stepper */}
              <div className="flex items-start w-full px-1">
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
                  return (
                    <PhaseStep
                      key={phase.key}
                      label={phase.label}
                      status={status}
                      isLast={idx === PHASES.length - 1}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
