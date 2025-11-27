"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, RotateCcw, Send, Timer, Users, Code, CheckCircle, XCircle, Clock, Eye, EyeOff, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/hooks/use-toast"
import { SubmissionAnalysis } from "@/components/practice/SubmissionAnalysis"

interface PvPMatchProps {
  match: any
  currentUser: any
  opponent: any
  challenge: any
  onLeaveMatch: () => void
  onSubmitCode: (code: string, language: string) => void
  onMatchEnd: (result: any) => void
}

export function PvPMatch({ match, currentUser, opponent, challenge, onLeaveMatch, onSubmitCode, onMatchEnd }: PvPMatchProps) {
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState(challenge?.language || "Java")
  const [timeLeft, setTimeLeft] = useState(match.settings?.timeLimit * 60 || 600) // seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<any | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null)
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result" | "analysis">("testcase")
  const [selectedTestCase, setSelectedTestCase] = useState(0)
  const [showConsole, setShowConsole] = useState(true)
  const [opponentProgress, setOpponentProgress] = useState({ submissions: 0, testCasesPassed: 0 })
  const [isMatchActive, setIsMatchActive] = useState(false)
  const [matchResult, setMatchResult] = useState<any | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Timer countdown
  useEffect(() => {
    if (!isMatchActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isMatchActive, timeLeft])

  // Simulate opponent progress (real implementation would use WebSocket)
  useEffect(() => {
    if (!isMatchActive) return

    const interval = setInterval(() => {
      setOpponentProgress(prev => ({
        submissions: prev.submissions + Math.random() > 0.7 ? 1 : 0,
        testCasesPassed: Math.min(
          prev.testCasesPassed + (Math.random() > 0.6 ? 1 : 0),
          challenge?.testCases?.length || 5
        )
      }))
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(interval)
  }, [isMatchActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUp = () => {
    setIsMatchActive(false)
    // Determine winner based on test cases passed
    const userTestCasesPassed = testResults?.cases?.filter((c: any) => c.status === "passed").length || 0
    const opponentTestCasesPassed = opponentProgress.testCasesPassed
    
    const winner = userTestCasesPassed > opponentTestCasesPassed ? 'user' : 
                 userTestCasesPassed < opponentTestCasesPassed ? 'opponent' : 'draw'
    
    setMatchResult({
      winner,
      userScore: userTestCasesPassed,
      opponentScore: opponentTestCasesPassed,
      timeUp: true
    })
  }

  const handleSubmit = async () => {
    if (!challenge?._id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy bài tập",
        variant: "destructive"
      })
      return
    }

    if (!code || code.trim().length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập code trước khi submit",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call to submit code
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock test results (real implementation would call Judge0 API)
      const mockResults = {
        status: Math.random() > 0.3 ? "Accepted" : "Wrong Answer",
        runtime: `${Math.floor(Math.random() * 1000)} ms`,
        memory: `${(Math.random() * 100).toFixed(2)} MB`,
        cases: challenge?.testCases?.map((tc: any, idx: number) => ({
          id: idx + 1,
          input: tc.input,
          output: Math.random() > 0.3 ? tc.expectedOutput : "Wrong output",
          expected: tc.expectedOutput,
          status: Math.random() > 0.3 ? "passed" : "failed",
        })) || []
      }

      setTestResults(mockResults)

      // Mock AI analysis
      if (Math.random() > 0.5) {
        setAiAnalysis({
          overallStatus: mockResults.status === "Accepted" ? "correct" : "partial",
          summary: mockResults.status === "Accepted" ? 
            "Code của bạn đã vượt qua tất cả test cases!" : 
            "Code của bạn cần cải thiện để vượt qua tất cả test cases.",
          recommendations: mockResults.status === "Accepted" ? [] : [
            "Kiểm tra lại logic xử lý edge cases",
            "Cải thiện hiệu suất của thuật toán"
          ]
        })
      }

      // Check if user completed all test cases
      const passedCount = mockResults.cases?.filter((c: any) => c.status === "passed").length || 0
      if (passedCount === challenge?.testCases?.length) {
        setIsMatchActive(false)
        setMatchResult({
          winner: 'user',
          userScore: passedCount,
          opponentScore: opponentProgress.testCasesPassed,
          timeUp: false
        })
      }

      toast({
        title: mockResults.status === "Accepted" ? "Đúng!" : "Chưa đúng",
        description: `Bạn đã qua ${passedCount}/${challenge?.testCases?.length} test cases`,
        variant: mockResults.status === "Accepted" ? "default" : "destructive"
      })

    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi nộp bài",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCode("")
    setTestResults(null)
    setAiAnalysis(null)
    setConsoleTab("testcase")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Đã sao chép",
      description: "Code đã được sao chép vào clipboard"
    })
  }

  const selectedTestCaseData = testResults?.cases?.[selectedTestCase]
  const currentTestCase = challenge?.testCases?.[selectedTestCase]

  const getProgressPercentage = (passed: number, total: number) => {
    return total > 0 ? (passed / total) * 100 : 0
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onLeaveMatch}>
                <X className="w-4 h-4 mr-2" />
                Rời trận đấu
              </Button>
              <h1 className="text-xl font-bold">{match.name}</h1>
              <Badge variant="secondary">{challenge?.difficulty}</Badge>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft <= 60 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={`font-mono text-lg font-bold ${timeLeft <= 60 ? 'text-red-500' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Players */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{currentUser?.username}</p>
                      <p className="text-sm text-muted-foreground">Bạn</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600">
                    {testResults?.cases?.filter((c: any) => c.status === "passed").length || 0}/{challenge?.testCases?.length} passed
                  </div>
                </div>
                
                <div className="text-xl font-bold text-muted-foreground">VS</div>
                
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{opponent?.username}</p>
                      <p className="text-sm text-muted-foreground">Đối thủ</p>
                    </div>
                  </div>
                  <div className="text-sm text-red-600">
                    {opponentProgress.testCasesPassed}/{challenge?.testCases?.length} passed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Result Modal */}
      {matchResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-md p-6">
            <div className="text-center space-y-4">
              <div className={`text-6xl font-bold ${
                matchResult.winner === 'user' ? 'text-green-500' : 
                matchResult.winner === 'opponent' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {matchResult.winner === 'user' ? '🎉' : 
                 matchResult.winner === 'opponent' ? '😔' : '🤝'}
              </div>
              <h2 className="text-2xl font-bold">
                {matchResult.winner === 'user' ? 'Bạn đã thắng!' : 
                 matchResult.winner === 'opponent' ? 'Bạn đã thua!' : 'Hòa!'}
              </h2>
              <p className="text-muted-foreground">
                {matchResult.timeUp ? 'Hết thời gian! ' : ''}
                {matchResult.userScore > matchResult.opponentScore ? 
                  `Bạn đã hoàn thành ${matchResult.userScore} test cases, đối thủ ${matchResult.opponentScore}` :
                  `Đối thủ đã hoàn thành ${matchResult.opponentScore} test cases, bạn ${matchResult.userScore}`
                }
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>XP nhận được:</span>
                  <span className="font-bold text-green-600">
                    +{matchResult.winner === 'user' ? '50' : '10'}
                  </span>
                </div>
              </div>
              <Button onClick={() => onMatchEnd(matchResult)} className="w-full">
                Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Problem Statement */}
        <div className="w-1/3 border-r border-border bg-muted/30 p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                {challenge?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Đề bài</h4>
                <div className="text-sm bg-background p-3 rounded border">
                  {challenge?.problemStatement}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Test Cases</h4>
                <div className="space-y-2">
                  {challenge?.testCases?.slice(0, 3).map((tc: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">Test Case {idx + 1}:</div>
                      <div className="bg-background p-2 rounded border font-mono text-xs">
                        Input: {tc.input}
                        {tc.isHidden ? "" : (
                          <>
                            <br />Expected: {tc.expectedOutput}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {challenge?.testCases?.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    ... và {challenge?.testCases?.length - 3} test cases khác
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Giới hạn</h4>
                <div className="text-sm space-y-1">
                  <div>• Thời gian: {match.settings?.timeLimit} phút</div>
                  <div>• Ngôn ngữ: {match.settings?.language === 'all' ? 'Tất cả' : match.settings?.language}</div>
                  <div>• Độ khó: {challenge?.difficulty}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between h-12 px-4 bg-card border-b border-border">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-input border border-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option>Java</option>
                <option>Python</option>
                <option>JavaScript</option>
                <option>C++</option>
                <option>C#</option>
                <option>C</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleReset} title="Reset code">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy code">
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConsole(!showConsole)}
                title={showConsole ? "Hide console" : "Show console"}
              >
                {showConsole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-[#1a1d23] font-mono text-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-4 bg-[#1a1d23] text-[#c5cad3] font-mono text-sm resize-none focus:outline-none border-0"
                style={{ lineHeight: "1.6" }}
                spellCheck={false}
                placeholder="Nhập code của bạn ở đây..."
                disabled={!isMatchActive || timeLeft <= 0}
              />
            </div>
          </div>

          {/* Console Output */}
          {showConsole && (
            <div className="h-48 bg-[#0f1419] border-t border-border flex flex-col">
              <div className="flex items-center justify-between h-10 px-4 bg-card border-b border-border">
                <div className="flex gap-4">
                  <button
                    onClick={() => setConsoleTab("testcase")}
                    className={`text-xs font-medium transition-colors ${consoleTab === "testcase" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Testcase
                  </button>
                  <button
                    onClick={() => setConsoleTab("result")}
                    className={`text-xs font-medium transition-colors ${consoleTab === "result" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Test Result
                  </button>
                  {aiAnalysis && (
                    <button
                      onClick={() => setConsoleTab("analysis")}
                      className={`text-xs font-medium transition-colors flex items-center gap-1 ${consoleTab === "analysis" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                    >
                      <Brain className="w-3 h-3" />
                      AI Phân tích
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => {}} disabled>
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isMatchActive || timeLeft <= 0}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>

              {/* Console Content */}
              <div className="flex-1 overflow-y-auto font-mono text-xs">
                {consoleTab === "testcase" && currentTestCase && (
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-muted-foreground mb-2">Input:</p>
                      <div className="bg-input p-2 rounded text-foreground">{currentTestCase.input}</div>
                    </div>
                    {!currentTestCase.isHidden && (
                      <>
                        <div>
                          <p className="text-muted-foreground mb-2">Expected Output:</p>
                          <div className="bg-input p-2 rounded text-foreground">{currentTestCase.expectedOutput}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {consoleTab === "result" && testResults && (
                  <div className="p-4 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                      <div className={`w-2 h-2 rounded-full ${testResults.status === "Accepted" ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className={`font-medium ${testResults.status === "Accepted" ? "text-green-400" : "text-red-400"}`}>
                        {testResults.status}
                      </span>
                      <span className="text-muted-foreground">Runtime: {testResults.runtime}</span>
                      <span className="text-muted-foreground">Memory: {testResults.memory}</span>
                    </div>

                    {testResults.cases && testResults.cases.length > 0 && (
                      <>
                        <div>
                          <p className="text-muted-foreground mb-2">Results by Test Case:</p>
                          <div className="flex gap-2 flex-wrap">
                            {testResults.cases.map((tc: any, idx: number) => (
                              <button
                                key={tc.id || idx}
                                onClick={() => setSelectedTestCase(idx)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs transition-colors ${
                                  selectedTestCase === idx
                                    ? "bg-primary/20 border border-primary text-primary"
                                    : "bg-input border border-transparent text-foreground hover:bg-input/80"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${tc.status === "passed" ? "bg-green-500" : "bg-red-500"}`}></span>
                                <span>Case {tc.id || idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Test Case View */}
                        {selectedTestCaseData && (
                          <div className="space-y-3 pt-2">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Input</p>
                              <div className="bg-input p-2 rounded text-foreground break-all">
                                {selectedTestCaseData.input}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Output</p>
                              <div className="bg-input p-2 rounded text-foreground">
                                {selectedTestCaseData.output}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Expected</p>
                              <div className="bg-input p-2 rounded text-foreground">
                                {selectedTestCaseData.expected}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {consoleTab === "analysis" && aiAnalysis && (
                  <div className="p-4 overflow-y-auto">
                    <SubmissionAnalysis analysis={aiAnalysis} />
                  </div>
                )}

                {!testResults && consoleTab === "result" && (
                  <div className="p-4 text-muted-foreground text-xs">Chạy code hoặc nộp bài để xem kết quả</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}