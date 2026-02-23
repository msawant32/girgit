import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';

const { Pool } = pg;
const PgSession = connectPgSimple(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'girgit-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000,
    sameSite: 'lax'
  }
});

export function wrapSocketWithSession(io) {
  io.engine.use(sessionMiddleware);
}
