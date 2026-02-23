import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketEvents } from './socket/events.js';
import { sessionMiddleware, wrapSocketWithSession } from './session/middleware.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  allowUpgrades: true,
  transports: ['websocket', 'polling'],
  connectTimeout: 45000
});

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.2',
    timestamp: new Date().toISOString()
  });
});

// Wrap socket.io with session
wrapSocketWithSession(io);

// Setup socket events
setupSocketEvents(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Girgit Game Server v1.0.0`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Running on port ${PORT}`);
  console.log(`💾 Database: PostgreSQL (Supabase)`);
});
