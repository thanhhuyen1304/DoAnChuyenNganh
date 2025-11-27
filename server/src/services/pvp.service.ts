import { Types } from 'mongoose';

export interface RoomOptions {
  difficulty?: string;
  mode?: string;
  page: number;
  limit: number;
}

export interface MatchmakingOptions {
  difficulty?: string;
  mode?: string;
  ratingRange?: [number, number];
}

export interface OnlineUsersOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface FriendsOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface MatchHistoryOptions {
  page: number;
  limit: number;
  mode?: string;
  difficulty?: string;
}

export interface LeaderboardOptions {
  page: number;
  limit: number;
  mode?: string;
  timeFrame?: string;
}

export interface RoomData {
  name: string;
  mode: '1vs1' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  problemCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  allowSpectators: boolean;
  autoStart: boolean;
  ratingRange: [number, number];
  selectedProblems: string[];
  customRules: {
    allowHints: boolean;
    showSolution: boolean;
    penaltySystem: boolean;
    timeBonus: boolean;
  };
  hostId: string;
}

export interface ChallengeData {
  difficulty: string;
  mode: string;
  timeLimit: number;
  problemCount: number;
}

export class PvPService {
  // Mock data storage - trong thực tế sẽ dùng database
  private rooms: any[] = [];
  private matchmakingQueue: any[] = [];
  private matches: any[] = [];
  private friendRequests: any[] = [];
  private friendships: any[] = [];
  private onlineUsers: any[] = [];
  private matchHistory: any[] = [];
  private leaderboard: any[] = [];
  private challenges: any[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Khởi tạo dữ liệu mẫu
    this.rooms = [
      {
        id: '1',
        name: 'CodeMaster\'s Room',
        host: 'CodeMaster',
        hostId: 'user1',
        hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
        mode: '1vs1',
        difficulty: 'medium',
        players: 1,
        maxPlayers: 2,
        isPrivate: false,
        timeLimit: 30,
        problemCount: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        allowSpectators: true,
        ratingRange: [1500, 1800]
      },
      {
        id: '2',
        name: 'Tournament Arena',
        host: 'ProCoder',
        hostId: 'user2',
        hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProCoder',
        mode: 'tournament',
        difficulty: 'hard',
        players: 3,
        maxPlayers: 8,
        isPrivate: false,
        timeLimit: 45,
        problemCount: 5,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        allowSpectators: true,
        ratingRange: [1800, 2200]
      }
    ];

    this.onlineUsers = [
      {
        id: '1',
        username: 'CodeMaster',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
        rating: 1850,
        status: 'online',
        lastSeen: '2 phút trước',
        wins: 142,
        losses: 38,
        level: 25,
        isOnline: true,
        isPlaying: false
      },
      {
        id: '2',
        username: 'AlgoNinja',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoNinja',
        rating: 1920,
        status: 'in-match',
        lastSeen: 'Đang đấu',
        wins: 167,
        losses: 42,
        level: 28,
        isOnline: true,
        isPlaying: true
      },
      {
        id: '3',
        username: 'SyntaxKing',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SyntaxKing',
        rating: 1780,
        status: 'online',
        lastSeen: '5 phút trước',
        wins: 128,
        losses: 35,
        level: 23,
        isOnline: true,
        isPlaying: false
      }
    ];

    this.leaderboard = [
      {
        rank: 1,
        username: 'CodeLegend',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeLegend',
        rating: 2150,
        wins: 287,
        losses: 43,
        winRate: 87.0,
        streak: 12
      },
      {
        rank: 2,
        username: 'AlgoMaster',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoMaster',
        rating: 2080,
        wins: 254,
        losses: 51,
        winRate: 83.3,
        streak: 8
      },
      {
        rank: 3,
        username: 'DebugExpert',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DebugExpert',
        rating: 1990,
        wins: 221,
        losses: 58,
        winRate: 79.2,
        streak: 5
      }
    ];
  }

  // Lấy danh sách phòng
  async getRooms(options: RoomOptions): Promise<any[]> {
    let filteredRooms = [...this.rooms];

    // Lọc theo độ khó
    if (options.difficulty && options.difficulty !== 'all') {
      filteredRooms = filteredRooms.filter(room => room.difficulty === options.difficulty);
    }

    // Lọc theo chế độ
    if (options.mode && options.mode !== 'all') {
      filteredRooms = filteredRooms.filter(room => room.mode === options.mode);
    }

    // Phân trang
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    
    return filteredRooms.slice(start, end);
  }

  // Tạo phòng mới
  async createRoom(roomData: RoomData): Promise<any> {
    const newRoom = {
      id: new Types.ObjectId().toString(),
      ...roomData,
      players: 1, // Host luôn được tính là người chơi đầu tiên
      createdAt: new Date().toISOString(),
      status: 'waiting'
    };

    this.rooms.push(newRoom);
    return newRoom;
  }

  // Tham gia phòng
  async joinRoom(roomId: string, userId: string, password?: string): Promise<any> {
    const room = this.rooms.find(r => r.id === roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('Invalid password');
    }

    if (room.players >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Kiểm tra xem user đã trong phòng chưa
    if (room.players.some((p: any) => p.userId === userId)) {
      throw new Error('Already in room');
    }

    room.players++;
    
    // Nếu đủ người chơi và autoStart = true, bắt đầu trận đấu
    if (room.players === room.maxPlayers && room.autoStart) {
      room.status = 'starting';
      // Logic bắt đầu trận đấu
      setTimeout(() => {
        room.status = 'in-progress';
      }, 3000);
    }

    return room;
  }

  // Rời phòng
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) {
      throw new Error('Room not found');
    }

    const room = this.rooms[roomIndex];
    room.players--;

    // Nếu không còn ai trong phòng, xóa phòng
    if (room.players === 0) {
      this.rooms.splice(roomIndex, 1);
    }
  }

  // Bắt đầu matchmaking
  async startMatchmaking(userId: string, options: MatchmakingOptions): Promise<any> {
    // Kiểm tra xem user đã trong queue chưa
    if (this.matchmakingQueue.find(m => m.userId === userId)) {
      throw new Error('Already in matchmaking queue');
    }

    const matchmakingEntry = {
      id: new Types.ObjectId().toString(),
      userId,
      options,
      startTime: new Date().toISOString(),
      status: 'searching'
    };

    this.matchmakingQueue.push(matchmakingEntry);

    // Giả lập tìm kiếm đối thủ sau 3-8 giây
    setTimeout(() => {
      this.findMatch(matchmakingEntry.id);
    }, Math.random() * 5000 + 3000);

    return matchmakingEntry;
  }

  // Tìm đối thủ
  private async findMatch(matchmakingId: string): Promise<void> {
    const matchmaking = this.matchmakingQueue.find(m => m.id === matchmakingId);
    if (!matchmaking) return;

    // Tìm đối thủ phù hợp
    const opponent = this.findSuitableOpponent(matchmaking);
    
    if (opponent) {
      matchmaking.status = 'found';
      matchmaking.opponent = opponent;
      
      // Tạo trận đấu
      const match = {
        id: new Types.ObjectId().toString(),
        player1: matchmaking.userId,
        player2: opponent.userId,
        difficulty: matchmaking.options.difficulty || 'medium',
        mode: matchmaking.options.mode || '1vs1',
        status: 'waiting-acceptance',
        createdAt: new Date().toISOString()
      };

      this.matches.push(match);
    }
  }

  // Tìm đối thủ phù hợp
  private findSuitableOpponent(matchmaking: any): any {
    const { ratingRange = [1000, 3000], difficulty, mode } = matchmaking.options;
    
    return this.onlineUsers.find(user => {
      if (user.userId === matchmaking.userId) return false;
      if (user.isPlaying) return false;
      if (user.rating < ratingRange[0] || user.rating > ratingRange[1]) return false;
      
      return true;
    });
  }

  // Hủy matchmaking
  async cancelMatchmaking(userId: string): Promise<void> {
    const index = this.matchmakingQueue.findIndex(m => m.userId === userId);
    if (index !== -1) {
      this.matchmakingQueue.splice(index, 1);
    }
  }

  // Chấp nhận trận đấu
  async acceptMatch(matchId: string, userId: string): Promise<any> {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.player1 !== userId && match.player2 !== userId) {
      throw new Error('Not a participant in this match');
    }

    match.status = 'accepted';
    return match;
  }

  // Từ chối trận đấu
  async rejectMatch(matchId: string, userId: string): Promise<void> {
    const matchIndex = this.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) {
      throw new Error('Match not found');
    }

    const match = this.matches[matchIndex];
    if (match.player1 !== userId && match.player2 !== userId) {
      throw new Error('Not a participant in this match');
    }

    this.matches.splice(matchIndex, 1);
  }

  // Lấy danh sách người dùng online
  async getOnlineUsers(options: OnlineUsersOptions): Promise<any[]> {
    let filteredUsers = [...this.onlineUsers];

    // Tìm kiếm
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower)
      );
    }

    // Phân trang
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    
    return filteredUsers.slice(start, end);
  }

  // Gửi lời mời kết bạn
  async sendFriendRequest(fromUserId: string, toUserId: string, message?: string): Promise<any> {
    // Kiểm tra xem đã là bạn chưa
    if (this.friendships.find(f => 
        (f.user1 === fromUserId && f.user2 === toUserId) ||
        (f.user1 === toUserId && f.user2 === fromUserId))) {
      throw new Error('Already friends');
    }

    // Kiểm tra xem đã gửi lời mời chưa
    if (this.friendRequests.find(fr => 
        fr.from === fromUserId && fr.to === toUserId)) {
      throw new Error('Friend request already sent');
    }

    const friendRequest = {
      id: new Types.ObjectId().toString(),
      from: fromUserId,
      to: toUserId,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.friendRequests.push(friendRequest);
    return friendRequest;
  }

  // Lấy danh sách lời mời kết bạn
  async getFriendRequests(userId: string): Promise<any[]> {
    return this.friendRequests.filter(fr => fr.to === userId && fr.status === 'pending');
  }

  // Chấp nhận lời mời kết bạn
  async acceptFriendRequest(requestId: string, userId: string): Promise<any> {
    const requestIndex = this.friendRequests.findIndex(fr => fr.id === requestId);
    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }

    const request = this.friendRequests[requestIndex];
    if (request.to !== userId) {
      throw new Error('Not authorized to accept this request');
    }

    // Tạo friendship
    const friendship = {
      id: new Types.ObjectId().toString(),
      user1: request.from,
      user2: request.to,
      createdAt: new Date().toISOString()
    };

    this.friendships.push(friendship);
    request.status = 'accepted';

    return friendship;
  }

  // Từ chối lời mời kết bạn
  async rejectFriendRequest(requestId: string, userId: string): Promise<void> {
    const requestIndex = this.friendRequests.findIndex(fr => fr.id === requestId);
    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }

    const request = this.friendRequests[requestIndex];
    if (request.to !== userId) {
      throw new Error('Not authorized to reject this request');
    }

    request.status = 'rejected';
  }

  // Lấy danh sách bạn bè
  async getFriends(userId: string, options: FriendsOptions): Promise<any[]> {
    let friends = this.friendships
      .filter(f => f.user1 === userId || f.user2 === userId)
      .map(f => {
        const friendId = f.user1 === userId ? f.user2 : f.user1;
        const friend = this.onlineUsers.find(u => u.id === friendId);
        return friend ? { ...friend, friendshipId: f.id } : null;
      })
      .filter(Boolean);

    // Tìm kiếm
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      friends = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchLower)
      );
    }

    // Phân trang
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    
    return friends.slice(start, end);
  }

  // Xóa bạn
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const index = this.friendships.findIndex(f => 
        (f.user1 === userId && f.user2 === friendId) ||
        (f.user1 === friendId && f.user2 === userId));
    
    if (index !== -1) {
      this.friendships.splice(index, 1);
    }
  }

  // Lấy lịch sử đấu
  async getMatchHistory(userId: string, options: MatchHistoryOptions): Promise<any[]> {
    let history = this.matchHistory.filter(m => 
      m.player1 === userId || m.player2 === userId
    );

    // Lọc theo chế độ
    if (options.mode && options.mode !== 'all') {
      history = history.filter(m => m.mode === options.mode);
    }

    // Lọc theo độ khó
    if (options.difficulty && options.difficulty !== 'all') {
      history = history.filter(m => m.difficulty === options.difficulty);
    }

    // Phân trang
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    
    return history.slice(start, end);
  }

  // Lấy bảng xếp hạng
  async getLeaderboard(options: LeaderboardOptions): Promise<any[]> {
    let leaderboard = [...this.leaderboard];

    // Lọc theo chế độ
    if (options.mode && options.mode !== 'all') {
      // Trong thực tế sẽ lọc theo chế độ
    }

    // Lọc theo khung thời gian
    if (options.timeFrame && options.timeFrame !== 'all-time') {
      // Trong thực tế sẽ lọc theo thời gian
    }

    // Phân trang
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    
    return leaderboard.slice(start, end);
  }

  // Lấy thống kê người dùng
  async getUserStats(userId: string): Promise<any> {
    const user = this.onlineUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const history = this.matchHistory.filter(m => 
      m.player1 === userId || m.player2 === userId
    );

    const wins = history.filter(m => m.winner === userId).length;
    const losses = history.filter(m => m.winner !== userId && m.winner !== null).length;
    const totalMatches = history.length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      ...user,
      totalMatches,
      wins,
      losses,
      winRate: Math.round(winRate * 10) / 10,
      currentStreak: this.calculateCurrentStreak(userId, history),
      bestStreak: this.calculateBestStreak(userId, history),
      averageRating: this.calculateAverageRating(userId, history)
    };
  }

  // Tính chuỗi thắng hiện tại
  private calculateCurrentStreak(userId: string, history: any[]): number {
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].winner === userId) {
        streak++;
      } else if (history[i].winner !== null) {
        break;
      }
    }
    return streak;
  }

  // Tính chuỗi thắng tốt nhất
  private calculateBestStreak(userId: string, history: any[]): number {
    let bestStreak = 0;
    let currentStreak = 0;
    
    for (const match of history) {
      if (match.winner === userId) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (match.winner !== null) {
        currentStreak = 0;
      }
    }
    
    return bestStreak;
  }

  // Tính rating trung bình
  private calculateAverageRating(userId: string, history: any[]): number {
    if (history.length === 0) return 1500;
    
    const user = this.onlineUsers.find(u => u.id === userId);
    return user ? user.rating : 1500;
  }

  // Thách đấu người dùng
  async challengeUser(fromUserId: string, toUserId: string, challengeData: ChallengeData): Promise<any> {
    const challenge = {
      id: new Types.ObjectId().toString(),
      from: fromUserId,
      to: toUserId,
      ...challengeData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.challenges.push(challenge);
    return challenge;
  }

  // Lấy danh sách thách đấu
  async getChallenges(userId: string, type: string = 'received'): Promise<any[]> {
    if (type === 'received') {
      return this.challenges.filter(c => c.to === userId && c.status === 'pending');
    } else {
      return this.challenges.filter(c => c.from === userId);
    }
  }

  // Phản hồi thách đấu
  async respondToChallenge(challengeId: string, userId: string, response: string): Promise<any> {
    const challengeIndex = this.challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) {
      throw new Error('Challenge not found');
    }

    const challenge = this.challenges[challengeIndex];
    if (challenge.to !== userId) {
      throw new Error('Not authorized to respond to this challenge');
    }

    if (response === 'accept') {
      challenge.status = 'accepted';
      
      // Tạo trận đấu từ challenge
      const match = {
        id: new Types.ObjectId().toString(),
        player1: challenge.from,
        player2: challenge.to,
        difficulty: challenge.difficulty,
        mode: challenge.mode,
        timeLimit: challenge.timeLimit,
        problemCount: challenge.problemCount,
        status: 'ready',
        createdAt: new Date().toISOString()
      };

      this.matches.push(match);
      return { challenge, match };
    } else {
      challenge.status = 'rejected';
      return challenge;
    }
  }
}