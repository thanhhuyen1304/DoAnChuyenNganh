import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  Check, 
  Clock, 
  Code2, 
  Users,
  Trophy
} from 'lucide-react';
import simplePvpApi from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';

export interface RoomInvite {
  inviteId: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  hostUsername: string;
  hostId: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  maxParticipants: number;
  currentParticipants: number;
  expiresAt: number;
}

interface RoomInviteNotificationProps {
  invite: RoomInvite;
  onAccept?: (roomCode: string) => void;
  onDecline?: (inviteId: string) => void;
  onExpire?: (inviteId: string) => void;
}

export function RoomInviteNotification({
  invite,
  onAccept,
  onDecline,
  onExpire
}: RoomInviteNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
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

  useEffect(() => {
    const updateTimeLeft = () => {
      const remaining = Math.max(0, invite.expiresAt - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0 && onExpire) {
        onExpire(invite.inviteId);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 100);

    return () => clearInterval(interval);
  }, [invite.expiresAt, invite.inviteId, onExpire]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Just call the parent callback to handle join logic
      if (onAccept) {
        onAccept(invite.roomCode);
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể tham gia phòng');
      setIsAccepting(false);
    }
    // Don't set isAccepting to false here, let parent handle it
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline(invite.inviteId);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const getProgressPercentage = () => {
    const totalTime = 60000; // 60 seconds
    return (timeLeft / totalTime) * 100;
  };

  if (timeLeft <= 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-2xl animate-in slide-in-from-bottom-5 z-50">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src="" />
              <AvatarFallback className="bg-white text-blue-600">
                {invite.hostUsername[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm">Lời mời tham gia phòng</p>
              <p className="text-xs text-blue-100">từ {invite.hostUsername}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecline}
            className="h-8 w-8 p-0 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Room Info */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold truncate">{invite.roomName}</h3>
            <Badge className={simplePvpApi.getDifficultyColor(invite.difficulty)}>
              {simplePvpApi.getDifficultyText(invite.difficulty)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              <span className="truncate">
                {languages[invite.language]?.icon} {languages[invite.language]?.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{invite.timeLimit} phút</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{invite.currentParticipants}/{invite.maxParticipants}</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Hết hạn sau: <span className="font-bold">{formatTime(timeLeft)}</span>
            </span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleDecline}
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={isAccepting}
          >
            Từ chối
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2" />
                Đang tham gia...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Chấp nhận
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}