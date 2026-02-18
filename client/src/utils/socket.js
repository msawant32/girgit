import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  forceNew: false,
  multiplex: true
});

// Auto-rejoin room after reconnection
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  const savedRoomCode = localStorage.getItem('lastRoomCode');
  const savedPlayerName = localStorage.getItem('lastPlayerName');
  if (savedRoomCode && savedPlayerName && !socket._rejoining) {
    socket._rejoining = true;
    socket.emit('rejoin-room', { roomCode: savedRoomCode, playerName: savedPlayerName }, (response) => {
      socket._rejoining = false;
      if (response && response.success) {
        console.log('🔄 Auto-rejoined room', savedRoomCode);
      }
    });
  }
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('🔴 Connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconnected after', attemptNumber, 'attempts');
});

// Handle page visibility - reconnect when tab becomes active again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !socket.connected) {
      console.log('👁️ Tab visible - reconnecting socket...');
      socket.connect();
    }
  });
}

export default socket;
