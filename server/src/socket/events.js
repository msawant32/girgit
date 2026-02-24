import { GameRoom } from '../game/GameRoom.js';
import {
  createGame,
  endGame,
  addGamePlayer,
  addGameRound,
  saveClue,
  saveVote,
  getRecentGames,
  getGamesByRoom,
  getGameDetails,
  getPlayerScore,
  updatePlayerScore,
  addRoomParticipant,
  updateRoomHost
} from '../database/db.js';

const rooms = new Map(); // roomCode -> GameRoom
const socketToRoom = new Map(); // socketId -> roomCode
const gameIdMap = new Map(); // roomCode -> databaseGameId
const disconnectTimers = new Map(); // socketId -> { timer, playerName, roomCode }

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setupSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Auto-reconnect if session has active game data
    const session = socket.request.session;
    if (session && session.roomCode && session.playerName) {
      const room = rooms.get(session.roomCode);

      if (!room) {
        // Room not found - clear session and notify client
        console.log(`Room ${session.roomCode} not found for ${session.playerName}, clearing session`);
        session.roomCode = null;
        session.playerName = null;
        session.save();

        socket.emit('room-expired', {
          message: 'Room no longer exists. Please create or join a new room.'
        });
        return;
      }

      // Check if player exists in room
      const existingPlayer = Array.from(room.players.values()).find(
        p => p.name === session.playerName
      );

      if (existingPlayer) {
        console.log(`Auto-reconnecting ${session.playerName} to room ${session.roomCode}`);

        // Find old socket ID
        const oldSocketId = Array.from(room.players.entries()).find(
          ([_, p]) => p.name === session.playerName
        )?.[0];

        if (oldSocketId && oldSocketId !== socket.id) {
          // Cancel any pending disconnect timer
          const pendingDisconnect = disconnectTimers.get(oldSocketId);
          if (pendingDisconnect) {
            clearTimeout(pendingDisconnect.timer);
            disconnectTimers.delete(oldSocketId);
          }

          // Update socket ID while preserving player state (including host status)
          room.updatePlayerSocketId(oldSocketId, socket.id, session.playerName);
          socketToRoom.delete(oldSocketId);
        } else if (!oldSocketId) {
          // Player data exists but no socket - add player back
          room.addPlayer(socket.id, session.playerName);
        }

        socketToRoom.set(socket.id, session.roomCode);
        socket.join(session.roomCode);

        // Ensure there's always a host
        const reconnectHostChanged = room.ensureHost();
        room.saveState();
        if (reconnectHostChanged) {
          const newHost = room.players.get(room.hostId);
          if (newHost) updateRoomHost(session.roomCode, newHost.name).catch(err => console.error('Failed to update room host:', err));
        }

        // Notify client of successful auto-reconnection with full state
        const fullState = room.getFullState(socket.id);
        socket.emit('auto-reconnected', {
          roomCode: session.roomCode,
          playerName: session.playerName,
          gameState: fullState
        });

        // If game is active, also emit round-update so GameBoard fully hydrates
        if (room.gameState !== 'waiting' && room.gameState !== 'ended') {
          const isChameleon = socket.id === room.chameleonId;
          socket.emit('round-update', {
            gameState: room.gameState,
            currentRound: room.currentRound,
            category: room.category,
            secretWord: isChameleon ? null : room.secretWord,
            isChameleon,
            players: room.getPlayers(),
            remainingTime: room.getRemainingTime(),
            roundHistory: room.roundHistory,
            // Preserve current clues/votes - don't reset
            existingClues: room.clues,
            existingVotes: Array.from(room.votes.entries()),
            myClue: room.clues.find(c => c.playerId === socket.id)?.clue || null,
            myVote: room.votes.get(socket.id) || null
          });
        } else if (room.gameState === 'ended') {
          // Re-emit game-ended for late reconnect
          socket.emit('game-state-update', {
            gameState: 'ended',
            players: room.getPlayers(),
            remainingTime: 0
          });
        }

        // Notify OTHER players that this player reconnected (not the reconnecting player themselves)
        socket.broadcast.to(session.roomCode).emit('player-reconnected', {
          playerId: socket.id,
          playerName: session.playerName,
          players: room.getPlayers()
        });
      } else {
        // Player not in room - clear session
        console.log(`Player ${session.playerName} not found in room ${session.roomCode}, clearing session`);
        session.roomCode = null;
        session.playerName = null;
        session.save();

        socket.emit('room-expired', {
          message: 'You are no longer in this room. Please create or join a new room.'
        });
      }
    }

    // Create room
    socket.on('create-room', ({ playerName, country }, callback) => {
      try {
        const selectedCountry = country || 'USA';
        let roomCode = generateRoomCode();
        // Ensure unique code
        while (rooms.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        const room = new GameRoom(roomCode, socket.id, selectedCountry);
        const player = room.addPlayer(socket.id, playerName);

        rooms.set(roomCode, room);
        socketToRoom.set(socket.id, roomCode);
        room.saveState();

        socket.join(roomCode);

        // Save to session for auto-reconnect
        socket.request.session.roomCode = roomCode;
        socket.request.session.playerName = playerName;
        socket.request.session.save();

        // Save host join to DB (fire-and-forget)
        addRoomParticipant(roomCode, playerName, true).catch(err =>
          console.error('Failed to save room participant:', err)
        );

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
        if (!player) {
          return callback({ success: false, error: 'Player name already taken in this room' });
        }
        socketToRoom.set(socket.id, roomCode);
        const hostChanged = room.ensureHost(); // Ensure there's always a host
        room.saveState();
        if (hostChanged) {
          const newHost = room.players.get(room.hostId);
          if (newHost) updateRoomHost(roomCode, newHost.name).catch(err => console.error('Failed to update room host:', err));
        }

        socket.join(roomCode);

        // Save to session for auto-reconnect
        socket.request.session.roomCode = roomCode;
        socket.request.session.playerName = playerName;
        socket.request.session.save();

        // Save participant join to DB (fire-and-forget)
        addRoomParticipant(roomCode, playerName, false).catch(err =>
          console.error('Failed to save room participant:', err)
        );

        // Send full state to joining player via callback
        callback({ success: true, player, gameState: room.getGameState() });

        // Notify OTHER players in room (not the joiner)
        socket.broadcast.to(roomCode).emit('player-joined', {
          player,
          players: room.getPlayers()
        });
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
          // Cancel any pending disconnect timer for old socket
          const pendingDisconnect = disconnectTimers.get(oldSocket);
          if (pendingDisconnect) {
            clearTimeout(pendingDisconnect.timer);
            disconnectTimers.delete(oldSocket);
            console.log(`Cancelled disconnect timer for ${playerName}`);
          }
          room.removePlayer(oldSocket);
          socketToRoom.delete(oldSocket);
        }

        // Find old socket ID
        const oldSocketId = Array.from(room.players.entries()).find(
          ([_, p]) => p.name === playerName
        )?.[0];

        let player;
        if (oldSocketId && oldSocketId !== socket.id) {
          // Update socket ID while preserving player state
          player = room.updatePlayerSocketId(oldSocketId, socket.id, playerName);
          socketToRoom.delete(oldSocketId);
        } else {
          // Add as new player
          player = room.addPlayer(socket.id, playerName);
          room.saveState();
        }

        socketToRoom.set(socket.id, roomCode);
        socket.join(roomCode);

        // Ensure there's always a host after rejoin
        const rejoinHostChanged = room.ensureHost();
        room.saveState();
        if (rejoinHostChanged) {
          const newHost = room.players.get(room.hostId);
          if (newHost) {
            updateRoomHost(roomCode, newHost.name).catch(err => console.error('Failed to update room host:', err));
            // Broadcast host change to all (including rejoiner)
            io.to(roomCode).emit('host-changed', {
              newHostId: room.hostId,
              newHostName: newHost.name,
              players: room.getPlayers()
            });
          }
        }

        // Save to session for auto-reconnect
        socket.request.session.roomCode = roomCode;
        socket.request.session.playerName = playerName;
        socket.request.session.save();

        // Send full game state for rejoining player FIRST
        const fullGameState = room.getGameState();
        callback({ success: true, player, gameState: fullGameState, rejoined: true });

        // Then notify OTHER players (not the rejoiner) — skip if host-changed already broadcast above
        if (!rejoinHostChanged) {
          socket.broadcast.to(roomCode).emit('player-reconnected', {
            playerId: socket.id,
            playerName,
            players: room.getPlayers()
          });
        }

        // If game is in progress, send round update to rejoining player
        // Add delay to ensure client has time to navigate and set up listeners
        if (room.gameState !== 'waiting' && room.gameState !== 'ended') {
          setTimeout(() => {
            const isChameleon = player.id === room.chameleonId;
            socket.emit('round-update', {
              gameState: room.gameState,
              currentRound: room.currentRound,
              category: room.category,
              secretWord: isChameleon ? null : room.secretWord,
              isChameleon,
              players: room.getPlayers(),
              remainingTime: room.getRemainingTime(),
              roundHistory: room.roundHistory
            });

            // Send existing clues
            room.clues.forEach(clue => {
              socket.emit('clue-submitted', clue);
            });

            // Send current votes
            if (room.votes.size > 0) {
              socket.emit('vote-submitted', {
                votes: Array.from(room.votes.entries())
              });
            }
          }, 500); // 500ms delay to allow client to navigate and set up listeners
        }

        console.log(`${playerName} rejoined room ${roomCode}`);
      } catch (error) {
        console.error('Error rejoining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Start game
    socket.on('start-game', async (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // If no host exists, auto-assign the requesting player as host
        if (!room.hostId || !room.players.has(room.hostId)) {
          const result = room.claimHost(socket.id);
          if (result.success) {
            updateRoomHost(roomCode, result.newHostName).catch(err => console.error('Failed to update room host:', err));
            io.to(roomCode).emit('host-changed', {
              newHostId: result.newHostId,
              newHostName: result.newHostName,
              players: room.getPlayers()
            });
          }
        }

        // Only host can start game (both initial and new games after ending)
        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can start the game' });
        }

        // Block if game already actively in progress
        if (!['waiting', 'ended', 'resolution'].includes(room.gameState)) {
          return callback({ success: false, error: 'Game already in progress' });
        }

        // After game ends or in resolution, reset to waiting state
        if (room.gameState === 'ended' || room.gameState === 'resolution') {
          room.resetToWaiting();
        }

        if (!room.canStartGame()) {
          return callback({ success: false, error: 'Need at least 3 players' });
        }

        // Create game in database, record who started it
        const hostPlayer = room.players.get(socket.id);
        const gameId = await createGame(roomCode, hostPlayer?.name);
        gameIdMap.set(roomCode, gameId);

        if (!room.startGame()) {
          return callback({ success: false, error: 'Failed to start game' });
        }

        // Notify all players
        io.to(roomCode).emit('game-started', {
          currentRound: room.currentRound
        });

        // Start setup phase immediately
        setTimeout(() => {
          room.startCluePhase();
          sendRoundUpdate(io, roomCode, room, gameIdMap);
        }, 1000);

        callback({ success: true });
        console.log(`Game started in room ${roomCode}`);
      } catch (error) {
        console.error('Error starting game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit clue
    socket.on('submit-clue', async ({ clue }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || room.gameState !== 'clue') {
          return callback({ success: false, error: 'Invalid game state' });
        }

        // Players can ONLY submit their own clues
        const playerId = socket.id;

        const success = room.submitClue(playerId, clue);

        if (!success) {
          return callback({ success: false, error: 'Could not submit clue' });
        }

        room.saveState();

        // Immediately persist clue to DB
        const gameId = gameIdMap.get(roomCode);
        if (gameId) {
          const playerName = room.players.get(playerId)?.name;
          saveClue(gameId, room.currentRound, playerName, clue).catch(err =>
            console.error('Failed to save clue to DB:', err)
          );
        }

        // Broadcast clue + full clues array to all players (enables full replace on client)
        io.to(roomCode).emit('clue-submitted', {
          playerId: playerId,
          playerName: room.players.get(playerId).name,
          clue,
          cluesCount: room.clues.length,
          totalPlayers: room.players.size,
          allClues: room.clues  // full array for reliable sync
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
            if (room.gameState !== 'clue-complete') {
              clearInterval(countdownInterval);
              return;
            }
            const remaining = room.getRemainingTime();
            if (remaining <= 0) {
              clearInterval(countdownInterval);
              room.startVotingPhase();
              sendGameStateUpdate(io, roomCode, room);
              startVotingTimer(io, roomCode, room, gameIdMap);
            } else {
              io.to(roomCode).emit('timer-update', { remainingTime: remaining });
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error submitting clue:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit vote
    socket.on('submit-vote', async ({ votedForId }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || (room.gameState !== 'voting' && room.gameState !== 'voting-complete' && room.gameState !== 'voting-tiebreak')) {
          return callback({ success: false, error: 'Invalid game state' });
        }

        // Players can ONLY vote for themselves
        const voterId = socket.id;

        const success = room.submitVote(voterId, votedForId);

        if (!success) {
          return callback({ success: false, error: 'Invalid vote' });
        }

        room.saveState();

        // Immediately persist vote to DB
        const gameId = gameIdMap.get(roomCode);
        if (gameId) {
          const voterName = room.players.get(voterId)?.name;
          const votedForName = room.players.get(votedForId)?.name;
          saveVote(gameId, room.currentRound, voterName, votedForName).catch(err =>
            console.error('Failed to save vote to DB:', err)
          );
        }

        io.to(roomCode).emit('vote-submitted', {
          voterId: socket.id,
          votesCount: room.votes.size,
          totalPlayers: room.players.size,
          votes: Array.from(room.votes.entries()),
          lockedVotes: Array.from(room.lockedVotes)
        });

        callback({ success: true });

        // If all votes submitted, start 1-minute discussion before resolving
        if (room.votes.size === room.players.size && room.gameState === 'voting') {
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
            if (room.gameState !== 'voting-complete') {
              clearInterval(discussInterval);
              return;
            }
            const remaining = room.getRemainingTime();
            if (remaining <= 0) {
              clearInterval(discussInterval);
              handleVotingComplete(io, roomCode, room, gameIdMap);
            } else {
              io.to(roomCode).emit('timer-update', { remainingTime: remaining });
            }
          }, 1000);
        } else if (room.votes.size === room.players.size && room.gameState === 'voting-tiebreak') {
          // Tiebreak voting complete, resolve immediately
          resolveRound(io, roomCode, room, gameIdMap);
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Lock vote
    socket.on('lock-vote', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room || (room.gameState !== 'voting' && room.gameState !== 'voting-complete')) {
          return callback({ success: false, error: 'Invalid game state' });
        }

        const success = room.lockVote(socket.id);
        if (!success) {
          return callback({ success: false, error: 'No vote to lock' });
        }

        io.to(roomCode).emit('vote-locked', {
          playerId: socket.id,
          lockedCount: room.lockedVotes.size,
          totalPlayers: room.players.size,
          lockedVotes: Array.from(room.lockedVotes)
        });

        callback({ success: true });

        // If all votes locked, skip timer and resolve immediately
        if (room.allVotesLocked() && room.gameState === 'voting-complete') {
          handleVotingComplete(io, roomCode, room, gameIdMap);
        }
      } catch (error) {
        console.error('Error locking vote:', error);
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
        room.saveState();

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
        room.saveState();

        io.to(roomCode).emit('round-started', {
          currentRound: room.currentRound
        });

        // Start clue phase after setup delay
        setTimeout(() => {
          room.startCluePhase();
          sendRoundUpdate(io, roomCode, room, gameIdMap);
        }, 5000);

        callback({ success: true });
      } catch (error) {
        console.error('Error starting next round:', error);
        callback({ success: false, error: error.message });
      }
    });

    // End game
    socket.on('end-game', async (callback) => {
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
        room.saveState();

        // Save to database and update cumulative scores
        const gameId = gameIdMap.get(roomCode);
        if (gameId) {
          await endGame(gameId, room.currentRound);

          // Save players (rounds already saved per-round on resolution)
          await Promise.all(
            gameResult.finalScores.map(ps =>
              addGamePlayer(gameId, ps.playerName, ps.score)
                .then(() => updatePlayerScore(ps.playerName, ps.score))
            )
          );

          gameIdMap.delete(roomCode);
        }

        // Get updated cumulative scores for all players
        const cumulativeScores = await Promise.all(
          gameResult.finalScores.map(async (ps) => ({
            playerName: ps.playerName,
            gameScore: ps.score,
            totalScore: await getPlayerScore(ps.playerName)
          }))
        );

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

    // Claim host
    socket.on('claim-host', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        const result = room.claimHost(socket.id);

        if (!result.success) {
          return callback(result);
        }

        // Persist host change to DB (fire-and-forget)
        updateRoomHost(roomCode, result.newHostName).catch(err =>
          console.error('Failed to update room host:', err)
        );

        // Notify all players of new host
        io.to(roomCode).emit('host-changed', {
          newHostId: result.newHostId,
          newHostName: result.newHostName,
          players: room.getPlayers()
        });

        callback({ success: true });
        console.log(`${result.newHostName} claimed host in room ${roomCode}`);
      } catch (error) {
        console.error('Error claiming host:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Kick player (host only)
    socket.on('kick-player', ({ playerId }, callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // Only host can kick
        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can kick players' });
        }

        // Can't kick yourself
        if (playerId === socket.id) {
          return callback({ success: false, error: 'Cannot kick yourself' });
        }

        const player = room.players.get(playerId);
        if (!player) {
          return callback({ success: false, error: 'Player not found' });
        }

        const playerName = player.name;

        // Remove player from room
        room.removePlayer(playerId);
        socketToRoom.delete(playerId);

        // Ensure there's always a host
        const kickHostChanged = room.ensureHost();
        room.saveState();
        if (kickHostChanged) {
          const newHost = room.players.get(room.hostId);
          if (newHost) updateRoomHost(roomCode, newHost.name).catch(err => console.error('Failed to update room host:', err));
        }

        // Clear their session
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket?.request?.session) {
          playerSocket.request.session.roomCode = null;
          playerSocket.request.session.playerName = null;
          playerSocket.request.session.save();
        }

        // Notify kicked player
        io.to(playerId).emit('kicked', {
          message: 'You have been removed from the room by the host'
        });

        // Notify all players
        io.to(roomCode).emit('player-left', {
          playerId,
          playerName,
          players: room.getPlayers(),
          kicked: true
        });

        callback({ success: true });
        console.log(`Host kicked ${playerName} from room ${roomCode}`);
      } catch (error) {
        console.error('Error kicking player:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Request full game state (used on visibility change / tab focus)
    socket.on('request-game-state', (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        const room = rooms.get(roomCode);
        if (!room) return callback && callback({ success: false });

        const isChameleon = socket.id === room.chameleonId;
        socket.emit('round-update', {
          gameState: room.gameState,
          currentRound: room.currentRound,
          category: room.category,
          secretWord: isChameleon ? null : room.secretWord,
          isChameleon,
          players: room.getPlayers(),
          remainingTime: room.getRemainingTime(),
          roundHistory: room.roundHistory,
          existingClues: room.clues,
          existingVotes: Array.from(room.votes.entries()),
          myClue: room.clues.find(c => c.playerId === socket.id)?.clue || null,
          myVote: room.votes.get(socket.id) || null
        });

        // If in resolution, re-send the last round result from history
        if (room.gameState === 'resolution' && room.roundHistory.length > 0) {
          const lastRound = room.roundHistory[room.roundHistory.length - 1];
          socket.emit('round-resolved', {
            chameleonCaught: lastRound.chameleonCaught,
            chameleonId: room.chameleonId,
            suspectedChameleon: lastRound.suspectedChameleon,
            category: lastRound.category,
            secretWord: lastRound.secretWord,
            scores: room.getGameState().scores,
            needsChameleonGuess: lastRound.chameleonCaught,
            roundHistory: room.roundHistory
          });
        }

        callback && callback({ success: true });
      } catch (err) {
        console.error('Error in request-game-state:', err);
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

    // Get game history (global)
    socket.on('get-game-history', async (callback) => {
      try {
        const games = await getRecentGames(20);
        callback({ success: true, games });
      } catch (error) {
        console.error('Error getting game history:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Get game history for current room only
    socket.on('get-room-history', async (callback) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) return callback({ success: false, error: 'Not in a room' });
        const games = await getGamesByRoom(roomCode, 10);
        callback({ success: true, games, roomCode });
      } catch (error) {
        console.error('Error getting room history:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Get game details
    socket.on('get-game-details', async ({ gameId }, callback) => {
      try {
        const game = await getGameDetails(gameId);
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
          const playerName = player?.name;

          // NEVER remove players on disconnect - they can always rejoin via session
          // Only remove via explicit kick-player event
          console.log(`Player ${playerName} temporarily disconnected from room ${roomCode}, can rejoin anytime`);

          // Keep player in room.players Map but clear socket mapping
          // Session persists so they can auto-reconnect
          // DO NOT call removePlayer() - player data stays in room
          socketToRoom.delete(socket.id);

          // Notify other players of temporary disconnect
          socket.to(roomCode).emit('player-status', {
            playerId: socket.id,
            playerName,
            status: 'disconnected'
          });
        } else {
          socketToRoom.delete(socket.id);
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

function sendRoundUpdate(io, roomCode, room, gameIdMap) {
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
      remainingTime: room.getRemainingTime(),
      roundHistory: room.roundHistory
    });
  });

  startClueTimer(io, roomCode, room, gameIdMap);
}

function sendGameStateUpdate(io, roomCode, room) {
  io.to(roomCode).emit('game-state-update', room.getGameState());
}

function startClueTimer(io, roomCode, room, gameIdMap) {
  const interval = setInterval(() => {
    if (room.gameState !== 'clue') {
      clearInterval(interval);
      return;
    }
    const remaining = room.getRemainingTime();
    if (remaining <= 0) {
      clearInterval(interval);
      room.startDiscussionPhase();
      sendGameStateUpdate(io, roomCode, room);
      startDiscussionTimer(io, roomCode, room, gameIdMap);
    } else {
      io.to(roomCode).emit('timer-update', { remainingTime: remaining });
    }
  }, 1000);
}

function startDiscussionTimer(io, roomCode, room, gameIdMap) {
  const interval = setInterval(() => {
    if (room.gameState !== 'discussion') {
      clearInterval(interval);
      return;
    }
    const remaining = room.getRemainingTime();
    if (remaining <= 0) {
      clearInterval(interval);
      room.startVotingPhase();
      sendGameStateUpdate(io, roomCode, room);
      startVotingTimer(io, roomCode, room, gameIdMap);
    } else {
      io.to(roomCode).emit('timer-update', { remainingTime: remaining });
    }
  }, 1000);
}

function startVotingTimer(io, roomCode, room, gameIdMap) {
  const interval = setInterval(() => {
    if (room.gameState !== 'voting') {
      clearInterval(interval);
      return;
    }
    const remaining = room.getRemainingTime();
    if (remaining <= 0) {
      clearInterval(interval);
      if (room.votes.size < room.players.size) {
        resolveRound(io, roomCode, room, gameIdMap);
      }
    } else {
      io.to(roomCode).emit('timer-update', { remainingTime: remaining });
    }
  }, 1000);
}

function handleVotingComplete(io, roomCode, room, gameIdMap) {
  const result = room.resolveRound();

  // Check if we need a tiebreak
  if (result.needsTiebreak) {
    room.gameState = 'voting-tiebreak';
    room.tiebreakAttempted = true;
    room.timerEndTime = Date.now() + 120000; // 2 minutes for tiebreak

    io.to(roomCode).emit('voting-tiebreak', {
      playersWithMaxVotes: result.playersWithMaxVotes,
      maxVotes: result.maxVotes,
      voteCounts: result.voteCounts,
      remainingTime: 120
    });

    // Start tiebreak timer
    const tiebreakInterval = setInterval(() => {
      if (room.gameState !== 'voting-tiebreak') {
        clearInterval(tiebreakInterval);
        return;
      }
      const remaining = room.getRemainingTime();
      if (remaining <= 0) {
        clearInterval(tiebreakInterval);
        resolveRound(io, roomCode, room, gameIdMap);
      } else {
        io.to(roomCode).emit('timer-update', { remainingTime: remaining });
      }
    }, 1000);
  } else {
    // No tie, resolve normally
    finalizeRound(io, roomCode, room, result, gameIdMap);
  }
}

function resolveRound(io, roomCode, room, gameIdMap) {
  const result = room.resolveRound();

  // If still has tiebreak flag, it's the final resolution
  if (result.isTie && room.tiebreakAttempted) {
    // Chameleon wins on tie
    room.awardPointsNoCatch();
    // Save round to DB immediately
    const gameId = gameIdMap.get(roomCode);
    if (gameId && room.roundHistory.length > 0) {
      const lastRound = room.roundHistory[room.roundHistory.length - 1];
      addGameRound(gameId, lastRound).catch(err => console.error('Failed to save round:', err));
    }
    io.to(roomCode).emit('round-resolved', {
      chameleonCaught: false,
      chameleonId: room.chameleonId,
      suspectedChameleon: null,
      category: room.category,
      secretWord: room.secretWord,
      scores: room.getGameState().scores,
      tieResult: true,
      message: 'No clear decision - Girgit wins!',
      roundHistory: room.roundHistory
    });
  } else {
    finalizeRound(io, roomCode, room, result, gameIdMap);
  }
}

function finalizeRound(io, roomCode, room, result, gameIdMap) {
  // If chameleon not caught, award points
  if (!result.chameleonCaught) {
    room.awardPointsNoCatch();
  }

  // Save round to DB immediately so it's durable
  const gameId = gameIdMap?.get(roomCode);
  if (gameId && room.roundHistory.length > 0) {
    const lastRound = room.roundHistory[room.roundHistory.length - 1];
    addGameRound(gameId, lastRound).catch(err => console.error('Failed to save round:', err));
  }

  io.to(roomCode).emit('round-resolved', {
    ...result,
    category: room.category,
    secretWord: room.secretWord,
    scores: room.getGameState().scores,
    needsChameleonGuess: result.chameleonCaught,
    roundHistory: room.roundHistory
  });
}
