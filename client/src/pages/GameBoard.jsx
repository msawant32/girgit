import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import socket from '../utils/socket';

// Secret words organized by category
const WORDS_BY_CATEGORY = {
  "Animals": ["Lion", "Elephant", "Penguin", "Dolphin", "Tiger", "Giraffe", "Kangaroo", "Eagle", "Shark", "Panda", "Koala", "Zebra", "Cheetah", "Gorilla", "Octopus", "Butterfly", "Horse", "Wolf", "Bear", "Fox"],
  "Food": ["Pizza", "Sushi", "Burger", "Pasta", "Tacos", "Salad", "Steak", "Sandwich", "Curry", "Ramen", "Croissant", "Pancakes", "Waffles", "Ice Cream", "Chocolate", "Soup", "Burrito", "Lasagna", "Risotto", "Dumplings"],
  "Movies": ["Titanic", "Avatar", "Inception", "Gladiator", "Frozen", "Jaws", "Shrek", "Matrix", "Joker", "Rocky", "Casablanca", "Aladdin", "Brave", "Up", "Cars", "Moana", "Coco", "Thor", "Wonder", "Gravity"],
  "Countries": ["Japan", "Brazil", "Egypt", "Australia", "Canada", "France", "India", "Mexico", "Italy", "Spain", "Greece", "Norway", "Thailand", "Argentina", "Kenya", "Iceland", "Peru", "Turkey", "Vietnam", "Morocco"],
  "Sports": ["Soccer", "Basketball", "Tennis", "Swimming", "Baseball", "Cricket", "Golf", "Boxing", "Skiing", "Surfing", "Volleyball", "Hockey", "Rugby", "Badminton", "Cycling", "Wrestling", "Karate", "Gymnastics", "Archery", "Fencing"],
  "Professions": ["Doctor", "Teacher", "Chef", "Pilot", "Engineer", "Artist", "Lawyer", "Nurse", "Firefighter", "Scientist", "Musician", "Writer", "Architect", "Detective", "Farmer", "Dentist", "Photographer", "Mechanic", "Astronaut", "Designer"],
  "Colors": ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Pink", "Black", "White", "Brown", "Gray", "Gold", "Silver", "Turquoise", "Maroon", "Lavender", "Crimson", "Teal", "Indigo", "Coral"],
  "Vehicles": ["Car", "Bicycle", "Train", "Airplane", "Boat", "Motorcycle", "Helicopter", "Submarine", "Rocket", "Scooter", "Truck", "Bus", "Yacht", "Tractor", "Ambulance", "Taxi", "Limousine", "Skateboard", "Spaceship", "Canoe"],
  "Music Genres": ["Rock", "Jazz", "Pop", "Hip Hop", "Classical", "Blues", "Country", "Electronic", "Reggae", "Metal", "Folk", "Soul", "Punk", "Disco", "Opera", "Techno", "Gospel", "Salsa", "Indie", "Funk"],
  "Furniture": ["Chair", "Table", "Sofa", "Bed", "Desk", "Cabinet", "Bookshelf", "Lamp", "Mirror", "Wardrobe", "Bench", "Dresser", "Nightstand", "Ottoman", "Stool", "Chandelier", "Armchair", "Hammock", "Cradle", "Recliner"],
  "Technology": ["Smartphone", "Laptop", "Tablet", "Camera", "Television", "Headphones", "Keyboard", "Mouse", "Printer", "Router", "Smartwatch", "Drone", "Speaker", "Microphone", "Projector", "Scanner", "Monitor", "Controller", "Charger", "USB"],
  "Nature": ["Mountain", "Ocean", "Forest", "Desert", "River", "Volcano", "Waterfall", "Beach", "Lake", "Island", "Canyon", "Valley", "Cave", "Jungle", "Glacier", "Meadow", "Cliff", "Swamp", "Reef", "Prairie"],
  "Weather": ["Sunny", "Rainy", "Snowy", "Cloudy", "Windy", "Stormy", "Foggy", "Thunder", "Lightning", "Hail", "Drizzle", "Hurricane", "Tornado", "Blizzard", "Rainbow", "Frost", "Mist", "Humid", "Drought", "Monsoon"],
  "Emotions": ["Happy", "Sad", "Angry", "Excited", "Scared", "Surprised", "Confused", "Proud", "Jealous", "Nervous", "Calm", "Bored", "Anxious", "Confident", "Lonely", "Grateful", "Frustrated", "Hopeful", "Embarrassed", "Curious"],
  "Clothing": ["Shirt", "Pants", "Dress", "Jacket", "Shoes", "Hat", "Socks", "Sweater", "Scarf", "Gloves", "Coat", "Jeans", "Skirt", "Tie", "Belt", "Hoodie", "Shorts", "Sandals", "Boots", "Cap"],
  "Hobbies": ["Reading", "Painting", "Cooking", "Gaming", "Gardening", "Photography", "Dancing", "Singing", "Writing", "Fishing", "Hiking", "Knitting", "Collecting", "Camping", "Drawing", "Yoga", "Running", "Baking", "Crafting", "Cycling"],
  "School Subjects": ["Math", "Science", "History", "English", "Art", "Music", "Geography", "Chemistry", "Physics", "Biology", "Literature", "Economics", "Psychology", "Philosophy", "Drama", "Spanish", "French", "Algebra", "Geometry", "Calculus"],
  "Fruits": ["Apple", "Banana", "Orange", "Mango", "Strawberry", "Grape", "Watermelon", "Pineapple", "Peach", "Cherry", "Kiwi", "Lemon", "Blueberry", "Raspberry", "Coconut", "Papaya", "Pomegranate", "Plum", "Pear", "Apricot"],
  "Instruments": ["Guitar", "Piano", "Drums", "Violin", "Flute", "Trumpet", "Saxophone", "Cello", "Clarinet", "Harp", "Accordion", "Banjo", "Trombone", "Ukulele", "Harmonica", "Xylophone", "Tambourine", "Bagpipes", "Oboe", "Tuba"],
  "Buildings": ["House", "School", "Hospital", "Museum", "Library", "Church", "Theater", "Stadium", "Castle", "Temple", "Skyscraper", "Factory", "Warehouse", "Lighthouse", "Barn", "Observatory", "Prison", "Mansion", "Tower", "Monument"]
};

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
  const [cumulativeScores, setCumulativeScores] = useState([]);

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
      if (data.votes) {
        setVotes(new Map(data.votes));
      }
    }

    function onTimerUpdate(data) {
      setRemainingTime(data.remainingTime);
    }

    function onClueSubmitted(data) {
      setClues((prev) => [...prev, {
        playerId: data.playerId,
        playerName: data.playerName,
        clue: data.clue
      }]);
    }

    function onVoteSubmitted(data) {
      // Update votes display
      if (data.votes) {
        setVotes(new Map(data.votes));
      }
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
      // Store cumulative scores and show them
      if (data.cumulativeScores) {
        setCumulativeScores(data.cumulativeScores);
      }
      // Don't navigate away - let players see the final scores
      setGameState('ended');
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

  const handleSubmitClue = () => {
    if (!myClue.trim() || clueSubmitted) return;

    socket.emit('submit-clue', { clue: myClue.trim() }, (response) => {
      if (response.success) {
        setClueSubmitted(true);
      }
    });
  };

  const handleSubmitVote = (playerId) => {
    if (playerId === currentPlayer) return;

    // Allow changing vote during voting-complete phase
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

  const handleNewGame = () => {
    socket.emit('start-game', (response) => {
      if (!response.success) {
        console.error('Failed to start new game');
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
      case 'clue-complete':
        return 'All Clues Submitted!';
      case 'discussion':
        return 'Discussion Time';
      case 'voting':
        return 'Vote for the Girgit';
      case 'voting-complete':
        return 'Voting Complete - Discuss!';
      case 'resolution':
        return 'Round Results';
      case 'ended':
        return 'Game Complete!';
      default:
        return 'Game in Progress';
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Home Button and Logo */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors shadow-md"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-base font-semibold hidden sm:inline">Home</span>
          </button>

          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                🦎 Girgit
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-gray-800">Round {currentRound}</div>
                <div className="text-xs sm:text-sm text-gray-600">{getPhaseTitle()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling Secret Word List - Show only words from current category */}
        {category && WORDS_BY_CATEGORY[category] && (
          <div className="mb-4 overflow-hidden bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-lg border-2 border-purple-300 shadow-sm">
            <div className="py-2">
              <div className="flex animate-marquee whitespace-nowrap">
                <span className="text-sm sm:text-base font-semibold text-purple-800 mx-4">
                  🎯 {category} Words:
                </span>
                {WORDS_BY_CATEGORY[category].map((word, index) => (
                  <span key={index} className="text-sm sm:text-base text-gray-700 mx-2">
                    {word} •
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                <span className="text-sm sm:text-base font-semibold text-purple-800 mx-4">
                  🎯 {category} Words:
                </span>
                {WORDS_BY_CATEGORY[category].map((word, index) => (
                  <span key={`dup-${index}`} className="text-sm sm:text-base text-gray-700 mx-2">
                    {word} •
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Sidebar - Players & Timer */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
            <Card>
              <Timer seconds={remainingTime} />
            </Card>

            <Card>
              <PlayerList
                players={players}
                currentPlayerId={currentPlayer}
                clues={clues}
                votes={votes}
              />
            </Card>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Role & Word Card */}
            <Card>
              <div className="text-center space-y-3 sm:space-y-4">
                <div className={`inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-full text-base sm:text-xl font-bold ${
                  isChameleon
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isChameleon ? '🦎 You are the GIRGIT!' : '🕵️ You are NOT the Girgit'}
                </div>

                <div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Category</div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">{category}</div>
                </div>

                {!isChameleon && secretWord && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Secret Word</div>
                    <div className="text-3xl sm:text-4xl font-bold text-blue-600">{secretWord}</div>
                  </div>
                )}

                {isChameleon && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      You don't know the secret word! Try to blend in by giving a clue that fits the category.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Clue Phase */}
            {gameState === 'clue' && (
              <Card title="Submit Your Clue">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={myClue}
                      onChange={(e) => setMyClue(e.target.value)}
                      placeholder="Enter one word..."
                      className="input flex-1 text-base"
                      disabled={clueSubmitted}
                      maxLength={30}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue()}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSubmitClue}
                      disabled={!myClue.trim() || clueSubmitted}
                      className="w-full sm:w-auto"
                    >
                      {clueSubmitted ? 'Submitted ✓' : 'Submit'}
                    </Button>
                  </div>

                  <div className="text-xs sm:text-sm text-gray-600">
                    {clues.length} / {players.length} clues submitted
                  </div>

                  {clues.length > 0 && (
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Clues So Far:</h4>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                        {clues.map((clue, idx) => (
                          <div key={idx} className="bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                            <div className="text-xs text-gray-600 truncate">{clue.playerName}</div>
                            <div className="text-sm sm:text-base font-semibold truncate">{clue.clue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Clue Complete - Countdown to Voting */}
            {gameState === 'clue-complete' && (
              <Card title="All Clues Submitted!">
                <div className="space-y-4 text-center">
                  <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
                    <p className="text-lg sm:text-xl font-bold text-green-800 mb-2">
                      ✓ Everyone has submitted their clue!
                    </p>
                    <p className="text-sm sm:text-base text-green-700">
                      Voting starts in {remainingTime} seconds...
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-semibold mb-3">All Clues:</h4>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {clues.map((clue, idx) => (
                        <div key={idx} className="bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                          <div className="text-xs text-gray-600 truncate">{clue.playerName}</div>
                          <div className="text-sm sm:text-base font-semibold truncate">{clue.clue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Discussion Phase */}
            {gameState === 'discussion' && (
              <Card title="Discussion Time">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-gray-700">
                    Use the chat to discuss who you think is the Girgit!
                  </p>

                  <div>
                    <h4 className="text-sm sm:text-base font-semibold mb-2">All Clues:</h4>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {clues.map((clue, idx) => (
                        <div key={idx} className="bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                          <div className="text-xs text-gray-600 truncate">{clue.playerName}</div>
                          <div className="text-sm sm:text-base font-semibold truncate">{clue.clue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Voting Phase */}
            {gameState === 'voting' && (
              <Card title="Vote for the Girgit">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-gray-700">
                    Click on a player to vote for them as the Girgit:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {players.filter(p => p.id !== currentPlayer).map((player) => (
                      <Button
                        key={player.id}
                        variant={myVote === player.id ? 'success' : 'secondary'}
                        onClick={() => handleSubmitVote(player.id)}
                        disabled={myVote !== null}
                        className="w-full text-sm sm:text-base py-3"
                      >
                        {player.name}
                        {myVote === player.id && ' ✓'}
                      </Button>
                    ))}
                  </div>

                  {myVote && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center text-sm sm:text-base">
                      Vote submitted! Waiting for others...
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Voting Complete - Discussion Period */}
            {gameState === 'voting-complete' && (
              <Card title="All Votes Submitted!">
                <div className="space-y-4 text-center">
                  <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
                    <p className="text-lg sm:text-xl font-bold text-yellow-800 mb-2">
                      ✓ Everyone has voted!
                    </p>
                    <p className="text-sm sm:text-base text-yellow-700">
                      Discuss and change your vote if needed.
                    </p>
                    <p className="text-lg font-bold text-yellow-900 mt-2">
                      Results in {remainingTime} seconds...
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      You can still change your vote using the chat or by re-voting!
                    </p>
                  </div>

                  {/* Allow re-voting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players.filter(p => p.id !== currentPlayer).map((player) => (
                      <Button
                        key={player.id}
                        variant={myVote === player.id ? 'success' : 'secondary'}
                        onClick={() => handleSubmitVote(player.id)}
                        className="w-full text-sm py-2"
                      >
                        {player.name}
                        {myVote === player.id && ' ✓'}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Game Ended - Show Final Cumulative Scores */}
            {gameState === 'ended' && (
              <Card title="🏆 Game Complete!">
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                      Game Complete!
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      Final scores have been updated
                    </p>
                  </div>

                  {/* Cumulative Scores */}
                  {cumulativeScores.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-300">
                      <h3 className="text-lg sm:text-xl font-bold text-center mb-3 text-blue-800">
                        Overall Leaderboard
                      </h3>
                      <div className="space-y-2">
                        {cumulativeScores
                          .sort((a, b) => b.totalScore - a.totalScore)
                          .map((player, index) => (
                            <div
                              key={player.playerName}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                index === 0
                                  ? 'bg-yellow-100 border-2 border-yellow-400'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl sm:text-2xl font-bold text-gray-700">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                </span>
                                <div>
                                  <div className="font-bold text-sm sm:text-base">{player.playerName}</div>
                                  <div className="text-xs text-gray-600">
                                    +{player.gameScore} this game
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                  {player.totalScore}
                                </div>
                                <div className="text-xs text-gray-500">total</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Return to Lobby Button */}
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/room/${roomCode}`)}
                    className="w-full text-lg"
                  >
                    Return to Lobby
                  </Button>
                </div>
              </Card>
            )}

            {/* Resolution Phase */}
            {gameState === 'resolution' && roundResult && (
              <Card title="Round Results">
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold mb-2">
                      The Girgit was: {players.find(p => p.id === roundResult.chameleonId)?.name}
                    </div>
                    <div className="text-base sm:text-xl">
                      Most votes went to: {players.find(p => p.id === roundResult.suspectedChameleon)?.name}
                    </div>
                    {roundResult.chameleonCaught ? (
                      <div className="mt-2 text-green-600 font-bold">
                        ✓ Girgit caught!
                      </div>
                    ) : (
                      <div className="mt-2 text-red-600 font-bold">
                        ✗ Girgit escaped!
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-600">Secret Word</div>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{roundResult.secretWord}</div>
                    </div>
                  </div>
                  
                  {roundResult.chameleonCaught && isChameleon && !roundResult.guess && (
                    <div className="space-y-3">
                      <p className="text-center text-sm sm:text-base font-semibold">
                        You were caught! Guess the secret word to redeem yourself:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={chameleonGuess}
                          onChange={(e) => setChameleonGuess(e.target.value)}
                          placeholder="Your guess..."
                          className="input flex-1 text-base"
                          maxLength={50}
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
                        />
                        <Button
                          variant="primary"
                          onClick={handleSubmitGuess}
                          disabled={!chameleonGuess.trim()}
                          className="w-full sm:w-auto"
                        >
                          Guess
                        </Button>
                      </div>
                    </div>
                  )}

                  {roundResult.guess && (
                    <div className={`p-3 sm:p-4 rounded-lg text-center ${
                      roundResult.guessCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="text-lg sm:text-xl font-bold">
                        Girgit guessed: "{roundResult.guess}"
                      </div>
                      <div className="text-base sm:text-lg mt-2">
                        {roundResult.guessCorrect ? '✓ Correct! Girgit wins!' : '✗ Wrong! Others win!'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                    {/* New Game button - available to all players */}
                    <Button
                      variant="success"
                      onClick={handleNewGame}
                      className="w-full"
                    >
                      Start New Game
                    </Button>
 
                  </div>
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
