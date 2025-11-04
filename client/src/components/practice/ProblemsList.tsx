"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
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

export function ProblemsList({ selectedId, onSelect }: ProblemsListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All")
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadProblems()
    loadSolvedProblems()
  }, [])

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
        // Lấy danh sách challenges đã giải
        const submissionsResponse = await fetch(buildApi('/submissions/user/all?status=Accepted&limit=1000'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const submissionsResult = await submissionsResponse.json()

        if (submissionsResult.success) {
          const solved = new Set(
            submissionsResult.data.submissions
              .map((s: any) => s.challenge?._id || s.challenge)
              .filter((id: any) => id)
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

  if (loading) {
    return (
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border space-y-3">
          <Skeleton className="h-9 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border space-y-3">
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

      <div className="flex-1 overflow-y-auto">
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
          filtered.map((problem) => {
            const isSolved = solvedIds.has(problem._id)
            return (
              <button
                key={problem._id}
                onClick={() => onSelect(problem._id)}
                className={`w-full px-4 py-3 text-left border-b border-sidebar-border transition-colors ${
                  selectedId === problem._id
                    ? "bg-sidebar-accent/20 border-l-2 border-l-primary"
                    : "hover:bg-sidebar-accent/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isSolved && (
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
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
          })
        )}
      </div>
    </div>
  )
}

