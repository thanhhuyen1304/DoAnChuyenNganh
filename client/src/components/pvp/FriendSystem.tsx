import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  UserX, 
  MessageSquare, 
  Search, 
  Clock, 
  Check, 
  X, 
  Users,
  UserCheck,
  UserMinus,
  Bell,
  Send,
  AlertCircle,
  TrendingUp,
  Trophy,
  Swords
} from 'lucide-react';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  level: number;
  status: 'online' | 'offline' | 'in-match';
  lastSeen: string;
  wins: number;
  losses: number;
  winRate: number;
  isOnline: boolean;
  isPlaying: boolean;
}

interface FriendRequest {
  id: string;
  from: string;
  fromAvatar?: string;
  fromRating: number;
  fromLevel: number;
  message?: string;
  sentAt: string;
}

interface SentRequest {
  id: string;
  to: string;
  toAvatar?: string;
  toRating: number;
  toLevel: number;
  sentAt: string;
}

interface FriendSystemProps {
  children: React.ReactNode;
  friends?: Friend[];
  onFriendAction?: (action: string, data: any) => void;
}

export default function FriendSystem({ 
  children, 
  friends = [],
  onFriendAction 
}: FriendSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Mock data
  const [friendsList, setFriendsList] = useState<Friend[]>([
    {
      id: '1',
      username: 'AlgoNinja',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoNinja',
      rating: 1920,
      level: 28,
      status: 'online',
      lastSeen: 'Online',
      wins: 167,
      losses: 42,
      winRate: 79.9,
      isOnline: true,
      isPlaying: false
    },
    {
      id: '2',
      username: 'DebugQueen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DebugQueen',
      rating: 1650,
      level: 23,
      status: 'in-match',
      lastSeen: 'Đang đấu',
      wins: 98,
      losses: 27,
      winRate: 78.4,
      isOnline: true,
      isPlaying: true
    },
    {
      id: '3',
      username: 'CodeMaster',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
      rating: 1780,
      level: 25,
      status: 'offline',
      lastSeen: '2 giờ trước',
      wins: 142,
      losses: 38,
      winRate: 78.9,
      isOnline: false,
      isPlaying: false
    }
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    {
      id: '1',
      from: 'SyntaxKing',
      fromAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SyntaxKing',
      fromRating: 1720,
      fromLevel: 26,
      message: 'Chúng ta đấu thử nhé!',
      sentAt: '5 phút trước'
    },
    {
      id: '2',
      from: 'PythonPro',
      fromAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PythonPro',
      fromRating: 1580,
      fromLevel: 22,
      sentAt: '1 giờ trước'
    }
  ]);

  const [sentRequests, setSentRequests] = useState<SentRequest[]>([
    {
      id: '1',
      to: 'JavaExpert',
      toAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JavaExpert',
      toRating: 1850,
      toLevel: 27,
      sentAt: '30 phút trước'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-match': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-match': return 'Đang đấu';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  const handleSendFriendRequest = () => {
    if (!inviteUsername.trim()) return;

    // Giả lập gửi lời mời kết bạn
    const newRequest: SentRequest = {
      id: Date.now().toString(),
      to: inviteUsername,
      toAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteUsername}`,
      toRating: Math.floor(Math.random() * 500) + 1500,
      toLevel: Math.floor(Math.random() * 10) + 20,
      sentAt: 'Vừa xong'
    };

    setSentRequests(prev => [newRequest, ...prev]);
    setInviteUsername('');
    setInviteMessage('');
    onFriendAction?.('send_request', newRequest);
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (request) {
      // Thêm vào danh sách bạn bè
      const newFriend: Friend = {
        id: requestId,
        username: request.from,
        avatar: request.fromAvatar,
        rating: request.fromRating,
        level: request.fromLevel,
        status: 'online',
        lastSeen: 'Online',
        wins: Math.floor(Math.random() * 100) + 50,
        losses: Math.floor(Math.random() * 30) + 10,
        winRate: Math.floor(Math.random() * 20) + 70,
        isOnline: true,
        isPlaying: false
      };

      setFriendsList(prev => [newFriend, ...prev]);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      onFriendAction?.('accept_request', { request, friend: newFriend });
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    onFriendAction?.('reject_request', requestId);
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriendsList(prev => prev.filter(f => f.id !== friendId));
    onFriendAction?.('remove_friend', friendId);
  };

  const handleChallengeFriend = (friendId: string) => {
    const friend = friendsList.find(f => f.id === friendId);
    if (friend) {
      onFriendAction?.('challenge_friend', friend);
    }
  };

  const handleMessageFriend = (friendId: string) => {
    const friend = friendsList.find(f => f.id === friendId);
    if (friend) {
      onFriendAction?.('message_friend', friend);
    }
  };

  const filteredFriends = friendsList.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6" />
            Hệ Thống Kết Bạn
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Bạn bè ({friendsList.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Lời mời ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Đã gửi ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Thêm bạn
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <Card key={friend.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(friend.status)}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{friend.username}</span>
                            <Badge variant="outline" className="text-xs">
                              Lv.{friend.level}
                            </Badge>
                            {friend.isPlaying && (
                              <Badge variant="secondary" className="text-xs">
                                <Swords className="w-3 h-3 mr-1" />
                                Đang đấu
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {friend.rating} • {friend.wins}W/{friend.losses}L • {friend.winRate}% WR
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getStatusText(friend.status)} • {friend.lastSeen}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessageFriend(friend.id)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChallengeFriend(friend.id)}
                          disabled={friend.isPlaying}
                        >
                          <Swords className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredFriends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có bạn bè nào</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests" className="space-y-4">
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.fromAvatar} />
                          <AvatarFallback>{request.from[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{request.from}</span>
                            <Badge variant="outline" className="text-xs">
                              Lv.{request.fromLevel}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {request.fromRating}
                          </div>
                          {request.message && (
                            <div className="text-sm text-blue-600 mt-1">
                              "{request.message}"
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {request.sentAt}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {friendRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Không có lời mời nào</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent" className="space-y-4">
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.toAvatar} />
                          <AvatarFallback>{request.to[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{request.to}</span>
                            <Badge variant="outline" className="text-xs">
                              Lv.{request.toLevel}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {request.toRating}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Đã gửi: {request.sentAt}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Đang chờ
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSentRequests(prev => prev.filter(r => r.id !== request.id))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {sentRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa gửi lời mời nào</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Add Friend */}
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Mời kết bạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username">Tên người dùng</label>
                  <Input
                    id="username"
                    placeholder="Nhập tên người dùng..."
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message">Tin nhắn (tùy chọn)</label>
                  <Input
                    id="message"
                    placeholder="Nhập lời nhắn..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleSendFriendRequest}
                  disabled={!inviteUsername.trim()}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi lời mời
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Gợi ý kết bạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { username: 'CodeExpert', rating: 1850, level: 27, reason: 'Cùng level' },
                    { username: 'AlgoMaster', rating: 1700, level: 24, reason: 'Rating gần' },
                    { username: 'DebugPro', rating: 1600, level: 22, reason: 'Tương thích' }
                  ].map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${suggestion.username}`} />
                          <AvatarFallback>{suggestion.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{suggestion.username}</div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {suggestion.rating} • Lv.{suggestion.level}
                          </div>
                          <div className="text-xs text-blue-600">
                            {suggestion.reason}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInviteUsername(suggestion.username)}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}