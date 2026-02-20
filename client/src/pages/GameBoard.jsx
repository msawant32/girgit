import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import { Logo } from '../components/Logo';
import socket from '../utils/socket';

// Secret words organized by category (mirrors server WORD_DATABASE)
const WORDS_BY_CATEGORY = {
  // USA
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
  "Buildings": ["House", "School", "Hospital", "Museum", "Library", "Church", "Theater", "Stadium", "Castle", "Temple", "Skyscraper", "Factory", "Warehouse", "Lighthouse", "Barn", "Observatory", "Prison", "Mansion", "Tower", "Monument"],
  // India
  "Hindi Movies": ["Sholay", "Dilwale", "Lagaan", "Mughal-E-Azam", "Mother India", "Deewar", "Zanjeer", "Don", "Tezaab", "Baazigar", "Kuch Kuch Hota Hai", "Kabhi Khushi Kabhie Gham", "Devdas", "Sarkar", "Gangs of Wasseypur", "3 Idiots", "PK", "Dangal", "Bahubali", "RRR"],
  "Indian States": ["Maharashtra", "Rajasthan", "Tamil Nadu", "Kerala", "Gujarat", "Punjab", "Uttar Pradesh", "West Bengal", "Madhya Pradesh", "Karnataka", "Andhra Pradesh", "Telangana", "Odisha", "Bihar", "Assam", "Haryana", "Himachal Pradesh", "Goa", "Jharkhand", "Uttarakhand"],
  "Indian Cities": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Vadodara", "Patna", "Bhopal", "Agra", "Varanasi", "Amritsar"],
  "Indian Food": ["Biryani", "Dosa", "Butter Chicken", "Paneer Tikka", "Dal Makhani", "Chole Bhature", "Pani Puri", "Vada Pav", "Idli Sambar", "Rajma Chawal", "Palak Paneer", "Aloo Paratha", "Gulab Jamun", "Jalebi", "Kheer", "Samosa", "Pav Bhaji", "Dhokla", "Rogan Josh", "Biryani"],
  "Indian Festivals": ["Diwali", "Holi", "Eid", "Navratri", "Durga Puja", "Ganesh Chaturthi", "Onam", "Pongal", "Baisakhi", "Makar Sankranti", "Lohri", "Raksha Bandhan", "Janmashtami", "Christmas", "Ugadi", "Bihu", "Rath Yatra", "Dussehra", "Teej", "Karva Chauth"],
  "Indian Monuments": ["Taj Mahal", "Red Fort", "Qutub Minar", "India Gate", "Gateway of India", "Hawa Mahal", "Mysore Palace", "Charminar", "Konark Temple", "Ajanta Caves", "Ellora Caves", "Hampi", "Jantar Mantar", "Victoria Memorial", "Golden Temple", "Lotus Temple", "Sanchi Stupa", "Fatehpur Sikri", "Amber Fort", "Khajuraho"],
  "Indian Cricketers": ["Sachin Tendulkar", "Virat Kohli", "MS Dhoni", "Rohit Sharma", "Kapil Dev", "Sunil Gavaskar", "Rahul Dravid", "Sourav Ganguly", "Anil Kumble", "Harbhajan Singh", "Yuvraj Singh", "Zaheer Khan", "VVS Laxman", "Shikhar Dhawan", "Jasprit Bumrah", "Ravindra Jadeja", "KL Rahul", "Hardik Pandya", "Rishabh Pant", "Mohammed Shami"],
  "Bollywood Actors": ["Amitabh Bachchan", "Shah Rukh Khan", "Salman Khan", "Aamir Khan", "Akshay Kumar", "Ranbir Kapoor", "Ranveer Singh", "Hrithik Roshan", "Ajay Devgn", "Varun Dhawan", "Deepika Padukone", "Priyanka Chopra", "Kareena Kapoor", "Alia Bhatt", "Katrina Kaif", "Madhuri Dixit", "Kajol", "Aishwarya Rai", "Taapsee Pannu", "Kangana Ranaut"],
  "Indian Dances": ["Bharatanatyam", "Kathak", "Odissi", "Kuchipudi", "Manipuri", "Mohiniyattam", "Sattriya", "Garba", "Bhangra", "Lavani", "Bihu", "Gidda", "Yakshagana", "Chhau", "Dollu Kunitha", "Kolattam", "Dandiya", "Fugdi", "Rouf", "Nati"],
  "Indian Languages": ["Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese", "Maithili", "Urdu", "Sanskrit", "Konkani", "Sindhi", "Kashmiri", "Nepali", "Manipuri", "Bodo"],
  "Indian Spices": ["Turmeric", "Cumin", "Coriander", "Cardamom", "Cinnamon", "Cloves", "Mustard Seeds", "Fenugreek", "Asafoetida", "Saffron", "Black Pepper", "Red Chilli", "Star Anise", "Bay Leaf", "Mace", "Ajwain", "Fennel", "Nutmeg", "Kokum", "Tamarind"],
  "Indian Rivers": ["Ganga", "Yamuna", "Brahmaputra", "Godavari", "Krishna", "Kaveri", "Narmada", "Mahanadi", "Tapti", "Indus", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Chambal", "Betwa", "Ken", "Damodar", "Sabarmati"],
  "Indian Street Food": ["Pani Puri", "Bhel Puri", "Sev Puri", "Dahi Puri", "Pav Bhaji", "Vada Pav", "Dabeli", "Kachori", "Aloo Tikki", "Chaat", "Samosa", "Jalebi", "Lassi", "Sugarcane Juice", "Cutting Chai", "Momos", "Rolls", "Frankie", "Kulfi", "Rabri"],
  "Indian Gods": ["Vishnu", "Shiva", "Brahma", "Ganesha", "Hanuman", "Krishna", "Rama", "Durga", "Lakshmi", "Saraswati", "Kali", "Parvati", "Indra", "Surya", "Kartikeya", "Ayyappa", "Murugan", "Venkateswara", "Jagannath", "Nataraja"],
  "Indian Animals": ["Bengal Tiger", "Indian Elephant", "Snow Leopard", "One-Horned Rhinoceros", "Asiatic Lion", "Indian Peacock", "King Cobra", "Mugger Crocodile", "Indian Bison", "Blackbuck", "Nilgai", "Sloth Bear", "Indian Pangolin", "Gharial", "Red Panda", "Great Indian Bustard", "Indian Wild Dog", "Irrawaddy Dolphin", "Hoolock Gibbon", "Chinkara"],
  "Indian Clothing": ["Saree", "Kurta", "Salwar Kameez", "Dhoti", "Sherwani", "Lehenga", "Dupatta", "Lungi", "Angrakha", "Bandhgala", "Patola", "Banarasi Silk", "Phulkari", "Kanjivaram", "Mekhela Chador", "Mundu", "Pheran", "Ghagra", "Anarkali", "Jodhpuri"],
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
  const [startingNewGame, setStartingNewGame] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);

  // Update currentPlayer on reconnect
  useEffect(() => {
    const onConnect = () => setCurrentPlayer(socket.id);
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, []);

  useEffect(() => {
    // Rejoin room on page refresh
    const needsRejoin = players.length === 0;
    if (needsRejoin) {
      setIsRejoining(true);
      const savedPlayerName = localStorage.getItem('lastPlayerName');
      const savedRoomCode = localStorage.getItem('lastRoomCode');

      if (savedPlayerName && savedRoomCode === roomCode) {
        const attemptRejoin = () => {
          socket.emit('rejoin-room', { roomCode, playerName: savedPlayerName }, (response) => {
            setIsRejoining(false);
            if (response && response.success) {
              const state = response.gameState;
              if (state.gameState === 'waiting') {
                navigate(`/room/${roomCode}`);
              } else {
                setPlayers(state.players);
                const myPlayer = state.players.find(p => p.name === savedPlayerName);
                if (myPlayer) {
                  setIsHost(myPlayer.isHost);
                }
              }
            } else {
              navigate('/');
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
      setStartingNewGame(false);
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

    function onVotingTiebreak(data) {
      setGameState('voting-tiebreak');
      setRemainingTime(data.remainingTime);
      setMyVote(null); // Allow revoting
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
    socket.on('voting-tiebreak', onVotingTiebreak);
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
      socket.off('voting-tiebreak', onVotingTiebreak);
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

  const handleSubmitClue = (onBehalfOf = null) => {
    const clueText = myClue.trim();
    if (!clueText) return;
    if (!onBehalfOf && clueSubmitted) return;

    const clueData = onBehalfOf
      ? { clue: clueText, onBehalfOf }
      : { clue: clueText };

    socket.emit('submit-clue', clueData, (response) => {
      if (response.success) {
        if (!onBehalfOf) {
          setClueSubmitted(true);
        } else {
          // Only clear input when submitting on behalf of others
          setMyClue('');
        }
      }
    });
  };

  const handleSubmitVote = (playerId, onBehalfOf = null) => {
    if (playerId === currentPlayer && !onBehalfOf) return;

    // Allow changing vote during voting-complete phase
    const voteData = onBehalfOf
      ? { votedForId: playerId, onBehalfOf }
      : { votedForId: playerId };

    socket.emit('submit-vote', voteData, (response) => {
      if (response.success) {
        if (!onBehalfOf) {
          setMyVote(playerId);
        }
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
    setStartingNewGame(true);
    socket.emit('start-game', (response) => {
      if (!response.success) {
        console.error('Failed to start new game');
        setStartingNewGame(false);
      }
      // Will be reset when game starts via onRoundUpdate
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
      case 'voting-tiebreak':
        return 'TIE! Vote Again!';
      case 'resolution':
        return 'Results';
      case 'ended':
        return 'Game Complete!';
      default:
        return 'Game in Progress';
    }
  };

  if (isRejoining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">Reconnecting...</div>
          <div className="text-sm text-gray-500">Restoring game state</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Centered Logo and Right-aligned Room Info */}
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

            {/* Centered Logo + Timer */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <Logo size="medium" clickable={true} onClick={() => navigate('/')} />
              {remainingTime > 0 && (
                <Timer seconds={remainingTime} />
              )}
            </div>

            {/* Round Info & Room Code */}
            <div className="flex-1 flex items-center justify-end gap-3 text-right">
              <div className="flex flex-col items-end gap-2">
                {/* Phase Info at top */}
                <div className="flex flex-col items-end">
                  <div className="text-xs font-bold text-gray-700">{getPhaseTitle()}</div>
                </div>
                {/* Room Info below */}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Sidebar - Players */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
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

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">Category</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">{category}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">Secret Word</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                      {isChameleon ? '\u00a0' : secretWord}
                    </div>
                  </div>
                </div>

                {/* Auto-Scrolling Word List */}
                {category && WORDS_BY_CATEGORY[category] && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Secret Word List</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  <div className="overflow-hidden rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 py-2 relative">
                    <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-purple-50 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-purple-50 to-transparent z-10 pointer-events-none" />
                    <div className="flex animate-scroll-left whitespace-nowrap w-max">
                      {[...WORDS_BY_CATEGORY[category], ...WORDS_BY_CATEGORY[category]].map((word, index) => (
                        <span key={index} className="text-xs font-medium text-purple-700 mx-3">{word}</span>
                      ))}
                    </div>
                  </div>
                  </div>
                )}

                {isChameleon && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      You don't know the secret word! Refer above list. Try to blend in by giving a clue that fits the category.
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
                      onClick={() => handleSubmitClue()}
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

                  {/* Host controls - submit clues on behalf of players */}
                  {isHost && clues.length < players.length && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="bg-orange-50 border-2 border-orange-300 p-3 rounded-lg">
                        <h4 className="font-bold text-orange-800 mb-2">🔑 Host Controls</h4>
                        <p className="text-sm text-orange-700 mb-3">
                          Submit clues on behalf of players who haven't submitted:
                        </p>
                        {players.filter(p => !clues.find(c => c.playerId === p.id)).map((player) => (
                          <details key={player.id} className="mb-2">
                            <summary className="cursor-pointer bg-white p-2 rounded border border-orange-200 text-sm font-semibold text-orange-800">
                              Submit clue for {player.name}
                            </summary>
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={myClue}
                                onChange={(e) => setMyClue(e.target.value)}
                                placeholder="Enter clue..."
                                className="input flex-1 text-sm"
                                maxLength={30}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue(player.id)}
                              />
                              <button
                                onClick={() => handleSubmitClue(player.id)}
                                disabled={!myClue.trim()}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-colors"
                              >
                                Submit
                              </button>
                            </div>
                          </details>
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
                    <p className="text-lg sm:text-xl font-bold text-green-800">
                      ✓ Everyone has submitted their clue! Voting starts soon...
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
              <Card title="Vote for the Girgit:">
                <div className="space-y-3 sm:space-y-4">
                   

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

                  {/* Host voting on behalf of others */}
                  {isHost && votes.size < players.length && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="bg-orange-50 border-2 border-orange-300 p-3 rounded-lg">
                        <h4 className="font-bold text-orange-800 mb-2">🔑 Host Controls</h4>
                        <p className="text-sm text-orange-700 mb-3">
                          Vote on behalf of players who haven't voted:
                        </p>
                        {players.filter(p => !votes.has(p.id)).map((player) => (
                          <details key={player.id} className="mb-2">
                            <summary className="cursor-pointer bg-white p-2 rounded border border-orange-200 text-sm font-semibold text-orange-800">
                              Vote for {player.name}
                            </summary>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {players.filter(p => p.id !== player.id).map((target) => (
                                <button
                                  key={target.id}
                                  onClick={() => handleSubmitVote(target.id, player.id)}
                                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors"
                                >
                                  {target.name}
                                </button>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
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
                     
                    <p className="text-sm sm:text-base text-yellow-700">
                      Discuss using chat and change your vote if needed.
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

                  {/* Host voting on behalf of others during discussion */}
                  {isHost && votes.size < players.length && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="bg-orange-50 border-2 border-orange-300 p-3 rounded-lg">
                        <h4 className="font-bold text-orange-800 mb-2">🔑 Host Controls</h4>
                        <p className="text-sm text-orange-700 mb-3">
                          Vote on behalf of players who haven't voted:
                        </p>
                        {players.filter(p => !votes.has(p.id)).map((player) => (
                          <details key={player.id} className="mb-2">
                            <summary className="cursor-pointer bg-white p-2 rounded border border-orange-200 text-sm font-semibold text-orange-800">
                              Vote for {player.name}
                            </summary>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {players.filter(p => p.id !== player.id).map((target) => (
                                <button
                                  key={target.id}
                                  onClick={() => handleSubmitVote(target.id, player.id)}
                                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors"
                                >
                                  {target.name}
                                </button>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Voting Tiebreak */}
            {gameState === 'voting-tiebreak' && (
              <Card title="🔄 TIE! Vote Again!">
                <div className="space-y-4 text-center">
                  <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                    <p className="text-lg sm:text-xl font-bold text-red-800 mb-2">
                      ⚠️ No clear decision!
                    </p>
                    <p className="text-sm sm:text-base text-red-700">
                      There's a tie in voting. Vote again to break the tie!
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-sm font-semibold text-orange-800">
                      ⚡ If still tied after this vote, the Girgit wins automatically!
                    </p>
                  </div>

                  {/* Tiebreak voting */}
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
              <Card>
                <div className="space-y-3 sm:space-y-4">
                  {roundResult.chameleonCaught ? (
                    <div className="animate-celebrate text-center py-4 px-4 rounded-xl animate-rainbow text-white shadow-lg">
                      <div className="text-xl sm:text-2xl font-black">
                        🎉 Girgit Caught: {players.find(p => p.id === roundResult.chameleonId)?.name} 🎉
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 px-4 rounded-xl bg-gray-800 text-white shadow-lg space-y-1">
                      <div className="text-xl sm:text-2xl font-black">🦎 Girgit Escaped!</div>
                      <div className="text-sm font-semibold opacity-80">
                        Most votes: {players.find(p => p.id === roundResult.suspectedChameleon)?.name || 'No clear vote'}
                      </div>
                    </div>
                  )}

                  {(!isChameleon || roundResult.guess) && (
                    <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600 font-medium">Secret Word:</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">{roundResult.secretWord}</span>
                    </div>
                  )}
                  
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
                      disabled={startingNewGame}
                      className="w-full"
                    >
                      {startingNewGame ? 'Starting Game...' : 'Start New Game'}
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
