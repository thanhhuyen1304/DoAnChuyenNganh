import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  X,
  Check,
  Heart,
  Wifi,
  Send,
  Copy,
  Clock
} from 'lucide-react';
import friendApi, { Friend, FriendRequest, OnlineUser } from '@/services/friendApi';
import simplePvpApi from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';

interface FriendsAndUsersModalProps {
  open: boolean;
  onClose: () => void;
  inviteMode?: boolean;
  roomCode?: string;
  roomId?: string;
}

export function FriendsAndUsersModal({ open, onClose, inviteMode = false, roomCode = '', roomId }: FriendsAndUsersModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [inviteCooldowns, setInviteCooldowns] = useState<{ [userId: string]: number }>({});
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const { success, error } = useToastActions();

  useEffect(() => {
    if (open) {
      loadAllData();
    }
  }, [open]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadOnlineUsers()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const result = await friendApi.getFriendsList();
      if (result.success) {
        setFriends(result.data);
      }
    } catch (err: any) {
      console.error('Load friends error:', err);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const result = await friendApi.getPendingRequests();
      if (result.success) {
        setPendingRequests(result.data);
      }
    } catch (err: any) {
      console.error('Load pending requests error:', err);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const result = await friendApi.getOnlineUsers();
      if (result.success) {
        setOnlineUsers(result.data);
      }
    } catch (err: any) {
      console.error('Load online users error:', err);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const result = await friendApi.sendFriendRequest(userId);
      if (result.success) {
        success('Thành công', 'Đã gửi lời mời kết bạn');
        loadOnlineUsers(); // Refresh list
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể gửi lời mời kết bạn');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await friendApi.acceptFriendRequest(requestId);
      if (result.success) {
        success('Thành công', 'Đã chấp nhận lời mời kết bạn');
        loadAllData(); // Refresh all data
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể chấp nhận lời mời');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const result = await friendApi.declineFriendRequest(requestId);
      if (result.success) {
        success('Thành công', 'Đã từ chối lời mời kết bạn');
        loadPendingRequests(); // Refresh requests
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể từ chối lời mời');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Bạn có chắc muốn hủy kết bạn?')) return;
    
    try {
      const result = await friendApi.removeFriend(friendId);
      if (result.success) {
        success('Thành công', 'Đã hủy kết bạn');
        loadFriends(); // Refresh friends list
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể hủy kết bạn');
    }
  };

  // Cooldown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setInviteCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(userId => {
          const remaining = Math.max(0, updated[userId] - 1000);
          if (remaining !== updated[userId]) {
            hasChanges = true;
            if (remaining <= 0) {
              delete updated[userId];
            } else {
              updated[userId] = remaining;
            }
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInviteUser = async (userId: string, username: string) => {
    if (!roomCode && !roomId) {
      error('Lỗi', 'Không có mã phòng để mời');
      return;
    }

    // Check cooldown
    if (inviteCooldowns[userId]) {
      const secondsLeft = Math.ceil(inviteCooldowns[userId] / 1000);
      error('Vui lòng chờ', `Bạn có thể mời ${username} lại sau ${secondsLeft} giây`);
      return;
    }
    
    setInvitingUserId(userId);
    try {
      // Nếu có roomId, gửi lời mời thực qua API
      if (roomId && inviteMode) {
        const result = await simplePvpApi.sendRoomInvite(roomId, userId);
        if (result.success) {
          success('Thành công', `Đã gửi lời mời đến ${username}`);
          // Set cooldown 60 seconds
          setInviteCooldowns(prev => ({ ...prev, [userId]: 60000 }));
        }
      } else {
        // Fallback: Copy room code
        await navigator.clipboard.writeText(roomCode);
        success('Đã sao chép mã phòng', `Gửi mã "${roomCode}" cho ${username} để mời họ vào phòng`);
        setInviteCooldowns(prev => ({ ...prev, [userId]: 60000 }));
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể gửi lời mời');
    } finally {
      setInvitingUserId(null);
    }
  };

  const getCooldownText = (userId: string) => {
    const cooldown = inviteCooldowns[userId];
    if (!cooldown) return null;
    const seconds = Math.ceil(cooldown / 1000);
    return `${seconds}s`;
  };

  const getFriendshipLevelText = (level: number) => {
    switch (level) {
      case 5: return 'Tri kỷ';
      case 4: return 'Bạn thân';
      case 3: return 'Bạn tốt';
      case 2: return 'Bạn bè';
      default: return 'Mới quen';
    }
  };

  const getFriendshipLevelColor = (level: number) => {
    switch (level) {
      case 5: return 'bg-purple-100 text-purple-800 border-purple-300';
      case 4: return 'bg-pink-100 text-pink-800 border-pink-300';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 2: return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto top-[10%] translate-y-0 sm:translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {inviteMode ? (
              <>
                <Send className="w-6 h-6" />
                Mời Bạn Bè Vào Phòng
              </>
            ) : (
              <>
                <Users className="w-6 h-6" />
                Bạn Bè & Người Dùng
              </>
            )}
          </DialogTitle>
          {inviteMode && roomCode && (
            <div className="mt-2">
              <Card className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-blue-100">Mã phòng của bạn:</div>
                    <div className="text-xl font-bold font-mono tracking-wider">{roomCode}</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(roomCode);
                        success('Thành công', 'Đã sao chép mã phòng');
                      } catch (err) {
                        error('Lỗi', 'Không thể sao chép');
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Bạn bè ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Lời mời ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Online ({onlineUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có bạn bè</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.friendshipId}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.username[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{friend.username}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{friend.experience} XP</span>
                          {friend.pvpStats && (
                            <span>• {friend.pvpStats.wins}T - {friend.pvpStats.losses}B</span>
                          )}
                        </div>
                      </div>

                      {!inviteMode ? (
                        <>
                          <Badge className={getFriendshipLevelColor(friend.friendshipLevel)}>
                            {getFriendshipLevelText(friend.friendshipLevel)}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFriend(friend.userId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(friend.userId, friend.username)}
                          disabled={!!inviteCooldowns[friend.userId] || invitingUserId === friend.userId}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                        >
                          {invitingUserId === friend.userId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                              Đang gửi...
                            </>
                          ) : inviteCooldowns[friend.userId] ? (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              {getCooldownText(friend.userId)}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Mời
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="requests">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không có lời mời kết bạn</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.from.avatar} />
                        <AvatarFallback>{request.from.username[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{request.from.username}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.from.experience} XP
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.requestId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Chấp nhận
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineRequest(request.requestId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Online Users Tab */}
          <TabsContent value="online">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wifi className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không có người dùng online</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{user.username}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{user.experience} XP</span>
                          {user.pvpStats && (
                            <span>• {user.pvpStats.wins}T - {user.pvpStats.losses}B</span>
                          )}
                        </div>
                      </div>

                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Online
                      </Badge>

                      {!inviteMode ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendFriendRequest(user.userId)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Kết bạn
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(user.userId, user.username)}
                          disabled={!!inviteCooldowns[user.userId] || invitingUserId === user.userId}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                        >
                          {invitingUserId === user.userId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                              Đang gửi...
                            </>
                          ) : inviteCooldowns[user.userId] ? (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              {getCooldownText(user.userId)}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Mời
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}