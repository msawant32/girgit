import { useEffect, useState } from 'react';
import socket from '../utils/socket';

export function useSocket() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      console.log('Socket connected');
    }

    function onDisconnect() {
      setConnected(false);
      console.log('Socket disconnected');
    }

    function onConnectError(error) {
      console.error('Socket connection error:', error);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return { socket, connected };
}
