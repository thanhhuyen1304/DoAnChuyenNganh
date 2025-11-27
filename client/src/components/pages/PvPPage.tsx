import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateRoomModal from '@/components/pvp/CreateRoomModal';
import MatchmakingModal from '@/components/pvp/MatchmakingModal';
import FriendSystem from '@/components/pvp/FriendSystem';
import { useToastActions } from '@/components/ui/toast';
import {
  Users,
  Swords,
  Trophy,
  Clock,
  Search,
  UserPlus,
  Settings,
  Play,
  History,
  Star,
  Zap,
  Shield,
  Target,
  Crown,
  Medal,
  Award,
  TrendingUp,
  UserCheck,
  UserX,
  MessageSquare,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react';

interface OnlineUser {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  status: 'online' | 'in-match' | 'away';
  lastSeen: string;
  wins: number;
  losses: number;
  level: number;
  isFriend: boolean;
  isInvited: boolean;
}

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  status: 'online' | 'offline' | 'in-match';
  lastSeen: string;
  wins: number;
  losses: number;
}

interface Room {
  id: string;
  name: string;
  host: string;
  hostAvatar?: string;
  mode: '1vs1' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard';
  players: number;
  maxPlayers: number;
  isPrivate: boolean;
  timeLimit: number;
  problemCount: number;
  createdAt: string;
}

interface MatchHistory {
  id: string;
  opponent: string;
  opponentAvatar?: string;
  result: 'win' | 'loss' | 'draw';
  mode: '1vs1' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  points: number;
  date: string;
}

interface LeaderboardUser {
  rank: number;
  username: string;
  avatar?: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
}

export default function PvPPage() {
  // Lấy toast functions
  const { success, info } = useToastActions();
  
  const [activeTab, setActiveTab] = useState('lobby');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedMode, setSelectedMode] = useState<'all' | '1vs1' | 'tournament'>('all');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);

  // Mock data - sẽ được thay thế bằng API calls
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([
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
      isFriend: false,
      isInvited: false
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
      isFriend: true,
      isInvited: false
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
      isFriend: false,
      isInvited: true
    }
  ]);

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '2',
      username: 'AlgoNinja',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoNinja',
      rating: 1920,
      status: 'in-match',
      lastSeen: 'Đang đấu',
      wins: 167,
      losses: 42
    },
    {
      id: '4',
      username: 'DebugQueen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DebugQueen',
      rating: 1650,
      status: 'online',
      lastSeen: '1 phút trước',
      wins: 98,
      losses: 27
    }
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    {
      id: '1',
      name: 'CodeMaster\'s Room',
      host: 'CodeMaster',
      hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
      mode: '1vs1',
      difficulty: 'medium',
      players: 1,
      maxPlayers: 2,
      isPrivate: false,
      timeLimit: 30,
      problemCount: 3,
      createdAt: '2 phút trước'
    },
    {
      id: '2',
      name: 'Tournament Arena',
      host: 'ProCoder',
      hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProCoder',
      mode: 'tournament',
      difficulty: 'hard',
      players: 3,
      maxPlayers: 8,
      isPrivate: false,
      timeLimit: 45,
      problemCount: 5,
      createdAt: '5 phút trước'
    }
  ]);

  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([
    {
      id: '1',
      opponent: 'CodeMaster',
      opponentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
      result: 'win',
      mode: '1vs1',
      difficulty: 'medium',
      duration: '18:42',
      points: +25,
      date: '2 giờ trước'
    },
    {
      id: '2',
      opponent: 'AlgoNinja',
      opponentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoNinja',
      result: 'loss',
      mode: 'tournament',
      difficulty: 'hard',
      duration: '32:15',
      points: -15,
      date: '5 giờ trước'
    }
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([
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
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-match': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-match': return 'Đang đấu';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModeIcon = (mode: string) => {
    return mode === '1vs1' ? <Swords className="w-4 h-4" /> : <Trophy className="w-4 h-4" />;
  };

  const handleInviteFriend = (userId: string) => {
    setOnlineUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, isInvited: true } : user
    ));
    
    // Show success toast
    const user = onlineUsers.find(u => u.id === userId);
    if (user) {
      success('Đã gửi lời mời kết bạn', `Đã gửi lời mời kết bạn đến ${user.username}`);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    // Logic để tham gia phòng
    console.log('Joining room:', roomId);
    
    // Show info toast
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      info('Đang tham gia phòng', `Đang tham gia phòng "${room.name}"...`);
    }
  };

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    // Logic để tạo phòng mới
    success('Đang tạo phòng', 'Đang tạo phòng đấu mới...');
  };

  const handleStartMatchmaking = () => {
    setIsSearching(true);
    // Logic để bắt đầu matchmaking
    info('Đang tìm đối thủ', 'Đang tìm kiếm đối thủ phù hợp...');
    
    setTimeout(() => {
      setIsSearching(false);
      // Chuyển đến trang đấu khi tìm thấy đối thủ
      success('Tìm thấy đối thủ!', 'Đã tìm thấy đối thủ, đang chuyển đến trang đấu...');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Đấu Đối Kháng
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Thách đấu với các lập trình viên khác và nâng cao kỹ năng của bạn
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleStartMatchmaking}
                disabled={isSearching}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Đang tìm đối thủ...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Matchmaking Nhanh
                  </>
                )}
              </Button>
              <Button
                onClick={handleCreateRoom}
                variant="outline"
                className="border-2 border-slate-300 dark:border-slate-600"
              >
                <Settings className="w-5 h-5 mr-2" />
                Tạo Phòng
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Online</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Đang đấu</p>
                    <p className="text-2xl font-bold">89</p>
                  </div>
                  <Swords className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Phòng đang chờ</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Rating của bạn</p>
                    <p className="text-2xl font-bold">1,650</p>
                  </div>
                  <Trophy className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            <TabsTrigger value="lobby" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Sảnh Chính
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Bạn Bè
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Lịch Sử
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              BXH
            </TabsTrigger>
          </TabsList>

          {/* Lobby Tab */}
          <TabsContent value="lobby" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Bộ Lọc Phòng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Độ khó:</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                      className="px-3 py-1 border rounded-md"
                    >
                      <option value="all">Tất cả</option>
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Chế độ:</label>
                    <select
                      value={selectedMode}
                      onChange={(e) => setSelectedMode(e.target.value as any)}
                      className="px-3 py-1 border rounded-md"
                    >
                      <option value="all">Tất cả</option>
                      <option value="1vs1">1vs1</option>
                      <option value="tournament">Tournament</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Tìm phòng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rooms List */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant={room.isPrivate ? "destructive" : "secondary"}>
                        {room.isPrivate ? "Riêng tư" : "Công khai"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={room.hostAvatar} />
                        <AvatarFallback>{room.host[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Host: {room.host}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getModeIcon(room.mode)}
                        <span>{room.mode === '1vs1' ? '1vs1' : 'Tournament'}</span>
                      </div>
                      <Badge className={getDifficultyColor(room.difficulty)}>
                        {room.difficulty === 'easy' ? 'Dễ' : room.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Người chơi: {room.players}/{room.maxPlayers}</span>
                      <span>{room.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{room.timeLimit} phút</span>
                      <span>•</span>
                      <span>{room.problemCount} bài</span>
                    </div>
                    <Button 
                      onClick={() => handleJoinRoom(room.id)}
                      className="w-full mt-3"
                      disabled={room.players >= room.maxPlayers}
                    >
                      {room.players >= room.maxPlayers ? 'Đầy' : 'Tham Gia'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Online Users Tab */}
          <TabsContent value="online" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Người Dùng Online ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(user.status)}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            <Badge variant="outline" className="text-xs">
                              Lv.{user.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Rating: {user.rating}</span>
                            <span>•</span>
                            <span>{getStatusText(user.status)}</span>
                            <span>•</span>
                            <span>{user.lastSeen}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="font-medium">{user.wins}W / {user.losses}L</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {Math.round((user.wins / (user.wins + user.losses)) * 100)}% WR
                          </div>
                        </div>
                        {user.isFriend ? (
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        ) : user.isInvited ? (
                          <Button variant="outline" size="sm" disabled>
                            <Clock className="w-4 h-4" />
                            Đã mời
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleInviteFriend(user.id)}
                          >
                            <UserPlus className="w-4 h-4" />
                            Kết bạn
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Danh Sách Bạn Bè ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(friend.status)}`} />
                        </div>
                        <div>
                          <div className="font-medium">{friend.username}</div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Rating: {friend.rating}</span>
                            <span>•</span>
                            <span>{getStatusText(friend.status)}</span>
                            <span>•</span>
                            <span>{friend.lastSeen}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="font-medium">{friend.wins}W / {friend.losses}L</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {Math.round((friend.wins / (friend.wins + friend.losses)) * 100)}% WR
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={friend.status === 'in-match'}
                        >
                          <Swords className="w-4 h-4" />
                          Thách đấu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Lịch Sử Đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matchHistory.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          match.result === 'win' ? 'bg-green-100 text-green-600' : 
                          match.result === 'loss' ? 'bg-red-100 text-red-600' : 
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {match.result === 'win' ? <Trophy className="w-5 h-5" /> : 
                           match.result === 'loss' ? <UserX className="w-5 h-5" /> : 
                           <Shield className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={match.opponentAvatar} />
                              <AvatarFallback>{match.opponent[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{match.opponent}</span>
                            <Badge variant="outline" className="text-xs">
                              {getModeIcon(match.mode)}
                              {match.mode === '1vs1' ? '1vs1' : 'Tournament'}
                            </Badge>
                            <Badge className={getDifficultyColor(match.difficulty)}>
                              {match.difficulty === 'easy' ? 'Dễ' : match.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {match.date} • {match.duration}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          match.result === 'win' ? 'text-green-600' : 
                          match.result === 'loss' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {match.result === 'win' ? 'Thắng' : match.result === 'loss' ? 'Thua' : 'Hòa'}
                        </div>
                        <div className={`text-sm font-medium ${
                          match.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.points > 0 ? '+' : ''}{match.points} điểm
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Bảng Xếp Hạng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div key={user.rank} className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          user.rank === 1 ? 'bg-yellow-100 text-yellow-600' : 
                          user.rank === 2 ? 'bg-gray-100 text-gray-600' : 
                          user.rank === 3 ? 'bg-orange-100 text-orange-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {user.rank === 1 ? <Crown className="w-5 h-5" /> : 
                           user.rank === 2 ? <Medal className="w-5 h-5" /> : 
                           user.rank === 3 ? <Award className="w-5 h-5" /> : 
                           user.rank}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {user.wins}W / {user.losses}L • {user.winRate}% WR
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{user.rating}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {user.streak > 0 ? `${user.streak} thắng` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}