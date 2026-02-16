export function PlayerList({ players, currentPlayerId, highlightPlayerId = null, clues = [], votes = new Map() }) {
  // Create maps for clues and votes
  const clueMap = new Map();
  clues.forEach(clue => {
    clueMap.set(clue.playerId, clue.clue);
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Players ({players.length})
      </h3>

      {/* Column Headers */}
      {(clues.length > 0 || votes.size > 0) && (
        <div className="grid grid-cols-3 gap-2 px-3 pb-2 text-xs font-semibold text-gray-500 border-b border-gray-300">
          <div>Player</div>
          <div className="text-center">Clue</div>
          <div className="text-center">Voted For</div>
        </div>
      )}

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
                {playerClue && (
                  <div className="text-xs sm:text-sm font-semibold text-blue-600 italic truncate">
                    "{playerClue}"
                  </div>
                )}
              </div>

              {/* Voted For */}
              <div className="text-center">
                {votedForName && (
                  <div className="text-xs sm:text-sm font-semibold text-red-600 truncate">
                    {votedForName}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
