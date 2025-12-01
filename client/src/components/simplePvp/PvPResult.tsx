import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Target
} from 'lucide-react';
import simplePvpApi from '@/services/simplePvpApi';

interface MatchResult {
  winner: string;
  participants: Array<{
    username: string;
    score: number;
    passedTests: number;
    totalTests: number;
    isWinner: boolean;
    completionTime: number;
  }>;
  winnerXP: number;
}

interface PvPDuelResultProps {
  open: boolean;
  matchResult: MatchResult | null;
  isCurrentUserWinner?: boolean;
  currentUserXP?: number;
  onClose?: () => void;
  onPlayAgain?: () => void;
}

export function PvPDuelResult({
  open,
  matchResult,
  isCurrentUserWinner,
  currentUserXP,
  onClose,
  onPlayAgain
}: PvPDuelResultProps) {
  if (!matchResult || !matchResult.participants || !Array.isArray(matchResult.participants)) {
    return null;
  }

  const winner = matchResult.participants.find(p => p.isWinner);
  const sortedParticipants = [...matchResult.participants].sort((a, b) => {
    // Sort by winner first, then by score, then by completion time
    if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.completionTime - b.completionTime;
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Kết quả trận đấu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Winner Announcement */}
          {(() => {
            const winners = matchResult.participants.filter(p => p.isWinner);
            
            if (winners.length > 1) {
              return (
                <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-8 h-8 text-blue-500" />
                    <h2 className="text-2xl font-bold text-blue-700">HÒA!</h2>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-lg text-blue-600 mb-2">Trận đấu kết thúc với kết quả hòa</p>
                  <p className="text-md text-blue-500">{winners.map(w => w.username).join(' & ')} có cùng điểm số!</p>
                  {isCurrentUserWinner && currentUserXP && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700">+{currentUserXP} XP</span>
                    </div>
                  )}
                </div>
              );
            } else if (winner) {
              return (
                <div className="text-center py-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h2 className="text-2xl font-bold text-yellow-700">{winner.username}</h2>
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="text-lg text-yellow-600">Đã chiến thắng trận đấu!</p>
                  {isCurrentUserWinner && currentUserXP && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700">+{currentUserXP} XP</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <Separator />

          {/* Participants Results */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Users className="w-5 h-5" />
              Bảng xếp hạng trận đấu
            </div>

            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.username}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  participant.isWinner 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-400' :
                    'bg-gray-600'
                  }`}>
                    {index === 0 ? <Crown className="w-5 h-5" /> : 
                     index === 1 ? <Medal className="w-5 h-5" /> : 
                     index + 1}
                  </div>

                  {/* Avatar and Name */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {participant.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {participant.username}
                        {participant.username === winner?.username && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            🏆 Người thắng
                          </Badge>
                        )}
                        {participant.username === (currentUserXP ? 'Current User' : '') && (
                          <Badge variant="outline">Bạn</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {simplePvpApi.formatTime(participant.completionTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score and Performance */}
                <div className="text-right">
                  <div className="font-bold text-lg mb-1">
                    {participant.score}%
                  </div>
                  <Progress value={participant.score} className="w-32 h-2 mb-2" />
                  <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                    <Target className="w-3 h-3" />
                    {participant.passedTests}/{participant.totalTests} test cases
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tổng test cases vượt qua
              </div>
              <div className="font-bold text-lg">
                {matchResult.participants.reduce((sum, p) => sum + p.passedTests, 0)}/
                {matchResult.participants.reduce((sum, p) => sum + p.totalTests, 0)}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                Người tham gia
              </div>
              <div className="font-bold text-lg">
                {matchResult.participants.length} người chơi
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onClose?.()}>
              Đóng
            </Button>
            
            <Button onClick={() => onPlayAgain?.()}>
              Chơi lại
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
