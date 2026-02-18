import { getCategoryAndWord } from './words.js';

export class GameRoom {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.players = new Map(); // socketId -> player object
    this.gameState = 'waiting'; // waiting, setup, clue, discussion, voting, voting-tiebreak, resolution
    this.currentRound = 0;
    this.chameleonId = null;
    this.category = null;
    this.secretWord = null;
    this.clues = []; // [{playerId, playerName, clue}]
    this.votes = new Map(); // playerId -> votedForPlayerId
    this.scores = new Map(); // playerId -> score
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timerEndTime = null;
    this.roundHistory = [];
    this.tiebreakAttempted = false;
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
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.scores.delete(socketId);

    // If host left, assign new host
    if (socketId === this.hostId && this.players.size > 0) {
      const newHost = Array.from(this.players.keys())[0];
      this.hostId = newHost;
      this.players.get(newHost).isHost = true;
      return newHost;
    }
    return null;
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

    // Get random category and word
    const { category, word } = getCategoryAndWord();
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

    return true;
  }

  startDiscussionPhase() {
    this.gameState = 'discussion';
    this.timerEndTime = Date.now() + 120000; // 2 minutes
  }

  startVotingPhase() {
    this.gameState = 'voting';
    this.votes.clear();
    this.timerEndTime = Date.now() + 120000; // 2 minutes
  }

  submitVote(voterId, votedForId) {
    if (this.gameState !== 'voting' && this.gameState !== 'voting-complete' && this.gameState !== 'voting-tiebreak') return false;
    if (!this.players.has(voterId) || !this.players.has(votedForId)) return false;
    if (voterId === votedForId) return false; // Can't vote for yourself

    this.votes.set(voterId, votedForId);

    return true;
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
