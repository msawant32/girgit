import { GameRoom } from '../game/GameRoom.js';
import {
  createGame,
  endGame,
  addGamePlayer,
  addGameRound,
  getRecentGames,
  getGameDetails,
  getPlayerScore,
  updatePlayerScore
} from '../database/db.js';

const rooms = new Map(); // roomCode -> GameRoom
const socketToRoom = new Map(); // socketId -> roomCode
const gameIdMap = new Map(); // roomCode -> databaseGameId

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setupSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create room
    socket.on('create-room', (playerName, callback) => {
      try {
        let roomCode = generateRoomCode();
        // Ensure unique code
        while (rooms.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        const room = new GameRoom(roomCode, socket.id);
        const player = room.addPlayer(socket.id, playerName);

        rooms.set(roomCode, room);
        socketToRoom.set(socket.id, roomCode);

        socket.join(roomCode);

        callback({ success: true, roomCode, player });
        console.log(`Room created: ${roomCode} by ${playerName}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Join room
    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      try {
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (room.gameState !== 'waiting') {
          return callback({ success: false, error: 'Game already in progress' });
        }

        // Check for duplicate names
        const existingPlayer = Array.from(room.players.values()).find(
          p => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (existingPlayer) {
          return callback({ success: false, error: 'Player name already taken' });
        }

        const player = room.addPlayer(socket.id, playerName);
        socketToRoom.set(socket.id, roomCode);

        socket.join(roomCode);

        // Notify all players in room
        io.to(roomCode).emit('player-joined', {
          player,
          players: room.getPlayers()
        });

        callback({ success: true, player, gameState: room.getGameState() });
        console.log(`${playerName} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Rejoin room
    socket.on('rejoin-room', ({ roomCode, playerName }, callback) => {
      try {
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found or game has ended' });
        }

        // Check if player name matches an existing player
        const existingPlayer = Array.from(room.players.values()).find(
          p => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (!existingPlayer) {
          return callback({ success: false, error: 'Player not found in this room' });
        }

        // Remove old socket association if exists
        const oldSocket = Array.from(room.players.entries()).find(
          ([_, p]) => p.name === playerName
        )?.[0];

        if (oldSocket && oldSocket !== socket.id) {
          room.removePlayer(oldSocket);
          socketToRoom.delete(oldSocket);
        }

        // Add player with new socket
        const player = room.addPlayer(socket.id, playerName);
        socketToRoom.set(socket.id, roomCode);
        socket.join(roomCode);

        // Notify all players
        io.to(roomCode).emit('player-joined', {
          player,
          players: room.getPlayers()
        });

        callback({ success: true, player, gameState: room.getGameState(), rejoined: true });
        console.log(`${playerName} rejoined room ${roomCode}`);
      } catch (error) {
        console.error('Error rejoining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Start game
    socket.on('start-game', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // Only host can start initial game
        if (room.gameState === 'waiting' && socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can start initial game' });
        }

        // After game ends or in resolution, anyone can start a new game
        if (room.gameState === 'ended' || room.gameState === 'resolution') {
          room.resetToWaiting();
        }

        if (!room.canStartGame()) {
          return callback({ success: false, error: 'Need at least 3 players' });
        }

        // Create game in database
        const gameId = createGame(roomCode);
        gameIdMap.set(roomCode, gameId);

        room.startGame();

        // Notify all players
        io.to(roomCode).emit('game-started', {
          currentRound: room.currentRound
        });

        // Start setup phase
        setTimeout(() => {
          room.startCluePhase();
          sendRoundUpdate(io, roomCode, room);
        }, 5000);

        callback({ success: true });
        console.log(`Game started in room ${roomCode}`);
      } catch (error) {
        console.error('Error starting game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit clue
    socket.on('submit-clue', ({ clue }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || room.gameState !== 'clue') {
          return callback({ success: false, error: 'Invalid game state' });
        }

        const success = room.submitClue(socket.id, clue);

        if (!success) {
          return callback({ success: false, error: 'Could not submit clue' });
        }

        // Broadcast clue to all players
        io.to(roomCode).emit('clue-submitted', {
          playerId: socket.id,
          playerName: room.players.get(socket.id).name,
          clue,
          cluesCount: room.clues.length,
          totalPlayers: room.players.size
        });

        callback({ success: true });

        // If all clues submitted, wait 10 seconds then move to voting
        if (room.clues.length === room.players.size) {
          // Set a 10-second countdown before voting
          room.timerEndTime = Date.now() + 10000;
          room.gameState = 'clue-complete';

          io.to(roomCode).emit('game-state-update', {
            gameState: 'clue-complete',
            players: room.getPlayers(),
            remainingTime: 10
          });

          // Start countdown timer
          const countdownInterval = setInterval(() => {
            const remaining = room.getRemainingTime();
            io.to(roomCode).emit('timer-update', { remainingTime: remaining });

            if (remaining <= 0) {
              clearInterval(countdownInterval);
              room.startVotingPhase();
              sendGameStateUpdate(io, roomCode, room);
              startVotingTimer(io, roomCode, room);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error submitting clue:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit vote
    socket.on('submit-vote', ({ votedForId }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || (room.gameState !== 'voting' && room.gameState !== 'voting-complete')) {
          return callback({ success: false, error: 'Invalid game state' });
        }

        const success = room.submitVote(socket.id, votedForId);

        if (!success) {
          return callback({ success: false, error: 'Invalid vote' });
        }

        io.to(roomCode).emit('vote-submitted', {
          voterId: socket.id,
          votesCount: room.votes.size,
          totalPlayers: room.players.size,
          votes: Array.from(room.votes.entries())
        });

        callback({ success: true });

        // If all votes submitted, start 1-minute discussion before resolving
        if (room.votes.size === room.players.size) {
          room.gameState = 'voting-complete';
          room.timerEndTime = Date.now() + 60000; // 1 minute

          io.to(roomCode).emit('game-state-update', {
            gameState: 'voting-complete',
            players: room.getPlayers(),
            remainingTime: 60,
            votes: Array.from(room.votes.entries())
          });

          // Start countdown timer
          const discussInterval = setInterval(() => {
            const remaining = room.getRemainingTime();
            io.to(roomCode).emit('timer-update', { remainingTime: remaining });

            if (remaining <= 0) {
              clearInterval(discussInterval);
              resolveRound(io, roomCode, room);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit chameleon guess
    socket.on('submit-guess', ({ guess }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || room.gameState !== 'resolution') {
          return callback({ success: false, error: 'Invalid game state' });
        }

        if (socket.id !== room.chameleonId) {
          return callback({ success: false, error: 'Only chameleon can guess' });
        }

        const result = room.submitChameleonGuess(guess);

        io.to(roomCode).emit('chameleon-guessed', {
          guess,
          isCorrect: result.isCorrect,
          secretWord: result.secretWord,
          scores: room.getGameState().scores
        });

        callback({ success: true, ...result });
      } catch (error) {
        console.error('Error submitting guess:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Next round
    socket.on('next-round', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can start next round' });
        }

        room.nextRound();

        io.to(roomCode).emit('round-started', {
          currentRound: room.currentRound
        });

        // Start clue phase after setup delay
        setTimeout(() => {
          room.startCluePhase();
          sendRoundUpdate(io, roomCode, room);
        }, 5000);

        callback({ success: true });
      } catch (error) {
        console.error('Error starting next round:', error);
        callback({ success: false, error: error.message });
      }
    });

    // End game
    socket.on('end-game', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can end game' });
        }

        const gameResult = room.endGame();

        // Save to database and update cumulative scores
        const gameId = gameIdMap.get(roomCode);
        if (gameId) {
          endGame(gameId, room.currentRound);

          // Save players and update cumulative scores
          for (const playerScore of gameResult.finalScores) {
            addGamePlayer(gameId, playerScore.playerName, playerScore.score);
            updatePlayerScore(playerScore.playerName, playerScore.score);
          }

          // Save rounds
          for (const round of room.roundHistory) {
            addGameRound(gameId, round);
          }

          gameIdMap.delete(roomCode);
        }

        // Get updated cumulative scores for all players
        const cumulativeScores = gameResult.finalScores.map(ps => ({
          playerName: ps.playerName,
          gameScore: ps.score,
          totalScore: getPlayerScore(ps.playerName)
        }));

        io.to(roomCode).emit('game-ended', {
          ...gameResult,
          cumulativeScores
        });

        callback({ success: true, gameResult, cumulativeScores });
      } catch (error) {
        console.error('Error ending game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Chat message
    socket.on('chat-message', ({ message }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        const player = room.players.get(socket.id);
        if (!player) {
          return callback({ success: false, error: 'Player not found' });
        }

        io.to(roomCode).emit('chat-message', {
          playerId: socket.id,
          playerName: player.name,
          message,
          timestamp: Date.now()
        });

        callback({ success: true });
      } catch (error) {
        console.error('Error sending chat message:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Get game history
    socket.on('get-game-history', (callback) => {
      try {
        const games = getRecentGames(20);
        callback({ success: true, games });
      } catch (error) {
        console.error('Error getting game history:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Get game details
    socket.on('get-game-details', ({ gameId }, callback) => {
      try {
        const game = getGameDetails(gameId);
        if (!game) {
          return callback({ success: false, error: 'Game not found' });
        }
        callback({ success: true, game });
      } catch (error) {
        console.error('Error getting game details:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          const player = room.players.get(socket.id);
          const newHostId = room.removePlayer(socket.id);

          // Notify others
          io.to(roomCode).emit('player-left', {
            playerId: socket.id,
            playerName: player?.name,
            players: room.getPlayers(),
            newHostId
          });

          // Clean up empty rooms
          if (room.players.size === 0) {
            rooms.delete(roomCode);
            gameIdMap.delete(roomCode);
            console.log(`Room ${roomCode} deleted (empty)`);
          }
        }
        socketToRoom.delete(socket.id);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

function sendRoundUpdate(io, roomCode, room) {
  const players = Array.from(room.players.values());

  players.forEach(player => {
    const isChameleon = player.id === room.chameleonId;
    io.to(player.id).emit('round-update', {
      gameState: room.gameState,
      currentRound: room.currentRound,
      category: room.category,
      secretWord: isChameleon ? null : room.secretWord,
      isChameleon,
      players: room.getPlayers(),
      remainingTime: room.getRemainingTime()
    });
  });

  startClueTimer(io, roomCode, room);
}

function sendGameStateUpdate(io, roomCode, room) {
  io.to(roomCode).emit('game-state-update', room.getGameState());
}

function startClueTimer(io, roomCode, room) {
  const interval = setInterval(() => {
    const remaining = room.getRemainingTime();
    io.to(roomCode).emit('timer-update', { remainingTime: remaining });

    if (remaining <= 0) {
      clearInterval(interval);
      if (room.gameState === 'clue') {
        room.startDiscussionPhase();
        sendGameStateUpdate(io, roomCode, room);
        startDiscussionTimer(io, roomCode, room);
      }
    }
  }, 1000);
}

function startDiscussionTimer(io, roomCode, room) {
  const interval = setInterval(() => {
    const remaining = room.getRemainingTime();
    io.to(roomCode).emit('timer-update', { remainingTime: remaining });

    if (remaining <= 0) {
      clearInterval(interval);
      if (room.gameState === 'discussion') {
        room.startVotingPhase();
        sendGameStateUpdate(io, roomCode, room);
        startVotingTimer(io, roomCode, room);
      }
    }
  }, 1000);
}

function startVotingTimer(io, roomCode, room) {
  const interval = setInterval(() => {
    const remaining = room.getRemainingTime();
    io.to(roomCode).emit('timer-update', { remainingTime: remaining });

    if (remaining <= 0) {
      clearInterval(interval);
      if (room.gameState === 'voting' && room.votes.size < room.players.size) {
        resolveRound(io, roomCode, room);
      }
    }
  }, 1000);
}

function resolveRound(io, roomCode, room) {
  const result = room.resolveRound();

  // If chameleon not caught, award points
  if (!result.chameleonCaught) {
    room.awardPointsNoCatch();
  }

  io.to(roomCode).emit('round-resolved', {
    ...result,
    category: room.category,
    secretWord: room.secretWord,
    scores: room.getGameState().scores,
    needsChameleonGuess: result.chameleonCaught
  });
}
