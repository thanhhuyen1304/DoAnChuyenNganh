import { Request, Response } from 'express';
import { PvPService } from '../services/pvp.service';
import { WebSocketService } from '../services/websocket.service';
import User from '../models/user.model';
import Room from '../models/room.model';
import Match from '../models/match.model';
import Friend from '../models/friend.model';
import Challenge from '../models/challenge.model';
import judge0Service from '../services/judge0Service';

export class PvPController {
  private pvpService: PvPService;
  private wsService: WebSocketService;

  constructor(server?: any) {
    this.pvpService = new PvPService();
    this.wsService = server ? new WebSocketService(server) : null as any;
  }

  // Lấy danh sách phòng đang chờ
  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 20, offset = 0, mode, difficulty } = req.query;
      
      let filter: any = { status: 'waiting' };
      
      if (mode) {
        filter['settings.mode'] = mode;
      }
      
      if (difficulty) {
        filter['settings.difficulty'] = difficulty;
      }

      const rooms = await Room.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('hostId', 'username avatar');

      const formattedRooms = rooms.map(room => ({
        id: room._id,
        name: room.name,
        description: room.description,
        hostUsername: room.hostUsername,
        hostAvatar: (room.hostId as any)?.avatar,
        participants: room.participants.length,
        maxParticipants: room.settings.maxParticipants,
        settings: room.settings,
        status: room.status,
        createdAt: room.createdAt
      }));

      res.json({
        success: true,
        data: formattedRooms,
        pagination: {
          page: Math.floor(Number(offset) / Number(limit)) + 1,
          limit: Number(limit),
          total: formattedRooms.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rooms',
        error: error.message
      });
    }
  };

  // Tạo phòng mới
  createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      
      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const roomData = req.body;
      
      // Get user rating
      const user = await User.findById(userId).select('rating');
      const userRating = user?.rating || 1200;

      const room = new Room({
        name: roomData.name,
        description: roomData.description,
        hostId: userId,
        hostUsername: username,
        settings: roomData.settings,
        participants: [{
          userId: userId,
          username: username,
          rating: userRating,
          joinedAt: new Date(),
          isReady: false
        }]
      });

      await room.save();

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create room',
        error: error.message
      });
    }
  };

  // Tham gia phòng
  joinRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { roomId } = req.params;
      const { password } = req.body;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Check password if private
      if (room.settings.isPrivate && room.settings.password !== password) {
        res.status(403).json({
          success: false,
          message: 'Invalid password'
        });
        return;
      }

      // Check if room is full
      if (room.participants.length >= room.settings.maxParticipants) {
        res.status(400).json({
          success: false,
          message: 'Room is full'
        });
        return;
      }

      // Get user rating
      const user = await User.findById(userId).select('rating');
      const userRating = user?.rating || 1200;

      // Add participant
      await (room as any).addParticipant(userId as any, username, userRating);

      res.json({
        success: true,
        data: room,
        message: 'Joined room successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to join room'
      });
    }
  };

  // Rời phòng
  leaveRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { roomId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      await (room as any).removeParticipant(userId as any);

      res.json({
        success: true,
        data: room,
        message: 'Left room successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to leave room'
      });
    }
  };

  // Bắt đầu matchmaking
  startMatchmaking = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { preferences } = req.body;

      // Add to matchmaking queue via WebSocket service
      if (this.wsService) {
        this.wsService.addToMatchmaking(userId as any, username, preferences);
      }

      res.json({
        success: true,
        message: 'Matchmaking started'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to start matchmaking',
        error: error.message
      });
    }
  };

  // Hủy matchmaking
  cancelMatchmaking = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Remove from matchmaking queue via WebSocket service
      if (this.wsService) {
        this.wsService.removeFromMatchmaking(userId as any);
      }

      res.json({
        success: true,
        message: 'Matchmaking cancelled'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel matchmaking'
      });
    }
  };

  // Chấp nhận trận đấu
  acceptMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { matchId } = req.params;

      const match = await this.pvpService.acceptMatch(matchId, userId);

      res.json({
        success: true,
        data: match,
        message: 'Match accepted'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept match'
      });
    }
  };

  // Từ chối trận đấu
  rejectMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { matchId } = req.params;

      await this.pvpService.rejectMatch(matchId, userId);

      res.json({
        success: true,
        message: 'Match rejected'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject match'
      });
    }
  };

  // Lấy danh sách người dùng online
  getOnlineUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const onlineUsers = this.wsService ? this.wsService.getOnlineUsers() : [];
      
      res.json({
        success: true,
        data: onlineUsers,
        pagination: {
          page: 1,
          limit: onlineUsers.length,
          total: onlineUsers.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch online users',
        error: error.message
      });
    }
  };

  // Gửi lời mời kết bạn
  sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const fromUserId = (req as any).user?.id;
      const fromUsername = (req as any).user?.username;
      if (!fromUserId || !fromUsername) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { toUserId } = req.body;

      // Check if friendship already exists
      const existingFriendship = await (Friend as any).findFriendship(
        fromUserId as any,
        toUserId as any
      );

      if (existingFriendship) {
        res.status(400).json({
          success: false,
          message: 'Friendship already exists or pending'
        });
        return;
      }

      // Get recipient info
      const recipient = await User.findById(toUserId).select('username');
      if (!recipient) {
        res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
        return;
      }

      // Create friend request
      const friendRequest = new Friend({
        requesterId: fromUserId,
        recipientId: toUserId,
        requesterUsername: fromUsername,
        recipientUsername: recipient.username,
        status: 'pending'
      });

      await friendRequest.save();

      res.status(201).json({
        success: true,
        data: friendRequest,
        message: 'Friend request sent'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send friend request'
      });
    }
  };

  // Lấy danh sách lời mời kết bạn
  getFriendRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const requests = await (Friend as any).getPendingRequests(userId as any);
      
      const formattedRequests = requests.map((request: any) => ({
        id: request._id,
        requesterId: request.requesterId,
        requesterUsername: request.requesterUsername,
        requestedAt: request.requestedAt
      }));

      res.json({
        success: true,
        data: formattedRequests
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch friend requests',
        error: error.message
      });
    }
  };

  // Chấp nhận lời mời kết bạn
  acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { requestId } = req.params;

      const friendRequest = await Friend.findById(requestId);
      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: 'Friend request not found'
        });
        return;
      }

      if (friendRequest.recipientId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to respond to this request'
        });
        return;
      }

      await (friendRequest as any).acceptRequest();

      res.json({
        success: true,
        data: friendRequest,
        message: 'Friend request accepted'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept friend request'
      });
    }
  };

  // Từ chối lời mời kết bạn
  rejectFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { requestId } = req.params;

      await this.pvpService.rejectFriendRequest(requestId, userId);

      res.json({
        success: true,
        message: 'Friend request rejected'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject friend request'
      });
    }
  };

  // Lấy danh sách bạn bè
  getFriends = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const friendships = await (Friend as any).getFriendsList(userId as any);
      
      const friends = friendships.map((friendship: any) => {
        const isRequester = friendship.requesterId.toString() === userId;
        const friendId = isRequester ? friendship.recipientId : friendship.requesterId;
        const friendUsername = isRequester ? friendship.recipientUsername : friendship.requesterUsername;
        
        return {
          id: friendship._id,
          userId: friendId,
          username: friendUsername,
          friendshipLevel: friendship.friendshipLevel,
          totalMatches: friendship.totalMatches,
          messagesExchanged: friendship.messagesExchanged,
          canSeeOnlineStatus: friendship.canSeeOnlineStatus,
          canInviteToMatches: friendship.canInviteToMatches,
          canViewStats: friendship.canViewStats,
          lastInteraction: friendship.lastInteraction
        };
      });

      res.json({
        success: true,
        data: friends,
        pagination: {
          page: 1,
          limit: friends.length,
          total: friends.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch friends',
        error: error.message
      });
    }
  };

  // Xóa bạn
  removeFriend = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { friendId } = req.params;

      await this.pvpService.removeFriend(userId, friendId);

      res.json({
        success: true,
        message: 'Friend removed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove friend'
      });
    }
  };

  // Lấy lịch sử đấu
  getMatchHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { limit = 20, offset = 0 } = req.query;
      
      const matches = await Match.find({
        'participants.userId': userId
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('participants.userId', 'username avatar')
      .populate('winner', 'username avatar');
      
      const history = matches.map(match => {
        const userParticipant = match.participants.find(p => p.userId.toString() === userId);
        return {
          id: match._id,
          roomName: match.roomName,
          mode: match.settings.mode,
          difficulty: match.settings.difficulty,
          status: match.status,
          startedAt: match.startedAt,
          completedAt: match.completedAt,
          duration: match.duration,
          userScore: userParticipant?.finalScore || 0,
          userRank: userParticipant?.rank || 0,
          ratingChange: userParticipant?.ratingChange || 0,
          winner: match.winnerUsername,
          participants: match.participants.map(p => ({
            username: (p.userId as any).username,
            avatar: (p.userId as any).avatar,
            score: p.finalScore,
            rank: p.rank,
            ratingChange: p.ratingChange
          }))
        };
      });
      
      res.json({
        success: true,
        data: history,
        pagination: {
          page: Math.floor(Number(offset) / Number(limit)) + 1,
          limit: Number(limit),
          total: history.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch match history',
        error: error.message
      });
    }
  };

  // Lấy bảng xếp hạng
  getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type = 'rating', limit = 50, offset = 0 } = req.query;
      
      let sortField = 'rating';
      if (type === 'wins') sortField = 'pvpStats.wins';
      if (type === 'winRate') sortField = 'pvpStats.winRate';
      if (type === 'level') sortField = 'level';
      
      const users = await User.find()
        .select('username avatar rating level pvpStats')
        .sort({ [sortField]: -1 })
        .limit(Number(limit))
        .skip(Number(offset));
      
      const leaderboard = users.map((user, index) => ({
        rank: Number(offset) + index + 1,
        username: user.username,
        avatar: user.avatar,
        rating: user.rating || 1200,
        level: user.level || 1,
        stats: user.pvpStats || {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageCompletionTime: 0
        }
      }));
      
      res.json({
        success: true,
        data: leaderboard,
        pagination: {
          page: Math.floor(Number(offset) / Number(limit)) + 1,
          limit: Number(limit),
          total: users.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  };

  // Lấy thống kê người dùng
  getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await User.findById(userId).select('rating level pvpStats');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const stats = {
        rating: user.rating || 1200,
        level: user.level || 1,
        pvpStats: user.pvpStats || {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageCompletionTime: 0
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user stats',
        error: error.message
      });
    }
  };

  // Thách đấu người dùng cụ thể
  challengeUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const fromUserId = (req as any).user?.id;
      if (!fromUserId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { toUserId } = req.params;
      const { difficulty, mode, timeLimit, problemCount } = req.body;

      const challenge = await this.pvpService.challengeUser(fromUserId, toUserId, {
        difficulty,
        mode,
        timeLimit,
        problemCount
      });

      res.status(201).json({
        success: true,
        data: challenge,
        message: 'Challenge sent'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send challenge'
      });
    }
  };

  // Lấy danh sách thách đấu
  getChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { type = 'received' } = req.query;

      const challenges = await this.pvpService.getChallenges(userId, type as string);

      res.json({
        success: true,
        data: challenges
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch challenges',
        error: error.message
      });
    }
  };

  // Phản hồi thách đấu
  respondToChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { challengeId } = req.params;
      const { response } = req.body; // 'accept' or 'decline'

      const result = await this.pvpService.respondToChallenge(challengeId, userId, response);

      res.json({
        success: true,
        data: result,
        message: `Challenge ${response}d`
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to respond to challenge'
      });
    }
  };

  // === PVP THỰC TẾ VỚI JUDGE0 INTEGRATION ===

  // Bắt đầu trận đấu thực tế với bài tập ngẫu nhiên
  startMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { roomId } = req.params;
      const { difficulty = 'medium', timeLimit = 15 } = req.body;

      // Lấy thông tin phòng
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Kiểm tra người dùng có trong phòng không
      const userInRoom = room.participants.find(p => p.userId.toString() === userId);
      if (!userInRoom) {
        res.status(403).json({
          success: false,
          message: 'You are not in this room'
        });
        return;
      }

      // Kiểm tra đủ người chơi (ít nhất 2)
      if (room.participants.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Need at least 2 players to start match'
        });
        return;
      }

      // Chọn ngẫu nhiên bài tập phù hợp độ khó
      const challenge = await Challenge.findOne({
        difficulty: difficulty,
        isActive: true
      });
      
      if (!challenge) {
        res.status(404).json({
          success: false,
          message: `No challenge found for difficulty: ${difficulty}`
        });
        return;
      }

      // Tạo match mới
      const match = new Match({
        roomId: roomId,
        roomName: room.name,
        settings: {
          mode: '1vs1',
          difficulty: difficulty,
          timeLimit: timeLimit,
          language: 'any'
        },
        participants: room.participants.map(p => ({
          userId: p.userId,
          username: p.username,
          rating: p.rating,
          ratingChange: 0,
          finalScore: 0,
          completionTime: 0,
          submissions: 0,
          rank: 0
        })),
        problems: [{
          id: (challenge._id as any).toString(),
          title: challenge.title,
          difficulty: challenge.difficulty,
          submissions: []
        }],
        status: 'in-progress',
        startedAt: new Date()
      });

      await match.save();

      // Cập nhật trạng thái phòng
      room.status = 'in-progress';
      await room.save();

      // Broadcast qua WebSocket
      if (this.wsService) {
        this.wsService.sendToRoom(roomId, 'matchStarted', {
          matchId: match._id,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            timeLimit: timeLimit,
            testCases: challenge.testCases?.slice(0, 2) // Chỉ hiển thị 2 test case công khai
          }
        });
      }

      res.json({
        success: true,
        data: {
          matchId: match._id,
          challenge: {
            id: challenge._id,
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            timeLimit: timeLimit,
            testCases: challenge.testCases?.slice(0, 2), // Test case công khai
            totalTestCases: challenge.testCases?.length || 0
          }
        },
        message: 'Match started successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to start match',
        error: error.message
      });
    }
  };

  // Submit code trong trận đấu PvP
  submitPvPCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { matchId } = req.params;
      const { code, language, problemIndex = 0 } = req.body;

      // Lấy thông tin match
      const match = await Match.findById(matchId);
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      // Kiểm tra match có đang active không
      if (match.status !== 'in-progress') {
        res.status(400).json({
          success: false,
          message: 'Match is not active'
        });
        return;
      }

      // Kiểm tra người dùng có trong match không
      const participant = match.participants.find(p => p.userId.toString() === userId);
      if (!participant) {
        res.status(403).json({
          success: false,
          message: 'You are not in this match'
        });
        return;
      }

      // Lấy challenge và test cases
      const challenge = await Challenge.findById(match.problems[0]?.id);
      if (!challenge || !challenge.testCases) {
        res.status(404).json({
          success: false,
          message: 'Challenge or test cases not found'
        });
        return;
      }

      // Sử dụng Judge0 API để chạy code
      try {
        const testCases = challenge.testCases;
        let passedTests = 0;
        const testResults = [];

        // Chạy từng test case với Judge0
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          
          const judge0Result = await judge0Service.submitCode(
            code,
            language,
            testCase.input || '',
            testCase.expectedOutput,
            5, // 5 giây
            128 // 128MB
          );

          const passed = judge0Result.status.id === 3 &&
                        judge0Result.stdout?.trim() === testCase.expectedOutput?.trim();

          if (passed) {
            passedTests++;
          }

          testResults.push({
            testCase: i + 1,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: judge0Result.stdout || '',
            status: judge0Result.status.description,
            passed: passed,
            executionTime: judge0Result.time,
            memory: judge0Result.memory
          });
        }

        // Tính điểm
        const score = (passedTests / testCases.length) * 100;

        // Cập nhật điểm cho người chơi
        participant.finalScore = (participant.finalScore || 0) + score;
        participant.completionTime = Date.now() - (match.startedAt?.getTime() || 0);

        // Sử dụng problems array để lưu submissions
        if (match.problems.length > 0) {
          await (match as any).addSubmission(
            match.problems[0].id,
            userId,
            code,
            language
          );
        }

        await match.save();

        // Broadcast real-time progress
        if (this.wsService) {
          this.wsService.sendToRoom(match.roomId.toString(), 'submissionResult', {
            userId: userId,
            username: username,
            score: score,
            passedTests: passedTests,
            totalTests: testCases.length,
            testResults: testResults.slice(0, 2) // Chỉ gửi 2 test case đầu tiên
          });
        }

        res.json({
          success: true,
          data: {
            score: score,
            passedTests: passedTests,
            totalTests: testCases.length,
            testResults: testResults
          },
          message: 'Code submitted successfully'
        });
      } catch (judge0Error: any) {
        res.status(500).json({
          success: false,
          message: 'Judge0 execution error',
          error: judge0Error.message
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit code',
        error: error.message
      });
    }
    };
  
    // Kết thúc trận đấu và tính điểm
    endMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { matchId } = req.params;

      // Lấy thông tin match
      const match = await Match.findById(matchId).populate('participants.userId');
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      // Kiểm tra match có đang active không
      if (match.status !== 'in-progress') {
        res.status(400).json({
          success: false,
          message: 'Match is not active'
        });
        return;
      }

      // Sắp xếp người chơi theo điểm
      const sortedParticipants = [...match.participants].sort((a, b) => {
        // Ưu tiên người qua hết test case đầu tiên
        if (a.finalScore === b.finalScore) {
          return a.completionTime - b.completionTime;
        }
        return b.finalScore - a.finalScore;
      });

      // Gán rank và tính rating change
      const baseRating = 25;
      for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];
        participant.rank = i + 1;
        
        // Tính rating change dựa trên rank
        if (i === 0) {
          participant.ratingChange = baseRating; // Người thắng
        } else if (i === 1) {
          participant.ratingChange = -baseRating; // Người thua
        } else {
          participant.ratingChange = -10; // Các vị trí khác
        }
      }

      // Cập nhật winner
      match.winner = sortedParticipants[0].userId;
      match.winnerUsername = (sortedParticipants[0].userId as any).username;
      match.status = 'completed';
      match.completedAt = new Date();
      match.duration = Math.floor((match.completedAt.getTime() - (match.startedAt?.getTime() || 0)) / 1000);

      await match.save();

      // Cập nhật rating và XP cho người chơi
      for (const participant of sortedParticipants) {
        const user = await User.findById(participant.userId);
        if (user) {
          // Cập nhật rating
          user.rating = (user.rating || 1200) + participant.ratingChange;
          
          // Cập nhật PvP stats
          if (!user.pvpStats) {
            user.pvpStats = {
              wins: 0,
              losses: 0,
              draws: 0,
              totalMatches: 0,
              winRate: 0,
              currentStreak: 0,
              bestStreak: 0,
              averageCompletionTime: 0
            };
          }

          user.pvpStats.totalMatches++;
          if (participant.rank === 1) {
            user.pvpStats.wins++;
            user.pvpStats.currentStreak = Math.max(user.pvpStats.currentStreak + 1, 1);
            user.pvpStats.bestStreak = Math.max(user.pvpStats.bestStreak, user.pvpStats.currentStreak);
          } else {
            user.pvpStats.losses++;
            user.pvpStats.currentStreak = 0;
          }
          
          user.pvpStats.winRate = (user.pvpStats.wins / user.pvpStats.totalMatches) * 100;
          
          // Tính XP thưởng
          const difficultyMultiplier = match.settings.difficulty === 'easy' ? 10 :
                                     match.settings.difficulty === 'medium' ? 20 : 30;
          const rankMultiplier = participant.rank === 1 ? 1.5 : participant.rank === 2 ? 0.8 : 0.5;
          const xpGained = Math.floor(difficultyMultiplier * rankMultiplier * (participant.finalScore > 0 ? 1 : 0));
          
          user.experience = (user.experience || 0) + xpGained;
          
          await user.save();
        }
      }

      // Cập nhật trạng thái phòng
      const room = await Room.findById(match.roomId);
      if (room) {
        room.status = 'completed';
        await room.save();
      }

      // Broadcast kết quả
      if (this.wsService) {
        this.wsService.sendToRoom(match.roomId.toString(), 'matchEnded', {
          matchId: matchId,
          winner: match.winnerUsername,
          participants: sortedParticipants.map(p => ({
            username: (p.userId as any).username,
            rank: p.rank,
            score: p.finalScore,
            ratingChange: p.ratingChange,
            problemsSolved: p.finalScore > 0 ? 1 : 0
          })),
          duration: match.duration
        });
      }

      res.json({
        success: true,
        data: {
          winner: match.winnerUsername,
          participants: sortedParticipants.map(p => ({
            username: (p.userId as any).username,
            rank: p.rank,
            score: p.finalScore,
            ratingChange: p.ratingChange,
            problemsSolved: p.finalScore > 0 ? 1 : 0
          })),
          duration: match.duration
        },
        message: 'Match ended successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to end match',
        error: error.message
      });
    }
  };

  // Helper function để map language string sang Judge0 language ID
  private getLanguageId(language: string): number {
    const languageMap: { [key: string]: number } = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54,
      'c': 50,
      'csharp': 51,
      'php': 68,
      'ruby': 72,
      'go': 79,
      'rust': 73,
      'typescript': 74,
      'kotlin': 77,
      'swift': 83
    };
    
    return languageMap[language.toLowerCase()] || 63; // Mặc định là JavaScript
  };
}