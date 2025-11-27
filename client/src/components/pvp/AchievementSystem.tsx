import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Target, 
  Zap, 
  Shield, 
  Crown,
  Sword,
  Flame,
  Gem,
  Lock,
  Unlock,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'victories' | 'streaks' | 'participation' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: {
    type: 'title' | 'badge' | 'points' | 'avatar';
    value: string | number;
  };
}

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'title' | 'badge' | 'avatar' | 'effect';
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: string;
  requirement: {
    type: string;
    value: number;
  };
}

interface Season {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rewards: Reward[];
  progress: {
    current: number;
    max: number;
    tier: number;
  };
}

interface AchievementSystemProps {
  children: React.ReactNode;
  userAchievements?: Achievement[];
  userRewards?: Reward[];
  currentSeason?: Season;
}

export default function AchievementSystem({ 
  children, 
  userAchievements = [],
  userRewards = [],
  currentSeason
}: AchievementSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('achievements');

  // Mock data
  const [achievements] = useState<Achievement[]>([
    {
      id: 'first_win',
      title: 'Chiến Thắng Đầu Tiên',
      description: 'Đạt chiến thắng đầu tiên trong trận đấu PvP',
      icon: <Trophy className="w-6 h-6" />,
      category: 'victories',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: '2024-01-15',
      reward: {
        type: 'points',
        value: 50
      }
    },
    {
      id: 'win_streak_5',
      title: 'Nóng Bỏng',
      description: 'Đạt chuỗi 5 chiến thắng liên tiếp',
      icon: <Flame className="w-6 h-6" />,
      category: 'streaks',
      rarity: 'rare',
      progress: 3,
      maxProgress: 5,
      unlocked: false
    },
    {
      id: 'win_streak_10',
      title: 'Bất Bại',
      description: 'Đạt chuỗi 10 chiến thắng liên tiếp',
      icon: <Crown className="w-6 h-6" />,
      category: 'streaks',
      rarity: 'epic',
      progress: 3,
      maxProgress: 10,
      unlocked: false
    },
    {
      id: '100_wins',
      title: 'Chiến Binh Dày Dạn',
      description: 'Đạt 100 chiến thắng tổng cộng',
      icon: <Medal className="w-6 h-6" />,
      category: 'victories',
      rarity: 'epic',
      progress: 67,
      maxProgress: 100,
      unlocked: false
    },
    {
      id: 'tournament_winner',
      title: 'Vô Địch Giải Đấu',
      description: 'Chiến thắng trong một trận tournament',
      icon: <Award className="w-6 h-6" />,
      category: 'special',
      rarity: 'legendary',
      progress: 0,
      maxProgress: 1,
      unlocked: false
    }
  ]);

  const [rewards] = useState<Reward[]>([
    {
      id: 'novice_title',
      title: 'Tân Binh',
      description: 'Mở khóa khi đạt 10 chiến thắng',
      type: 'title',
      icon: <Shield className="w-6 h-6" />,
      unlocked: true,
      unlockedAt: '2024-01-10',
      requirement: {
        type: 'wins',
        value: 10
      }
    },
    {
      id: 'expert_badge',
      title: 'Chuyên Gia',
      description: 'Mở khóa khi đạt 75% win rate',
      type: 'badge',
      icon: <Star className="w-6 h-6" />,
      unlocked: false,
      requirement: {
        type: 'win_rate',
        value: 75
      }
    },
    {
      id: 'elite_avatar',
      title: 'Elite Avatar',
      description: 'Mở khóa khi đạt top 100 leaderboard',
      type: 'avatar',
      icon: <Crown className="w-6 h-6" />,
      unlocked: false,
      requirement: {
        type: 'leaderboard_rank',
        value: 100
      }
    }
  ]);

  const [seasons] = useState<Season[]>([
    {
      id: 'season_1',
      name: 'Mùa 1: Rise of Champions',
      description: 'Mùa đầu tiên của BugHunter PvP',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      isActive: true,
      rewards: [
        {
          id: 'season1_bronze',
          title: 'Huy chương Đồng',
          description: 'Đạt 20 điểm mùa',
          type: 'badge',
          icon: <Medal className="w-6 h-6" />,
          unlocked: true,
          requirement: {
            type: 'season_points',
            value: 20
          }
        }
      ],
      progress: {
        current: 45,
        max: 100,
        tier: 2
      }
    }
  ]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'victories': return <Trophy className="w-5 h-5" />;
      case 'streaks': return <Flame className="w-5 h-5" />;
      case 'participation': return <Target className="w-5 h-5" />;
      case 'special': return <Star className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'victories': return 'Chiến Thắng';
      case 'streaks': return 'Chuỗi Thắng';
      case 'participation': return 'Tham Gia';
      case 'special': return 'Đặc Biệt';
      default: return 'Khác';
    }
  };

  const getSeasonTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'text-bronze-600';
      case 2: return 'text-silver-600';
      case 3: return 'text-gold-600';
      case 4: return 'text-platinum-600';
      case 5: return 'text-diamond-600';
      default: return 'text-gray-600';
    }
  };

  const getSeasonTierName = (tier: number) => {
    switch (tier) {
      case 1: return 'Đồng';
      case 2: return 'Bạc';
      case 3: return 'Vàng';
      case 4: return 'Bạch Kim';
      case 5: return 'Kim Cương';
      default: return 'Đồng';
    }
  };

  const filteredAchievements = achievements.filter(achievement => 
    userAchievements.length === 0 || userAchievements.some(ua => ua.id === achievement.id)
  );

  const achievementsByCategory = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked).length;
  const totalAchievements = filteredAchievements.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6" />
            Thành Tích & Phần Thưởng
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Thành Tích ({unlockedAchievements}/{totalAchievements})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Phần Thưởng
            </TabsTrigger>
            <TabsTrigger value="season" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mùa Đấu
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Thống Kê
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {getCategoryName(category)}
                      <Badge variant="outline">
                        {categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryAchievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)} ${
                          achievement.unlocked ? '' : 'opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            achievement.unlocked ? 'bg-white' : 'bg-gray-200'
                          }`}>
                            {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`font-semibold ${getRarityTextColor(achievement.rarity)}`}>
                                {achievement.title}
                              </h3>
                              {achievement.unlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Đã mở khóa
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {achievement.description}
                            </p>
                            
                            {!achievement.unlocked && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Tiến độ</span>
                                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className="w-full"
                                />
                              </div>
                            )}
                            
                            {achievement.reward && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                  <Gem className="w-4 h-4" />
                                  <span>Phần thưởng: </span>
                                  {achievement.reward.type === 'points' && (
                                    <span className="font-semibold">+{achievement.reward.value} điểm</span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {achievement.unlockedAt && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Mở khóa: {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className={`hover:shadow-md transition-shadow ${
                  reward.unlocked ? '' : 'opacity-75'
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      reward.unlocked ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
                    }`}>
                      {reward.unlocked ? reward.icon : <Lock className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="font-semibold mb-2">{reward.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reward.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Yêu cầu: {reward.requirement.type} = {reward.requirement.value}
                    </div>
                    {reward.unlocked && reward.unlockedAt && (
                      <div className="mt-2 text-xs text-green-600">
                        <Unlock className="w-3 h-3 inline mr-1" />
                        Đã mở khóa: {new Date(reward.unlockedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Season Tab */}
          <TabsContent value="season" className="space-y-6">
            {seasons.map((season) => (
              <Card key={season.id} className={`${season.isActive ? 'border-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {season.name}
                    </div>
                    {season.isActive && (
                      <Badge className="bg-green-100 text-green-800">
                        Đang diễn ra
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{season.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Bắt đầu:</span>
                      <span>{new Date(season.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Kết thúc:</span>
                      <span>{new Date(season.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tiến độ mùa:</span>
                      <span className={`font-bold ${getSeasonTierColor(season.progress.tier)}`}>
                        {getSeasonTierName(season.progress.tier)} - {season.progress.current}/{season.progress.max} điểm
                      </span>
                    </div>
                    <Progress 
                      value={(season.progress.current / season.progress.max) * 100} 
                      className="w-full"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Phần thưởng mùa:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {season.rewards.map((reward) => (
                        <div key={reward.id} className={`p-3 rounded-lg border ${
                          reward.unlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            {reward.icon}
                            <span className="text-sm font-medium">{reward.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <div className="text-2xl font-bold mb-2">{unlockedAchievements}</div>
                  <div className="text-sm text-muted-foreground">Thành tích đã mở</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                  <div className="text-2xl font-bold mb-2">{rewards.filter(r => r.unlocked).length}</div>
                  <div className="text-sm text-muted-foreground">Phần thưởng đã nhận</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <div className="text-2xl font-bold mb-2">85%</div>
                  <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <div className="text-2xl font-bold mb-2">1,250</div>
                  <div className="text-sm text-muted-foreground">Điểm thành tích</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}