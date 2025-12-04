import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

interface AuthenticatedSocket extends Socket {
  user?: IUser & {
    id: string;
    email: string;
    role?: string;
  };
  userId?: string;
}

interface OnlineUser {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  level: number;
  status: 'online' | 'in-match' | 'away';
  lastSeen: string;
  socketId: string;
  email?: string;
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  players: OnlineUser[];
  maxPlayers: number;
  mode: '1vs1' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard';
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'starting' | 'in-progress' | 'finished';
  createdAt: string;
  allowSpectators: boolean;
  autoStart: boolean;
  ratingRange: [number, number];
  timeLimit?: number;
  problemCount?: number;
}

interface Match {
  id: string;
  player1: OnlineUser;
  player2: OnlineUser;
  mode: '1vs1' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'waiting-acceptance' | 'accepted' | 'in-progress' | 'finished';
  winner?: string;
  createdAt: string;
  timeLimit?: number;
  problemCount?: number;
  solutions?: { userId: string; solution: string; time: number; }[];
}

interface MatchmakingEntry {
  user: OnlineUser;
  options: {
    difficulty?: string;
    mode?: string;
    ratingRange?: [number, number];
  };
  startTime: number;
  status: 'searching' | 'found' | 'expired';
}

interface FriendRequest {
  id: string;
  from: OnlineUser;
  to: OnlineUser;
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Challenge {
  id: string;
  from: OnlineUser;
  to: OnlineUser;
  challengeData: {
    difficulty: string;
    mode: string;
    timeLimit: number;
    problemCount: number;
  };
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export class WebSocketService {
  private io: SocketIOServer;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private rooms: Map<string, Room> = new Map();
  private matches: Map<string, Match> = new Map();
  private matchmakingQueue: Map<string, MatchmakingEntry> = new Map();
  private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly JWT_SECRET: string;
  private readonly MAX_RATING_DIFF: number = 200;
  private readonly MATCH_TIMEOUT: number = 30000; // 30 seconds
  private readonly CLEANUP_INTERVAL: number = 60000; // 1 minute

  constructor(server: HttpServer) {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupTasks();
  }

  private setupMiddleware(): void {
    // Authentication middleware với multiple token sources
    this.io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        // Lấy token từ nhiều nguồn khác nhau
        const token = this.extractToken(socket);
        
        if (!token) {
          console.warn('Authentication attempt without token');
          return next(new Error('Authentication token required'));
        }

        // Verify token với error handling
        let decoded: any;
        try {
          decoded = jwt.verify(token, this.JWT_SECRET);
        } catch (jwtError) {
          console.error('JWT verification failed:', jwtError);
          return next(new Error('Invalid or expired authentication token'));
        }

        // Tìm user với proper error handling
        let user: IUser | null = null;
        try {
          user = await User.findById(decoded.userId).select('+email +role +avatar +rating +level').exec();
        } catch (dbError) {
          console.error('Database error when finding user:', dbError);
          return next(new Error('Database error'));
        }

        if (!user) {
          console.warn('User not found for token:', decoded.userId);
          return next(new Error('User not found'));
        }

        // Attach user info to socket với proper typing
        socket.user = {
          ...user.toObject(),
          id: (user._id as any).toString(),
          email: user.email,
          role: user.email === (process.env.ADMIN_EMAIL || 'admin@bughunter.com') ? 'admin' : 'user'
        };
        socket.userId = (user._id as any).toString();
        
        console.log(`User authenticated: ${socket.user?.username} (${socket.userId})`);
        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private extractToken(socket: Socket): string | null {
    // Thử nhiều cách lấy token
    const auth = (socket as any).handshake.auth;
    const query = (socket as any).handshake.query;
    const headers = (socket as any).handshake.headers;

    // Priority 1: auth.token
    if (auth?.token) {
      return auth.token as string;
    }

    // Priority 2: query.token
    if (query?.token) {
      return query.token as string;
    }

    // Priority 3: Authorization header
    const authHeader = headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.user || !socket.userId) {
        console.error('Unauthenticated connection attempt');
        (socket as Socket).disconnect();
        return;
      }

      console.log(`User connected: ${socket.user.username} (${socket.userId})`);

      // Check if user already online
      const existingUser = this.onlineUsers.get(socket.userId);
      if (existingUser) {
        console.warn(`User ${socket.user.username} already connected, disconnecting previous session`);
        // Disconnect previous session
        this.io.to(existingUser.socketId).emit('session_expired', {
          message: 'New session detected',
          timestamp: new Date().toISOString()
        });
        // Get the socket of the previous session and disconnect it
        const previousSocket = this.io.sockets.sockets.get(existingUser.socketId);
        if (previousSocket) {
          previousSocket.disconnect(true);
        }
      }

      // Add user to online users
      const onlineUser: OnlineUser = {
        id: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        email: socket.user.email,
        rating: socket.user.rating || 1500,
        level: socket.user.level || 1,
        status: 'online',
        lastSeen: new Date().toISOString(),
        socketId: (socket as any).id
      };

      this.onlineUsers.set(socket.userId, onlineUser);

      // Join user to their personal room
      (socket as any).join(`user_${socket.userId}`);

      // Notify others about user coming online
      (socket as any).broadcast.emit('user_online', {
        user: this.sanitizeUser(onlineUser),
        timestamp: new Date().toISOString()
      });

      // Send current data to new user
      (socket as any).emit('connection_established', {
        user: this.sanitizeUser(onlineUser),
        onlineUsers: Array.from(this.onlineUsers.values()).map(u => this.sanitizeUser(u)),
        rooms: Array.from(this.rooms.values()).map(r => this.sanitizeRoom(r)),
        timestamp: new Date().toISOString()
      });

      // Setup user-specific event handlers
      this.setupUserEventHandlers(socket, onlineUser);
    });

    this.io.on('disconnect', (socket: AuthenticatedSocket) => {
      if (!socket.userId) {
        console.log('Unauthenticated user disconnected');
        return;
      }

      console.log(`User disconnected: ${socket.user?.username} (${socket.userId})`);

      // Remove user from online users
      const onlineUser = this.onlineUsers.get(socket.userId);
      if (onlineUser) {
        this.onlineUsers.delete(socket.userId);

        // Remove from matchmaking queue if present
        this.matchmakingQueue.delete(socket.userId);

        // Remove from all rooms
        this.removeUserFromAllRooms(socket.userId);

        // Clean up any intervals for this user
        const userInterval = this.cleanupIntervals.get(socket.userId);
        if (userInterval) {
          clearInterval(userInterval);
          this.cleanupIntervals.delete(socket.userId);
        }

        // Notify others about user going offline
        (socket as any).broadcast.emit('user_offline', {
          userId: socket.userId,
          username: onlineUser.username,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private setupUserEventHandlers(socket: AuthenticatedSocket, onlineUser: OnlineUser): void {
    // Room Management Events
    (socket as any).on('create_room', (roomData: any) => {
      try {
        this.handleCreateRoom(socket, onlineUser, roomData);
      } catch (error) {
        console.error('Error creating room:', error);
        (socket as any).emit('error', { 
          message: 'Failed to create room',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    (socket as any).on('join_room', (data: { roomId: string; password?: string }) => {
      try {
        this.handleJoinRoom(socket, onlineUser, data);
      } catch (error) {
        console.error('Error joining room:', error);
        (socket as any).emit('error', { 
          message: 'Failed to join room',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    (socket as any).on('leave_room', (data: { roomId: string }) => {
      try {
        this.handleLeaveRoom(socket, onlineUser, data.roomId);
      } catch (error) {
        console.error('Error leaving room:', error);
        (socket as any).emit('error', { 
          message: 'Failed to leave room',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Matchmaking Events
    (socket as any).on('start_matchmaking', (options: any) => {
      try {
        this.handleStartMatchmaking(socket, onlineUser, options);
      } catch (error) {
        console.error('Error starting matchmaking:', error);
        (socket as any).emit('error', { 
          message: 'Failed to start matchmaking',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    (socket as any).on('cancel_matchmaking', () => {
      try {
        this.handleCancelMatchmaking(socket, onlineUser);
      } catch (error) {
        console.error('Error cancelling matchmaking:', error);
        (socket as any).emit('error', { 
          message: 'Failed to cancel matchmaking',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Friend System Events
    (socket as any).on('send_friend_request', (data: { toUserId: string; message?: string }) => {
      try {
        this.handleSendFriendRequest(socket, onlineUser, data);
      } catch (error) {
        console.error('Error sending friend request:', error);
        (socket as any).emit('error', { 
          message: 'Failed to send friend request',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    (socket as any).on('accept_friend_request', (data: { requestId: string; fromUserId: string }) => {
      try {
        this.handleAcceptFriendRequest(socket, onlineUser, data);
      } catch (error) {
        console.error('Error accepting friend request:', error);
        (socket as any).emit('error', { 
          message: 'Failed to accept friend request',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    (socket as any).on('challenge_user', (data: { toUserId: string; challengeData: any }) => {
      try {
        this.handleChallengeUser(socket, onlineUser, data);
      } catch (error) {
        console.error('Error sending challenge:', error);
        (socket as any).emit('error', { 
          message: 'Failed to send challenge',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Real-time match events
    (socket as any).on('submit_solution', (data: { matchId: string; solution: string; time: number }) => {
      try {
        this.handleSubmitSolution(socket, onlineUser, data);
      } catch (error) {
        console.error('Error submitting solution:', error);
        (socket as any).emit('error', { 
          message: 'Failed to submit solution',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // User status updates
    (socket as any).on('update_status', (status: 'online' | 'in-match' | 'away') => {
      try {
        this.handleUpdateStatus(socket, onlineUser, status);
      } catch (error) {
        console.error('Error updating status:', error);
        (socket as any).emit('error', { 
          message: 'Failed to update status',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private handleCreateRoom(socket: AuthenticatedSocket, onlineUser: OnlineUser, roomData: any): void {
    const room: any = {
      name: roomData.name?.trim() || `${onlineUser.username}'s Room`,
      hostId: onlineUser.id,
      hostUsername: onlineUser.username,
      roomCode: this.generateRoomCode(),
      participants: [{
        userId: onlineUser.id,
        username: onlineUser.username,
        joinedAt: new Date(),
        isReady: false
      }],
      settings: {
        timeLimit: Math.max(5, Math.min(60, parseInt(roomData.timeLimit) || 15)),
        difficulty: roomData.difficulty || 'Medium',
        maxParticipants: Math.max(2, Math.min(8, parseInt(roomData.maxParticipants || 2)))
      },
      status: 'waiting',
      createdAt: new Date()
    };

    // Validate room data
    if (!room.name || room.name.length > 50) {
      throw new Error('Invalid room name');
    }

    this.rooms.set(room.id, room);
    (socket as any).join(room.id);
    
    // Broadcast room creation
    (socket as any).emit('room_created', {
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });

    (socket as any).emit('room_joined', {
      room: this.sanitizeRoom(room),
      isHost: true,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all clients that a new room was created
    (this.io as any).emit('room_created', {
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });
  }

  private handleJoinRoom(socket: AuthenticatedSocket, onlineUser: OnlineUser, data: { roomId: string; password?: string }): void {
    const room = this.rooms.get(data.roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.isPrivate && room.password !== data.password) {
      throw new Error('Invalid password');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check if user already in room
    if (room.players.some(p => p.id === onlineUser.id)) {
      throw new Error('Already in room');
    }

    // Add user to room
    room.players.push(onlineUser);
    (socket as any).join(data.roomId);
    
    // Update room status
    if (room.players.length === room.maxPlayers) {
      room.status = 'starting';
      
      // Auto-start after 3 seconds
      setTimeout(() => {
        room.status = 'in-progress';
        (this.io as any).to(data.roomId).emit('room_started', {
          room: this.sanitizeRoom(room),
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }

    // Notify room members
    (this.io as any).to(data.roomId).emit('user_joined_room', {
      user: this.sanitizeUser(onlineUser),
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });

    (socket as any).emit('room_joined', {
      room: this.sanitizeRoom(room),
      isHost: false,
      timestamp: new Date().toISOString()
    });
    
    // Also broadcast room update to all clients
    (this.io as any).emit('room_updated', {
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });
  }

  private handleLeaveRoom(socket: AuthenticatedSocket, onlineUser: OnlineUser, roomId: string): void {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    // Remove user from room
    const initialLength = room.players.length;
    room.players = room.players.filter(p => p.id !== onlineUser.id);
    (socket as any).leave(roomId);

    // Update room status
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      (this.io as any).emit('room_deleted', { 
        roomId, 
        timestamp: new Date().toISOString()
      });
    } else if (room.status === 'in-progress' && room.players.length < 2) {
      room.status = 'waiting';
    }

    // Notify room members
    (this.io as any).to(roomId).emit('user_left_room', {
      user: this.sanitizeUser(onlineUser),
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });

    (socket as any).emit('room_left', {
      roomId,
      timestamp: new Date().toISOString()
    });
    
    // Also broadcast room update to all clients
    (this.io as any).emit('room_updated', {
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });
  }

  private handleStartMatchmaking(socket: AuthenticatedSocket, onlineUser: OnlineUser, options: any): void {
    // Check if user already in queue
    if (this.matchmakingQueue.has(onlineUser.id)) {
      throw new Error('Already in matchmaking queue');
    }

    // Check if user is available for matchmaking
    if (onlineUser.status === 'in-match') {
      throw new Error('Cannot start matchmaking while in match');
    }

    const matchmakingEntry: MatchmakingEntry = {
      user: onlineUser,
      options: {
        difficulty: options.difficulty || 'medium',
        mode: options.mode || '1vs1',
        ratingRange: options.ratingRange || [1000, 3000]
      },
      startTime: Date.now(),
      status: 'searching'
    };

    this.matchmakingQueue.set(onlineUser.id, matchmakingEntry);
    
    (socket as any).emit('matchmaking_started', {
      options: matchmakingEntry.options,
      timestamp: new Date().toISOString()
    });
    
    // Start searching for match
    this.searchForMatch(onlineUser.id);
  }

  private handleCancelMatchmaking(socket: AuthenticatedSocket, onlineUser: OnlineUser): void {
    const removed = this.matchmakingQueue.delete(onlineUser.id);
    
    if (removed) {
      (socket as any).emit('matchmaking_cancelled', {
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Not in matchmaking queue');
    }
  }

  private handleSendFriendRequest(socket: AuthenticatedSocket, onlineUser: OnlineUser, data: { toUserId: string; message?: string }): void {
    const targetUser = this.onlineUsers.get(data.toUserId);
    
    if (!targetUser) {
      throw new Error('User not found or not online');
    }

    if (data.toUserId === onlineUser.id) {
      throw new Error('Cannot send friend request to yourself');
    }

    const friendRequest: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: onlineUser,
      to: targetUser,
      message: data.message?.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Send to target user
    (this.io as any).to(targetUser.socketId).emit('friend_request_received', {
      request: this.sanitizeFriendRequest(friendRequest),
      timestamp: new Date().toISOString()
    });

    (socket as any).emit('friend_request_sent', {
      request: this.sanitizeFriendRequest(friendRequest),
      timestamp: new Date().toISOString()
    });
  }

  private handleAcceptFriendRequest(socket: AuthenticatedSocket, onlineUser: OnlineUser, data: { requestId: string; fromUserId: string }): void {
    // This would typically involve database operations
    // For now, just notify both users
    const fromUser = this.onlineUsers.get(data.fromUserId);
    
    if (!fromUser) {
      throw new Error('Friend request not found');
    }

    const friendship = {
      id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      users: [onlineUser, fromUser],
      timestamp: new Date().toISOString()
    };

    // Notify both users
    (socket as any).emit('friendship_established', {
      friendship,
      timestamp: new Date().toISOString()
    });

    (this.io as any).to(fromUser.socketId).emit('friendship_established', {
      friendship,
      timestamp: new Date().toISOString()
    });
  }

  private handleChallengeUser(socket: AuthenticatedSocket, onlineUser: OnlineUser, data: { toUserId: string; challengeData: any }): void {
    const targetUser = this.onlineUsers.get(data.toUserId);
    
    if (!targetUser) {
      throw new Error('User not found or not online');
    }

    if (data.toUserId === onlineUser.id) {
      throw new Error('Cannot challenge yourself');
    }

    if (targetUser.status === 'in-match') {
      throw new Error('User is currently in a match');
    }

    const challenge: Challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: onlineUser,
      to: targetUser,
      challengeData: {
        difficulty: data.challengeData.difficulty || 'medium',
        mode: data.challengeData.mode || '1vs1',
        timeLimit: data.challengeData.timeLimit || 30,
        problemCount: data.challengeData.problemCount || 3
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Send challenge to target user
    (this.io as any).to(targetUser.socketId).emit('challenge_received', {
      challenge: this.sanitizeChallenge(challenge),
      timestamp: new Date().toISOString()
    });

    (socket as any).emit('challenge_sent', {
      challenge: this.sanitizeChallenge(challenge),
      timestamp: new Date().toISOString()
    });
  }

  private handleSubmitSolution(socket: AuthenticatedSocket, onlineUser: OnlineUser, data: { matchId: string; solution: string; time: number }): void {
    const match = this.matches.get(data.matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'in-progress') {
      throw new Error('Match is not in progress');
    }

    // Initialize solutions array if not exists
    if (!match.solutions) {
      match.solutions = [];
    }

    // Add solution
    match.solutions.push({
      userId: onlineUser.id,
      solution: data.solution,
      time: data.time
    });

    // Broadcast solution submission
    (this.io as any).to(`match_${data.matchId}`).emit('solution_submitted', {
      userId: onlineUser.id,
      username: onlineUser.username,
      solution: data.solution,
      time: data.time,
      timestamp: new Date().toISOString()
    });

    // Check if match should be completed (simplified logic)
    this.checkMatchCompletion(data.matchId);
  }

  private handleUpdateStatus(socket: AuthenticatedSocket, onlineUser: OnlineUser, status: 'online' | 'in-match' | 'away'): void {
    const user = this.onlineUsers.get(onlineUser.id);
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
      
      // Broadcast status update
      (socket as any).broadcast.emit('user_status_updated', {
        user: this.sanitizeUser(user),
        timestamp: new Date().toISOString()
      });
    }
  }

  private searchForMatch(userId: string): void {
    const matchmakingEntry = this.matchmakingQueue.get(userId);
    if (!matchmakingEntry) return;

    // Set timeout for match search
    const timeoutId = setTimeout(() => {
      const entry = this.matchmakingQueue.get(userId);
      if (entry && entry.status === 'searching') {
        entry.status = 'expired';
        (this.io as any).to(entry.user.socketId).emit('matchmaking_timeout', {
          message: 'No suitable opponent found',
          timestamp: new Date().toISOString()
        });
        this.matchmakingQueue.delete(userId);
      }
    }, this.MATCH_TIMEOUT);

    this.cleanupIntervals.set(userId, timeoutId);

    // Try to find match immediately
    this.findSuitableOpponent(userId);
  }

  private findSuitableOpponent(userId: string): void {
    const matchmakingEntry = this.matchmakingQueue.get(userId);
    if (!matchmakingEntry || matchmakingEntry.status !== 'searching') return;

    const { user, options } = matchmakingEntry;
    
    // Find suitable opponent from queue
    for (const [opponentId, opponentEntry] of this.matchmakingQueue.entries()) {
      if (opponentId === userId || opponentEntry.status !== 'searching') continue;
      
      const opponent = opponentEntry.user;
      
      // Check if opponent is suitable
      if (this.isSuitableMatch(user, opponent, options)) {
        // Create match
        this.createMatch(user, opponent, options);
        return;
      }
    }
  }

  private isSuitableMatch(user1: OnlineUser, user2: OnlineUser, options: any): boolean {
    // Check if both users are available
    if (user1.status === 'in-match' || user2.status === 'in-match') {
      return false;
    }

    // Check rating compatibility
    const ratingRange = options.ratingRange || [1000, 3000];
    const ratingDiff = Math.abs(user1.rating - user2.rating);
    
    if (ratingDiff > this.MAX_RATING_DIFF) {
      return false;
    }

    // Check if both users are within rating range
    if (user1.rating < ratingRange[0] || user1.rating > ratingRange[1] ||
        user2.rating < ratingRange[0] || user2.rating > ratingRange[1]) {
      return false;
    }

    return true;
  }

  private createMatch(player1: OnlineUser, player2: OnlineUser, options: any): void {
    const match: Match = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player1,
      player2,
      mode: options.mode || '1vs1',
      difficulty: options.difficulty || 'medium',
      timeLimit: options.timeLimit || 30,
      problemCount: options.problemCount || 3,
      status: 'waiting-acceptance',
      createdAt: new Date().toISOString(),
      solutions: []
    };

    this.matches.set(match.id, match);
    
    // Remove both from queue
    this.matchmakingQueue.delete(player1.id);
    this.matchmakingQueue.delete(player2.id);
    
    // Clear any existing timeouts
    const timeout1 = this.cleanupIntervals.get(player1.id);
    const timeout2 = this.cleanupIntervals.get(player2.id);
    if (timeout1) clearTimeout(timeout1);
    if (timeout2) clearTimeout(timeout2);
    this.cleanupIntervals.delete(player1.id);
    this.cleanupIntervals.delete(player2.id);
    
    // Create match room
    const matchRoomId = `match_${match.id}`;
    (this.io as any).to(player1.socketId).sockets.join(matchRoomId);
    (this.io as any).to(player2.socketId).sockets.join(matchRoomId);
    
    // Notify both players
    (this.io as any).to(player1.socketId).emit('match_found', {
      match: this.sanitizeMatch(match),
      isPlayer1: true,
      opponent: this.sanitizeUser(player2),
      timestamp: new Date().toISOString()
    });

    (this.io as any).to(player2.socketId).emit('match_found', {
      match: this.sanitizeMatch(match),
      isPlayer1: false,
      opponent: this.sanitizeUser(player1),
      timestamp: new Date().toISOString()
    });

    // Set timeout for match acceptance
    setTimeout(() => {
      const currentMatch = this.matches.get(match.id);
      if (currentMatch && currentMatch.status === 'waiting-acceptance') {
        currentMatch.status = 'finished';
        (this.io as any).to(matchRoomId).emit('match_expired', {
          matchId: match.id,
          timestamp: new Date().toISOString()
        });
        this.matches.delete(match.id);
      }
    }, 10000); // 10 seconds to accept
  }

  private checkMatchCompletion(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'in-progress') return;

    // Simplified completion logic - in real implementation would validate solutions
    // For demo purposes, randomly complete after some time
    setTimeout(() => {
      const currentMatch = this.matches.get(matchId);
      if (currentMatch && currentMatch.status === 'in-progress') {
        currentMatch.status = 'finished';
        
        // Random winner for demo
        const winnerId = Math.random() > 0.5 ? currentMatch.player1.id : currentMatch.player2.id;
        currentMatch.winner = winnerId;
        
        // Update winner status
        const winner = this.onlineUsers.get(winnerId);
        if (winner) {
          winner.status = 'online';
        }
        
        // Notify match participants
        (this.io as any).to(`match_${matchId}`).emit('match_completed', {
          match: this.sanitizeMatch(currentMatch),
          timestamp: new Date().toISOString()
        });
        
        // Clean up
        this.matches.delete(matchId);
      }
    }, 8000); // 8 seconds
  }

  private removeUserFromAllRooms(userId: string): void {
    for (const [roomId, room] of this.rooms.entries()) {
      const initialLength = room.players.length;
      room.players = room.players.filter(p => p.id !== userId);
      
      if (room.players.length !== initialLength) {
        // User was in this room
        (this.io as any).to(roomId).emit('user_left_room', {
          userId,
          room: this.sanitizeRoom(room),
          timestamp: new Date().toISOString()
        });
        
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
          (this.io as any).emit('room_deleted', { 
            roomId, 
            timestamp: new Date().toISOString()
          });
        }
        
        break;
      }
    }
  }

  private startCleanupTasks(): void {
    // Clean up expired matchmaking entries
    setInterval(() => {
      const now = Date.now();
      for (const [userId, entry] of this.matchmakingQueue.entries()) {
        if (entry.status === 'searching' && (now - entry.startTime) > this.MATCH_TIMEOUT) {
          entry.status = 'expired';
          (this.io as any).to(entry.user.socketId).emit('matchmaking_timeout', {
            message: 'Matchmaking timeout',
            timestamp: new Date().toISOString()
          });
          this.matchmakingQueue.delete(userId);
        }
      }
    }, this.CLEANUP_INTERVAL);
  }

  // Data sanitization methods
  private sanitizeUser(user: OnlineUser): any {
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      rating: user.rating,
      level: user.level,
      status: user.status,
      lastSeen: user.lastSeen
    };
  }

  private sanitizeRoom(room: any): any {
    return {
      id: room._id || room.id,
      name: room.name,
      hostId: room.hostId?.toString() || room.hostId,
      hostUsername: room.hostUsername,
      participants: (room.participants || []).map((p: any) => ({
        userId: p.userId?.toString() || p.userId,
        username: p.username,
        joinedAt: p.joinedAt,
        isReady: p.isReady || false
      })),
      settings: room.settings || {
        timeLimit: 15,
        difficulty: 'Medium',
        maxParticipants: 2
      },
      status: room.status || 'waiting',
      roomCode: room.roomCode,
      createdAt: room.createdAt || new Date(),
      updatedAt: room.updatedAt || new Date()
    };
  }

  private sanitizeMatch(match: Match): any {
    return {
      id: match.id,
      player1: this.sanitizeUser(match.player1),
      player2: this.sanitizeUser(match.player2),
      mode: match.mode,
      difficulty: match.difficulty,
      status: match.status,
      winner: match.winner,
      createdAt: match.createdAt,
      timeLimit: match.timeLimit,
      problemCount: match.problemCount
    };
  }

  private sanitizeFriendRequest(request: FriendRequest): any {
    return {
      id: request.id,
      from: this.sanitizeUser(request.from),
      to: this.sanitizeUser(request.to),
      message: request.message,
      timestamp: request.timestamp,
      status: request.status
    };
  }

  private sanitizeChallenge(challenge: Challenge): any {
    return {
      id: challenge.id,
      from: this.sanitizeUser(challenge.from),
      to: this.sanitizeUser(challenge.to),
      challengeData: challenge.challengeData,
      timestamp: challenge.timestamp,
      status: challenge.status
    };
  }

  // Public methods for external use
  public broadcastSystemNotification(notification: { 
    title: string; 
    message: string; 
    type?: 'info' | 'warning' | 'success' | 'error' 
  }): void {
    (this.io as any).emit('system_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  public sendToUser(userId: string, event: string, data: any): void {
    const user = this.onlineUsers.get(userId);
    if (user) {
      (this.io as any).to(user.socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  public sendToRoom(roomId: string, event: string, data: any): void {
    (this.io as any).to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomCode;
  }

  public getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  public getActiveMatchesCount(): number {
    return this.matches.size;
  }

  public getMatchmakingQueueSize(): number {
    return this.matchmakingQueue.size;
  }

  public getServerStats(): any {
    return {
      onlineUsers: this.getOnlineUsersCount(),
      activeRooms: this.getActiveRoomsCount(),
      activeMatches: this.getActiveMatchesCount(),
      matchmakingQueue: this.getMatchmakingQueueSize(),
      timestamp: new Date().toISOString()
    };
  }

  // Public methods for controller integration
  public addToMatchmaking(userId: string, username: string, preferences: any): void {
    this.handleStartMatchmaking({
      userId,
      emit: (event: string, data: any) => {
        this.io.to(`user_${userId}`).emit(event, data);
      }
    } as any, {
      id: userId,
      username,
      rating: 1200, // Default rating
      level: 1,
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      socketId: `user_${userId}`,
      email: ''
    }, preferences);
  }

  public removeFromMatchmaking(userId: string): void {
    this.handleCancelMatchmaking({
      userId,
      emit: (event: string, data: any) => {
        this.io.to(`user_${userId}`).emit(event, data);
      }
    } as any, {
      id: userId,
      username: '',
      rating: 1200,
      level: 1,
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      socketId: `user_${userId}`,
      email: ''
    });
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  public getOnlineUsersDetails(): any[] {
    return Array.from(this.onlineUsers.values()).map(user => this.sanitizeUser(user));
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public isConnected(): boolean {
    return this.io !== null && this.io !== undefined;
  }

  public broadcastRoomUpdate(room: any): void {
    console.log('📢 Broadcasting room update for room:', room.name || room._id);
    this.io.emit('room_updated', {
      room: this.sanitizeRoom(room),
      timestamp: new Date().toISOString()
    });
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
  
  // Broadcast room timer sync
  public broadcastRoomTimerSync(roomId: string, startTime: number): void {
    this.io.emit('room_timer_sync', {
      roomId,
      startTime,
      currentTime: Date.now(),
      timestamp: new Date().toISOString()
    });
  }

  public broadcastSubmission(roomId: string, data: any): void {
    this.io.to(roomId).emit('submission_received', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public sendFriendRequest(userId: string, data: any): void {
    this.io.to(`user_${userId}`).emit('friend_request_received', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public sendFriendAccepted(userId: string, data: any): void {
    this.io.to(`user_${userId}`).emit('friend_accepted', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}