
"use client"

import { useState, useEffect } from "react"
import { Trophy, Star, Award, Target, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buildApi } from "@/lib/api"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
  xpReward: number
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (stats) {
      generateAchievements()
    }
  }, [stats])

  const loadStats = async () => {
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
        setStats(result.data)
      }

      // Load user info
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setStats((prev: any) => ({
          ...prev,
          experience: user.experience || 0,
          rank: user.rank || 'Newbie'
        }))
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAchievements = () => {
    if (!stats) return

    const userXP = stats.experience || 0
    const totalSubmissions = stats.total || 0
    const acceptedSubmissions = stats.accepted || 0
    const acceptanceRate = parseFloat(stats.acceptanceRate || '0')

    const allAchievements: Achievement[] = [
      {
        id: 'first_submission',
        title: 'Bước đầu',
        description: 'Nộp bài tập đầu tiên',
        icon: 'target',
        unlocked: totalSubmissions >= 1,
        progress: Math.min(totalSubmissions, 1),
        maxProgress: 1,
        xpReward: 10
      },
      {
        id: 'first_accept',
        title: 'Thành công đầu tiên',
        description: 'Giải đúng bài tập đầu tiên',
        icon: 'trophy',
        unlocked: acceptedSubmissions >= 1,
        progress: Math.min(acceptedSubmissions, 1),
        maxProgress: 1,
        xpReward: 25
      },
      {
        id: '10_accepted',
        title: 'Luyện tập chăm chỉ',
        description: 'Giải đúng 10 bài tập',
        icon: 'star',
        unlocked: acceptedSubmissions >= 10,
        progress: Math.min(acceptedSubmissions, 10),
        maxProgress: 10,
        xpReward: 50
      },
      {
        id: '50_accepted',
        title: 'Chuyên nghiệp',
        description: 'Giải đúng 50 bài tập',
        icon: 'award',
        unlocked: acceptedSubmissions >= 50,
        progress: Math.min(acceptedSubmissions, 50),
        maxProgress: 50,
        xpReward: 200
      },
      {
        id: '100_accepted',
        title: 'Bậc thầy',
        description: 'Giải đúng 100 bài tập',
        icon: 'trophy',
        unlocked: acceptedSubmissions >= 100,
        progress: Math.min(acceptedSubmissions, 100),
        maxProgress: 100,
        xpReward: 500
      },
      {
        id: 'perfect_rate',
        title: 'Hoàn hảo',
        description: 'Tỷ lệ đúng 100% với ít nhất 5 bài',
        icon: 'zap',
        unlocked: acceptanceRate >= 100 && acceptedSubmissions >= 5,
        progress: acceptanceRate,
        maxProgress: 100,
        xpReward: 100
      },
      {
        id: 'xp_100',
        title: 'Tích lũy kinh nghiệm',
        description: 'Đạt 100 XP',
        icon: 'star',
        unlocked: userXP >= 100,
        progress: Math.min(userXP, 100),
        maxProgress: 100,
        xpReward: 0
      },
      {
        id: 'xp_500',
        title: 'Chuyên gia',
        description: 'Đạt 500 XP',
        icon: 'award',
        unlocked: userXP >= 500,
        progress: Math.min(userXP, 500),
        maxProgress: 500,
        xpReward: 0
      },
      {
        id: 'xp_1000',
        title: 'Bậc thầy',
        description: 'Đạt 1000 XP',
        icon: 'trophy',
        unlocked: userXP >= 1000,
        progress: Math.min(userXP, 1000),
        maxProgress: 1000,
        xpReward: 0
      }
    ]

    setAchievements(allAchievements)
  }

  const getIcon = (iconName: string) => {
    const className = "w-6 h-6"
    switch (iconName) {
      case 'trophy':
        return <Trophy className={className} />
      case 'star':
        return <Star className={className} />
      case 'award':
        return <Award className={className} />
      case 'target':
        return <Target className={className} />
      case 'zap':
        return <Zap className={className} />
      default:
        return <Trophy className={className} />
    }
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Đang tải thành tựu...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thành tựu</h2>
        <p className="text-muted-foreground">
          Đã mở khóa {unlockedCount} / {achievements.length} thành tựu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`relative overflow-hidden transition-all ${
              achievement.unlocked
                ? 'border-primary bg-primary/5'
                : 'border-border opacity-60'
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    achievement.unlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {getIcon(achievement.icon)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  {achievement.unlocked && (
                    <Badge className="mt-1 bg-primary text-primary-foreground">Đã mở khóa</Badge>
                  )}
                </div>
              </div>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-medium">
                    {achievement.progress} / {achievement.maxProgress}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      achievement.unlocked ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                    style={{
                      width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`
                    }}
                  />
                </div>
                {achievement.xpReward > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Phần thưởng: {achievement.xpReward} XP
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  )
}
