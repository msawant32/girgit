import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use /data in production (Fly.io), local path in development
const dbPath = process.env.FLY_APP_NAME
  ? '/data/gamestate.db'
  : join(__dirname, '../../gamestate.db');

const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS active_games (
    room_code TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    total_rounds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    final_score INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game_history(id)
  );

  CREATE TABLE IF NOT EXISTS game_rounds (
    game_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    category TEXT NOT NULL,
    secret_word TEXT NOT NULL,
    chameleon_name TEXT,
    suspected_name TEXT,
    chameleon_caught INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game_history(id)
  );

  CREATE TABLE IF NOT EXISTS player_scores (
    player_name TEXT PRIMARY KEY,
    total_score INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_active_games_updated ON active_games(updated_at);
`);



// Game State Persistence
export function saveGameState(roomCode, state) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO active_games (room_code, state, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(roomCode, JSON.stringify(state), Date.now());
}

export function loadGameState(roomCode) {
  const stmt = db.prepare(`
    SELECT state FROM active_games
    WHERE room_code = ? AND updated_at > ?
  `);
  const row = stmt.get(roomCode, Date.now() - 86400000); // 24h TTL
  return row ? JSON.parse(row.state) : null;
}

export function deleteGameState(roomCode) {
  db.prepare('DELETE FROM active_games WHERE room_code = ?').run(roomCode);
}

// Cleanup old games
setInterval(() => {
  const count = db.prepare('DELETE FROM active_games WHERE updated_at < ?')
    .run(Date.now() - 86400000).changes;
  if (count > 0) console.log(`Cleaned up ${count} old game(s)`);
}, 3600000); // Every hour

// Game History
export function createGame(roomCode) {
  const stmt = db.prepare(`
    INSERT INTO game_history (room_code, started_at)
    VALUES (?, ?)
  `);
  const result = stmt.run(roomCode, new Date().toISOString());
  return result.lastInsertRowid;
}

export function endGame(gameId, totalRounds) {
  db.prepare(`
    UPDATE game_history
    SET ended_at = ?, total_rounds = ?
    WHERE id = ?
  `).run(new Date().toISOString(), totalRounds, gameId);
}

export function addGamePlayer(gameId, playerName, finalScore) {
  db.prepare(`
    INSERT INTO game_players (game_id, player_name, final_score)
    VALUES (?, ?, ?)
  `).run(gameId, playerName, finalScore);
}

export function addGameRound(gameId, roundData) {
  db.prepare(`
    INSERT INTO game_rounds (game_id, round_number, category, secret_word, chameleon_name, suspected_name, chameleon_caught)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    gameId,
    roundData.round,
    roundData.category,
    roundData.secretWord,
    roundData.chameleonName,
    roundData.suspectedName,
    roundData.chameleonCaught ? 1 : 0
  );
}

export function getRecentGames(limit = 20) {
  const games = db.prepare(`
    SELECT id, room_code, started_at, ended_at, total_rounds
    FROM game_history
    WHERE ended_at IS NOT NULL
    ORDER BY ended_at DESC
    LIMIT ?
  `).all(limit);

  return games.map(game => ({
    id: game.id,
    roomCode: game.room_code,
    startedAt: game.started_at,
    endedAt: game.ended_at,
    totalRounds: game.total_rounds,
    players: db.prepare(`
      SELECT player_name as name, final_score as score
      FROM game_players
      WHERE game_id = ?
    `).all(game.id)
  }));
}

export function getGameDetails(gameId) {
  const game = db.prepare(`
    SELECT id, room_code, started_at, ended_at, total_rounds
    FROM game_history
    WHERE id = ?
  `).get(gameId);

  if (!game) return null;

  return {
    id: game.id,
    roomCode: game.room_code,
    startedAt: game.started_at,
    endedAt: game.ended_at,
    totalRounds: game.total_rounds,
    players: db.prepare(`
      SELECT player_name as name, final_score as score
      FROM game_players
      WHERE game_id = ?
      ORDER BY score DESC
    `).all(gameId),
    rounds: db.prepare(`
      SELECT round_number, category, secret_word, chameleon_name, suspected_name, chameleon_caught
      FROM game_rounds
      WHERE game_id = ?
      ORDER BY round_number
    `).all(gameId).map(r => ({
      roundNumber: r.round_number,
      category: r.category,
      secretWord: r.secret_word,
      chameleonName: r.chameleon_name,
      suspectedName: r.suspected_name,
      chameleonCaught: r.chameleon_caught === 1
    }))
  };
}

export function getPlayerScore(playerName) {
  const row = db.prepare('SELECT total_score FROM player_scores WHERE player_name = ?').get(playerName);
  return row ? row.total_score : 0;
}

export function updatePlayerScore(playerName, scoreToAdd) {
  db.prepare(`
    INSERT INTO player_scores (player_name, total_score)
    VALUES (?, ?)
    ON CONFLICT(player_name) DO UPDATE SET total_score = total_score + ?
  `).run(playerName, scoreToAdd, scoreToAdd);

  return getPlayerScore(playerName);
}

export function getTopPlayers(limit = 10) {
  return db.prepare(`
    SELECT player_name as name, total_score as score
    FROM player_scores
    ORDER BY total_score DESC
    LIMIT ?
  `).all(limit);
}

export default db;
