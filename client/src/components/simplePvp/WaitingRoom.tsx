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
import { Card } from '@/components/ui/card';
import { Copy, Users, Clock, Trophy, Settings, CheckCircle, Circle, UserPlus, Code2, Lock, Globe, Minimize2 } from 'lucide-react';
import simplePvpApi, { Room, RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';
import { getWebSocketService } from '@/services/websocket.service';
import { FriendsAndUsersModal } from './FriendsAndUsersModal';

interface WaitingRoomProps {
  open: boolean;
  room: Room | null;
  currentUserId: string;
  onLeaveRoom?: () => void;
  onMinimize?: () => void;
  onMatchStart?: (matchData: any) => void;
  onRoomUpdate?: (updatedRoom: Room) => void;
}

export function WaitingRoom({
  open,
  room,
  currentUserId,
  onLeaveRoom,
  onMinimize,
  onMatchStart,
  onRoomUpdate
}: WaitingRoomProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { success, error } = useToastActions();

  // Danh sách ngôn ngữ
  const languages: { [key: string]: { label: string; icon: string } } = {
    javascript: { label: 'JavaScript', icon: '🟨' },
    python: { label: 'Python', icon: '🐍' },
    java: { label: 'Java', icon: '☕' },
    cpp: { label: 'C++', icon: '⚡' },
    csharp: { label: 'C#', icon: '💜' },
    typescript: { label: 'TypeScript', icon: '🔷' },
    go: { label: 'Go', icon: '🐹' },
    rust: { label: 'Rust', icon: '🦀' },
  };

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
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể bắt đầu trận đấu');
    } finally {
      setIsStarting(false);
    }
  };

  if (!room) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={() => onLeaveRoom?.()}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {room.settings.isPrivate ? (
                  <Lock className="w-5 h-5 text-orange-500" />
                ) : (
                  <Globe className="w-5 h-5 text-green-500" />
                )}
                <span className="truncate">Phòng Chờ: {room.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMinimize}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                  title="Thu nhỏ phòng chờ"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Badge variant={room.settings.isPrivate ? "destructive" : "secondary"}>
                  {room.settings.isPrivate ? 'Riêng tư' : 'Công khai'}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Room Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Thời gian</span>
                </div>
                <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                  {simplePvpApi.formatTimeLimit(room.settings.timeLimit)}
                </div>
              </Card>
              
              <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="font-medium">Độ khó</span>
                </div>
                <Badge className={simplePvpApi.getDifficultyColor(room.settings.difficulty)}>
                  {simplePvpApi.getDifficultyText(room.settings.difficulty)}
                </Badge>
              </Card>
              
              <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Người chơi</span>
                </div>
                <div className="font-bold text-lg text-green-900 dark:text-green-100">
                  {room.participants.length}/{room.settings.maxParticipants}
                </div>
              </Card>

              <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
                <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300 mb-1">
                  <Code2 className="w-4 h-4" />
                  <span className="font-medium">Ngôn ngữ</span>
                </div>
                <div className="font-bold text-base text-orange-900 dark:text-orange-100 flex items-center gap-1">
                  <span>{languages[room.settings.language || 'javascript']?.icon}</span>
                  <span className="truncate text-sm">{languages[room.settings.language || 'javascript']?.label}</span>
                </div>
              </Card>
            </div>

            {/* Room Code & Invite - Only show if host or if room is private */}
            {(isHost || room.settings.isPrivate) && (
              <Card className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-100 mb-1">
                      {room.settings.isPrivate ? '🔒 Mã phòng riêng tư' : '🌐 Mã phòng'}
                    </p>
                    <p className="text-2xl font-bold font-mono tracking-wider">
                      {roomCode}
                    </p>
                    <p className="text-xs text-blue-100 mt-1">
                      {room.settings.isPrivate
                        ? 'Chỉ những người có mã này mới vào được'
                        : 'Chia sẻ mã này để mời bạn bè'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyRoomCode}
                      className="whitespace-nowrap"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Sao chép
                    </Button>
                    {isHost && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowInviteModal(true)}
                        className="whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Mời bạn
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

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
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleLeaveRoom}
              disabled={isLeaving || room.status !== 'waiting'}
              className="flex-1"
            >
              {isLeaving ? 'Đang rời...' : 'Rời phòng'}
            </Button>
            
            {isHost && (
              <Button
                onClick={handleStartMatch}
                disabled={!allReady || isStarting || room.status !== 'waiting'}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isStarting ? 'Đang bắt đầu...' : 'Bắt đầu trận đấu'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Friends and Users Modal for Inviting */}
    {isHost && (
      <FriendsAndUsersModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteMode={true}
        roomCode={roomCode}
        roomId={room._id}
      />
    )}
  </>
  );
}
