import { Request, Response } from 'express';
import PVPRoom from '../models/pvpRoom.model';
import PVPMatch from '../models/pvpMatch.model';
import Challenge from '../models/challenge.model';
import User from '../models/user.model';
import Submission from '../models/submission.model';
import judge0Service from '../services/judge0Service';
import { notifyPvPWin, notifyPvPLoss, notifyRankUp } from '../services/notification.service';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class SimplePvPController {
  createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      console.log('Create room request body:', req.body);
      console.log('Create room user:', req.user);
      
      const userId = req.user?.id;
      const username = req.user?.username;

      if (!userId || !username) {
        console.log('Missing user info:', { userId, username });
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { name, settings } = req.body;
      console.log('Parsed request data:', { name, settings });

      if (!settings?.timeLimit || !settings?.difficulty) {
        console.log('Invalid settings:', settings);
        res.status(400).json({
          success: false,
          message: 'Time limit and difficulty are required'
        });
        return;
      }

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

      const room = new PVPRoom({
        name: name || `${username}'s Room`,
        roomCode,
        hostId: userId,
        hostUsername: username,
        participants: [{ userId, username, isReady: false, joinedAt: new Date() }],
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

  joinRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { roomCode: roomCodeParam, roomId } = req.params;
      const { roomCode: roomCodeBody } = req.body;
      
      // roomCode có thể từ params (khi join bằng code) hoặc từ body (khi join by ID nhưng có code)
      const roomCode = roomCodeParam || roomCodeBody;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const room = await PVPRoom.findOne(
        roomCodeParam ? { roomCode: roomCodeParam } : { _id: roomId }
      );

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Check if room is private and user is not the host
      // Private rooms can only be joined via roomCode (from invite) or if user is host
      if (room.settings.isPrivate && room.hostId.toString() !== userId && !roomCode) {
        res.status(403).json({
          success: false,
          message: 'Cannot join private room without invitation'
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

      if (room.participants.some(p => p.userId.toString() === userId)) {
        res.status(400).json({
          success: false,
          message: 'Already in room'
        });
        return;
      }

      room.participants.push({ userId, username, isReady: false, joinedAt: new Date() });
      await room.save();

      // Broadcast to all connected clients via WebSocket that a new user joined
      if ((req as any).wsService) {
        console.log(`📢 Broadcasting user_joined_room for user ${username} in room ${room._id}`);
        
        // Broadcast to all connected clients so they can update their UI if they're viewing this room
        (req as any).wsService.broadcastToAll('user_joined_room', {
          room: room,
          participant: { userId, username },
          user: { userId, username },
          roomId: (room._id as any).toString()
        });
        
        // Also broadcast general room update to all clients
        (req as any).wsService.broadcastRoomUpdate(room);
      }

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
      const allReady = room.participants.every(p => p.isReady);
      if (!allReady || room.participants.length < 2) {
        res.status(400).json({
          success: false,
          message: 'All participants must be ready and there must be at least 2 players'
        });
        return;
      }

      // Select challenge randomly based on difficulty
      const challenges = await Challenge.aggregate([
        {
          $match: {
            difficulty: room.settings.difficulty,
            isActive: true,
            testCases: { $exists: true, $ne: [] }
          }
        },
        { $sample: { size: 1 } }
      ]);

      if (!challenges || challenges.length === 0) {
        res.status(500).json({
          success: false,
          message: `No ${room.settings.difficulty} challenges available`
        });
        return;
      }

      const challenge = challenges[0];

      const match = new PVPMatch({
        roomId: room._id,
        roomName: room.name,
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        participants: room.participants.map(p => ({
          userId: p.userId,
          username: p.username,
          score: 0,
          passedTests: 0,
          totalTests: challenge.testCases?.length || 0,
          completed: false,
          completionTime: 0,
          submissions: []
        })),
        status: 'in-progress',
        startedAt: new Date(),
        timeLimit: room.settings.timeLimit,
        difficulty: room.settings.difficulty,
        settings: room.settings
      });

      await match.save();

      room.status = 'in-progress';
      await room.save();

      // Broadcast match_started event
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('match_started', {
          roomId: (room._id as any).toString(),
          matchId: match._id,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            timeLimit: room.settings.timeLimit,
            testCases: challenge.testCases?.filter((tc: any) => !tc.isHidden).map((tc: any) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: false
            })) || []
          }
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

      const match = await PVPMatch.findById(matchId).populate('challengeId');
      if (!match) {
        res.status(404).json({
          success: false,
          message: 'Match not found'
        });
        return;
      }

      if (match.status !== 'in-progress' && match.status !== 'active') {
        res.status(400).json({
          success: false,
          message: 'Match is not active'
        });
        return;
      }

      const challenge = match.challengeId as any;
      if (!challenge.testCases || challenge.testCases.length === 0) {
        res.status(500).json({
          success: false,
          message: 'Challenge test cases not found'
        });
        return;
      }

      // Run code with ALL test cases (public + hidden)
      const allTestCases = challenge.testCases;
      const results = await judge0Service.runTestCases(
        code,
        language,
        allTestCases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        })),
        challenge.timeLimit,
        challenge.memoryLimit
      );

      // Calculate score based on ALL test cases
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      const score = Math.round((passedTests / totalTests) * 100);

      // Calculate completion time
      const currentTime = Date.now() - match.startedAt.getTime();

      // Update participant
      const participant = match.participants.find((p: any) => p.userId.toString() === userId);
      if (participant) {
        // Only update if this is a better score or first submission
        if (score > participant.score || !participant.submittedAt) {
          participant.score = score;
          participant.passedTests = passedTests;
          participant.totalTests = totalTests;
          participant.completionTime = currentTime;
          participant.submittedAt = new Date();
        }
        
        // Save submission history
        if (!participant.submissions) {
          participant.submissions = [];
        }
        participant.submissions.push({
          code,
          language,
          score,
          submittedAt: new Date(),
          testResults: results
        });
      }

      await match.save();

      // Broadcast submission received
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('submission_received', {
          matchId: matchId,
          userId,
          username,
          passedTests,
          totalTests,
          score
        });
      }

      // Only return public test case results to client
      const publicResults = results.filter((r, idx) =>
        !challenge.testCases[idx].isHidden
      );

      res.json({
        success: true,
        data: {
          score,
          passedTests,
          totalTests,
          testResults: publicResults
        },
        message: 'Code submitted successfully'
      });
    } catch (error: any) {
      console.error('Submit code error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Code execution failed'
      });
    }
  };

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

      const match = await PVPMatch.findById(matchId).populate('challengeId');
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
          timeRemaining: (match as any).getTimeRemaining(),
          challenge: {
            title: (match as any).challengeTitle,
            difficulty: (match as any).difficulty,
            timeLimit: (match as any).settings?.timeLimit
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

      const participant = room.participants.find(p => p.userId.toString() === userId);
      if (!participant) {
        res.status(404).json({
          success: false,
          message: 'Participant not found in room'
        });
        return;
      }

      participant.isReady = isReady;
      await room.save();

      // Broadcast ready status changed
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('ready_status_changed', {
          roomId: (room._id as any).toString(),
          userId,
          isReady,
          room: room
        });
      }

      res.json({
        success: true,
        data: room,
        message: 'Ready status updated successfully'
      });
    } catch (error: any) {
      console.error('Set ready status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update ready status'
      });
    }
  };

  leaveRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
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

      // Check if user is actually in the room
      const wasInRoom = room.participants.some(p => p.userId.toString() === userId);
      if (!wasInRoom) {
        res.status(400).json({
          success: false,
          message: 'User not in room'
        });
        return;
      }

      // Remove participant from room
      room.participants = room.participants.filter(p => p.userId.toString() !== userId);

      // Handle host leaving
      const wasHost = room.hostId.toString() === userId;
      if (wasHost) {
        if (room.participants.length > 0) {
          // Transfer host to first remaining participant
          room.hostId = room.participants[0].userId;
          await room.save();

          // Broadcast user left and host transferred
          if ((req as any).wsService) {
            (req as any).wsService.broadcastToAll('user_left_room', {
              roomId: (room._id as any).toString(),
              userId,
              username,
              room: room,
              newHostId: room.hostId.toString()
            });
          }

          res.json({
            success: true,
            message: 'Left room successfully. Host transferred.',
            data: { newHostId: room.hostId.toString() }
          });
          return;
        } else {
          // Last person leaving - delete room
          await PVPRoom.findByIdAndDelete(roomId);

          // Broadcast room deleted
          if ((req as any).wsService) {
            (req as any).wsService.broadcastToAll('room_deleted', {
              roomId: (room._id as any).toString()
            });
          }

          res.json({
            success: true,
            message: 'Room deleted as last participant left'
          });
          return;
        }
      }

      // Regular participant leaving (not host)
      await room.save();

      // Broadcast user left
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('user_left_room', {
          roomId: (room._id as any).toString(),
          userId,
          username,
          room: room
        });
      }

      res.json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error: any) {
      console.error('Leave room error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to leave room'
      });
    }
  };

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

      if (match.status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Match already completed'
        });
        return;
      }

      // Use the model's determineWinner method
      (match as any).determineWinner();
      match.status = 'completed';
      match.completedAt = new Date();

      // Calculate XP for winner
      const winnerXP = (match as any).calculateWinnerXP();

      await match.save();

      // Update user stats and XP
      if (match.winnerId) {
        // Có 1 người thắng rõ ràng
        const winner = match.participants.find(p => p.userId.toString() === match.winnerId?.toString());
        const losers = match.participants.filter(p => p.userId.toString() !== match.winnerId?.toString());
        
        // Update winner
        const winnerUser = await User.findByIdAndUpdate(match.winnerId, {
          $inc: {
            'pvpStats.wins': 1,
            'pvpStats.totalMatches': 1,
            experience: winnerXP
          }
        }, { new: true });

        if (winnerUser) {
          // Check for rank up
          const oldRank = winnerUser.rank || 'Newbie';
          const xp = winnerUser.experience || 0;
          let newRank = 'Newbie';
          if (xp >= 1000) newRank = 'Expert';
          else if (xp >= 500) newRank = 'Senior';
          else if (xp >= 200) newRank = 'Intermediate';
          else if (xp >= 50) newRank = 'Junior';
          
          if (oldRank !== newRank) {
            winnerUser.rank = newRank as any;
            await winnerUser.save();
            await notifyRankUp(match.winnerId.toString(), oldRank, newRank);
          }

          // Notify winner
          const opponentName = losers.length > 0 ? losers[0].username : 'đối thủ';
          await notifyPvPWin(
            match.winnerId.toString(),
            opponentName,
            winnerXP,
            (match._id as any).toString(),
            match.difficulty || 'Medium'
          );
        }

        // Update losers and notify them
        for (const participant of losers) {
          await User.findByIdAndUpdate(participant.userId, {
            $inc: {
              'pvpStats.losses': 1,
              'pvpStats.totalMatches': 1
            }
          });

          // Notify loser
          await notifyPvPLoss(
            participant.userId.toString(),
            winner?.username || 'đối thủ',
            (match._id as any).toString()
          );
        }
      } else {
        // HÒA - tất cả winners nhận XP nhưng tính là hòa
        const winners = match.participants.filter(p => p.isWinner);
        const losers = match.participants.filter(p => !p.isWinner);
        const drawXP = Math.floor(winnerXP / 2); // Chia đôi XP cho hòa

        for (const winner of winners) {
          const winnerUser = await User.findByIdAndUpdate(winner.userId, {
            $inc: {
              'pvpStats.draws': 1,
              'pvpStats.totalMatches': 1,
              experience: drawXP
            }
          }, { new: true });

          if (winnerUser && drawXP > 0) {
            // Check for rank up
            const oldRank = winnerUser.rank || 'Newbie';
            const xp = winnerUser.experience || 0;
            let newRank = 'Newbie';
            if (xp >= 1000) newRank = 'Expert';
            else if (xp >= 500) newRank = 'Senior';
            else if (xp >= 200) newRank = 'Intermediate';
            else if (xp >= 50) newRank = 'Junior';
            
            if (oldRank !== newRank) {
              winnerUser.rank = newRank as any;
              await winnerUser.save();
              await notifyRankUp(winner.userId.toString(), oldRank, newRank);
            }

            // Notify draw (treated as win with reduced XP)
            const opponentName = losers.length > 0 ? losers[0].username : 'đối thủ';
            await notifyPvPWin(
              winner.userId.toString(),
              opponentName,
              drawXP,
              (match._id as any).toString(),
              match.difficulty || 'Medium'
            );
          }
        }

        // Non-winners vẫn tính là thua
        for (const participant of losers) {
          await User.findByIdAndUpdate(participant.userId, {
            $inc: {
              'pvpStats.losses': 1,
              'pvpStats.totalMatches': 1
            }
          });

          // Notify loser
          const winnerName = winners.length > 0 ? winners[0].username : 'đối thủ';
          await notifyPvPLoss(
            participant.userId.toString(),
            winnerName,
            (match._id as any).toString()
          );
        }
      }

      // Update room status
      const room = await PVPRoom.findById(match.roomId);
      if (room) {
        room.status = 'completed';
        await room.save();
      }

      // Broadcast match_completed event
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('match_completed', {
          matchId: match._id,
          winner: match.winnerId,
          winnerXP,
          results: {
            participants: match.participants.map(p => ({
              userId: p.userId,
              username: p.username,
              score: p.score,
              passedTests: p.passedTests,
              totalTests: p.totalTests,
              isWinner: p.isWinner,
              completionTime: p.completionTime
            }))
          }
        });
      }

      res.json({
        success: true,
        data: {
          winner: match.participants.find(p => p.isWinner)?.username || 'No winner',
          winnerXP,
          participants: match.participants.map(p => ({
            username: p.username,
            score: p.score,
            passedTests: p.passedTests,
            totalTests: p.totalTests,
            isWinner: p.isWinner,
            completionTime: p.completionTime
          }))
        },
        message: 'Match finished successfully'
      });
    } catch (error: any) {
      console.error('Finish match error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to finish match'
      });
    }
  };

  forfeitMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { matchId } = req.params;

      if (!userId || !username) {
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

      if (match.status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Match already completed'
        });
        return;
      }

      // Find the forfeiting participant
      const forfeitingParticipant = match.participants.find(
        (p: any) => p.userId.toString() === userId
      );

      if (!forfeitingParticipant) {
        res.status(403).json({
          success: false,
          message: 'Not a participant in this match'
        });
        return;
      }

      // Mark participant as forfeited
      forfeitingParticipant.isWinner = false;
      forfeitingParticipant.score = 0;
      forfeitingParticipant.completionTime = Date.now() - match.startedAt.getTime();

      // Find other participants and make them winners
      const otherParticipants = match.participants.filter(
        (p: any) => p.userId.toString() !== userId
      );

      // If there are other participants, they win
      if (otherParticipants.length > 0) {
        otherParticipants.forEach((p: any) => {
          p.isWinner = true;
        });

        // Set first other participant as winner
        match.winnerId = otherParticipants[0].userId;
      }

      // Complete the match
      match.status = 'completed';
      match.completedAt = new Date();

      // Calculate XP for winners
      const winnerXP = (match as any).calculateWinnerXP();

      await match.save();

      // Update user stats
      // Forfeiting player gets a loss and NO XP
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'pvpStats.losses': 1,
          'pvpStats.totalMatches': 1
        }
      });

      // Other participants get wins and full XP
      for (const participant of otherParticipants) {
        await User.findByIdAndUpdate(participant.userId, {
          $inc: {
            'pvpStats.wins': 1,
            'pvpStats.totalMatches': 1,
            experience: winnerXP
          }
        });
      }

      // Update room status
      const room = await PVPRoom.findById(match.roomId);
      if (room) {
        room.status = 'completed';
        await room.save();
      }

      // Broadcast match_completed event with forfeit info
      if ((req as any).wsService) {
        (req as any).wsService.broadcastToAll('match_completed', {
          matchId: match._id,
          forfeitedBy: username,
          winner: otherParticipants.length > 0 ? otherParticipants[0].username : null,
          winnerXP,
          participants: match.participants.map(p => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
            passedTests: p.passedTests,
            totalTests: p.totalTests,
            isWinner: p.isWinner,
            completionTime: p.completionTime
          }))
        });
      }

      res.json({
        success: true,
        data: {
          message: `${username} đã bỏ cuộc`,
          forfeitedBy: username,
          winner: otherParticipants.length > 0 ? otherParticipants[0].username : null,
          winnerXP,
          participants: match.participants.map(p => ({
            username: p.username,
            score: p.score,
            passedTests: p.passedTests,
            totalTests: p.totalTests,
            isWinner: p.isWinner,
            completionTime: p.completionTime
          }))
        },
        message: 'Bạn đã rời trận đấu và bị thua'
      });
    } catch (error: any) {
      console.error('Forfeit match error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to forfeit match'
      });
    }
  };

  // Lấy bảng xếp hạng PvP
  getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const leaderboard = await User.find({
        'pvpStats.totalMatches': { $gt: 0 }
      })
        .select('username avatar experience pvpStats')
        .sort({
          'pvpStats.wins': -1,
          experience: -1
        })
        .limit(Number(limit))
        .skip(Number(offset));

      const leaderboardData = leaderboard.map((user, index) => ({
        rank: Number(offset) + index + 1,
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        totalXP: user.experience || 0,
        wins: user.pvpStats?.wins || 0,
        losses: user.pvpStats?.losses || 0,
        draws: user.pvpStats?.draws || 0,
        totalMatches: user.pvpStats?.totalMatches || 0,
        winRate: user.pvpStats?.totalMatches
          ? Math.round((user.pvpStats.wins / user.pvpStats.totalMatches) * 100)
          : 0
      }));

      res.json({
        success: true,
        data: leaderboardData,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: leaderboardData.length
        }
      });
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy bảng xếp hạng'
      });
    }
  };

  // Lấy thống kê cá nhân
  getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await User.findById(userId).select('username avatar experience pvpStats');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      // Lấy số trận đã hoàn thành
      const completedMatches = await PVPMatch.countDocuments({
        'participants.userId': userId,
        status: 'completed'
      });

      // Lấy vị trí xếp hạng
      const usersAbove = await User.countDocuments({
        $or: [
          { 'pvpStats.wins': { $gt: user.pvpStats?.wins || 0 } },
          {
            'pvpStats.wins': user.pvpStats?.wins || 0,
            experience: { $gt: user.experience || 0 }
          }
        ],
        'pvpStats.totalMatches': { $gt: 0 }
      });

      res.json({
        success: true,
        data: {
          username: user.username,
          avatar: user.avatar,
          totalXP: user.experience || 0,
          rank: usersAbove + 1,
          pvpStats: {
            wins: user.pvpStats?.wins || 0,
            losses: user.pvpStats?.losses || 0,
            draws: user.pvpStats?.draws || 0,
            totalMatches: user.pvpStats?.totalMatches || 0,
            completedMatches,
            winRate: user.pvpStats?.totalMatches
              ? Math.round((user.pvpStats.wins / user.pvpStats.totalMatches) * 100)
              : 0,
            currentStreak: user.pvpStats?.currentStreak || 0,
            bestStreak: user.pvpStats?.bestStreak || 0
          }
        }
      });
    } catch (error: any) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Không thể lấy thống kê'
      });
    }
  };

  // Gửi lời mời vào phòng
  sendRoomInvite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      const { roomId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: 'Target user ID is required'
        });
        return;
      }

      // Kiểm tra phòng tồn tại
      const room = await PVPRoom.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Kiểm tra người gửi có phải là chủ phòng
      if (room.hostId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Only room host can send invites'
        });
        return;
      }

      // Kiểm tra phòng còn chỗ trống
      if (room.participants.length >= (room.settings.maxParticipants || 8)) {
        res.status(400).json({
          success: false,
          message: 'Room is full'
        });
        return;
      }

      // Kiểm tra người được mời đã ở trong phòng chưa
      if (room.participants.some(p => p.userId.toString() === targetUserId)) {
        res.status(400).json({
          success: false,
          message: 'User is already in the room'
        });
        return;
      }

      // Kiểm tra người được mời có tồn tại
      const targetUser = await User.findById(targetUserId).select('username');
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'Target user not found'
        });
        return;
      }

      // Gửi lời mời qua WebSocket
      if ((req as any).wsService) {
        (req as any).wsService.sendToUser(targetUserId, 'room_invite_received', {
          inviteId: `${roomId}_${Date.now()}`,
          roomId: (room._id as any).toString(),
          roomCode: room.roomCode,
          roomName: room.name,
          hostUsername: username,
          hostId: userId,
          language: room.settings.language || 'javascript',
          difficulty: room.settings.difficulty,
          timeLimit: room.settings.timeLimit,
          maxParticipants: room.settings.maxParticipants,
          currentParticipants: room.participants.length,
          expiresAt: Date.now() + 60000 // 1 phút từ bây giờ
        });
      }

      res.json({
        success: true,
        message: `Đã gửi lời mời đến ${targetUser.username}`,
        data: {
          targetUsername: targetUser.username,
          roomName: room.name,
          expiresIn: 60000
        }
      });
    } catch (error: any) {
      console.error('Send room invite error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send room invite'
      });
    }
  };
}

export default new SimplePvPController();
