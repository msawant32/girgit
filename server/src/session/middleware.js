import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQLiteStore = connectSqlite3(session);

// Use /data in production (Fly.io), local path in development
const dbDir = process.env.FLY_APP_NAME ? '/data' : join(__dirname, '../../');

export const sessionMiddleware = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: dbDir
  }),
  secret: process.env.SESSION_SECRET || 'girgit-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000, // 24 hours
    sameSite: 'lax'
  }
});

export function wrapSocketWithSession(io) {
  io.engine.use(sessionMiddleware);
}
