import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
console.log('SOCKET_URL', SOCKET_URL);
export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: true,           
      transports: ['websocket'],   
      withCredentials: true,       
      auth: {
    token: localStorage.getItem('token') || '',
  },
    });

    socket.on('connect', () => {
      console.log('Socket connected → ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('error')
      console.log('Socket connection error:', error.message);
    });

    socket.on('error', (err) => {
      console.log('Server sent error:', err);
    });
  }

  return socket;
};


export const getSocket = (): Socket => {
  return initializeSocket();
};


export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket manually disconnected');
  }
};