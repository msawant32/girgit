import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import { Logo } from '../components/Logo';
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
  const [isRejoining, setIsRejoining] = useState(false);

  useEffect(() => {
    // Rejoin room on page refresh
    const needsRejoin = !location.state?.players;
    if (needsRejoin) {
      setIsRejoining(true);
      const savedPlayerName = localStorage.getItem('lastPlayerName');
      const savedRoomCode = localStorage.getItem('lastRoomCode');

      if (savedPlayerName && savedRoomCode === roomCode) {
        const attemptRejoin = () => {
          socket.emit('rejoin-room', { roomCode, playerName: savedPlayerName }, (response) => {
            setIsRejoining(false);
            if (response && response.success) {
              setPlayers(response.gameState.players);
              const myPlayer = response.gameState.players.find(p => p.name === savedPlayerName);
              if (myPlayer) {
                setIsHost(myPlayer.isHost);
              }
              if (response.gameState.gameState !== 'waiting') {
                navigate(`/game/${roomCode}`);
              }
            } else {
              // Rejoin failed, try joining as new player
              socket.emit('join-room', { roomCode, playerName: savedPlayerName }, (joinResponse) => {
                if (joinResponse && joinResponse.success) {
                  setPlayers(joinResponse.gameState.players);
                  const myPlayer = joinResponse.gameState.players.find(p => p.name === savedPlayerName);
                  if (myPlayer) {
                    setIsHost(myPlayer.isHost);
                  }
                } else {
                  navigate('/');
                }
              });
            }
          });
        };

        if (socket.connected) {
          attemptRejoin();
        } else {
          socket.once('connect', attemptRejoin);
        }
      } else {
        setIsRejoining(false);
        navigate('/');
      }
    }
  }, []);

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

  // Prevent accidental page exit
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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

  const handleLeaveRoom = () => {
    navigate('/');
  };

  if (isRejoining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">Reconnecting...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Host Info */}
            <div className="flex-1 flex items-start">
              {players.find(p => p.isHost) && (
                <div className="text-sm font-semibold text-gray-700">
                  Host: {players.find(p => p.isHost).name}
                </div>
              )}
            </div>

            {/* Centered Logo */}
            <div className="flex-shrink-0">
              <Logo size="medium" clickable={true} onClick={() => navigate('/')} />
            </div>

            {/* Room Info */}
            <div className="flex-1 flex items-center justify-end gap-3 text-right">
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-gray-600">Waiting Room</div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-500">Room number</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-purple-700">
                      {roomCode}
                    </span>
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(roomCode);
                      }}
                      href="#"
                      className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    >
                      copy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              Share this room number with your friends!
            </p>
          </div>
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
              <p>One player is randomly selected as the Girgit. A category and secret word are chosen.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Clue Phase (60 seconds)</h4>
              <p>Each player gives a one-word clue. The Girgit must blend in without knowing the word!</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Discussion Phase (30 seconds)</h4>
              <p>Discuss and strategize to figure out who the Girgit is.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Voting Phase (30 seconds)</h4>
              <p>Vote on who you think is the Girgit. If caught, they can guess the word to win!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
