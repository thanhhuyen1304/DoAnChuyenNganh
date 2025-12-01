import React, { useState, useEffect } from 'react';
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
import simplePvpApi, { Room, RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';
import { getWebSocketService } from '@/services/websocket.service';
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
  UserPlus
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
  
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Yêu cầu đăng nhập</CardTitle>
            <CardDescription>
              Bạn cần đăng nhập để sử dụng tính năng PvP
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/login'}>
              Đăng nhập
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
  const [showArena, setShowArena] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriendsAndUsers, setShowFriendsAndUsers] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  // Load rooms function
  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const result = await simplePvpApi.getRooms(20, 0);
      if (result.success) {
        // Filter rooms based on search query
        let filteredRooms = result.data;
        if (searchQuery.trim()) {
          filteredRooms = result.data.filter(room =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.hostUsername.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setRooms(filteredRooms);
      }
    } catch (err: any) {
      console.error('Load rooms error:', err);
      error('Lỗi', 'Không thể tải danh sách phòng');
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

    // Register event listeners
    wsService.on('room_created', handleRoomCreated);
    wsService.on('room_updated', handleRoomUpdated);
    wsService.on('room_deleted', handleRoomDeleted);
    wsService.on('user_joined_room', handleUserJoinedRoom);
    wsService.on('user_left_room', handleUserLeftRoom);
    wsService.on('match_started', handleMatchStarted);
    wsService.on('match_completed', handleMatchCompleted);

    // Cleanup on unmount
    return () => {
      wsService.off('room_created', handleRoomCreated);
      wsService.off('room_updated', handleRoomUpdated);
      wsService.off('room_deleted', handleRoomDeleted);
      wsService.off('user_joined_room', handleUserJoinedRoom);
      wsService.off('user_left_room', handleUserLeftRoom);
      wsService.off('match_started', handleMatchStarted);
      wsService.off('match_completed', handleMatchCompleted);
    };
  }, [loadRooms, searchQuery, currentRoom, currentMatch]);

  const handleCreateRoom = (room: Room) => {
    setCurrentRoom(room);
    setShowWaitingRoom(true);
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
      error('Lỗi', error.response?.data?.message || 'Không thể xóa phòng');
    }
  };

  const handleJoinRoom = async (roomId: string, roomCode?: string) => {
    try {
      let result;
      if (roomCode) {
        result = await simplePvpApi.joinRoom(roomCode);
      } else if (roomId) {
        result = await simplePvpApi.joinRoomById(roomId);
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
    } catch (error: any) {
      console.error('Join room error:', error);
      if (error && typeof error === 'object' && error.response?.data) {
        error('Lỗi', error.response.data.message || 'Không thể tham gia phòng');
      } else {
        error('Lỗi', error.message || 'Không thể tham gia phòng');
      }
    }
  };

  const handleJoinRoomByCode = async () => {
    if (!joinRoomCode.trim()) {
      error('Lỗi', 'Vui lòng nhập mã phòng');
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
        success('Chúc mừng!', `Bạn đã thắng trận đấu và nhận được ${result.winnerXP || 0} XP!`);
      }
    }
  };

  const handleLeaveWaitingRoom = async () => {
    if (!currentRoom) return;
    
    // If user is host, delete the room. Otherwise, just leave.
    if (currentRoom.hostId === currentUserId) {
      try {
        await simplePvpApi.deleteRoom(currentRoom._id);
        success('Thành công', 'Đã xóa phòng thành công');
      } catch (error: any) {
        console.error('Delete room error:', error);
        error('Lỗi', error.response?.data?.message || 'Không thể xóa phòng');
      }
    } else {
      // Just leave the room as participant
      try {
        await simplePvpApi.leaveRoom(currentRoom._id);
        success('Thành công', 'Đã rời phòng thành công');
      } catch (error: any) {
        console.error('Leave room error:', error);
        error('Lỗi', error.response?.data?.message || 'Không thể rời phòng');
      }
    }
    
    setShowWaitingRoom(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Đấu Đối Kháng
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Thách đấu với các lập trình viên khác và nâng cao kỹ năng của bạn
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLeaderboard(true)}
                disabled={showArena}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Xếp hạng
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFriendsAndUsers(true)}
                disabled={showArena}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Bạn bè
              </Button>
              <CreateRoomModal onRoomCreated={handleCreateRoom}>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  disabled={showArena}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Tạo phòng
                </Button>
              </CreateRoomModal>
            </div>
          </div>

          {/* Join Room by Code */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
            {showArena && (
              <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Bạn đang trong trận đấu. Hoàn thành trận đấu hoặc rời khỏi để sử dụng các tính năng khác.
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 w-full">
                <Input
                  placeholder="Nhập mã phòng để tham gia..."
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
                    Đang tham gia...
                  </>
                ) : (
                  'Tham gia phòng'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Phòng đang chờ</p>
                    <p className="text-2xl font-bold">{rooms.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Đang diễn ra</p>
                    <p className="text-2xl font-bold">
                      {rooms.filter(r => r.status === 'in-progress').length}
                    </p>
                  </div>
                  <Swords className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Đã hoàn thành</p>
                    <p className="text-2xl font-bold">
                      {userStats?.pvpStats?.completedMatches || 0}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Xếp hạng</p>
                    <p className="text-2xl font-bold">
                      #{userStats?.rank || '-'}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Tìm kiếm phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Tìm kiếm theo tên phòng hoặc mã phòng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  disabled={showArena}
                />
                <Button
                  variant="outline"
                  onClick={loadRooms}
                  disabled={isLoadingRooms || showArena}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rooms List */}
          {isLoadingRooms ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Đang tải phòng...</span>
            </div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Không có phòng nào</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Không tìm thấy phòng phù hợp với tìm kiếm của bạn' : 'Hãy tạo phòng mới hoặc đợi người khác tạo phòng'}
                </p>
                <CreateRoomModal onRoomCreated={handleCreateRoom}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo phòng mới
                  </Button>
                </CreateRoomModal>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{room.name}</CardTitle>
                      <Badge 
                        variant={room.status === 'waiting' ? "secondary" : room.status === 'in-progress' ? "destructive" : "outline"}
                      >
                        {room.status === 'waiting' ? 'Đang chờ' : room.status === 'in-progress' ? 'Đang diễn ra' : 'Hoàn thành'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src="" />
                        <AvatarFallback>{room.hostUsername[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Host: {room.hostUsername}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={simplePvpApi.getDifficultyColor(room.settings.difficulty)}>
                        {simplePvpApi.getDifficultyText(room.settings.difficulty)}
                      </Badge>
                      <span className="text-muted-foreground">
                        {simplePvpApi.formatTimeLimit(room.settings.timeLimit)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Người chơi: {room.participants.length}/{room.settings.maxParticipants || 2}</span>
                      <span>Mã: {room.roomCode}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(room.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex gap-2">
                      {room.hostId === currentUserId ? (
                        <>
                          <Button
                            onClick={() => handleDeleteRoom(room._id)}
                            variant="destructive"
                            className="flex-1"
                            disabled={showArena}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa phòng
                          </Button>
                          <Button
                            onClick={() => handleJoinRoom(room._id, room.roomCode)}
                            className="flex-1"
                            disabled={room.status !== 'waiting' || showArena}
                          >
                            Vào phòng
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleJoinRoom(room._id, room.roomCode)}
                          className="w-full"
                          disabled={room.status !== 'waiting' || room.participants.length >= (room.settings.maxParticipants || 2) || showArena}
                        >
                          {room.status !== 'waiting' ? 'Không khả dụng' :
                           room.participants.length >= (room.settings.maxParticipants || 2) ? 'Đầy' :
                           'Tham gia'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <WaitingRoom
        open={showWaitingRoom}
        room={currentRoom}
        currentUserId={currentUserId}
        onLeaveRoom={handleLeaveWaitingRoom}
        onMatchStart={handleMatchStart}
        onRoomUpdate={handleRoomUpdate}
      />

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
    </div>
  );
}
