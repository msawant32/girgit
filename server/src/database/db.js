import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

// Initialize schema
await pool.query(`
  CREATE TABLE IF NOT EXISTS active_games (
    room_code TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    room_code TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    total_rounds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL REFERENCES game_history(id),
    player_name TEXT NOT NULL,
    final_score INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_rounds (
    game_id INTEGER NOT NULL REFERENCES game_history(id),
    round_number INTEGER NOT NULL,
    category TEXT NOT NULL,
    secret_word TEXT NOT NULL,
    chameleon_name TEXT,
    suspected_name TEXT,
    chameleon_caught BOOLEAN NOT NULL
  );

  CREATE TABLE IF NOT EXISTS player_scores (
    player_name TEXT PRIMARY KEY,
    total_score INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_active_games_updated ON active_games(updated_at);
`);

console.log('Database schema initialized');

// Cleanup old games every hour (24h TTL)
setInterval(async () => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM active_games WHERE updated_at < $1',
      [Date.now() - 86400000]
    );
    if (rowCount > 0) console.log(`Cleaned up ${rowCount} old game(s)`);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, 3600000);

// Game State Persistence
export async function saveGameState(roomCode, state) {
  await pool.query(
    `INSERT INTO active_games (room_code, state, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (room_code) DO UPDATE SET state = $2, updated_at = $3`,
    [roomCode, JSON.stringify(state), Date.now()]
  );
}

export async function loadGameState(roomCode) {
  const { rows } = await pool.query(
    'SELECT state FROM active_games WHERE room_code = $1 AND updated_at > $2',
    [roomCode, Date.now() - 86400000]
  );
  return rows[0] ? JSON.parse(rows[0].state) : null;
}

export async function deleteGameState(roomCode) {
  await pool.query('DELETE FROM active_games WHERE room_code = $1', [roomCode]);
}

// Game History
export async function createGame(roomCode) {
  const { rows } = await pool.query(
    'INSERT INTO game_history (room_code, started_at) VALUES ($1, $2) RETURNING id',
    [roomCode, new Date().toISOString()]
  );
  return rows[0].id;
}

export async function endGame(gameId, totalRounds) {
  await pool.query(
    'UPDATE game_history SET ended_at = $1, total_rounds = $2 WHERE id = $3',
    [new Date().toISOString(), totalRounds, gameId]
  );
}

export async function addGamePlayer(gameId, playerName, finalScore) {
  await pool.query(
    'INSERT INTO game_players (game_id, player_name, final_score) VALUES ($1, $2, $3)',
    [gameId, playerName, finalScore]
  );
}

export async function addGameRound(gameId, roundData) {
  await pool.query(
    `INSERT INTO game_rounds (game_id, round_number, category, secret_word, chameleon_name, suspected_name, chameleon_caught)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [gameId, roundData.round, roundData.category, roundData.secretWord,
     roundData.chameleonName, roundData.suspectedName, roundData.chameleonCaught]
  );
}

export async function getRecentGames(limit = 20) {
  const { rows: games } = await pool.query(
    `SELECT id, room_code, started_at, ended_at, total_rounds
     FROM game_history WHERE ended_at IS NOT NULL
     ORDER BY ended_at DESC LIMIT $1`,
    [limit]
  );

  return Promise.all(games.map(async (game) => {
    const { rows: players } = await pool.query(
      'SELECT player_name as name, final_score as score FROM game_players WHERE game_id = $1',
      [game.id]
    );
    return {
      id: game.id,
      roomCode: game.room_code,
      startedAt: game.started_at,
      endedAt: game.ended_at,
      totalRounds: game.total_rounds,
      players
    };
  }));
}

export async function getGameDetails(gameId) {
  const { rows } = await pool.query(
    'SELECT id, room_code, started_at, ended_at, total_rounds FROM game_history WHERE id = $1',
    [gameId]
  );
  if (!rows[0]) return null;
  const game = rows[0];

  const [{ rows: players }, { rows: rounds }] = await Promise.all([
    pool.query(
      'SELECT player_name as name, final_score as score FROM game_players WHERE game_id = $1 ORDER BY score DESC',
      [gameId]
    ),
    pool.query(
      'SELECT round_number, category, secret_word, chameleon_name, suspected_name, chameleon_caught FROM game_rounds WHERE game_id = $1 ORDER BY round_number',
      [gameId]
    )
  ]);

  return {
    id: game.id,
    roomCode: game.room_code,
    startedAt: game.started_at,
    endedAt: game.ended_at,
    totalRounds: game.total_rounds,
    players,
    rounds: rounds.map(r => ({
      roundNumber: r.round_number,
      category: r.category,
      secretWord: r.secret_word,
      chameleonName: r.chameleon_name,
      suspectedName: r.suspected_name,
      chameleonCaught: r.chameleon_caught
    }))
  };
}

export async function getPlayerScore(playerName) {
  const { rows } = await pool.query(
    'SELECT total_score FROM player_scores WHERE player_name = $1',
    [playerName]
  );
  return rows[0] ? rows[0].total_score : 0;
}

export async function updatePlayerScore(playerName, scoreToAdd) {
  await pool.query(
    `INSERT INTO player_scores (player_name, total_score) VALUES ($1, $2)
     ON CONFLICT (player_name) DO UPDATE SET total_score = player_scores.total_score + $2`,
    [playerName, scoreToAdd]
  );
  return getPlayerScore(playerName);
}

export async function getTopPlayers(limit = 10) {
  const { rows } = await pool.query(
    'SELECT player_name as name, total_score as score FROM player_scores ORDER BY total_score DESC LIMIT $1',
    [limit]
  );
  return rows;
}

export default pool;
