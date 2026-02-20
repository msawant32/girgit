import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { WaitingRoom } from './pages/WaitingRoom';
import { GameBoard } from './pages/GameBoard';
import { GameHistory } from './pages/GameHistory';
import { VersionInfo } from './components/VersionInfo';

function AppContent() {
  const { connected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auto-reconnection event
    const handleAutoReconnect = (event) => {
      const { roomCode, gameState } = event.detail;
      console.log('🔄 Handling auto-reconnect, gameState:', gameState.gameState);

      // Navigate to appropriate page based on game state
      if (gameState.gameState === 'waiting') {
        navigate(`/room/${roomCode}`, { replace: true });
      } else if (gameState.gameState !== 'ended') {
        navigate(`/game/${roomCode}`, { replace: true });
      } else {
        navigate(`/room/${roomCode}`, { replace: true });
      }
    };

    // Listen for room expiration event
    const handleRoomExpired = (event) => {
      const { message } = event.detail;
      console.log('❌ Room expired, redirecting to home');

      // Navigate to home and show error message
      navigate('/', {
        replace: true,
        state: { error: message }
      });
    };

    window.addEventListener('auto-reconnected', handleAutoReconnect);
    window.addEventListener('room-expired', handleRoomExpired);

    return () => {
      window.removeEventListener('auto-reconnected', handleAutoReconnect);
      window.removeEventListener('room-expired', handleRoomExpired);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Connection Status */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
          Connecting to server...
        </div>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomCode" element={<WaitingRoom />} />
        <Route path="/game/:roomCode" element={<GameBoard />} />
        <Route path="/history" element={<GameHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <VersionInfo />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
