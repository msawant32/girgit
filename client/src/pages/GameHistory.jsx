import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import socket from '../utils/socket';

export function GameHistory() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch game history
    socket.emit('get-game-history', (response) => {
      setLoading(false);
      if (response.success) {
        setGames(response.games);
      }
    });
  }, []);

  const handleViewGame = (gameId) => {
    socket.emit('get-game-details', { gameId }, (response) => {
      if (response.success) {
        setSelectedGame(response.game);
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading history...</div>
      </div>
    );
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="secondary" onClick={() => setSelectedGame(null)}>
              ← Back to History
            </Button>
          </div>

          <Card title={`Game: ${selectedGame.roomCode}`}>
            <div className="space-y-6">
              {/* Game Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Started:</span>{' '}
                  <span className="font-semibold">{formatDate(selectedGame.startedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ended:</span>{' '}
                  <span className="font-semibold">{formatDate(selectedGame.endedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Rounds:</span>{' '}
                  <span className="font-semibold">{selectedGame.totalRounds}</span>
                </div>
              </div>

              {/* Final Scores */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Final Scores</h3>
                <div className="space-y-2">
                  {selectedGame.players.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{player.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Round History */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Round History</h3>
                <div className="space-y-3">
                  {selectedGame.rounds.map((round) => (
                    <div key={round.roundNumber} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">Round {round.roundNumber}</div>
                        <div className={`badge ${round.chameleonCaught ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {round.chameleonCaught ? 'Girgit Caught' : 'Girgit Escaped'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Category:</span>{' '}
                          <span className="font-semibold">{round.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Word:</span>{' '}
                          <span className="font-semibold">{round.secretWord}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Girgit:</span>{' '}
                          <span className="font-semibold text-green-600">{round.chameleonName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Suspected:</span>{' '}
                          <span className="font-semibold">{round.suspectedName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>

        <Card title="Game History">
          {games.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-xl text-gray-600">No games played yet!</div>
              <div className="text-gray-500 mt-2">
                Start a new game to see it appear here.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleViewGame(game.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg mb-1">
                        Room: {game.roomCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(game.endedAt)}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {game.players.slice(0, 3).map((player, idx) => (
                          <span key={idx} className="badge badge-player">
                            {player.name}: {player.score}
                          </span>
                        ))}
                        {game.players.length > 3 && (
                          <span className="badge bg-gray-200 text-gray-700">
                            +{game.players.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Rounds</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {game.totalRounds}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
