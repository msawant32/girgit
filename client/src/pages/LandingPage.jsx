import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import socket from '../utils/socket';

export function LandingPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRoom, setLastRoom] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for error message from navigation state
    if (location.state?.error) {
      setError(location.state.error);
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Check for last room in localStorage
    const savedRoom = localStorage.getItem('lastRoomCode');
    const savedName = localStorage.getItem('lastPlayerName');
    if (savedRoom && savedName) {
      setLastRoom({ roomCode: savedRoom, playerName: savedName });
      setPlayerName(savedName);
    }
  }, [location.state, location.pathname, navigate]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    const createRoom = () => {
      socket.emit('create-room', { playerName: playerName.trim(), country: 'USA' }, (response) => {
        setLoading(false);
        if (response && response.success) {
          // Save to localStorage
          localStorage.setItem('lastRoomCode', response.roomCode);
          localStorage.setItem('lastPlayerName', playerName.trim());

          navigate(`/room/${response.roomCode}`, {
            state: { player: response.player, players: [response.player] }
          });
        } else {
          setError(response?.error || 'Failed to create room. Please try again.');
        }
      });
    };

    // Ensure socket is connected before creating room
    if (socket.connected) {
      createRoom();
    } else {
      const onConnect = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        createRoom();
      };

      const onConnectError = (err) => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        setLoading(false);
        setError('Cannot connect to server. Please check if the server is running.');
        console.error('Socket connection error:', err);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.connect();
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

    const joinRoom = () => {
      socket.emit('join-room', {
        roomCode: roomCode.trim(),
        playerName: playerName.trim()
      }, (response) => {
        setLoading(false);
        if (response && response.success) {
          // Save to localStorage
          localStorage.setItem('lastRoomCode', roomCode.trim());
          localStorage.setItem('lastPlayerName', playerName.trim());

          navigate(`/room/${roomCode.trim()}`, {
            state: { player: response.player, players: response.gameState?.players || [] }
          });
        } else {
          setError(response?.error || 'Failed to join room');
        }
      });
    };

    // Ensure socket is connected before joining room
    if (socket.connected) {
      joinRoom();
    } else {
      const onConnect = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        joinRoom();
      };

      const onConnectError = (err) => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        setLoading(false);
        setError('Cannot connect to server. Please check if the server is running.');
        console.error('Socket connection error:', err);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.connect();
    }
  };

  const handleRejoinRoom = () => {
    if (!lastRoom) return;

    setLoading(true);
    setError('');

    const rejoinRoom = () => {
      socket.emit('rejoin-room', {
        roomCode: lastRoom.roomCode,
        playerName: lastRoom.playerName
      }, (response) => {
        setLoading(false);
        if (response && response.success) {
          const gameState = response.gameState;

          // Always navigate to game board if game exists
          if (gameState.gameState === 'waiting') {
            navigate(`/room/${lastRoom.roomCode}`, {
              state: { player: response.player, players: gameState.players }
            });
          } else {
            // Navigate to game board for in-progress game
            navigate(`/game/${lastRoom.roomCode}`);
          }
        } else {
          setError(response?.error || 'Failed to rejoin room');
          // Clear saved room if rejoin failed
          localStorage.removeItem('lastRoomCode');
          localStorage.removeItem('lastPlayerName');
          setLastRoom(null);
        }
      });
    };

    if (socket.connected) {
      rejoinRoom();
    } else {
      const onConnect = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        rejoinRoom();
      };

      const onConnectError = (err) => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        setLoading(false);
        setError('Cannot connect to server. Please check if the server is running.');
        console.error('Socket connection error:', err);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.connect();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg mb-6">
            <Logo size="xlarge" />
            <p className="text-gray-700 text-lg mt-4 font-medium">
              Find the imposter among your friends!
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
              <span>🎯 Deduction</span>
              <span>•</span>
              <span>🎭 Deception</span>
              <span>•</span>
              <span>🎉 Fun!</span>
            </div>
          </div>
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

            {/* Rejoin Last Room */}
            {lastRoom && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Last room: <span className="font-bold">{lastRoom.roomCode}</span>
                </p>
                <Button
                  variant="primary"
                  onClick={handleRejoinRoom}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Rejoining...' : 'Rejoin Last Room'}
                </Button>
              </div>
            )}

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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

             
          </div>
        </Card>

        {/* How to Play */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            How to Play
          </h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Create or join a room (min 3 players)</li>
            <li>2. One player is secretly the Girgit</li>
            <li>3. Everyone sees a category and secret word (except the Girgit)</li>
            <li>4. Give one-word clues related to the word</li>
            <li>5. Vote on who you think is the Girgit</li>
            <li>6. If caught, the Girgit can guess the word to win!</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
