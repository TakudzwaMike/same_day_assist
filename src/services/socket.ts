import { io as connectSocket, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(userId: string, role: string): Socket {
  if (socket?.connected) return socket;

  socket = connectSocket('/', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected:', socket?.id);
    socket?.emit('join', { userId, role });
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Typed event handlers
export function onNewJob(callback: (job: any) => void) {
  socket?.on('new-job', callback);
}

export function onJobUpdated(callback: (job: any) => void) {
  socket?.on('job-updated', callback);
}

export function onJobAssigned(callback: (job: any) => void) {
  socket?.on('job-assigned', callback);
}

export function onContractorLocation(callback: (data: { jobId: string; lat: number; lng: number; contractorId: string }) => void) {
  socket?.on('contractor-location', callback);
}

export function offJobUpdated() {
  socket?.off('job-updated');
}

export function offNewJob() {
  socket?.off('new-job');
}
