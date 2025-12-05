"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Lightbulb,
  Share2,
  MessageCircle,
  Heart,
  Search,
  Filter,
  Plus,
  Eye,
  MessageSquare,
  X,
  Clock,
  HardDrive,
  ThumbsUp,
  Lock,
  Unlock,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { buildApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { CommentSection } from "./CommentSection"
// Date formatting helper - không dùng date-fns để tránh dependency
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return 'Không xác định'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Kiểm tra xem date có hợp lệ không
  if (isNaN(d.getTime())) {
    return 'Không xác định'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  
  // Nếu thời gian trong tương lai (có thể do timezone issues), hiển thị date trực tiếp
  if (diffMs < 0) {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  
  // Hiển thị date với format đầy đủ hơn
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface ProblemDetailProps {
  problemId: string | null
  onSubmissionSuccess?: () => void
}

function NotesModal({
  isOpen,
  onClose,
  onSave,
}: { isOpen: boolean; onClose: () => void; onSave: (note: string, color: string) => void }) {
  const [note, setNote] = useState("")
  const [selectedColor, setSelectedColor] = useState("checked")

  const colors = [
    { id: "checked", label: "checkmark", icon: "✓" },
    { id: "gold", label: "gold", icon: "●" },
    { id: "blue", label: "blue", icon: "●" },
    { id: "green", label: "green", icon: "●" },
    { id: "pink", label: "pink", icon: "●" },
    { id: "purple", label: "purple", icon: "●" },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Ghi chú</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Viết ghi chú của bạn..."
            className="w-full h-32 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                  selectedColor === color.id ? "ring-2 ring-primary scale-110" : ""
                } ${
                  color.id === "checked"
                    ? "bg-muted text-muted-foreground"
                    : color.id === "gold"
                      ? "bg-amber-500"
                      : color.id === "blue"
                        ? "bg-blue-500"
                        : color.id === "green"
                          ? "bg-green-500"
                          : color.id === "pink"
                            ? "bg-pink-500"
                            : "bg-purple-500"
                }`}
                title={color.label}
              >
                {color.id === "checked" ? "✓" : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(note, selectedColor)
              setNote("")
              setSelectedColor("checked")
              onClose()
            }}
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProblemDetail({ problemId, onSubmissionSuccess }: ProblemDetailProps) {
  const [activeTab, setActiveTab] = useState<"description" | "editorial" | "solutions" | "submissions">("description")
  const [expandedHints, setExpandedHints] = useState<number | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("All")
  const [languageFilter, setLanguageFilter] = useState("All")
  const [problem, setProblem] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [solutions, setSolutions] = useState<any[]>([])
  const [userTokens, setUserTokens] = useState(0)
  const [loadingSolutions, setLoadingSolutions] = useState(false)
  const [unlockingSolution, setUnlockingSolution] = useState<number | null>(null)
  const [selectedSolution, setSelectedSolution] = useState<any>(null)

  useEffect(() => {
    if (problemId) {
      loadProblem()
      loadSubmissions()
    } else {
      setProblem(null)
      setSubmissions([])
    }
  }, [problemId])

  useEffect(() => {
    if (activeTab === "submissions" && problemId) {
      loadSubmissions()
    }
    if (activeTab === "solutions" && problemId) {
      loadSolutions()
    }
  }, [activeTab, problemId])

  useEffect(() => {
    if (onSubmissionSuccess) {
      onSubmissionSuccess()
    }
    loadSubmissions()
  }, [problemId])

  const loadProblem = async () => {
    if (!problemId) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(buildApi(`/challenges/${problemId}`), {
        headers
      })
      const result = await response.json()

      if (result.success) {
        setProblem(result.data)
      }
    } catch (error) {
      console.error('Error loading problem:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    if (!problemId) return
    try {
      setSubmissionsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(buildApi(`/submissions/challenge/${problemId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        setSubmissions(result.data.submissions || [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const loadSolutions = async () => {
    if (!problemId) return
    try {
      setLoadingSolutions(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(buildApi(`/challenges/${problemId}/solutions`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        setSolutions(result.data.solutions || [])
        setUserTokens(result.data.userTokens || 0)
      }
    } catch (error) {
      console.error('Error loading solutions:', error)
    } finally {
      setLoadingSolutions(false)
    }
  }

  const handleUnlockSolution = async (solutionIndex: number) => {
    try {
      setUnlockingSolution(solutionIndex)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(
        buildApi(`/challenges/${problemId}/solutions/${solutionIndex}/unlock`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const result = await response.json()

      if (result.success) {
        // Reload solutions để cập nhật trạng thái
        await loadSolutions()
        // Hiển thị solution đã unlock
        setSelectedSolution(result.data.solution)
        alert(`Đã mở khóa lời giải! Còn lại ${result.data.remainingTokens} token`)
      } else {
        alert(result.message || 'Không thể mở khóa lời giải')
      }
    } catch (error: any) {
      console.error('Error unlocking solution:', error)
      alert('Lỗi khi mở khóa lời giải')
    } finally {
      setUnlockingSolution(null)
    }
  }

  const loadSolutionDetail = async (solutionIndex: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(
        buildApi(`/challenges/${problemId}/solutions/${solutionIndex}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      const result = await response.json()

      if (result.success) {
        setSelectedSolution(result.data)
      }
    } catch (error) {
      console.error('Error loading solution detail:', error)
    }
  }

  const tabs = [
    { id: "description", label: "Mô tả" },
    { id: "editorial", label: "Bình luận" },
    { id: "solutions", label: "Lời giải" },
    { id: "submissions", label: `Lịch sử nộp bài (${submissions.length})` },
  ]

  const filteredSubmissions = submissions.filter((sub) => {
    const statusMatch = statusFilter === "All" || sub.status === statusFilter
    const languageMatch = languageFilter === "All" || sub.language === languageFilter
    return statusMatch && languageMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "text-green-400"
      case "Wrong Answer":
        return "text-red-400"
      case "Time Limit Exceeded":
        return "text-yellow-400"
      case "Memory Limit Exceeded":
        return "text-orange-400"
      case "Runtime Error":
        return "text-red-400"
      case "Compilation Error":
        return "text-purple-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-500"
      case "Wrong Answer":
        return "bg-red-500"
      case "Time Limit Exceeded":
        return "bg-yellow-500"
      case "Memory Limit Exceeded":
        return "bg-orange-500"
      case "Runtime Error":
        return "bg-red-500"
      case "Compilation Error":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto border-b border-border bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex-1 overflow-y-auto border-b border-border bg-background">
        <div className="max-w-4xl mx-auto p-6 text-center text-muted-foreground">
          Chọn một bài tập để xem chi tiết
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto border-b border-border bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header with title and stats */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{problem.title}</h2>
                  <Badge
                    className={`${
                      problem.difficulty === "Easy"
                        ? "bg-green-500/20 text-green-400"
                        : problem.difficulty === "Medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {problem.difficulty}
                  </Badge>
                  <Badge variant="outline">{problem.points} XP</Badge>
                </div>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>
                    Ngôn ngữ: <span className="text-foreground font-medium">{problem.language}</span>
                  </span>
                  <span>
                    Loại: <span className="text-foreground font-medium">{problem.category}</span>
                  </span>
                  <span>
                    Test Cases: <span className="text-foreground font-medium">{problem.testCases?.length || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-b-primary text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === "description" && (
            <>
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Mô tả</h3>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{problem.description || problem.problemStatement}</p>
              </div>

              {/* Problem Statement */}
              {problem.problemStatement && problem.problemStatement !== problem.description && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Đề bài</h3>
                  <p className="text-foreground whitespace-pre-line leading-relaxed">{problem.problemStatement}</p>
                </div>
              )}

              {/* Test Cases */}
              {problem.testCases && problem.testCases.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Test Cases</h3>
                  <div className="space-y-3">
                    {problem.testCases.map((tc: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4 font-mono text-sm space-y-2">
                        <div>
                          <span className="text-primary font-medium">Input:</span>
                          <div className="mt-1 ml-4 text-foreground whitespace-pre-wrap">{tc.input}</div>
                        </div>
                        {!tc.isHidden && (
                          <div>
                            <span className="text-accent font-medium">Expected Output:</span>
                            <div className="mt-1 ml-4 text-foreground whitespace-pre-wrap">{tc.expectedOutput}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="bg-input border-border">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "editorial" && problemId &&(
            <CommentSection challengeId={problemId} />
          )}

          {activeTab === "solutions" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Lời giải</h3>
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Tokens của bạn:</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    {userTokens}
                  </Badge>
                </div>
              </div>

              {/* Loading State */}
              {loadingSolutions ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Đang tải lời giải...</p>
                </div>
              ) : solutions.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Chưa có lời giải cho bài này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {solutions.map((solution, index) => (
                    <div
                      key={index}
                      className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-foreground">{solution.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {solution.language}
                            </Badge>
                          </div>
                          
                          {solution.isUnlocked ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-green-500">
                                <Unlock className="w-4 h-4" />
                                <span>Đã mở khóa</span>
                              </div>
                              
                              {selectedSolution && selectedSolution.title === solution.title ? (
                                <div className="mt-4 space-y-4">
                                  <div>
                                    <h5 className="font-medium text-foreground mb-2">Giải thích:</h5>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                      {selectedSolution.explanation}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-foreground mb-2">Code mẫu:</h5>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                      <code>{selectedSolution.code}</code>
                                    </pre>
                                  </div>
                                  
                                  {selectedSolution.content && (
                                    <div>
                                      <h5 className="font-medium text-foreground mb-2">Chi tiết:</h5>
                                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                                        {selectedSolution.content}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadSolutionDetail(index)}
                                  className="mt-2"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xem chi tiết
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                <span>Cần {solution.tokenCost} token để mở khóa</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleUnlockSolution(index)}
                                disabled={userTokens < solution.tokenCost || unlockingSolution === index}
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                              >
                                {unlockingSolution === index ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang mở khóa...
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Mở khóa ({solution.tokenCost} 🪙)
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thông tin */}
              {solutions.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Mẹo:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Hoàn thành bài tập để nhận token</li>
                        <li>Sử dụng token để mở khóa lời giải khi gặp khó khăn</li>
                        <li>Mỗi lời giải chỉ cần mở khóa 1 lần</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Tất cả</option>
                    <option>Accepted</option>
                    <option>Wrong Answer</option>
                    <option>Time Limit Exceeded</option>
                    <option>Memory Limit Exceeded</option>
                    <option>Runtime Error</option>
                    <option>Compilation Error</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ngôn ngữ:</span>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="px-3 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Tất cả</option>
                    <option>Java</option>
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>C++</option>
                    <option>C#</option>
                    <option>C</option>
                  </select>
                </div>
              </div>

              {/* Submissions Table */}
              {submissionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Chưa có bài nộp nào
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2 font-semibold text-foreground">#</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground">Trạng thái</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground">Ngôn ngữ</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground">Thời gian</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground">Điểm</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground">Thời gian nộp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission, idx) => (
                        <tr key={submission._id} className="border-b border-border hover:bg-card/50 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">
                            {filteredSubmissions.length - idx}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium flex items-center gap-2 ${getStatusColor(submission.status)}`}>
                              <span className={`w-2 h-2 rounded-full ${getStatusBg(submission.status)}`}></span>
                              {submission.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground">{submission.language}</td>
                          <td className="px-4 py-3 text-foreground">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {submission.executionTime && submission.executionTime > 0
                                    ? `${submission.executionTime.toFixed(0)} ms`
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <HardDrive className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {submission.memoryUsed && submission.memoryUsed > 0
                                    ? `${(submission.memoryUsed / 1024).toFixed(2)} MB`
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {submission.score} / {submission.totalPoints}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(submission.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        onSave={(note, color) => {
          // TODO: Lưu note vào backend
          console.log('Save note:', note, color)
        }}
      />
    </div>
  )
}