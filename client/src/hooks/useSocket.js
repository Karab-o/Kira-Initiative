import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Single connection per consultation. Patient passes sessionToken; doctor passes doctorToken.
export function useConsultationSocket({ consultationId, sessionToken, doctorToken, onMessage, onTyping, onPresence }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!consultationId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-consultation', { consultationId, sessionToken, doctorToken });
    });

    socket.on('joined', ({ role: r }) => {
      setRole(r);
      setJoined(true);
    });

    socket.on('new-message', ({ message }) => onMessage?.(message));
    socket.on('user-typing', ({ role: r }) => onTyping?.(r));
    socket.on('doctor-online', (p) => onPresence?.({ online: true, ...p }));
    socket.on('doctor-offline', (p) => onPresence?.({ online: false, ...p }));

    socket.on('error', (e) => console.warn('socket error', e));
    socket.on('disconnect', () => {
      setConnected(false);
      setJoined(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, sessionToken, doctorToken]);

  const sendMessage = useCallback((content, fileUrl) => {
    socketRef.current?.emit('send-message', { consultationId, content, fileUrl });
  }, [consultationId]);

  const sendTyping = useCallback(() => {
    socketRef.current?.emit('typing', { consultationId });
  }, [consultationId]);

  return { connected, joined, role, sendMessage, sendTyping };
}
