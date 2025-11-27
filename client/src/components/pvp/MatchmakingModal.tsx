import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  X, 
  Clock, 
  Users, 
  Target, 
  Zap, 
  Shield, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Timer,
  Activity
} from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound?: (opponent: any) => void;
  userRating?: number;
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  preferredMode?: '1vs1' | 'tournament';
}

interface Opponent {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  status: 'searching' | 'found' | 'ready';
}

export default function MatchmakingModal({
  isOpen,
  onClose,
  onMatchFound,
  userRating = 1650,
  preferredDifficulty = 'medium',
  preferredMode = '1vs1'
}: MatchmakingModalProps) {
  const [searchStatus, setSearchStatus] = useState<'searching' | 'found' | 'ready' | 'cancelled'>('searching');
  const [searchTime, setSearchTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [searchPhase, setSearchPhase] = useState<'initial' | 'expanding' | 'wide'>('initial');

  // Mock opponent data
  const mockOpponents: Opponent[] = [
    {
      id: '1',
      username: 'CodeMaster',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
      rating: 1680,
      level: 24,
      wins: 142,
      losses: 38,
      winRate: 78.9,
      status: 'searching'
    },
    {
      id: '2',
      username: 'AlgoNinja',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoNinja',
      rating: 1720,
      level: 26,
      wins: 167,
      losses: 42,
      winRate: 79.9,
      status: 'searching'
    },
    {
      id: '3',
      username: 'SyntaxKing',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SyntaxKing',
      rating: 1620,
      level: 22,
      wins: 128,
      losses: 35,
      winRate: 78.5,
      status: 'searching'
    }
  ];

  useEffect(() => {
    if (!isOpen || searchStatus !== 'searching') return;

    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
      setProgress(prev => Math.min(prev + 3.33, 100));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, searchStatus]);

  useEffect(() => {
    if (searchTime === 10 && searchPhase === 'initial') {
      setSearchPhase('expanding');
      setEstimatedTime(45);
    } else if (searchTime === 25 && searchPhase === 'expanding') {
      setSearchPhase('wide');
      setEstimatedTime(60);
    }
  }, [searchTime, searchPhase]);

  useEffect(() => {
    if (!isOpen || searchStatus !== 'searching') return;

    // Simulate finding opponent after 3-8 seconds
    const findOpponentTime = Math.random() * 5000 + 3000;
    
    const timer = setTimeout(() => {
      const randomOpponent = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
      setOpponent(randomOpponent);
      setSearchStatus('found');
      setProgress(100);
      
      // Auto-ready after 2 seconds
      setTimeout(() => {
        setSearchStatus('ready');
      }, 2000);
    }, findOpponentTime);

    return () => clearTimeout(timer);
  }, [isOpen, searchStatus]);

  const handleCancel = () => {
    setSearchStatus('cancelled');
    onClose();
    // Reset state
    setTimeout(() => {
      setSearchTime(0);
      setProgress(0);
      setEstimatedTime(30);
      setOpponent(null);
      setSearchPhase('initial');
      setSearchStatus('searching');
    }, 300);
  };

  const handleAcceptMatch = () => {
    if (opponent) {
      onMatchFound?.(opponent);
      onClose();
    }
  };

  const getSearchPhaseText = () => {
    switch (searchPhase) {
      case 'initial':
        return 'Tìm đối thủ tương xứng...';
      case 'expanding':
        return 'Mở rộng phạm vi tìm kiếm...';
      case 'wide':
        return 'Tìm kiếm trên toàn bộ server...';
      default:
        return 'Đang tìm kiếm...';
    }
  };

  const getSearchPhaseDescription = () => {
    switch (searchPhase) {
      case 'initial':
        return `Tìm đối thủ có rating ±${Math.round(userRating * 0.05)}`;
      case 'expanding':
        return `Tìm đối thủ có rating ±${Math.round(userRating * 0.1)}`;
      case 'wide':
        return 'Tìm tất cả đối thủ có sẵn';
      default:
        return '';
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Matchmaking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Status */}
          {searchStatus === 'searching' && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 mx-auto border-4 border-primary rounded-full flex items-center justify-center">
                  <Search className={`w-8 h-8 text-primary ${searchStatus === 'searching' ? 'animate-pulse' : ''}`} />
                </div>
                {searchPhase === 'expanding' && (
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-blue-500 rounded-full animate-ping" />
                )}
                {searchPhase === 'wide' && (
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-orange-500 rounded-full animate-ping" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{getSearchPhaseText()}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {getSearchPhaseDescription()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Thời gian tìm kiếm</span>
                  <span>{formatTime(searchTime)}</span>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>Ước tính: {formatTime(estimatedTime)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Rating: {userRating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(preferredDifficulty)}>
                    {preferredDifficulty === 'easy' ? 'Dễ' : 
                     preferredDifficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>{preferredMode === '1vs1' ? '1vs1' : 'Tournament'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>{Math.floor(Math.random() * 50) + 100} người chơi</span>
                </div>
              </div>
            </div>
          )}

          {/* Opponent Found */}
          {searchStatus === 'found' && opponent && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 mx-auto border-4 border-green-500 rounded-full flex items-center justify-center bg-green-50">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-green-500 rounded-full animate-ping" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">Tìm thấy đối thủ!</h3>
                <p className="text-sm text-muted-foreground">
                  Đang chờ xác nhận...
                </p>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={opponent.avatar} />
                      <AvatarFallback>{opponent.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{opponent.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Rating: {opponent.rating} • Lv.{opponent.level}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {opponent.wins}W / {opponent.losses}L • {opponent.winRate}% WR
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ready to Start */}
          {searchStatus === 'ready' && opponent && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto border-4 border-green-500 rounded-full flex items-center justify-center bg-green-50">
                <Zap className="w-8 h-8 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">Sẵn sàng bắt đầu!</h3>
                <p className="text-sm text-muted-foreground">
                  Cả hai người chơi đã sẵn sàng
                </p>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>Bạn</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">Bạn</div>
                        <div className="text-sm text-muted-foreground">
                          Rating: {userRating}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">VS</div>
                      <Badge className={getDifficultyColor(preferredDifficulty)}>
                        {preferredDifficulty === 'easy' ? 'Dễ' : 
                         preferredDifficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{opponent.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Rating: {opponent.rating}
                        </div>
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={opponent.avatar} />
                        <AvatarFallback>{opponent.username[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>Bắt đầu trong 3 giây...</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {searchStatus === 'searching' && (
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
            )}
            
            {searchStatus === 'ready' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button 
                  onClick={handleAcceptMatch}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chấp nhận
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}