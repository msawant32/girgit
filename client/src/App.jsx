import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { LandingPage } from './pages/LandingPage';
import { WaitingRoom } from './pages/WaitingRoom';
import { GameBoard } from './pages/GameBoard';
import { GameHistory } from './pages/GameHistory';
import { VersionInfo } from './components/VersionInfo';

function App() {
  const { connected } = useSocket();

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
