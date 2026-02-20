import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Log version info to console
console.log(`%c🦎 Girgit Game v${import.meta.env.VITE_APP_VERSION || '1.0.0'}`, 'color: #10b981; font-size: 16px; font-weight: bold');
console.log(`%cBuild: ${import.meta.env.VITE_BUILD_TIME || 'development'}`, 'color: #6b7280; font-size: 12px');
console.log(`%cServer: ${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}`, 'color: #6b7280; font-size: 12px');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
