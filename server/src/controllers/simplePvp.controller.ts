import { Request, Response } from 'express';
import PVPRoom from '../models/pvpRoom.model';
import PVPMatch from '../models/pvpMatch.model';
import Challenge from '../models/challenge.model';
import User from '../models/user.model';
import Submission from '../models/submission.model';
import judge0Service from '../services/judge0Service';

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: any;
}

export class SimplePvPController {
  // Tạo phòng mới
  createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { name, settings } = req.body;

      // Validate settings
      if (!settings?.timeLimit || !settings?.difficulty) {
        res.status(400).json({
          success: false,
          message: 'Time limit and difficulty are required'
        });
        return;
      }

      // Generate unique room code
      let roomCode: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        roomCode = (PVPRoom as any).generateRoomCode();
        attempts++;
      } while (await PVPRoom.findOne({ roomCode }) && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate unique room code'
        });
        return;
      }

      // Create new room
      const room = new PVPRoom({
        name: name || `${username}'s Room`,
        roomCode,
        hostId: userId,
        participants: [{ userId, username, isReady: false }],
        settings,
        status: 'waiting'
      });

      await room.save();

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create room'
      });
    }
  };

  // Lấy danh sách phòng
  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status = 'waiting' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const rooms = await PVPRoom.find({ status })
        .populate('hostId', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(offset);

      res.json({
        success: true,
        data: rooms,
        pagination: {
          page: Math.floor(Number(offset) / Number(limit)) + 1,
          limit: Number(limit),
          total: rooms.length
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

  // Tham gia phòng
  joinRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { roomCode, roomId } = req.params;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Find room by code or ID
      const room = await PVPRoom.findOne(
        roomCode ? { roomCode } : { _id: roomId }
      );

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      if (room.status !== 'waiting') {
        res.status(400).json({
          success: false,
          message: 'Room is not accepting new participants'
        });
        return;
      }

      if (room.participants.length >= (room.settings.maxParticipants || 8)) {
        res.status(400).json({
          success: false,
          message: 'Room is full'
        });
        return;
      }

      // Check if user already in room
      if (room.participants.some(p => p.userId.toString() === userId)) {
        res.status(400).json({
          success: false,
          message: 'Already in room'
        });
        return;
      }

      // Add participant
      room.participants.push({ userId, username, isReady: false });
      await room.save();

      res.json({
        success: true,
        data: room,
        message: 'Joined room successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to join room'
      });
    }
  };

  // Bắt đầu trận đấu
  startMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await PVPRoom.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      if (room.hostId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only room host can start the match'
        });
        return;
      }

      if (room.status !== 'waiting') {
        res.status(400).json({
          success: false,
          message: 'Match already started'
        });
        return;
      }

      // Check if all participants are ready
      if (!(room as any).allParticipantsReady()) {
        res.status(400).json({
          success: false,
          message: 'Not all participants are ready'
        });
        return;
      }

      // Find a random challenge
      const challengeCount = await Challenge.countDocuments();
      const randomIndex = Math.floor(Math.random() * challengeCount);
      const challenge = await Challenge.findOne().skip(randomIndex);

      if (!challenge) {
        res.status(500).json({
          success: false,
          message: 'No challenges available'
        });
        return;
      }

      // Create match
      const match = new PVPMatch({
        roomId: room._id,
        participants: room.participants.map(p => ({
          userId: p.userId,
          username: p.username,
          score: 0,
          completed: false,
          completionTime: null,
          submissions: []
        })),
        challenge: challenge._id,
        status: 'in-progress',
        startedAt: new Date()
      });

      await match.save();

      // Update room status
      room.status = 'in-progress';
      await room.save();

      // Broadcast match start via WebSocket if available
      if ((req as any).wsService) {
        (req as any).wsService.sendToRoom(room._id.toString(), 'match:started', {
          matchId: match._id,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            timeLimit: room.settings.timeLimit,
            testCases: challenge.testCases?.map((tc: any) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden
            })) || []
          },
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: {
          matchId: match._id,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            timeLimit: room.settings.timeLimit,
            testCases: challenge.testCases?.map((tc: any) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden
            })) || []
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

  // Nộp bài
  submitCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { matchId } = req.params;
      const { code, language } = req.body;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const match = await PVPMatch.findById(matchId).populate('challenge');
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      if (match.status !== 'in-progress') {
        res.status(400).json({
          success: false,
          message: 'Match is not active'
        });
        return;
      }

      const challenge = match.challenge as any;
      if (!challenge.testCases) {
        res.status(500).json({
          success: false,
          message: 'Challenge test cases not found'
        });
        return;
      }

      const testCases = challenge.testCases.filter((tc: any) => !tc.isHidden);

      // Submit to Judge0
      const submission = await judge0Service.submitCode({
        code,
        language,
        testCases: testCases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        }))
      });

      // Calculate score
      const passedTests = submission.testCases.filter((tc: any) => tc.passed).length;
      const score = (passedTests / testCases.length) * 100;

      // Update match participant
      const participant = match.participants.find((p: any) => p.userId.toString() === userId);
      if (participant) {
        participant.score = Math.max(participant.score, score);
        participant.completed = score === 100;
        participant.completionTime = participant.completed ? new Date() : participant.completionTime;
        participant.submissions.push({
          code,
          language,
          score,
          submittedAt: new Date(),
          testResults: submission.testCases
        });
      }

      await match.save();

      // Broadcast submission via WebSocket if available
      if ((req as any).wsService) {
        (req as any).wsService.sendToRoom(match.roomId.toString(), 'code:submitted', {
          userId,
          username,
          score,
          completed: participant?.completed
        });
      }

      res.json({
        success: true,
        data: {
          score,
          passedTests,
          totalTests: testCases.length,
          testResults: submission.testCases
        },
        message: 'Code submitted successfully'
      });
    } catch (judge0Error: any) {
      console.error('Judge0 API error:', judge0Error);
      res.status(500).json({
        success: false,
        message: 'Code execution failed'
      });
    }
  };

  // Lấy trạng thái trận đấu
  getMatchStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { matchId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const match = await PVPMatch.findById(matchId).populate('challenge');
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      const participant = match.participants.find((p: any) => p.userId.toString() === userId);
      if (!participant) {
        res.status(403).json({
          success: false,
          message: 'Not a participant in this match'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          status: match.status,
          participants: match.participants.map((p: any) => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
            completed: p.completed,
            completionTime: p.completionTime,
            isWinner: p.isWinner
          })),
          timeRemaining: match.getTimeRemaining(),
          challenge: {
            title: (match.challenge as any).title,
            difficulty: (match.challenge as any).difficulty,
            timeLimit: match.settings?.timeLimit
          }
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to get match status'
      });
    }
  };

  // Cập nhật trạng thái sẵn sàng
  setReadyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;
      const { isReady } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await PVPRoom.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Update participant ready status
      const participant = room.participants.find(p => p.userId.toString() === userId);
      if (participant) {
        participant.isReady = isReady;
      }

      await room.save();

      // Broadcast ready status via WebSocket if available
      if ((req as any).wsService) {
        (req as any).wsService.sendToRoom(roomId, 'room:participant_ready', {
          userId,
          isReady,
          allReady: (room as any).allParticipantsReady()
        });
      }

      res.json({
        success: true,
        data: room,
        message: 'Ready status updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to update ready status'
      });
    }
  };

  // Rời phòng
  leaveRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await PVPRoom.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Remove user from participants
      room.participants = room.participants.filter(p => p.userId.toString() !== userId);

      // If user was host, transfer to someone else or delete room
      if (room.hostId.toString() === userId) {
        if (room.participants.length > 0) {
          room.hostId = room.participants[0].userId;
        } else {
          // Delete room if no participants left
          await PVPRoom.findByIdAndDelete(roomId);
          res.json({
            success: true,
            message: 'Room deleted as host left'
          });
          return;
        }
      }

      await room.save();

      res.json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to leave room'
      });
    }
  };

  // Xóa phòng
  deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await PVPRoom.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      if (room.hostId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only room host can delete the room'
        });
        return;
      }

      if (room.status === 'in-progress') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete room while match is in progress'
        });
        return;
      }

      await PVPRoom.findByIdAndDelete(roomId);

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to delete room'
      });
    }
  };

  // Kết thúc trận đấu
  finishMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { matchId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const match = await PVPMatch.findById(matchId);
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      const room = await PVPRoom.findById(match.roomId);
      if (!room || room.hostId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only room host can finish the match'
        });
        return;
      }

      // Update match status
      match.status = 'completed';
      match.endedAt = new Date();
      
      // Determine winner
      const highestScore = Math.max(...match.participants.map((p: any) => p.score));
      const winners = match.participants.filter((p: any) => p.score === highestScore);
      
      // Mark winners (handle ties)
      winners.forEach(winner => {
        (winner as any).isWinner = true;
      });

      await match.save();

      // Update room status
      room.status = 'completed';
      await room.save();

      res.json({
        success: true,
        data: {
          match,
          winners: winners.map(w => ({ userId: w.userId, username: w.username, score: w.score }))
        },
        message: 'Match finished successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.response?.data?.message || 'Failed to finish match'
      });
    }
  };
}

export default new SimplePvPController();
