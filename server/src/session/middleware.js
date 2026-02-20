import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQLiteStore = connectSqlite3(session);

export const sessionMiddleware = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: join(__dirname, '../../'),
    ttl: 86400000 // 24 hours
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
