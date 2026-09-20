import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });
  }
  return socket;
}

export function connectSocket(phone) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('join', { phone });
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
