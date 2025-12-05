import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api/pvp',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('SimplePvPApi: Sending request to', config.url, 'with token:', token ? `${token.substring(0, 10)}...` : 'none');
  console.log('SimplePvPApi: Request data:', config.data);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface RoomSettings {
  timeLimit: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  maxParticipants?: number;
  isPrivate?: boolean;
  language?: string;
}

export interface Room {
  _id: string;
  name: string;
  hostId: string;
  hostUsername: string;
  roomCode: string;
  settings: RoomSettings;
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: string;
    isReady: boolean;
  }>;
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface Challenge {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export interface Match {
  _id: string;
  roomId: string;
  roomName: string;
  challengeId: string;
  challengeTitle: string;
  participants: Array<{
    userId: string;
    username: string;
    submissionId?: string;
    score: number;
    passedTests: number;
    totalTests: number;
    completionTime: number;
    submittedAt?: string;
    isWinner?: boolean;
  }>;
  status: 'active' | 'completed';
  winnerId?: string;
  startedAt: string;
  completedAt?: string;
  timeLimit: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SubmissionResult {
  score: number;
  passedTests: number;
  totalTests: number;
  testResults: Array<{
    testCase: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    passed: boolean;
    executionTime: number;
    memory: number;
  }>;
}

export interface MatchResult {
  winner: string;
  participants: Array<{
    username: string;
    score: number;
    passedTests: number;
    completionTime: number;
    isWinner: boolean;
  }>;
  winnerXP: number;
}

class SimplePvPApi {
  // Room Management
  async createRoom(name: string, settings: RoomSettings): Promise<{ data: Room; success: boolean }> {
    const response = await api.post('/rooms', { name, settings });
    return response.data;
  }

  async getRooms(limit = 20, offset = 0): Promise<{ data: Room[]; success: boolean }> {
    const response = await api.get('/rooms', { params: { limit, offset } });
    return response.data;
  }

  async joinRoom(roomCode: string): Promise<{ data: Room; success: boolean }> {
    const response = await api.post(`/rooms/${roomCode}/join`, { roomCode });
    return response.data;
  }

  async joinRoomById(roomId: string, roomCode?: string): Promise<{ data: Room; success: boolean }> {
    const response = await api.post(`/rooms/${roomId}/join`, { roomCode });
    return response.data;
  }

  async leaveRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  }

  async startMatch(roomId: string): Promise<{ 
    data: { 
      matchId: string; 
      challenge: Challenge;
    }; 
    success: boolean; 
    message: string; 
  }> {
    const response = await api.post(`/rooms/${roomId}/start`);
    return response.data;
  }

  async setReadyStatus(roomId: string, isReady: boolean): Promise<{ data: Room; success: boolean }> {
    const response = await api.post(`/rooms/${roomId}/ready`, { isReady });
    return response.data;
  }

  // Match Management
  async submitCode(matchId: string, code: string, language: string): Promise<{ 
    data: SubmissionResult; 
    success: boolean; 
    message: string; 
  }> {
    const response = await api.post(`/matches/${matchId}/submit`, { code, language });
    return response.data;
  }

  async getMatchStatus(matchId: string): Promise<{ data: Match; success: boolean }> {
    const response = await api.get(`/matches/${matchId}/status`);
    return response.data;
  }

  async finishMatch(matchId: string): Promise<{ data: MatchResult; success: boolean; message: string }> {
    const response = await api.post(`/matches/${matchId}/finish`);
    return response.data;
  }

  async forfeitMatch(matchId: string): Promise<{ data: MatchResult; success: boolean; message: string }> {
    const response = await api.post(`/matches/${matchId}/forfeit`);
    return response.data;
  }

  // Utility methods
  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomCode;
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatTimeLimit(minutes: number): string {
    return `${minutes} phút`;
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getDifficultyText(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'Dễ';
      case 'Medium':
        return 'Trung bình';
      case 'Hard':
        return 'Khó';
      default:
        return difficulty;
    }
  }

  // Leaderboard APIs
  async getLeaderboard(limit = 100, offset = 0): Promise<{
    success: boolean;
    data: Array<{
      rank: number;
      userId: string;
      username: string;
      avatar?: string;
      totalXP: number;
      wins: number;
      losses: number;
      draws: number;
      totalMatches: number;
      winRate: number;
    }>;
  }> {
    const response = await api.get('/leaderboard', { params: { limit, offset } });
    return response.data;
  }

  async getUserStats(): Promise<{
    success: boolean;
    data: {
      username: string;
      avatar?: string;
      totalXP: number;
      rank: number;
      pvpStats: {
        wins: number;
        losses: number;
        draws: number;
        totalMatches: number;
        completedMatches: number;
        winRate: number;
        currentStreak: number;
        bestStreak: number;
      };
    };
  }> {
    const response = await api.get('/stats/me');
    return response.data;
  }

  // Gửi lời mời vào phòng
  async sendRoomInvite(roomId: string, targetUserId: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      targetUsername: string;
      roomName: string;
      expiresIn: number;
    };
  }> {
    const response = await api.post(`/rooms/${roomId}/invite`, { targetUserId });
    return response.data;
  }
}

export default new SimplePvPApi();
