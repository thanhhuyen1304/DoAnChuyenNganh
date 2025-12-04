import React, { useState, useEffect, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  Trophy,
  Code,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import simplePvpApi, { Challenge, Match, SubmissionResult } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';

interface PvPArenaProps {
  open: boolean;
  match: {
    matchId: string;
    challenge: Challenge;
  } | null;
  currentUserId: string;
  opponent?: {
    id: string;
    username: string;
  };
  onMatchEnd?: (result: any) => void;
  onLeaveArena?: () => void;
}

interface MatchStatus {
  status: Match | null;
  isLoading: boolean;
}

export function PvPArena({ 
  open, 
  match, 
  currentUserId,
  opponent,
  onMatchEnd,
  onLeaveArena 
}: PvPArenaProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>({
    status: null,
    isLoading: false
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(true);
  const [isMatchActive, setIsMatchActive] = useState(true);
  
  const { success, error } = useToastActions();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize match data
  useEffect(() => {
    if (match && open) {
      setTimeLeft(match.challenge.timeLimit * 60); // Convert minutes to seconds
      setMatchStatus({ status: null, isLoading: true });
      
      // Get initial match status
      loadMatchStatus(match.matchId);
      
      // Set up periodic status updates
      statusIntervalRef.current = setInterval(() => {
        loadMatchStatus(match.matchId);
      }, 3000); // Update every 3 seconds
      
      // Set up timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [match, open]);

  const loadMatchStatus = async (matchId: string) => {
    try {
      const result = await simplePvpApi.getMatchStatus(matchId);
      if (result.success) {
        setMatchStatus({ status: result.data, isLoading: false });
        
        // Check if match is completed
        if (result.data.status === 'completed') {
          setIsMatchActive(false);
          handleMatchCompleted(result.data);
        }
      }
    } catch (error) {
      console.error('Load match status error:', error);
    }
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }
    
    // Auto finish match when time's up
    if (match) {
      finishMatch();
    }
  };

  const handleMatchCompleted = (completedMatch: Match) => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }
    
    // Set match as inactive
    setIsMatchActive(false);
    
    // Calculate winner XP and results
    const winner = completedMatch.participants.find(p => p.isWinner);
    const winnerXP = completedMatch.winnerId ? 50 : 0; // Simplified XP calculation
    
    onMatchEnd?.({
      match: completedMatch,
      winner: winner?.username,
      winnerXP,
      participants: completedMatch.participants.map(p => ({
        username: p.username,
        score: p.score,
        passedTests: p.passedTests,
        totalTests: p.totalTests,
        isWinner: p.isWinner,
        completionTime: p.completionTime
      }))
    });
  };

  const handleSubmitCode = async () => {
    if (!match || !code.trim()) {
      error('Lỗi', 'Vui lòng nhập code trước khi submit');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await simplePvpApi.submitCode(match.matchId, code.trim(), language);
      
      if (result.success) {
        setSubmissionResult(result.data);
        
        // Check if user won (passed all tests)
        if (result.data.passedTests === result.data.totalTests) {
          success('Xuất sắc!', `Bạn đã hoàn thành tất cả test cases với ${result.data.score}% điểm!`);
          
          // Auto finish match if someone wins
          setTimeout(() => {
            finishMatch();
          }, 2000);
        } else {
          success('Đã nộp', `Bạn đã qua ${result.data.passedTests}/${result.data.totalTests} test cases`);
        }
        
        // Update match status
        loadMatchStatus(match.matchId);
      }
    } catch (error: any) {
      console.error('Submit code error:', error);
      error('Lỗi', error.response?.data?.message || 'Không thể nộp code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishMatch = async () => {
    if (!match) return;
    
    setMatchStatus(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await simplePvpApi.finishMatch(match.matchId);
      
      if (result.success) {
        handleMatchCompleted(result.data as unknown as Match);
      }
    } catch (error: any) {
      error('Lỗi', error.response?.data?.message || 'Không thể kết thúc trận đấu');
    } finally {
      setMatchStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleForfeit = async () => {
    if (!match) return;
    
    // Show confirmation dialog
    if (!confirm('Bạn có chắc muốn rời trận đấu? Bạn sẽ bị thua và không nhận được XP.')) {
      return;
    }
    
    setMatchStatus(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await simplePvpApi.forfeitMatch(match.matchId);
      
      if (result.success) {
        success('Thông báo', result.message || 'Bạn đã rời trận đấu');
        
        // Handle match completed with forfeit
        handleMatchCompleted(result.data as unknown as Match);
      }
    } catch (err: any) {
      error('Lỗi', err.response?.data?.message || 'Không thể rời trận đấu');
    } finally {
      setMatchStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!match) return null;

  const testCases = match.challenge.testCases.filter(tc => !tc.isHidden);

  return (
    <Dialog open={open} onOpenChange={() => onLeaveArena?.()}>
      <DialogContent
        className="sm:max-w-[1200px] max-h-[85vh] flex flex-col overflow-hidden top-[8%] translate-y-0 sm:translate-y-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Trận đấu: {match.challenge.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className="font-medium text-lg">{formatTime(timeLeft)}</span>
              <Badge className={timeLeft < 60 ? 'bg-red-500' : 'bg-blue-500'}>
                {timeLeft < 60 ? 'Sắp hết giờ!' : 'Đang diễn ra'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Badge className={simplePvpApi.getDifficultyColor(match.challenge.difficulty)}>
                {simplePvpApi.getDifficultyText(match.challenge.difficulty)}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {testCases.length} test cases
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              {opponent && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback>{opponent.username[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{opponent.username}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Left Panel - Problem Description & Test Cases */}
            <div className="flex flex-col space-y-4 overflow-hidden">
              {/* Problem Description */}
              <div className="bg-muted/50 rounded-lg p-4 overflow-y-auto max-h-[40vh]">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Mô tả bài tập
                </h3>
                <div className="text-sm whitespace-pre-wrap">
                  {match.challenge.description}
                </div>
              </div>

              {/* Test Cases */}
              <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-y-auto">
                <h3 className="font-medium mb-2">Test Cases (Public)</h3>
                <div className="space-y-3">
                  {testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Test Case {index + 1}</span>
                        {submissionResult?.testResults[index] && (
                          <Badge variant={
                            submissionResult.testResults[index].passed 
                              ? "default" 
                              : "destructive"
                          }>
                            {submissionResult.testResults[index].passed ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Input: </span>
                          <code className="bg-gray-100 px-1 rounded">{testCase.input}</code>
                        </div>
                        <div>
                          <span className="font-medium">Output: </span>
                          <code className="bg-gray-100 px-1 rounded">{testCase.expectedOutput}</code>
                        </div>
                        
                        {submissionResult?.testResults[index] && (
                          <div>
                            <span className="font-medium">Your Output: </span>
                            <code className={`px-1 rounded ${
                              submissionResult.testResults[index].passed 
                                ? 'bg-green-100' 
                                : 'bg-red-100'
                            }`}>
                              {submissionResult.testResults[index].actualOutput}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Code Editor */}
            <div className="flex flex-col space-y-4">
              {/* Code Editor Toggle Header */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span className="font-medium text-sm">Code Editor</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
                  disabled={!isMatchActive}
                  title={!isMatchActive ? "Trận đấu đã kết thúc" : ""}
                >
                  {isCodeEditorOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {isCodeEditorOpen && (
                <>
                  {/* Language Selector */}
                  <div className="flex items-center gap-4">
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                      disabled={isMatchActive}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="Java">Java</SelectItem>
                        <SelectItem value="C++">C++</SelectItem>
                        <SelectItem value="C#">C#</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleSubmitCode}
                      disabled={isSubmitting || timeLeft === 0 || !isMatchActive}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang nộp...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Chạy code
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 border rounded-lg overflow-hidden relative">
                    {!isMatchActive && (
                      <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
                          <Terminal className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium">Trận đấu đã kết thúc</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Code editor đã bị khóa
                          </p>
                        </div>
                      </div>
                    )}
                    <Editor
                      height="100%"
                      defaultLanguage={language.toLowerCase()}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        readOnly: !isMatchActive,
                      }}
                    />
                  </div>

                  {/* Submission Result */}
                  {submissionResult && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Kết quả chạy code</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Điểm:</span> {submissionResult.score}%
                        </div>
                        <div>
                          <span className="font-medium">Test cases:</span> {submissionResult.passedTests}/{submissionResult.totalTests}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Progress value={submissionResult.score} className="h-2" />
                      </div>
                      
                      {submissionResult.passedTests === submissionResult.totalTests && (
                        <div className="mt-2 text-green-600 font-medium text-sm">
                          🎉 Tuyệt vời! Bạn đã qua tất cả test cases!
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {!isCodeEditorOpen && (
                <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed">
                  <div className="text-center text-muted-foreground p-8">
                    <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Code Editor đã được thu gọn</p>
                    <p className="text-xs mt-1">
                      {isMatchActive
                        ? "Đang thi đấu - Không thể mở editor"
                        : "Nhấn nút mũi tên để mở lại"
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleForfeit}
              disabled={!isMatchActive || matchStatus.isLoading}
            >
              {matchStatus.isLoading ? 'Đang xử lý...' : 'Bỏ cuộc (Thua)'}
            </Button>
            
            <div className="flex items-center gap-4">
              {isMatchActive && (
                <Badge variant="destructive" className="animate-pulse">
                  Đang thi đấu - Các nút bị vô hiệu hóa
                </Badge>
              )}
              {matchStatus.status && (
                <div className="text-sm text-muted-foreground">
                  Trạng thái: {matchStatus.status.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
