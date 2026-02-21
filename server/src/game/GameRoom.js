import { getCategoryAndWord, WORD_DATABASE_USA, WORD_DATABASE_INDIA } from './words.js';
import { saveGameState, loadGameState, deleteGameState } from '../database/db.js';

export class GameRoom {
  constructor(roomCode, hostId, country = 'USA') {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.country = country;
    this.players = new Map(); // socketId -> player object
    this.gameState = 'waiting'; // waiting, setup, clue, discussion, voting, voting-tiebreak, resolution
    this.currentRound = 0;
    this.chameleonId = null;
    this.category = null;
    this.secretWord = null;
    this.clues = []; // [{playerId, playerName, clue}]
    this.votes = new Map(); // playerId -> votedForPlayerId
    this.lockedVotes = new Set(); // Set of playerIds who locked their votes
    this.scores = new Map(); // playerId -> score
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timerEndTime = null;
    this.roundHistory = [];
    this.tiebreakAttempted = false;
  }

  saveState() {
    const state = {
      roomCode: this.roomCode,
      hostId: this.hostId,
      country: this.country,
      players: Array.from(this.players.entries()),
      gameState: this.gameState,
      currentRound: this.currentRound,
      chameleonId: this.chameleonId,
      category: this.category,
      secretWord: this.secretWord,
      clues: this.clues,
      votes: Array.from(this.votes.entries()),
      lockedVotes: Array.from(this.lockedVotes),
      scores: Array.from(this.scores.entries()),
      roundHistory: this.roundHistory,
      timerEndTime: this.timerEndTime,
      tiebreakAttempted: this.tiebreakAttempted
    };
    saveGameState(this.roomCode, state);
  }

  static loadFromDB(roomCode) {
    const state = loadGameState(roomCode);
    if (!state) return null;

    const room = new GameRoom(state.roomCode, state.hostId, state.country);
    room.players = new Map(state.players);
    room.gameState = state.gameState;
    room.currentRound = state.currentRound;
    room.chameleonId = state.chameleonId;
    room.category = state.category;
    room.secretWord = state.secretWord;
    room.clues = state.clues;
    room.votes = new Map(state.votes);
    room.lockedVotes = new Set(state.lockedVotes || []);
    room.scores = new Map(state.scores);
    room.roundHistory = state.roundHistory;
    room.timerEndTime = state.timerEndTime;
    room.tiebreakAttempted = state.tiebreakAttempted;
    return room;
  }

  getFullState(playerId) {
    const isChameleon = playerId === this.chameleonId;
    return {
      ...this.getGameState(),
      secretWord: isChameleon ? null : this.secretWord,
      isChameleon,
      myClue: this.clues.find(c => c.playerId === playerId)?.clue || null,
      myVote: this.votes.get(playerId) || null,
      isHost: playerId === this.hostId
    };
  }

  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      isHost: socketId === this.hostId,
      score: 0
    };
    this.players.set(socketId, player);
    this.scores.set(socketId, 0);
    this.saveState();
    return player;
  }

  // Update existing player's socket ID (for reconnection)
  updatePlayerSocketId(oldSocketId, newSocketId, playerName) {
    const oldPlayer = this.players.get(oldSocketId);
    if (!oldPlayer) return null;

    // Preserve all player data including host status and score
    const wasHost = oldPlayer.isHost || oldSocketId === this.hostId;
    const currentScore = this.scores.get(oldSocketId) || oldPlayer.score || 0;

    // Remove old socket entry
    this.players.delete(oldSocketId);
    this.scores.delete(oldSocketId);

    // Add with new socket ID, preserving status
    const updatedPlayer = {
      id: newSocketId,
      name: playerName,
      isHost: wasHost,
      score: currentScore
    };

    this.players.set(newSocketId, updatedPlayer);
    this.scores.set(newSocketId, currentScore);

    // Update hostId if this player was/is the host
    if (wasHost) {
      this.hostId = newSocketId;
    }

    // Update chameleonId if this player is the chameleon
    if (this.chameleonId === oldSocketId) {
      this.chameleonId = newSocketId;
    }

    // Update votes if player has voted or been voted for
    if (this.votes.has(oldSocketId)) {
      const votedFor = this.votes.get(oldSocketId);
      this.votes.delete(oldSocketId);
      this.votes.set(newSocketId, votedFor);
    }
    // Update if other players voted for this player
    for (const [voterId, votedForId] of this.votes.entries()) {
      if (votedForId === oldSocketId) {
        this.votes.set(voterId, newSocketId);
      }
    }

    // Update clues
    this.clues = this.clues.map(clue =>
      clue.playerId === oldSocketId
        ? { ...clue, playerId: newSocketId }
        : clue
    );

    this.saveState();
    return updatedPlayer;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.scores.delete(socketId);

    // If host left, set hostId to null - players will need to claim host
    if (socketId === this.hostId) {
      this.hostId = null;
      // Clear isHost flag from all players
      for (const player of this.players.values()) {
        player.isHost = false;
      }
      return 'host-left';
    }
    return null;
  }

  // Allow a player to claim host status
  claimHost(socketId) {
    // Only allow if no current host
    if (this.hostId !== null && this.players.has(this.hostId)) {
      return { success: false, error: 'Room already has a host' };
    }

    // Check if player exists
    const player = this.players.get(socketId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Ensure all other players have isHost = false
    for (const p of this.players.values()) {
      p.isHost = false;
    }

    // Assign host
    this.hostId = socketId;
    player.isHost = true;
    this.saveState();

    return { success: true, newHostId: socketId, newHostName: player.name };
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  canStartGame() {
    return this.players.size >= 3 && this.gameState === 'waiting';
  }

  startGame() {
    if (!this.canStartGame()) return false;
    this.currentRound = 1;
    this.startNewRound();
    return true;
  }

  startNewRound() {
    this.gameState = 'setup';
    this.clues = [];
    this.votes.clear();
    this.currentPlayerIndex = 0;
    this.tiebreakAttempted = false;

    // Select random chameleon
    const playerIds = Array.from(this.players.keys());
    this.chameleonId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // Get random category and word based on room's country
    const database = this.country === 'INDIA' ? WORD_DATABASE_INDIA : WORD_DATABASE_USA;
    const { category, word } = getCategoryAndWord(database);
    this.category = category;
    this.secretWord = word;

    return {
      chameleonId: this.chameleonId,
      category: this.category,
      secretWord: this.secretWord
    };
  }

  startCluePhase() {
    this.gameState = 'clue';
    this.timerEndTime = Date.now() + 120000; // 2 minutes
  }

  submitClue(playerId, clue) {
    if (this.gameState !== 'clue') return false;

    const player = this.players.get(playerId);
    if (!player) return false;

    // Check if player already submitted
    if (this.clues.find(c => c.playerId === playerId)) return false;

    this.clues.push({
      playerId,
      playerName: player.name,
      clue
    });

    this.saveState();
    return true;
  }

  startDiscussionPhase() {
    this.gameState = 'discussion';
    this.timerEndTime = Date.now() + 120000; // 2 minutes
  }

  startVotingPhase() {
    this.gameState = 'voting';
    this.votes.clear();
    this.lockedVotes.clear();
    this.timerEndTime = Date.now() + 120000; // 2 minutes
  }

  submitVote(voterId, votedForId) {
    if (this.gameState !== 'voting' && this.gameState !== 'voting-complete' && this.gameState !== 'voting-tiebreak') return false;
    if (!this.players.has(voterId) || !this.players.has(votedForId)) return false;
    if (voterId === votedForId) return false; // Can't vote for yourself

    this.votes.set(voterId, votedForId);
    this.saveState();

    return true;
  }

  lockVote(voterId) {
    if (!this.votes.has(voterId)) return false;
    this.lockedVotes.add(voterId);
    this.saveState();
    return true;
  }

  allVotesLocked() {
    if (this.votes.size !== this.players.size) return false;
    return this.lockedVotes.size === this.players.size;
  }

  ensureHost() {
    // If no host or host doesn't exist in players, assign first player as host
    if (!this.hostId || !this.players.has(this.hostId)) {
      const firstPlayer = Array.from(this.players.entries())[0];
      if (firstPlayer) {
        this.hostId = firstPlayer[0];
        firstPlayer[1].isHost = true;
        // Clear isHost from all other players
        for (const [playerId, player] of this.players.entries()) {
          if (playerId !== this.hostId) {
            player.isHost = false;
          }
        }
        this.saveState();
        return true;
      }
    }
    return false;
  }

  resolveRound() {
    // Count votes
    const voteCounts = new Map();
    for (const votedForId of this.votes.values()) {
      voteCounts.set(votedForId, (voteCounts.get(votedForId) || 0) + 1);
    }

    // Find player(s) with most votes
    let maxVotes = 0;
    let playersWithMaxVotes = [];
    for (const [playerId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        playersWithMaxVotes = [playerId];
      } else if (count === maxVotes) {
        playersWithMaxVotes.push(playerId);
      }
    }

    // Check for tie
    const isTie = playersWithMaxVotes.length > 1 || playersWithMaxVotes.length === 0;

    // If tie and haven't attempted tiebreak yet, initiate tiebreak
    if (isTie && !this.tiebreakAttempted) {
      return {
        isTie: true,
        needsTiebreak: true,
        playersWithMaxVotes,
        maxVotes,
        voteCounts: Array.from(voteCounts.entries()).map(([id, count]) => ({
          playerId: id,
          playerName: this.players.get(id)?.name,
          votes: count
        }))
      };
    }

    // If tie after tiebreak or no tie, resolve normally
    this.gameState = 'resolution';

    let suspectedChameleon = null;
    let chameleonCaught = false;

    if (isTie && this.tiebreakAttempted) {
      // Chameleon wins on tie after tiebreak
      suspectedChameleon = null;
      chameleonCaught = false;
    } else {
      suspectedChameleon = playersWithMaxVotes[0];
      chameleonCaught = suspectedChameleon === this.chameleonId;
    }

    // Save round result (before updating scores)
    const roundResult = {
      round: this.currentRound,
      category: this.category,
      secretWord: this.secretWord,
      chameleonId: this.chameleonId,
      chameleonName: this.players.get(this.chameleonId)?.name,
      suspectedChameleon,
      suspectedName: this.players.get(suspectedChameleon)?.name,
      chameleonCaught,
      votes: Array.from(this.votes.entries()).map(([voterId, votedForId]) => ({
        voter: this.players.get(voterId)?.name,
        votedFor: this.players.get(votedForId)?.name
      })),
      clues: this.clues
    };

    this.roundHistory.push(roundResult);

    return {
      chameleonCaught,
      suspectedChameleon,
      chameleonId: this.chameleonId,
      voteCounts: Array.from(voteCounts.entries()).map(([id, count]) => ({
        playerId: id,
        playerName: this.players.get(id)?.name,
        votes: count
      }))
    };
  }

  submitChameleonGuess(guess) {
    if (this.gameState !== 'resolution') return false;

    const isCorrect = guess.toLowerCase().trim() === this.secretWord.toLowerCase().trim();

    if (isCorrect) {
      // Chameleon guessed correctly, gets 2 points
      this.scores.set(this.chameleonId, (this.scores.get(this.chameleonId) || 0) + 2);
    } else {
      // Other players get 1 point each
      for (const [playerId] of this.players) {
        if (playerId !== this.chameleonId) {
          this.scores.set(playerId, (this.scores.get(playerId) || 0) + 1);
        }
      }
    }

    // Update player objects with scores
    for (const [playerId, score] of this.scores) {
      const player = this.players.get(playerId);
      if (player) {
        player.score = score;
      }
    }

    return { isCorrect, secretWord: this.secretWord };
  }

  awardPointsNoCatch() {
    // Chameleon wasn't caught, gets 3 points
    this.scores.set(this.chameleonId, (this.scores.get(this.chameleonId) || 0) + 3);

    // Update player object
    const chameleon = this.players.get(this.chameleonId);
    if (chameleon) {
      chameleon.score = this.scores.get(this.chameleonId);
    }
  }

  nextRound() {
    this.currentRound++;
    this.startNewRound();
  }

  endGame() {
    this.gameState = 'ended';
    return {
      finalScores: Array.from(this.scores.entries()).map(([id, score]) => ({
        playerId: id,
        playerName: this.players.get(id)?.name,
        score
      })).sort((a, b) => b.score - a.score),
      roundHistory: this.roundHistory
    };
  }

  resetToWaiting() {
    this.gameState = 'waiting';
    this.currentRound = 0;
    this.chameleonId = null;
    this.category = null;
    this.secretWord = null;
    this.clues = [];
    this.votes.clear();
    this.currentPlayerIndex = 0;
    this.roundHistory = [];

    // Reset scores
    for (const [playerId] of this.players) {
      this.scores.set(playerId, 0);
      const player = this.players.get(playerId);
      if (player) {
        player.score = 0;
      }
    }
  }

  getRemainingTime() {
    if (!this.timerEndTime) return 0;
    const remaining = Math.max(0, Math.ceil((this.timerEndTime - Date.now()) / 1000));
    return remaining;
  }

  getGameState() {
    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      players: this.getPlayers(),
      gameState: this.gameState,
      currentRound: this.currentRound,
      category: this.category,
      clues: this.clues,
      votes: Array.from(this.votes.entries()),
      scores: Array.from(this.scores.entries()).map(([id, score]) => ({
        playerId: id,
        playerName: this.players.get(id)?.name,
        score
      })),
      remainingTime: this.getRemainingTime()
    };
  }
}
