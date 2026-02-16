// In-memory game history storage
const games = [];
let nextGameId = 1;

// Player cumulative scores storage (playerName -> totalScore)
const playerScores = new Map();

export function createGame(roomCode) {
  const gameId = nextGameId++;
  games.push({
    id: gameId,
    roomCode,
    startedAt: new Date().toISOString(),
    endedAt: null,
    totalRounds: 0,
    players: [],
    rounds: []
  });
  return gameId;
}

export function endGame(gameId, totalRounds) {
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.endedAt = new Date().toISOString();
    game.totalRounds = totalRounds;
  }
}

export function addGamePlayer(gameId, playerName, finalScore) {
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.players.push({
      playerName,
      finalScore
    });
  }
}

export function addGameRound(gameId, roundData) {
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.rounds.push({
      roundNumber: roundData.round,
      category: roundData.category,
      secretWord: roundData.secretWord,
      chameleonName: roundData.chameleonName,
      suspectedName: roundData.suspectedName,
      chameleonCaught: roundData.chameleonCaught
    });
  }
}

export function getRecentGames(limit = 20) {
  return games
    .filter(g => g.endedAt !== null)
    .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
    .slice(0, limit)
    .map(g => ({
      id: g.id,
      roomCode: g.roomCode,
      startedAt: g.startedAt,
      endedAt: g.endedAt,
      totalRounds: g.totalRounds,
      players: g.players.map(p => ({
        name: p.playerName,
        score: p.finalScore
      }))
    }));
}

export function getGameDetails(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game) return null;

  return {
    id: game.id,
    roomCode: game.roomCode,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    totalRounds: game.totalRounds,
    players: game.players
      .map(p => ({
        name: p.playerName,
        score: p.finalScore
      }))
      .sort((a, b) => b.score - a.score),
    rounds: game.rounds
  };
}

export function getPlayerScore(playerName) {
  return playerScores.get(playerName) || 0;
}

export function updatePlayerScore(playerName, scoreToAdd) {
  const currentScore = playerScores.get(playerName) || 0;
  const newScore = currentScore + scoreToAdd;
  playerScores.set(playerName, newScore);
  return newScore;
}

export function getTopPlayers(limit = 10) {
  return Array.from(playerScores.entries())
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default { createGame, endGame, addGamePlayer, addGameRound, getRecentGames, getGameDetails, getPlayerScore, updatePlayerScore, getTopPlayers };
