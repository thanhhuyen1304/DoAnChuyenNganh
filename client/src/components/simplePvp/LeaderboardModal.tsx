import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import simplePvpApi from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalXP: number;
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  winRate: number;
}

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ open, onClose }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const { error } = useToastActions();

  useEffect(() => {
    if (open) {
      loadLeaderboard();
      loadUserStats();
    }
  }, [open]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const result = await simplePvpApi.getLeaderboard(100, 0);
      if (result.success) {
        setLeaderboard(result.data);
      }
    } catch (err: any) {
      console.error('Load leaderboard error:', err);
      error('Lỗi', 'Không thể tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

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

  const getRankIcon = (rank: number) => {
    return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700';
    return 'bg-slate-200';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Bảng Xếp Hạng PvP
          </DialogTitle>
        </DialogHeader>

        {/* User Stats Card */}
        {userStats && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-white">
                  <AvatarImage src={userStats.avatar} />
                  <AvatarFallback>{userStats.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{userStats.username}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4" />
                    <span>Hạng #{userStats.rank}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{userStats.totalXP} XP</div>
                <div className="text-sm opacity-90">
                  {userStats.pvpStats.wins}T - {userStats.pvpStats.losses}B - {userStats.pvpStats.draws}H
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có dữ liệu xếp hạng
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    entry.rank <= 3 
                      ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' 
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar & Name */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>{entry.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{entry.username}</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.totalMatches} trận đấu
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">{entry.wins}</div>
                      <div className="text-xs text-muted-foreground">Thắng</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">{entry.losses}</div>
                      <div className="text-xs text-muted-foreground">Thua</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-600">{entry.draws}</div>
                      <div className="text-xs text-muted-foreground">Hòa</div>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="text-center min-w-[80px]">
                    <Badge 
                      className={`${
                        entry.winRate >= 70 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : entry.winRate >= 50 
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {entry.winRate}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">Tỷ lệ thắng</div>
                  </div>

                  {/* XP */}
                  <div className="text-right min-w-[100px]">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-purple-600">{entry.totalXP}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Tổng XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}