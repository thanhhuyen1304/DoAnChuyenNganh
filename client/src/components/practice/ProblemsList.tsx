"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { buildApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Problem {
  _id: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  language: string
  points: number
  isSolved?: boolean
}

interface ProblemsListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  refreshKey?: number
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "text-green-400"
    case "Medium":
      return "text-amber-400"
    case "Hard":
      return "text-red-400"
    default:
      return "text-muted-foreground"
  }
}

export function ProblemsList({ selectedId, onSelect, refreshKey }: ProblemsListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All")
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [submittedIds, setSubmittedIds] = useState<Map<string, boolean>>(new Map())
  const [displayCount, setDisplayCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProblems()
    loadSolvedProblems()
  }, [])

  // Reload danh sách khi refreshKey thay đổi (sau khi submit thành công)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      loadSolvedProblems()
    }
  }, [refreshKey])

  // Reset display count when filter or search changes
  useEffect(() => {
    setDisplayCount(10)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [filter, search])

  const loadProblems = async () => {
    try {
      setLoading(true)
      const apiUrl = buildApi('/challenges?limit=100')
      console.log('Fetching challenges from:', apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      
      if (result.success) {
        const challenges = result.data.challenges || []
        console.log(`Loaded ${challenges.length} challenges`)
        setProblems(challenges)
        
        if (challenges.length === 0) {
          console.warn('⚠️ No challenges found in database.')
          console.warn('💡 Run: cd server && npm run setup-db')
        }
      } else {
        console.error('❌ API Error:', result.message || 'Unknown error')
        setProblems([])
      }
    } catch (error: any) {
      console.error('❌ Error loading problems:', error)
      console.error('Error details:', error.message)
      setProblems([])
    } finally {
      setLoading(false)
    }
  }

  const loadSolvedProblems = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(buildApi('/submissions/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        // Lấy tất cả submissions (cả Accepted lẫn Rejected)
        const submissionsResponse = await fetch(buildApi('/submissions/user/all?limit=1000'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const submissionsResult = await submissionsResponse.json()

        if (submissionsResult.success) {
          const solvedMap = new Map<string, boolean>()
          
          submissionsResult.data.submissions.forEach((s: any) => {
            const challengeId = s.challenge?._id || s.challenge
            if (challengeId && typeof challengeId === 'string') {
              const isAccepted = s.status === 'Accepted'
              // Chỉ cập nhật nếu chưa có hoặc nếu bài này Accepted (ưu tiên trạng thái Accepted)
              if (!solvedMap.has(challengeId) || isAccepted) {
                solvedMap.set(challengeId, isAccepted)
              }
            }
          })
          
          setSubmittedIds(solvedMap)
          // Giữ lại solvedIds cho backward compatibility
          const solved = new Set<string>(
            Array.from(solvedMap.entries())
              .filter(([_, isAccepted]) => isAccepted)
              .map(([id, _]) => id)
          )
          setSolvedIds(solved)
        }
      }
    } catch (error) {
      console.error('Error loading solved problems:', error)
    }
  }

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "All" || p.difficulty === filter
    return matchesSearch && matchesFilter
  })

  const displayedProblems = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    // Check if user has scrolled near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    if (isNearBottom && !isLoadingMore && hasMore) {
      setIsLoadingMore(true)
      
      // Simulate loading delay for smooth UX
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 10, filtered.length))
        setIsLoadingMore(false)
      }, 300)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-white/95 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 flex-shrink-0">
          <Skeleton className="h-9 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-4 min-h-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white/95 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex flex-col max-h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 flex-shrink-0 bg-white/95 dark:bg-gray-900/80 z-10">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm bài tập..."
            className="pl-8 h-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
            <Button
              key={diff}
              variant={filter === diff ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(diff)}
              className={filter === diff ? "bg-primary text-primary-foreground" : ""}
            >
              {diff === "All" ? "Tất cả" : diff}
            </Button>
          ))}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth"
        onScroll={handleScroll}
        style={{ maxHeight: 'calc(100vh - 20rem)' }}
      >
        {filtered.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <div className="text-muted-foreground text-sm">
              {problems.length === 0 
                ? "Chưa có bài tập nào trong database" 
                : "Không tìm thấy bài tập nào phù hợp với bộ lọc"}
            </div>
            {problems.length === 0 && (
              <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded">
                <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
                <p>Chạy script setup database để tạo sample bài tập:</p>
                <code className="block mt-1 p-1 bg-background rounded text-xs">
                  cd server && npm run setup-db
                </code>
              </div>
            )}
          </div>
        ) : (
          <>
            {displayedProblems.map((problem) => {
              const isSolved = solvedIds.has(problem._id)
              return (
                <button
                  key={problem._id}
                  onClick={() => onSelect(problem._id)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-200 dark:border-gray-800 transition-colors ${
                    selectedId === problem._id
                      ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary"
                      : "hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {submittedIds.has(problem._id) && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            submittedIds.get(problem._id)
                              ? "bg-green-500/20" 
                              : "bg-red-500/20"
                          }`}>
                            <span className={`text-xs ${
                              submittedIds.get(problem._id)
                                ? "text-green-400"
                                : "text-red-400"
                            }`}>
                              {submittedIds.get(problem._id) ? "✓" : "✕"}
                            </span>
                          </div>
                        )}
                        <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {problem.points} XP
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate text-sidebar-foreground">
                        {problem.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{problem.language}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{problem.category}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Load more indicator */}
            {hasMore && (
              <div className="p-4 text-center border-b border-gray-200 dark:border-gray-800">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Đang tải thêm...</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">
                      Đang hiển thị {displayCount} / {filtered.length} bài tập
                    </p>
                    <p className="mt-1 opacity-70">
                      Cuộn xuống để xem thêm
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && filtered.length > 10 && (
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  ✓ Đã hiển thị tất cả {filtered.length} bài tập
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}