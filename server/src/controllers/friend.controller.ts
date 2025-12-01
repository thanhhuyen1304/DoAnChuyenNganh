import { Request, Response } from 'express';
import Friend from '../models/friend.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class FriendController {
  // Gửi lời mời kết bạn
  sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { recipientId } = req.body;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (userId === recipientId) {
        res.status(400).json({
          success: false,
          message: 'Không thể gửi lời mời kết bạn cho chính mình'
        });
        return;
      }

      // Kiểm tra người nhận có tồn tại không
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      // Kiểm tra đã có quan hệ bạn bè chưa
      const existingFriendship = await (Friend as any).findFriendship(
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(recipientId)
      );

      if (existingFriendship) {
        if (existingFriendship.status === 'pending') {
          res.status(400).json({
            success: false,
            message: 'Đã có lời mời kết bạn đang chờ xử lý'
          });
          return;
        }
        if (existingFriendship.status === 'accepted') {
          res.status(400).json({
            success: false,
            message: 'Đã là bạn bè'
          });
          return;
        }
        if (existingFriendship.status === 'blocked') {
          res.status(400).json({
            success: false,
            message: 'Không thể gửi lời mời kết bạn'
          });
          return;
        }
      }

      // Tạo lời mời kết bạn mới
      const friendRequest = new Friend({
        requesterId: userId,
        recipientId,
        requesterUsername: username,
        recipientUsername: recipient.username,
        status: 'pending'
      });

      await friendRequest.save();

      // Broadcast qua WebSocket nếu có
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToUser(recipientId, 'friend_request_received', {
          requestId: friendRequest._id,
          from: {
            userId,
            username
          }
        });
      }

      res.status(201).json({
        success: true,
        data: friendRequest,
        message: 'Đã gửi lời mời kết bạn'
      });
    } catch (error: any) {
      console.error('Send friend request error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể gửi lời mời kết bạn'
      });
    }
  };

  // Chấp nhận lời mời kết bạn
  acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const friendRequest = await Friend.findById(requestId);
      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy lời mời kết bạn'
        });
        return;
      }

      if (friendRequest.recipientId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Không có quyền thực hiện hành động này'
        });
        return;
      }

      if (friendRequest.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Lời mời đã được xử lý'
        });
        return;
      }

      await (friendRequest as any).acceptRequest();

      // Broadcast qua WebSocket
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToUser(friendRequest.requesterId.toString(), 'friend_request_accepted', {
          friendId: userId,
          username: req.user?.username
        });
      }

      res.json({
        success: true,
        data: friendRequest,
        message: 'Đã chấp nhận lời mời kết bạn'
      });
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể chấp nhận lời mời kết bạn'
      });
    }
  };

  // Từ chối lời mời kết bạn
  declineFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const friendRequest = await Friend.findById(requestId);
      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy lời mời kết bạn'
        });
        return;
      }

      if (friendRequest.recipientId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Không có quyền thực hiện hành động này'
        });
        return;
      }

      await (friendRequest as any).declineRequest();

      res.json({
        success: true,
        message: 'Đã từ chối lời mời kết bạn'
      });
    } catch (error: any) {
      console.error('Decline friend request error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể từ chối lời mời kết bạn'
      });
    }
  };

  // Lấy danh sách bạn bè
  getFriendsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const friendships = await (Friend as any).getFriendsList(
        new mongoose.Types.ObjectId(userId)
      );

      // Lấy thông tin chi tiết của bạn bè
      const friends = await Promise.all(
        friendships.map(async (friendship: any) => {
          const friendId = friendship.requesterId.toString() === userId 
            ? friendship.recipientId 
            : friendship.requesterId;
          
          const friendUsername = friendship.requesterId.toString() === userId 
            ? friendship.recipientUsername 
            : friendship.requesterUsername;

          const friendUser = await User.findById(friendId).select('username avatar experience pvpStats');

          return {
            friendshipId: friendship._id,
            userId: friendId,
            username: friendUsername,
            avatar: friendUser?.avatar,
            experience: friendUser?.experience || 0,
            pvpStats: friendUser?.pvpStats,
            friendshipLevel: friendship.friendshipLevel,
            lastInteraction: friendship.lastInteraction
          };
        })
      );

      res.json({
        success: true,
        data: friends
      });
    } catch (error: any) {
      console.error('Get friends list error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách bạn bè'
      });
    }
  };

  // Lấy danh sách lời mời kết bạn đang chờ
  getPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const pendingRequests = await (Friend as any).getPendingRequests(
        new mongoose.Types.ObjectId(userId)
      );

      // Lấy thông tin người gửi
      const requests = await Promise.all(
        pendingRequests.map(async (request: any) => {
          const requester = await User.findById(request.requesterId).select('username avatar experience');
          return {
            requestId: request._id,
            from: {
              userId: request.requesterId,
              username: request.requesterUsername,
              avatar: requester?.avatar,
              experience: requester?.experience || 0
            },
            requestedAt: request.requestedAt
          };
        })
      );

      res.json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      console.error('Get pending requests error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách lời mời'
      });
    }
  };

  // Hủy kết bạn
  removeFriend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { friendId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const friendship = await (Friend as any).findFriendship(
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(friendId)
      );

      if (!friendship) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy quan hệ bạn bè'
        });
        return;
      }

      await Friend.findByIdAndDelete(friendship._id);

      res.json({
        success: true,
        message: 'Đã hủy kết bạn'
      });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể hủy kết bạn'
      });
    }
  };

  // Lấy danh sách người dùng online (không phải bạn bè)
  getOnlineUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Lấy danh sách bạn bè
      const friendships = await (Friend as any).getFriendsList(
        new mongoose.Types.ObjectId(userId)
      );
      const friendIds = friendships.map((f: any) => 
        f.requesterId.toString() === userId ? f.recipientId.toString() : f.requesterId.toString()
      );

      // Lấy danh sách người dùng online từ WebSocket service
      let onlineUserIds: string[] = [];
      if ((req as any).wsService) {
        onlineUserIds = (req as any).wsService.getOnlineUsers();
      }

      // Lọc ra những người không phải bạn bè và không phải chính mình
      const strangerIds = onlineUserIds.filter(id => 
        id !== userId && !friendIds.includes(id)
      );

      // Lấy thông tin chi tiết
      const strangers = await User.find({
        _id: { $in: strangerIds }
      }).select('username avatar experience pvpStats').limit(20);

      res.json({
        success: true,
        data: strangers.map(user => ({
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
          experience: user.experience || 0,
          pvpStats: user.pvpStats
        }))
      });
    } catch (error: any) {
      console.error('Get online users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách người dùng'
      });
    }
  };
}

export default new FriendController();