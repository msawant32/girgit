import { useState } from 'react';

export function PlayerList({ players, currentPlayerId, highlightPlayerId = null, clues = [], votes = new Map() }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Create maps for clues and votes
  const clueMap = new Map();
  clues.forEach(clue => {
    clueMap.set(clue.playerId, clue.clue);
  });

  return (
    <div className="space-y-2">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full grid grid-cols-3 gap-2 items-center bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-150 group"
      >
        <div className="flex items-center gap-1">
          <span className={`text-indigo-500 group-hover:text-indigo-700 transition-transform duration-200 text-sm font-bold ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>▾</span>
          <span className="text-sm font-semibold text-indigo-700">Players ({players.length})</span>
        </div>
        {(clues.length > 0 || votes.size > 0) ? (
          <>
            <span className="text-xs font-semibold text-indigo-500 text-center">Clue</span>
            <span className="text-xs font-semibold text-indigo-500 text-center">Voted</span>
          </>
        ) : (
          <span className="col-span-2" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>

          <div className="space-y-2">
            {players.map((player) => {
              const playerClue = clueMap.get(player.id);
              const votedForId = votes.get(player.id);
              const votedForName = votedForId ? players.find(p => p.id === votedForId)?.name : null;

              return (
                <div
                  key={player.id}
                  className={`grid grid-cols-3 gap-2 items-center p-3 rounded-lg transition-all ${
                    highlightPlayerId === player.id
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : 'bg-gray-50'
                  }`}
                >
                  {/* Player Name */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      player.id === currentPlayerId ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-sm truncate">
                      {player.name}
                      {player.isHost && <span className="ml-1 text-xs text-blue-600">(H)</span>}
                      {player.id === currentPlayerId && <span className="ml-1 text-xs text-green-600">(You)</span>}
                    </span>
                  </div>

                  {/* Clue */}
                  <div className="text-center">
                    {playerClue ? (
                      <div className="text-xs sm:text-sm font-semibold text-blue-600 italic truncate">
                        "{playerClue}"
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">—</div>
                    )}
                  </div>

                  {/* Voted For */}
                  <div className="text-center">
                    {votedForName ? (
                      <div className="text-xs sm:text-sm font-semibold text-red-600 truncate">
                        {votedForName}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
