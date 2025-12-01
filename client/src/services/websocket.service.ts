import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(url?: string) {
    // Explicitly set the URL to point to the server at port 5000
    this.url = url || `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname}:5000`;
    console.log('WebSocket URL:', this.url);
  }

  connect(token?: string) {
    try {
      // Disconnect existing connection if any
      if (this.socket) {
        console.log('🔌 Disconnecting existing WebSocket connection...');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // Get token from localStorage if not provided
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.warn('No authentication token available for WebSocket connection');
        this.emit('error', new Error('Authentication token required'));
        return;
      }
      
      console.log('🔌 Connecting to WebSocket with token:', authToken.substring(0, 10) + '...');
      
      this.socket = io(this.url, {
        auth: {
          token: authToken
        },
        query: {
          token: authToken
        },
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 10000, // Shorter timeout
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket.IO connected successfully!');
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.emit('disconnected');
        
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          this.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        console.error('Connection details:', {
          url: this.url,
          transport: this.socket?.io.engine.transport.name,
          hasToken: !!authToken
        });
        this.emit('error', error);
        this.attemptReconnect();
      });

      // Handle all Socket.IO events
      this.socket.onAny((event, data) => {
        if (event !== 'connect' && event !== 'disconnect' && event !== 'connect_error') {
          this.emit(event, data);
        }
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (this.listeners[event]) {
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        this.listeners[event] = [];
      }
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  // Room-specific methods
  joinRoom(roomId: string) {
    this.send('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.send('leave_room', { roomId });
  }

  setReady(roomId: string, isReady: boolean) {
    this.send('set_ready', { roomId, isReady });
  }

  startMatch(roomId: string) {
    this.send('start_match', { roomId });
  }

  submitCode(roomId: string, code: string, language: string) {
    this.send('submit_code', { roomId, code, language });
  }

  // Matchmaking methods
  startMatchmaking(options: any) {
    this.send('start_matchmaking', options);
  }

  cancelMatchmaking() {
    this.send('cancel_matchmaking', {});
  }

  // Friend system methods
  sendFriendRequest(toUserId: string, message?: string) {
    this.send('send_friend_request', { toUserId, message });
  }

  acceptFriendRequest(requestId: string, fromUserId: string) {
    this.send('accept_friend_request', { requestId, fromUserId });
  }

  // Challenge methods
  challengeUser(toUserId: string, challengeData: any) {
    this.send('challenge_user', { toUserId, challengeData });
  }

  // Status updates
  updateStatus(status: 'online' | 'in-match' | 'away') {
    this.send('update_status', status);
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = (url?: string): WebSocketService => {
  if (!wsInstance) {
    wsInstance = new WebSocketService(url);
  }
  return wsInstance;
};

export default WebSocketService;