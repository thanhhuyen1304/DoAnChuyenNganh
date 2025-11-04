"use client"

import { useState, useEffect } from "react"
import { Play, RotateCcw, Send, Settings2, Copy, Maximize2, Minimize2, Eye, EyeOff, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildApi } from "@/lib/api"
import { useToast } from "@/components/hooks/use-toast"
import { SubmissionAnalysis } from "./SubmissionAnalysis"

interface CodeEditorProps {
  problemId: string
  challenge: any
  onSubmissionSuccess?: (submission: any, xpEarned: number) => void
}

export function CodeEditor({ problemId, challenge, onSubmissionSuccess }: CodeEditorProps) {
  const { toast } = useToast()
  
  if (!challenge || !problemId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chọn một bài tập để bắt đầu lập trình</p>
      </div>
    )
  }
  const [code, setCode] = useState(challenge?.buggyCode || "")
  const [language, setLanguage] = useState(challenge?.language || "Java")
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result" | "analysis">("result")
  const [testResults, setTestResults] = useState<any | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showConsole, setShowConsole] = useState(true)
  const [selectedTestCase, setSelectedTestCase] = useState(0)

  useEffect(() => {
    if (challenge?.buggyCode) {
      setCode(challenge.buggyCode)
      setLanguage(challenge.language)
    }
  }, [challenge])

  const handleRun = async () => {
    setIsRunning(true)
    setConsoleTab("result")
    // TODO: Tích hợp Judge0 API để chạy code thực tế
    // Hiện tại chỉ mock
    setTimeout(() => {
      setTestResults({
        status: "Accepted",
        runtime: "0 ms",
        memory: "42.1 MB",
        cases: challenge?.testCases?.map((tc: any, idx: number) => ({
          id: idx + 1,
          input: tc.input,
          output: tc.expectedOutput,
          expected: tc.expectedOutput,
          status: "passed",
        })) || [],
      })
      setIsRunning(false)
    }, 1200)
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

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Lỗi",
          description: "Vui lòng đăng nhập để nộp bài",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(buildApi('/submissions/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: challenge._id,
          code,
          language
        })
      })

      const result = await response.json()

      if (result.success) {
        const submission = result.data.submission
        const xpEarned = result.data.xpEarned || 0
        
        // Cập nhật test results với kết quả thực tế
        setTestResults({
          status: submission.status,
          runtime: `${submission.executionTime} ms`,
          memory: `${(submission.memoryUsed / 1024).toFixed(2)} MB`,
          cases: submission.executionResults.map((er: any, idx: number) => ({
            id: idx + 1,
            input: er.input,
            output: er.actualOutput,
            expected: er.expectedOutput,
            status: er.passed ? "passed" : "failed",
          }))
        })

        // Lưu AI analysis nếu có
        if (submission.aiAnalysis) {
          setAiAnalysis(submission.aiAnalysis)
          // Tự động chuyển sang tab analysis nếu có lỗi
          if (submission.aiAnalysis.overallStatus !== 'correct') {
            setConsoleTab("analysis")
          } else {
            setConsoleTab("result")
          }
        } else {
          setConsoleTab("result")
        }

        if (xpEarned > 0) {
          toast({
            title: "Thành công!",
            description: `Bạn đã nhận được ${xpEarned} XP! Tổng XP: ${result.data.newXP}`,
          })
        } else {
          toast({
            title: submission.status === "Accepted" ? "Đã nộp bài" : "Chưa đúng",
            description: submission.status === "Accepted" ? "Bài làm của bạn đã được lưu" : "Vui lòng kiểm tra lại code",
            variant: submission.status === "Accepted" ? "default" : "destructive"
          })
        }

        if (onSubmissionSuccess) {
          onSubmissionSuccess(submission, xpEarned)
        }

        // Cập nhật user info trong localStorage
        if (result.data.newXP !== undefined) {
          const userData = localStorage.getItem('user')
          if (userData) {
            const user = JSON.parse(userData)
            user.experience = result.data.newXP
            user.rank = result.data.newRank
            localStorage.setItem('user', JSON.stringify(user))
          }
        }
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Có lỗi xảy ra khi nộp bài",
          variant: "destructive"
        })
      }
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
    if (challenge?.buggyCode) {
      setCode(challenge.buggyCode)
    }
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

  return (
    <div className={`flex-1 flex flex-col bg-background overflow-hidden ${isFullScreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Editor Header with Panel Controls */}
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
          <span className="text-xs text-muted-foreground">Auto</span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} title="Reset code">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy code">
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConsole(!showConsole)}
            title={showConsole ? "Hide console" : "Show console"}
          >
            {showConsole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" title="Settings">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor */}
        <div className="flex-1 bg-[#1a1d23] font-mono text-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 bg-[#1a1d23] text-[#c5cad3] font-mono text-sm resize-none focus:outline-none border-0"
              style={{ lineHeight: "1.6" }}
              spellCheck="false"
              placeholder="Nhập code của bạn ở đây..."
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
                <Button size="sm" variant="ghost" onClick={handleRun} disabled={isRunning}>
                  <Play className="w-3 h-3 mr-1" />
                  {isRunning ? "Running..." : "Run"}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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
  )
}

