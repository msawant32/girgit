import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import socket from '../utils/socket';

export function LandingPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
      // Wait a bit for connection
      setTimeout(() => {
        socket.emit('create-room', playerName.trim(), (response) => {
          setLoading(false);
          if (response.success) {
            navigate(`/room/${response.roomCode}`, {
              state: { player: response.player, players: [response.player] }
            });
          } else {
            setError(response.error || 'Failed to create room');
          }
        });
      }, 500);
    } else {
      socket.emit('create-room', playerName.trim(), (response) => {
        setLoading(false);
        if (response.success) {
          navigate(`/room/${response.roomCode}`, {
            state: { player: response.player, players: [response.player] }
          });
        } else {
          setError(response.error || 'Failed to create room');
        }
      });
    }
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-digit room code');
      return;
    }

    setLoading(true);
    setError('');

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
      setTimeout(() => {
        socket.emit('join-room', {
          roomCode: roomCode.trim(),
          playerName: playerName.trim()
        }, (response) => {
          setLoading(false);
          if (response.success) {
            navigate(`/room/${roomCode.trim()}`, {
              state: { player: response.player, players: response.gameState?.players || [] }
            });
          } else {
            setError(response.error || 'Failed to join room');
          }
        });
      }, 500);
    } else {
      socket.emit('join-room', {
        roomCode: roomCode.trim(),
        playerName: playerName.trim()
      }, (response) => {
        setLoading(false);
        if (response.success) {
          navigate(`/room/${roomCode.trim()}`, {
            state: { player: response.player, players: response.gameState?.players || [] }
          });
        } else {
          setError(response.error || 'Failed to join room');
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">
            🦎 Chameleon
          </h1>
          <p className="text-gray-600 text-lg">
            Find the imposter among your friends!
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <div className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                maxLength={20}
                disabled={loading}
              />
            </div>

            {/* Create Room Button */}
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={loading || !playerName.trim()}
              className="w-full text-lg"
            >
              {loading ? 'Creating...' : 'Create New Room'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Join Room Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="input"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <Button
              variant="secondary"
              onClick={handleJoinRoom}
              disabled={loading || !playerName.trim() || roomCode.length !== 6}
              className="w-full text-lg"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Game History Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/history')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View Game History
              </button>
            </div>
          </div>
        </Card>

        {/* How to Play */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            How to Play
          </h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Create or join a room (min 3 players)</li>
            <li>2. One player is secretly the Chameleon</li>
            <li>3. Everyone sees a category and secret word (except the Chameleon)</li>
            <li>4. Give one-word clues related to the word</li>
            <li>5. Vote on who you think is the Chameleon</li>
            <li>6. If caught, the Chameleon can guess the word to win!</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
