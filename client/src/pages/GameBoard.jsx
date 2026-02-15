import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import socket from '../utils/socket';

export function GameBoard() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('waiting');
  const [currentRound, setCurrentRound] = useState(0);
  const [category, setCategory] = useState('');
  const [secretWord, setSecretWord] = useState(null);
  const [isChameleon, setIsChameleon] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [clues, setClues] = useState([]);
  const [myClue, setMyClue] = useState('');
  const [clueSubmitted, setClueSubmitted] = useState(false);
  const [votes, setVotes] = useState(new Map());
  const [myVote, setMyVote] = useState(null);
  const [scores, setScores] = useState([]);
  const [roundResult, setRoundResult] = useState(null);
  const [chameleonGuess, setChameleonGuess] = useState('');

  useEffect(() => {
    setCurrentPlayer(socket.id);

    function onRoundUpdate(data) {
      setGameState(data.gameState);
      setCurrentRound(data.currentRound);
      setCategory(data.category);
      setSecretWord(data.secretWord);
      setIsChameleon(data.isChameleon);
      setPlayers(data.players);
      setRemainingTime(data.remainingTime);
      setClues([]);
      setClueSubmitted(false);
      setMyClue('');
      setMyVote(null);
      setVotes(new Map());
      setRoundResult(null);
      setChameleonGuess('');
    }

    function onGameStateUpdate(data) {
      setGameState(data.gameState);
      setPlayers(data.players);
      setRemainingTime(data.remainingTime);
      if (data.scores) {
        setScores(data.scores);
      }
    }

    function onTimerUpdate(data) {
      setRemainingTime(data.remainingTime);
    }

    function onClueSubmitted(data) {
      setClues((prev) => [...prev, {
        playerName: data.playerName,
        clue: data.clue
      }]);
    }

    function onVoteSubmitted(data) {
      // Just update vote count for feedback
    }

    function onRoundResolved(data) {
      setRoundResult(data);
      setGameState('resolution');
    }

    function onChameleonGuessed(data) {
      setRoundResult((prev) => ({
        ...prev,
        guess: data.guess,
        guessCorrect: data.isCorrect,
        secretWord: data.secretWord,
        scores: data.scores
      }));
      setScores(data.scores);
    }

    function onRoundStarted(data) {
      setCurrentRound(data.currentRound);
      setRoundResult(null);
    }

    function onGameEnded(data) {
      // Navigate to results or waiting room
      alert('Game ended! Check the final scores.');
      navigate(`/room/${roomCode}`);
    }

    function onChatMessage(message) {
      setMessages((prev) => [...prev, message]);
    }

    function onPlayerLeft({ players: updatedPlayers, newHostId }) {
      setPlayers(updatedPlayers);
      if (newHostId === socket.id) {
        setIsHost(true);
      }
    }

    socket.on('round-update', onRoundUpdate);
    socket.on('game-state-update', onGameStateUpdate);
    socket.on('timer-update', onTimerUpdate);
    socket.on('clue-submitted', onClueSubmitted);
    socket.on('vote-submitted', onVoteSubmitted);
    socket.on('round-resolved', onRoundResolved);
    socket.on('chameleon-guessed', onChameleonGuessed);
    socket.on('round-started', onRoundStarted);
    socket.on('game-ended', onGameEnded);
    socket.on('chat-message', onChatMessage);
    socket.on('player-left', onPlayerLeft);

    return () => {
      socket.off('round-update', onRoundUpdate);
      socket.off('game-state-update', onGameStateUpdate);
      socket.off('timer-update', onTimerUpdate);
      socket.off('clue-submitted', onClueSubmitted);
      socket.off('vote-submitted', onVoteSubmitted);
      socket.off('round-resolved', onRoundResolved);
      socket.off('chameleon-guessed', onChameleonGuessed);
      socket.off('round-started', onRoundStarted);
      socket.off('game-ended', onGameEnded);
      socket.off('chat-message', onChatMessage);
      socket.off('player-left', onPlayerLeft);
    };
  }, [roomCode, navigate]);

  const handleSubmitClue = () => {
    if (!myClue.trim() || clueSubmitted) return;

    socket.emit('submit-clue', { clue: myClue.trim() }, (response) => {
      if (response.success) {
        setClueSubmitted(true);
      }
    });
  };

  const handleSubmitVote = (playerId) => {
    if (myVote || playerId === currentPlayer) return;

    socket.emit('submit-vote', { votedForId: playerId }, (response) => {
      if (response.success) {
        setMyVote(playerId);
      }
    });
  };

  const handleSubmitGuess = () => {
    if (!chameleonGuess.trim()) return;

    socket.emit('submit-guess', { guess: chameleonGuess.trim() }, (response) => {
      if (response.success) {
        // Result will be handled by onChameleonGuessed
      }
    });
  };

  const handleNextRound = () => {
    socket.emit('next-round', (response) => {
      if (!response.success) {
        console.error('Failed to start next round');
      }
    });
  };

  const handleEndGame = () => {
    socket.emit('end-game', (response) => {
      if (!response.success) {
        console.error('Failed to end game');
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

  const getPhaseTitle = () => {
    switch (gameState) {
      case 'setup':
        return 'Setting up round...';
      case 'clue':
        return 'Give Your Clue!';
      case 'discussion':
        return 'Discussion Time';
      case 'voting':
        return 'Vote for the Chameleon';
      case 'resolution':
        return 'Round Results';
      default:
        return 'Game in Progress';
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Round {currentRound}
          </h1>
          <div className="text-xl text-gray-600 mt-1">{getPhaseTitle()}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Players & Timer */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <Timer seconds={remainingTime} />
            </Card>

            <Card>
              <PlayerList
                players={players}
                currentPlayerId={currentPlayer}
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-3">Scores</h3>
              <div className="space-y-2">
                {scores.sort((a, b) => b.score - a.score).map((player) => (
                  <div key={player.playerId} className="flex justify-between">
                    <span className="font-medium">{player.playerName}</span>
                    <span className="text-blue-600 font-bold">{player.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Role & Word Card */}
            <Card>
              <div className="text-center space-y-4">
                <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${
                  isChameleon
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isChameleon ? '🦎 You are the CHAMELEON!' : '🕵️ You are NOT the Chameleon'}
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Category</div>
                  <div className="text-3xl font-bold text-purple-600">{category}</div>
                </div>

                {!isChameleon && secretWord && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Secret Word</div>
                    <div className="text-4xl font-bold text-blue-600">{secretWord}</div>
                  </div>
                )}

                {isChameleon && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      You don't know the secret word! Try to blend in by giving a clue that fits the category.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Clue Phase */}
            {gameState === 'clue' && (
              <Card title="Submit Your Clue">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={myClue}
                      onChange={(e) => setMyClue(e.target.value)}
                      placeholder="Enter one word..."
                      className="input flex-1"
                      disabled={clueSubmitted}
                      maxLength={30}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue()}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSubmitClue}
                      disabled={!myClue.trim() || clueSubmitted}
                    >
                      {clueSubmitted ? 'Submitted ✓' : 'Submit'}
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    {clues.length} / {players.length} clues submitted
                  </div>

                  {clues.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Clues So Far:</h4>
                      <div className="flex flex-wrap gap-2">
                        {clues.map((clue, idx) => (
                          <div key={idx} className="bg-blue-50 px-4 py-2 rounded-lg">
                            <div className="text-xs text-gray-600">{clue.playerName}</div>
                            <div className="font-semibold">{clue.clue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Discussion Phase */}
            {gameState === 'discussion' && (
              <Card title="Discussion Time">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Use the chat to discuss who you think is the Chameleon!
                  </p>

                  <div>
                    <h4 className="font-semibold mb-2">All Clues:</h4>
                    <div className="flex flex-wrap gap-2">
                      {clues.map((clue, idx) => (
                        <div key={idx} className="bg-blue-50 px-4 py-2 rounded-lg">
                          <div className="text-xs text-gray-600">{clue.playerName}</div>
                          <div className="font-semibold">{clue.clue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Voting Phase */}
            {gameState === 'voting' && (
              <Card title="Vote for the Chameleon">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Click on a player to vote for them as the Chameleon:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {players.filter(p => p.id !== currentPlayer).map((player) => (
                      <Button
                        key={player.id}
                        variant={myVote === player.id ? 'success' : 'secondary'}
                        onClick={() => handleSubmitVote(player.id)}
                        disabled={myVote !== null}
                        className="w-full"
                      >
                        {player.name}
                        {myVote === player.id && ' ✓'}
                      </Button>
                    ))}
                  </div>

                  {myVote && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                      Vote submitted! Waiting for others...
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Resolution Phase */}
            {gameState === 'resolution' && roundResult && (
              <Card title="Round Results">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      The Chameleon was: {players.find(p => p.id === roundResult.chameleonId)?.name}
                    </div>
                    <div className="text-xl">
                      You suspected: {players.find(p => p.id === roundResult.suspectedChameleon)?.name}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Secret Word</div>
                      <div className="text-3xl font-bold text-blue-600">{roundResult.secretWord}</div>
                    </div>
                  </div>

                  {roundResult.chameleonCaught && isChameleon && !roundResult.guess && (
                    <div className="space-y-3">
                      <p className="text-center font-semibold">
                        You were caught! Guess the secret word to redeem yourself:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chameleonGuess}
                          onChange={(e) => setChameleonGuess(e.target.value)}
                          placeholder="Your guess..."
                          className="input flex-1"
                          maxLength={50}
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
                        />
                        <Button
                          variant="primary"
                          onClick={handleSubmitGuess}
                          disabled={!chameleonGuess.trim()}
                        >
                          Guess
                        </Button>
                      </div>
                    </div>
                  )}

                  {roundResult.guess && (
                    <div className={`p-4 rounded-lg text-center ${
                      roundResult.guessCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="text-xl font-bold">
                        Chameleon guessed: "{roundResult.guess}"
                      </div>
                      <div className="text-lg mt-2">
                        {roundResult.guessCorrect ? '✓ Correct! Chameleon wins!' : '✗ Wrong! Others win!'}
                      </div>
                    </div>
                  )}

                  {isHost && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="primary"
                        onClick={handleNextRound}
                        className="flex-1"
                      >
                        Next Round
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleEndGame}
                        className="flex-1"
                      >
                        End Game
                      </Button>
                    </div>
                  )}

                  {!isHost && (
                    <div className="text-center text-gray-600">
                      Waiting for host to continue...
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <Card title="Chat">
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                disabled={gameState === 'clue'}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
