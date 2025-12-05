import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateRoomModal } from './CreateRoomModal';
import { WaitingRoom } from './WaitingRoom';
import { PvPArena } from './PvPArena';
import { PvPDuelResult } from './PvPResult';
import { LeaderboardModal } from './LeaderboardModal';
import { FriendsAndUsersModal } from './FriendsAndUsersModal';
import { RoomInviteNotification, RoomInvite } from './RoomInviteNotification';
import simplePvpApi, { Room, RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';
import { getWebSocketService } from '@/services/websocket.service';
import { useLanguage } from '@/components/contexts/LanguageContext';
import {
  Users,
  Swords,
  Trophy,
  Clock,
  Settings,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Award,
  UserPlus,
  Code2,
  Lock,
  Globe
} from 'lucide-react';

interface PvPPageProps {
  currentUser?: {
    id: string;
    username: string;
  };
}

export function PvPPage({ currentUser: currentUserProp }: PvPPageProps) {
  // Check if user is authenticated FIRST
  const token = localStorage.getItem('token');
  const { success, error } = useToastActions();
  const { language } = useLanguage();
  
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {language === 'vi' ? 'Yêu cầu đăng nhập' : 'Login required'}
            </CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Bạn cần đăng nhập để sử dụng tính năng PvP'
                : 'You need to log in to use PvP mode.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => (window.location.href = '/login')}>
              {language === 'vi' ? 'Đăng nhập' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current user info from localStorage
  const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUserData.id || '';

  // Only initialize state after authentication check
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [isWaitingRoomMinimized, setIsWaitingRoomMinimized] = useState(false);
  const [showArena, setShowArena] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriendsAndUsers, setShowFriendsAndUsers] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);

  // Load rooms function
  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const result = await simplePvpApi.getRooms(20, 0);
      if (result.success) {
        // Show all rooms (both public and private)
        let filteredRooms = result.data;
        
        // Filter based on search query
        if (searchQuery.trim()) {
          filteredRooms = filteredRooms.filter(room =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.hostUsername.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setRooms(filteredRooms);
      }
    } catch (err: any) {
      console.error('Load rooms error:', err);
      error(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể tải danh sách phòng' : 'Failed to load rooms'
      );
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Load user stats
  const loadUserStats = async () => {
    try {
      const result = await simplePvpApi.getUserStats();
      if (result.success) {
        setUserStats(result.data);
      }
    } catch (err: any) {
      console.error('Load user stats error:', err);
    }
  };

  // Load rooms on component mount
  useEffect(() => {
    loadRooms();
    loadUserStats();
  }, [searchQuery]);

  // WebSocket connection for real-time room updates
  useEffect(() => {
    const wsService = getWebSocketService();
    
    // Connect to WebSocket if not already connected
    if (!wsService.isConnected()) {
      wsService.connect();
    }

    // Listen for room updates
    const handleRoomCreated = (data: any) => {
      console.log('📢 Room created event received:', data);
      loadRooms();
    };

    const handleRoomUpdated = (data: any) => {
      console.log('📢 Room updated event received:', data);
      loadRooms();
    };

    const handleRoomDeleted = (data: any) => {
      console.log('📢 Room deleted event received:', data);
      loadRooms();
    };

    const handleUserJoinedRoom = (data: any) => {
      console.log('📢 User joined room event received:', data);
      loadRooms();
    };

    const handleUserLeftRoom = (data: any) => {
      console.log('📢 User left room event received:', data);
      loadRooms();
    };

    const handleMatchStarted = (data: any) => {
      console.log('📢 Match started event received:', data);
      // Check if this match is for the current room
      if (currentRoom && data.roomId === currentRoom._id) {
        handleMatchStart(data);
      }
    };

    const handleMatchCompleted = (data: any) => {
      console.log('📢 Match completed event received:', data);
      // Check if this match is the current match
      if (currentMatch && data.matchId === currentMatch.matchId) {
        handleMatchEnd(data);
      }
    };

    const handleRoomInviteReceived = (data: RoomInvite) => {
      console.log('📢 Room invite received:', data);
      setRoomInvites(prev => [...prev, data]);
      success('Lời mời mới', `${data.hostUsername} mời bạn vào phòng ${data.roomName}`);
    };

    // Register event listeners
    wsService.on('room_created', handleRoomCreated);
    wsService.on('room_updated', handleRoomUpdated);
    wsService.on('room_deleted', handleRoomDeleted);
    wsService.on('user_joined_room', handleUserJoinedRoom);
    wsService.on('user_left_room', handleUserLeftRoom);
    wsService.on('match_started', handleMatchStarted);
    wsService.on('match_completed', handleMatchCompleted);
    wsService.on('room_invite_received', handleRoomInviteReceived);

    // Cleanup on unmount
    return () => {
      wsService.off('room_created', handleRoomCreated);
      wsService.off('room_updated', handleRoomUpdated);
      wsService.off('room_deleted', handleRoomDeleted);
      wsService.off('user_joined_room', handleUserJoinedRoom);
      wsService.off('user_left_room', handleUserLeftRoom);
      wsService.off('match_started', handleMatchStarted);
      wsService.off('match_completed', handleMatchCompleted);
      wsService.off('room_invite_received', handleRoomInviteReceived);
    };
  }, [loadRooms, searchQuery, currentRoom, currentMatch]);

  const handleCreateRoom = (room: Room) => {
    setCurrentRoom(room);
    setShowWaitingRoom(true);
    // Reload rooms to show the newly created room in the list
    loadRooms();
  };

  const handleRoomUpdate = (updatedRoom: Room) => {
    setCurrentRoom(updatedRoom);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const result = await simplePvpApi.deleteRoom(roomId);
      if (result.success) {
        success('Thành công', 'Đã xóa phòng thành công');
        loadRooms();
      }
    } catch (error: any) {
      console.error('Delete room error:', error);
      error(
        language === 'vi' ? 'Lỗi' : 'Error',
        error.response?.data?.message ||
          (language === 'vi' ? 'Không thể xóa phòng' : 'Unable to delete room')
      );
    }
  };

  const handleJoinRoom = async (roomId: string, roomCode?: string) => {
    try {
      let result;
      if (roomCode) {
        result = await simplePvpApi.joinRoom(roomCode);
      } else if (roomId) {
        // When joining by roomId, still pass roomCode if available for private room check
        result = await simplePvpApi.joinRoomById(roomId, roomCode);
      } else {
        throw new Error('Room ID or Room Code is required');
      }

      if (result.success) {
        setCurrentRoom(result.data);
        setShowWaitingRoom(true);
        success('Thành công', 'Đã tham gia phòng!');
        setJoinRoomCode('');
        loadRooms();
      }
    } catch (err: any) {
      console.error('Join room error:', err);
      if (err && typeof err === 'object' && err.response?.data) {
        error('Lỗi', err.response.data.message || 'Không thể tham gia phòng');
      } else {
        error('Lỗi', err.message || 'Không thể tham gia phòng');
      }
    }
  };

  const handleJoinRoomByCode = async () => {
    if (!joinRoomCode.trim()) {
      error(language === 'vi' ? 'Lỗi' : 'Error', language === 'vi' ? 'Vui lòng nhập mã phòng' : 'Please enter a room code');
      return;
    }

    setIsJoiningByCode(true);
    try {
      await handleJoinRoom('', joinRoomCode.trim().toUpperCase());
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleMatchStart = (matchData: any) => {
    setCurrentMatch(matchData);
    setShowArena(true);
    setShowWaitingRoom(false);
    setIsWaitingRoomMinimized(false); // Close minimized widget when match starts
  };

  const handleMatchEnd = (result: any) => {
    setMatchResult(result);
    setShowResult(true);
    setShowArena(false);
    
    // Check if result has participants array before accessing it
    if (result?.participants && Array.isArray(result.participants)) {
      const currentUserResult = result.participants.find(
        (p: any) => p.username === currentUserProp?.username
      );
      
      if (currentUserResult?.isWinner) {
        success(
          language === 'vi' ? 'Chúc mừng!' : 'Congratulations!',
          language === 'vi'
            ? `Bạn đã thắng trận đấu và nhận được ${result.winnerXP || 0} XP!`
            : `You won the match and gained ${result.winnerXP || 0} XP!`
        );
      }
    }
  };

  const handleMinimizeWaitingRoom = () => {
    setIsWaitingRoomMinimized(true);
    setShowWaitingRoom(false);
  };

  const handleRestoreWaitingRoom = () => {
    setIsWaitingRoomMinimized(false);
    setShowWaitingRoom(true);
  };

  const handleLeaveWaitingRoom = async () => {
    if (!currentRoom) return;
    
    // If user is host, delete the room. Otherwise, just leave.
    if (currentRoom.hostId === currentUserId) {
      try {
        await simplePvpApi.deleteRoom(currentRoom._id);
        success(
          language === 'vi' ? 'Thành công' : 'Success',
          language === 'vi' ? 'Đã xóa phòng thành công' : 'Room deleted successfully'
        );
      } catch (error: any) {
        console.error('Delete room error:', error);
        error(
          language === 'vi' ? 'Lỗi' : 'Error',
          error.response?.data?.message ||
            (language === 'vi' ? 'Không thể xóa phòng' : 'Unable to delete room')
        );
      }
    } else {
      // Just leave the room as participant
      try {
        await simplePvpApi.leaveRoom(currentRoom._id);
        success(
          language === 'vi' ? 'Thành công' : 'Success',
          language === 'vi' ? 'Đã rời phòng thành công' : 'Left room successfully'
        );
      } catch (error: any) {
        console.error('Leave room error:', error);
        error(
          language === 'vi' ? 'Lỗi' : 'Error',
          error.response?.data?.message ||
            (language === 'vi' ? 'Không thể rời phòng' : 'Unable to leave room')
        );
      }
    }
    
    setShowWaitingRoom(false);
    setIsWaitingRoomMinimized(false);
    setCurrentRoom(null);
    loadRooms();
  };

  const handleLeaveArena = () => {
    setShowArena(false);
    setCurrentMatch(null);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setMatchResult(null);
    setCurrentRoom(null);
    setCurrentMatch(null);
    loadRooms();
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setMatchResult(null);
    setCurrentRoom(null);
    setCurrentMatch(null);
    setShowCreateRoom(true);
  };

  const handleInviteAccept = async (roomCode: string) => {
    // Remove the accepted invite
    setRoomInvites(prev => prev.filter(inv => inv.roomCode !== roomCode));
    
    // Join the room and open waiting room
    try {
      const result = await simplePvpApi.joinRoom(roomCode);
      if (result.success) {
        setCurrentRoom(result.data);
        setShowWaitingRoom(true);
        // Reload rooms to show updated state
        loadRooms();
      }
    } catch (err: any) {
      console.error('Join room after invite error:', err);
      error('Lỗi', err.response?.data?.message || 'Không thể vào phòng');
      // Reload rooms anyway
      loadRooms();
    }
  };

  const handleInviteDecline = (inviteId: string) => {
    setRoomInvites(prev => prev.filter(inv => inv.inviteId !== inviteId));
  };

  const handleInviteExpire = (inviteId: string) => {
    setRoomInvites(prev => prev.filter(inv => inv.inviteId !== inviteId));
  };

  return (
    <>
      <Header />
      <section className="min-h-screen flex pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden relative">
        {/* Nền giống Hero: overlay + blobs */}
        <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-20 space-y-8">
          {/* Header Banner Similar to Practice */}
          <div className="bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-3xl text-white p-6 md:p-8 shadow-[0_10px_40px_rgba(162,89,255,0.35)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/80 mb-2">
                  {language === 'vi' ? 'Đấu đối kháng' : 'PvP Arena'}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {language === 'vi' ? 'Thách đấu và nâng cao kỹ năng' : 'Challenge others and level up'}
                </h1>
                <p className="text-white/80 max-w-2xl">
                  {language === 'vi'
                    ? 'Chọn phòng bất kỳ hoặc tạo phòng mới để thách đấu với các lập trình viên khác. Kiếm điểm, tăng xếp hạng và trở thành vô địch.'
                    : 'Join an existing room or create your own to battle other developers. Earn XP, climb the leaderboard and become a champion.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLeaderboard(true)}
                  disabled={showArena}
                  className="bg-white/20 text-white border border-white/40 hover:bg-white/30 transition-all duration-200"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Xếp hạng' : 'Leaderboard'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFriendsAndUsers(true)}
                  disabled={showArena}
                  className="bg-white/20 text-white border border-white/40 hover:bg-white/30 transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Bạn bè' : 'Friends'}
                </Button>
                <CreateRoomModal onRoomCreated={handleCreateRoom}>
                  <Button
                    disabled={showArena}
                    className="bg-white/20 text-white border border-white/40 hover:bg-white/30 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Tạo phòng' : 'Create room'}
                  </Button>
                </CreateRoomModal>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/15 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {language === 'vi' ? 'Phòng chờ' : 'Waiting rooms'}
                </p>
                <p className="text-2xl font-semibold mt-1">{rooms.length}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {language === 'vi' ? 'Đang diễn ra' : 'In progress'}
                </p>
                <p className="text-2xl font-semibold mt-1">
                  {rooms.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {language === 'vi' ? 'Xếp hạng' : 'Your rank'}
                </p>
                <p className="text-2xl font-semibold mt-1">#{userStats?.rank || '-'}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 items-start">
            {/* Join Room by Code Section */}
            <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
              {showArena && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
                  {language === 'vi'
                    ? '⚠️ Bạn đang trong trận đấu. Hoàn thành trận đấu hoặc rời khỏi để sử dụng các tính năng khác.'
                    : '⚠️ You are currently in a match. Finish or leave the match before using other features.'}
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {language === 'vi' ? 'Tham gia phòng bằng mã' : 'Join room by code'}
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder={
                      language === 'vi'
                        ? 'Nhập mã phòng (ví dụ: ABC123)...'
                        : 'Enter room code (e.g. ABC123)...'
                    }
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono uppercase"
                    disabled={showArena}
                  />
                </div>
                <Button
                  onClick={handleJoinRoomByCode}
                  disabled={isJoiningByCode || !joinRoomCode.trim() || showArena}
                  className="w-full sm:w-auto"
                >
                  {isJoiningByCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'vi' ? 'Đang tham gia...' : 'Joining...'}
                    </>
                  ) : language === 'vi' ? (
                    'Tham gia'
                  ) : (
                    'Join'
                  )}
                </Button>
              </div>
            </div>

            {/* Rooms List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {language === 'vi' ? 'Các phòng chơi' : 'Available rooms'}
                </h2>
                <Button
                  variant="outline"
                  onClick={loadRooms}
                  disabled={isLoadingRooms || showArena}
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
                <Input
                  placeholder="Tìm kiếm theo tên phòng hoặc tên người chơi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-6"
                  disabled={showArena}
                />

                {isLoadingRooms ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">
                      {language === 'vi' ? 'Đang tải phòng...' : 'Loading rooms...'}
                    </span>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {language === 'vi' ? 'Không có phòng nào' : 'No rooms found'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery
                        ? language === 'vi'
                          ? 'Không tìm thấy phòng phù hợp với tìm kiếm của bạn'
                          : 'No rooms match your search'
                        : language === 'vi'
                          ? 'Hãy tạo phòng mới hoặc đợi người khác tạo'
                          : 'Create a new room or wait for someone else to create one.'}
                    </p>
                    <CreateRoomModal onRoomCreated={handleCreateRoom}>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === 'vi' ? 'Tạo phòng mới' : 'Create new room'}
                      </Button>
                    </CreateRoomModal>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room) => (
                      <div key={room._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{room.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-xs">{room.hostUsername[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{room.hostUsername}</span>
                            </div>
                          </div>
                          <Badge
                            variant={room.status === 'waiting' ? "secondary" : room.status === 'in-progress' ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {room.status === 'waiting' ? 'Chờ' : room.status === 'in-progress' ? 'Diễn ra' : 'Xong'}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <Badge className={simplePvpApi.getDifficultyColor(room.settings.difficulty)}>
                              {simplePvpApi.getDifficultyText(room.settings.difficulty)}
                            </Badge>
                            <span>{room.participants.length}/{room.settings.maxParticipants || 2}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>
                              {language === 'vi' ? 'Mã:' : 'Code:'} <strong>{room.roomCode}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {simplePvpApi.formatTimeLimit(room.settings.timeLimit)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {room.hostId === currentUserId ? (
                            <>
                              <Button
                                onClick={() => handleDeleteRoom(room._id)}
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                disabled={showArena}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Xóa' : 'Delete'}
                              </Button>
                              <Button
                                onClick={() => handleJoinRoom(room._id, room.roomCode)}
                                size="sm"
                                className="flex-1"
                                disabled={room.status !== 'waiting' || showArena}
                              >
                                {language === 'vi' ? 'Vào' : 'Join'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleJoinRoom(room._id, room.roomCode)}
                              size="sm"
                              className="w-full"
                              disabled={room.status !== 'waiting' || room.participants.length >= (room.settings.maxParticipants || 2) || showArena}
                            >
                              {room.status !== 'waiting'
                                ? language === 'vi'
                                  ? 'Không khả dụng'
                                  : 'Unavailable'
                                : room.participants.length >= (room.settings.maxParticipants || 2)
                                  ? language === 'vi'
                                    ? 'Đầy'
                                    : 'Full'
                                  : language === 'vi'
                                    ? 'Tham gia'
                                    : 'Join'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <WaitingRoom
        open={showWaitingRoom}
        room={currentRoom}
        currentUserId={currentUserId}
        onLeaveRoom={handleLeaveWaitingRoom}
        onMinimize={handleMinimizeWaitingRoom}
        onMatchStart={handleMatchStart}
        onRoomUpdate={handleRoomUpdate}
      />

      {/* Minimized Waiting Room Widget (FROM MAIN - KEEP THIS!) */}
      {isWaitingRoomMinimized && currentRoom && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <Card className="w-80 shadow-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {currentRoom.settings.isPrivate ? (
                    <Lock className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Globe className="w-4 h-4 text-green-500" />
                  )}
                  <h3 className="font-semibold truncate">{currentRoom.name}</h3>
                </div>
                <Badge variant={currentRoom.settings.isPrivate ? "destructive" : "secondary"} className="text-xs">
                  {currentRoom.settings.isPrivate ? 'Riêng tư' : 'Công khai'}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Người chơi
                  </span>
                  <span className="font-medium">
                    {currentRoom.participants.length}/{currentRoom.settings.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Thời gian
                  </span>
                  <span className="font-medium">
                    {simplePvpApi.formatTimeLimit(currentRoom.settings.timeLimit)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRestoreWaitingRoom}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Mở phòng chờ
                </Button>
                <Button
                  onClick={handleLeaveWaitingRoom}
                  variant="outline"
                  size="sm"
                >
                  Rời
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PvPArena
        open={showArena}
        match={currentMatch}
        currentUserId={currentUserId}
        onMatchEnd={handleMatchEnd}
        onLeaveArena={handleLeaveArena}
      />

      <PvPDuelResult
        open={showResult}
        matchResult={matchResult}
        isCurrentUserWinner={matchResult?.winner === currentUserProp?.username}
        currentUserXP={matchResult?.winnerXP}
        onClose={handleCloseResult}
        onPlayAgain={handlePlayAgain}
      />

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <FriendsAndUsersModal
        open={showFriendsAndUsers}
        onClose={() => setShowFriendsAndUsers(false)}
      />

      {/* Room Invites */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          {roomInvites.map((invite) => (
            <RoomInviteNotification
              key={invite.inviteId}
              invite={invite}
              onAccept={handleInviteAccept}
              onDecline={handleInviteDecline}
              onExpire={handleInviteExpire}
            />
          ))}
        </div>
      </div>
    </>
  );
}