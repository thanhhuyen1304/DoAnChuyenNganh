import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react';
import { useToastActions } from '@/components/ui/toast';

interface PracticeLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  completedCount: number;
  highestScore: number;
  totalPoints: number;
  activityDays: number;
  badges: string[];
  highestBadge: string | null;
  userRank: string;
  experience: number;
}

interface PvPLeaderboardEntry {
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

interface CombinedLeaderboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function CombinedLeaderboardModal({ open, onClose }: CombinedLeaderboardModalProps) {
  const [practiceLeaderboard, setPracticeLeaderboard] = useState<PracticeLeaderboardEntry[]>([]);
  const [pvpLeaderboard, setPvpLeaderboard] = useState<PvPLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { error } = useToastActions();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (open) {
      loadLeaderboards();
    }
  }, [open]);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      // Load practice leaderboard
      const practiceRes = await fetch(`${API_BASE}/api/leaderboard/practice?limit=50`);
      const practiceData = await practiceRes.json();
      if (practiceData.success) {
        setPracticeLeaderboard(practiceData.data);
      }

      // Load PVP leaderboard
      const token = localStorage.getItem('token');
      const pvpRes = await fetch(`${API_BASE}/api/pvp/leaderboard?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const pvpData = await pvpRes.json();
      if (pvpData.success) {
        setPvpLeaderboard(pvpData.data);
      }
    } catch (err: any) {
      console.error('Load leaderboards error:', err);
      error('Lỗi', 'Không thể tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Bảng Xếp Hạng
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Bài Đơn
            </TabsTrigger>
            <TabsTrigger value="pvp" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              PvP
            </TabsTrigger>
          </TabsList>

          {/* Practice Leaderboard Tab */}
          <TabsContent value="practice">
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : practiceLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu xếp hạng
                </div>
              ) : (
                <div className="space-y-2">
                  {practiceLeaderboard.map((entry, index) => (
                    <div
                      key={`practice-${entry.userId}-${index}`}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
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
                      <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback className="text-lg">{entry.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg truncate">{entry.username}</h4>
                          {entry.highestBadge && (
                            <span className="text-xl" title="Huy chương cao nhất">
                              {entry.highestBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{entry.completedCount} bài</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{entry.activityDays} ngày</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.userRank}
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span className="font-bold text-xl text-purple-600">
                            {entry.totalPoints}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">Tổng điểm</div>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Cao nhất: {entry.highestScore}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* PVP Leaderboard Tab */}
          <TabsContent value="pvp">
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pvpLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu xếp hạng PvP
                </div>
              ) : (
                <div className="space-y-2">
                  {pvpLeaderboard.map((entry, index) => (
                    <div
                      key={`pvp-${entry.userId}-${index}`}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}