export function PlayerList({ players, currentPlayerId, highlightPlayerId = null }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Players ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              highlightPlayerId === player.id
                ? 'bg-yellow-100 border-2 border-yellow-400'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                player.id === currentPlayerId ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium">
                {player.name}
                {player.isHost && <span className="ml-2 text-xs text-blue-600">(Host)</span>}
                {player.id === currentPlayerId && <span className="ml-2 text-xs text-green-600">(You)</span>}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-600">
              {player.score || 0} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
