import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import socket from '../utils/socket';

export function WaitingRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState(location.state?.players || []);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isHost, setIsHost] = useState(location.state?.player?.isHost || false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get current player info from socket
    const currentPlayerId = socket.id;
    setCurrentPlayer(currentPlayerId);

    // Listen for player joined
    function onPlayerJoined({ player, players: updatedPlayers }) {
      setPlayers(updatedPlayers);

      // If this is the current player joining, check if host
      if (player.id === currentPlayerId) {
        setIsHost(player.isHost);
      }
    }

    // Listen for player left
    function onPlayerLeft({ players: updatedPlayers, newHostId }) {
      setPlayers(updatedPlayers);
      if (newHostId === socket.id) {
        setIsHost(true);
      }
    }

    // Listen for game started
    function onGameStarted() {
      navigate(`/game/${roomCode}`);
    }

    // Listen for chat messages
    function onChatMessage(message) {
      setMessages((prev) => [...prev, message]);
    }

    socket.on('player-joined', onPlayerJoined);
    socket.on('player-left', onPlayerLeft);
    socket.on('game-started', onGameStarted);
    socket.on('chat-message', onChatMessage);

    return () => {
      socket.off('player-joined', onPlayerJoined);
      socket.off('player-left', onPlayerLeft);
      socket.off('game-started', onGameStarted);
      socket.off('chat-message', onChatMessage);
    };
  }, [roomCode, navigate]);

  const handleStartGame = () => {
    socket.emit('start-game', (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    });
  };

  const handleSendMessage = (message) => {
    socket.emit('chat-message', { message }, (response) => {
      if (!response.success) {
        console.error('Failed to send message');
      }
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied to clipboard!');
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Waiting Room
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-mono text-2xl font-bold tracking-wider">
              {roomCode}
            </div>
            <Button variant="secondary" onClick={handleCopyCode}>
              Copy Code
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Share this code with your friends to join!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Section */}
          <div className="lg:col-span-1">
            <Card>
              <PlayerList
                players={players}
                currentPlayerId={currentPlayer}
              />

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {isHost && (
                  <Button
                    variant="success"
                    onClick={handleStartGame}
                    disabled={players.length < 3}
                    className="w-full"
                  >
                    {players.length < 3
                      ? `Need ${3 - players.length} more player(s)`
                      : 'Start Game'}
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={handleLeaveRoom}
                  className="w-full"
                >
                  Leave Room
                </Button>
              </div>

              {!isHost && players.length >= 3 && (
                <div className="mt-4 text-center text-gray-600 text-sm">
                  Waiting for host to start the game...
                </div>
              )}
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card title="Chat">
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </Card>
          </div>
        </div>

        {/* Game Rules */}
        <Card className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Game Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Setup Phase (5 seconds)</h4>
              <p>One player is randomly selected as the Chameleon. A category and secret word are chosen.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Clue Phase (60 seconds)</h4>
              <p>Each player gives a one-word clue. The Chameleon must blend in without knowing the word!</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Discussion Phase (30 seconds)</h4>
              <p>Discuss and strategize to figure out who the Chameleon is.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Voting Phase (30 seconds)</h4>
              <p>Vote on who you think is the Chameleon. If caught, they can guess the word to win!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
