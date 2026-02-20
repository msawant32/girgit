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
  multiplex: true,
  withCredentials: true  // Enable session cookies
});

// Connection established - server will auto-reconnect via session
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

// Handle auto-reconnection from server (session-based)
socket.on('auto-reconnected', (data) => {
  console.log('🔄 Auto-reconnected to room:', data.roomCode);
  // Store in localStorage as backup
  localStorage.setItem('lastRoomCode', data.roomCode);
  localStorage.setItem('lastPlayerName', data.playerName);

  // Dispatch custom event for app components to handle state restoration
  window.dispatchEvent(new CustomEvent('auto-reconnected', { detail: data }));
});

// Handle room expiration/not found
socket.on('room-expired', (data) => {
  console.log('❌ Room expired:', data.message);

  // Clear stored data
  localStorage.removeItem('lastRoomCode');
  localStorage.removeItem('lastPlayerName');

  // Dispatch event to redirect user to home with message
  window.dispatchEvent(new CustomEvent('room-expired', { detail: data }));
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
