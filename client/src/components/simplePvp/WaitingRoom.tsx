import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Copy, Users, Clock, Trophy, Settings, CheckCircle, Circle } from 'lucide-react';
import simplePvpApi, { Room, RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';
import { getWebSocketService } from '@/services/websocket.service';

interface WaitingRoomProps {
  open: boolean;
  room: Room | null;
  currentUserId: string;
  onLeaveRoom?: () => void;
  onMatchStart?: (matchData: any) => void;
  onRoomUpdate?: (updatedRoom: Room) => void;
}

export function WaitingRoom({ 
  open, 
  room, 
  currentUserId,
  onLeaveRoom,
  onMatchStart,
  onRoomUpdate
}: WaitingRoomProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const { success, error } = useToastActions();

  // Set room code when room changes
  useEffect(() => {
    if (room?.roomCode) {
      setRoomCode(room.roomCode);
    }
  }, [room]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!open || !room) return;

    const wsService = getWebSocketService();
    
    // Connect to WebSocket if not already connected
    if (!wsService.isConnected()) {
      wsService.connect();
    }

    // Listen for room updates
    const handleRoomUpdate = (data: any) => {
      console.log('📢 Room update received:', data);
      const roomIdFromEvent = data.roomId || data.room?._id;
      const currentRoomId = room._id;
      
      // Compare room IDs (convert to string to ensure proper comparison)
      if (roomIdFromEvent && roomIdFromEvent.toString() === currentRoomId.toString()) {
        // Update room through callback
        if (data.room && onRoomUpdate) {
          onRoomUpdate(data.room);
        }
      }
    };

    const handleUserJoinedRoom = (data: any) => {
      console.log('📢 User joined room:', data);
      const roomIdFromEvent = data.roomId || data.room?._id;
      const currentRoomId = room._id;
      
      // Compare room IDs (convert to string to ensure proper comparison)
      if (roomIdFromEvent && roomIdFromEvent.toString() === currentRoomId.toString()) {
        const username = data.participant?.username || data.user?.username || 'Một người dùng';
        success('Thông báo', `${username} đã tham gia phòng`);
        
        // Update room through callback if room data is provided
        if (data.room && onRoomUpdate) {
          onRoomUpdate(data.room);
        }
      }
    };

    const handleUserLeftRoom = (data: any) => {
      console.log('📢 User left room:', data);
      const roomIdFromEvent = data.roomId || data.room?._id;
      const currentRoomId = room._id;
      
      // Compare room IDs (convert to string to ensure proper comparison)
      if (roomIdFromEvent && roomIdFromEvent.toString() === currentRoomId.toString()) {
        const username = data.participant?.username || data.user?.username || 'Một người dùng';
        success('Thông báo', `${username} đã rời phòng`);
        
        // Update room through callback if room data is provided
        if (data.room && onRoomUpdate) {
          onRoomUpdate(data.room);
        }
      }
    };

    const handleReadyStatusChanged = (data: any) => {
      console.log('📢 Ready status changed:', data);
      const roomIdFromEvent = data.roomId || data.room?._id;
      const currentRoomId = room._id;
      
      // Compare room IDs (convert to string to ensure proper comparison)
      if (roomIdFromEvent && roomIdFromEvent.toString() === currentRoomId.toString()) {
        // Update room through callback
        if (data.room && onRoomUpdate) {
          onRoomUpdate(data.room);
        }
      }
    };

    const handleRoomDeleted = (data: any) => {
      console.log('📢 Room deleted:', data);
      // Close waiting room if current room was deleted
      if (data.roomId === room._id) {
        if (onLeaveRoom) {
          onLeaveRoom();
        }
      }
    };

    // Register event listeners
    wsService.on('room_updated', handleRoomUpdate);
    wsService.on('user_joined_room', handleUserJoinedRoom);
    wsService.on('user_left_room', handleUserLeftRoom);
    wsService.on('ready_status_changed', handleReadyStatusChanged);
    wsService.on('room_deleted', handleRoomDeleted);

    // Cleanup on unmount
    return () => {
      wsService.off('room_updated', handleRoomUpdate);
      wsService.off('user_joined_room', handleUserJoinedRoom);
      wsService.off('user_left_room', handleUserLeftRoom);
      wsService.off('ready_status_changed', handleReadyStatusChanged);
      wsService.off('room_deleted', handleRoomDeleted);
    };
  }, [open, room, success]);

  // Check if current user is host
  const isHost = room?.hostId === currentUserId;
  
  // Check if all participants are ready
  const allReady = room?.participants.every(p => p.isReady) && 
                   room?.participants.length >= 2;

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      success('Thành công', 'Đã sao chép mã phòng vào clipboard');
    } catch (error: any) {
      error('Lỗi', 'Không thể sao chép mã phòng');
    }
  };

  const handleReadyToggle = async () => {
    if (!room) return;
    
    try {
      const result = await simplePvpApi.setReadyStatus(room._id, !isReady);
      if (result.success) {
        setIsReady(!isReady);
        success('Thành công', !isReady ? 'Bạn đã sẵn sàng' : 'Đã hủy sẵn sàng');
      }
    } catch (error: any) {
      error('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    
    setIsLeaving(true);
    try {
      const result = await simplePvpApi.leaveRoom(room._id);
      if (result.success) {
        success('Thành công', 'Bạn đã rời phòng');
        setIsReady(false);
        onLeaveRoom?.();
      }
    } catch (error: any) {
      error('Lỗi', error.response?.data?.message || 'Không thể rời phòng');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStartMatch = async () => {
    if (!room || !isHost) return;
    
    if (!allReady) {
      error('Lỗi', 'Tất cả người chơi phải sẵn sàng để bắt đầu');
      return;
    }

    setIsStarting(true);
    try {
      const result = await simplePvpApi.startMatch(room._id);
      if (result.success) {
        success('Thành công', 'Trận đấu đã bắt đầu!');
        onMatchStart?.(result.data);
      }
    } catch (error: any) {
      error('Lỗi', error.response?.data?.message || 'Không thể bắt đầu trận đấu');
    } finally {
      setIsStarting(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={() => onLeaveRoom?.()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Phòng Chờ: {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Thời gian
              </div>
              <div className="font-medium">
                {simplePvpApi.formatTimeLimit(room.settings.timeLimit)}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                Độ khó
              </div>
              <div className="font-medium">
                <Badge className={simplePvpApi.getDifficultyColor(room.settings.difficulty)}>
                  {simplePvpApi.getDifficultyText(room.settings.difficulty)}
                </Badge>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Người chơi
              </div>
              <div className="font-medium">
                {room.participants.length}/{room.settings.maxParticipants}
              </div>
            </div>
          </div>

          {/* Room Code */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Mã phòng mời bạn</p>
                <p className="text-2xl font-bold font-mono text-primary">
                  {roomCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRoomCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-medium">Người chơi ({room.participants.length})</h3>
            </div>
            
            <div className="space-y-2">
              {room.participants.map((participant, index) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {participant.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {participant.username}
                        {participant.userId === room.hostId && (
                          <Badge variant="outline" className="ml-2">
                            Chủ phòng
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tham gia: {new Date(participant.joinedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {participant.userId === currentUserId ? (
                      <Button
                        variant={participant.isReady ? "default" : "outline"}
                        size="sm"
                        onClick={handleReadyToggle}
                        disabled={room.status !== 'waiting'}
                      >
                        {participant.isReady ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Sẵn sàng
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            Sẵn sàng
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge variant={participant.isReady ? "default" : "secondary"}>
                        {participant.isReady ? 'Sẵn sàng' : 'Đang chờ'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {room.participants.length < 2 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Cần ít nhất 2 người chơi</strong> để bắt đầu trận đấu.
                Chia sẻ mã phòng để mời bạn bè tham gia!
              </p>
            </div>
          )}

          {!allReady && room.participants.length >= 2 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Chờ tất cả người chơi sẵn sàng</strong> để bắt đầu trận đấu.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleLeaveRoom}
              disabled={isLeaving || room.status !== 'waiting'}
            >
              {isLeaving ? 'Đang rời...' : 'Rời phòng'}
            </Button>
            
            {isHost && (
              <Button
                onClick={handleStartMatch}
                disabled={!allReady || isStarting || room.status !== 'waiting'}
              >
                {isStarting ? 'Đang bắt đầu...' : 'Bắt đầu trận đấu'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
