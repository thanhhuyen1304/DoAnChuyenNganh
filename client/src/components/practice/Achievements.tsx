
"use client"

import { useState, useEffect } from "react"
import { Trophy, Star, Award, Target, Zap, Filter, ArrowUpDown, Users, Clock, Lightbulb, HeartHandshake } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  category: 'submission' | 'experience' | 'accuracy' | 'support' | 'teamwork' | 'creativity'
  difficulty: number
}

type SortOption = 'default' | 'difficulty' | 'progress' | 'xpReward'
type FilterOption = 'all' | 'unlocked' | 'locked' | 'submission' | 'experience' | 'accuracy' | 'support' | 'teamwork' | 'creativity'

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

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
      // Thành tựu Bài tập - Tập trung vào hoàn thành và học tập
      {
        id: 'first_submission',
        title: 'Khởi đầu hành trình',
        description: 'Hoàn thành bài tập đầu tiên - Mỗi chuyến đi ngàn dặm đều bắt đầu từ bước chân đầu tiên',
        icon: 'target',
        unlocked: totalSubmissions >= 1,
        progress: Math.min(totalSubmissions, 1),
        maxProgress: 1,
        xpReward: 10,
        category: 'submission',
        difficulty: 1
      },
      {
        id: 'first_accept',
        title: 'Chiến thắng đầu tiên',
        description: 'Hoàn thành thành công bài tập đầu tiên - Bạn đã làm được!',
        icon: 'trophy',
        unlocked: acceptedSubmissions >= 1,
        progress: Math.min(acceptedSubmissions, 1),
        maxProgress: 1,
        xpReward: 25,
        category: 'submission',
        difficulty: 2
      },
      {
        id: '10_accepted',
        title: 'Người học tập tích cực',
        description: 'Hoàn thành 10 bài tập - Sự kiên trì của bạn đang được đền đáp',
        icon: 'star',
        unlocked: acceptedSubmissions >= 10,
        progress: Math.min(acceptedSubmissions, 10),
        maxProgress: 10,
        xpReward: 50,
        category: 'submission',
        difficulty: 3
      },
      {
        id: '50_accepted',
        title: 'Người giải quyết vấn đề',
        description: 'Hoàn thành 50 bài tập - Kỹ năng của bạn đang phát triển mạnh mẽ',
        icon: 'lightbulb',
        unlocked: acceptedSubmissions >= 50,
        progress: Math.min(acceptedSubmissions, 50),
        maxProgress: 50,
        xpReward: 200,
        category: 'submission',
        difficulty: 5
      },
      {
        id: '100_accepted',
        title: 'Bậc thầy giải thuật',
        description: 'Hoàn thành 100 bài tập - Bạn đã đạt trình độ cao!',
        icon: 'trophy',
        unlocked: acceptedSubmissions >= 100,
        progress: Math.min(acceptedSubmissions, 100),
        maxProgress: 100,
        xpReward: 500,
        category: 'submission',
        difficulty: 8
      },
      
      // Thành tựu Độ chính xác - Tập trung vào chất lượng
      {
        id: 'perfect_rate',
        title: 'Người hoàn hảo',
        description: 'Đạt tỷ lệ hoàn thành 100% với ít nhất 5 bài - Chất lượng trên hết!',
        icon: 'zap',
        unlocked: acceptanceRate >= 100 && acceptedSubmissions >= 5,
        progress: acceptanceRate,
        maxProgress: 100,
        xpReward: 100,
        category: 'accuracy',
        difficulty: 7
      },
      {
        id: 'high_accuracy',
        title: 'Chính xác cao',
        description: 'Duy trì tỷ lệ chính xác trên 80% với ít nhất 20 bài',
        icon: 'target',
        unlocked: acceptanceRate >= 80 && acceptedSubmissions >= 20,
        progress: Math.min(acceptanceRate, 80),
        maxProgress: 80,
        xpReward: 150,
        category: 'accuracy',
        difficulty: 6
      },
      
      // Thành tựu Kinh nghiệm - Tích lũy và phát triển
      {
        id: 'xp_100',
        title: 'Người mới nổi',
        description: 'Đạt 100 XP - Bạn đang trên con đường phát triển',
        icon: 'star',
        unlocked: userXP >= 100,
        progress: Math.min(userXP, 100),
        maxProgress: 100,
        xpReward: 0,
        category: 'experience',
        difficulty: 3
      },
      {
        id: 'xp_500',
        title: 'Chuyên gia đang lên',
        description: 'Đạt 500 XP - Kỹ năng của bạn đã được công nhận',
        icon: 'award',
        unlocked: userXP >= 500,
        progress: Math.min(userXP, 500),
        maxProgress: 500,
        xpReward: 0,
        category: 'experience',
        difficulty: 6
      },
      {
        id: 'xp_1000',
        title: 'Bậc thầy lập trình',
        description: 'Đạt 1000 XP - Bạn là hình mẫu cho người khác',
        icon: 'trophy',
        unlocked: userXP >= 1000,
        progress: Math.min(userXP, 1000),
        maxProgress: 1000,
        xpReward: 0,
        category: 'experience',
        difficulty: 9
      },
      
      // Thành tựu Hỗ trợ - Giúp đỡ cộng đồng
      {
        id: 'helpful_member',
        title: 'Thành viên hữu ích',
        description: 'Đóng góp giải pháp hoặc gợi ý hữu ích cho cộng đồng',
        icon: 'hearthandshake',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        xpReward: 75,
        category: 'support',
        difficulty: 4
      },
      {
        id: 'mentor',
        title: 'Người cố vấn',
        description: 'Hỗ trợ và hướng dẫn người khác học tập',
        icon: 'users',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        xpReward: 200,
        category: 'support',
        difficulty: 7
      },
      
      // Thành tựu Thời gian tham gia
      {
        id: 'consistent_learner',
        title: 'Học viên kiên trì',
        description: 'Tham gia học tập liên tục trong 7 ngày',
        icon: 'clock',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
        xpReward: 100,
        category: 'teamwork',
        difficulty: 5
      },
      {
        id: 'dedicated_student',
        title: 'Học sinh tận tụy',
        description: 'Tham gia học tập liên tục trong 30 ngày',
        icon: 'clock',
        unlocked: false,
        progress: 0,
        maxProgress: 30,
        xpReward: 300,
        category: 'teamwork',
        difficulty: 8
      },
      
      // Thành tựu Sáng tạo
      {
        id: 'creative_solution',
        title: 'Giải pháp sáng tạo',
        description: 'Đề xuất giải pháp độc đáo và hiệu quả',
        icon: 'lightbulb',
        unlocked: false,
        progress: 0,
        maxProgress: 3,
        xpReward: 150,
        category: 'creativity',
        difficulty: 6
      },
      {
        id: 'innovator',
        title: 'Nhà đổi mới',
        description: 'Tạo ra nhiều giải pháp sáng tạo cho các thử thách khác nhau',
        icon: 'lightbulb',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        xpReward: 400,
        category: 'creativity',
        difficulty: 9
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
      case 'users':
        return <Users className={className} />
      case 'clock':
        return <Clock className={className} />
      case 'lightbulb':
        return <Lightbulb className={className} />
      case 'hearthandshake':
        return <HeartHandshake className={className} />
      default:
        return <Trophy className={className} />
    }
  }

  // Hàm sắp xếp thành tựu
  const getSortedAchievements = (achievements: Achievement[]): Achievement[] => {
    let sorted = [...achievements]
    
    switch (sortBy) {
      case 'difficulty':
        // Sắp xếp theo độ khó (cao xuống thấp), ưu tiên đã mở khóa
        sorted.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
          return b.difficulty - a.difficulty
        })
        break
      case 'progress':
        // Sắp xếp theo tiến độ (% hoàn thành cao xuống thấp)
        sorted.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
          const progressA = (a.progress / a.maxProgress) * 100
          const progressB = (b.progress / b.maxProgress) * 100
          return progressB - progressA
        })
        break
      case 'xpReward':
        // Sắp xếp theo phần thưởng XP (cao xuống thấp)
        sorted.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
          return b.xpReward - a.xpReward
        })
        break
      default:
        // Mặc định: đã mở khóa trước, sau đó theo difficulty
        sorted.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
          return b.difficulty - a.difficulty
        })
    }
    
    return sorted
  }

  // Hàm lọc thành tựu
  const getFilteredAchievements = (achievements: Achievement[]): Achievement[] => {
    switch (filterBy) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked)
      case 'locked':
        return achievements.filter(a => !a.unlocked)
      case 'submission':
        return achievements.filter(a => a.category === 'submission')
      case 'experience':
        return achievements.filter(a => a.category === 'experience')
      case 'accuracy':
        return achievements.filter(a => a.category === 'accuracy')
      case 'support':
        return achievements.filter(a => a.category === 'support')
      case 'teamwork':
        return achievements.filter(a => a.category === 'teamwork')
      case 'creativity':
        return achievements.filter(a => a.category === 'creativity')
      default:
        return achievements
    }
  }

  // Lấy danh sách thành tựu đã được sắp xếp và lọc
  const displayedAchievements = getSortedAchievements(getFilteredAchievements(achievements))
  const unlockedCount = achievements.filter(a => a.unlocked).length

  // Lấy badge màu theo category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'submission':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
      case 'experience':
        return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
      case 'accuracy':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
      case 'support':
        return 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
      case 'teamwork':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
      case 'creativity':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30'
    }
  }

  // Lấy tên hiển thị category
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'submission':
        return 'Bài tập'
      case 'experience':
        return 'Kinh nghiệm'
      case 'accuracy':
        return 'Độ chính xác'
      case 'support':
        return 'Hỗ trợ'
      case 'teamwork':
        return 'Đồng đội'
      case 'creativity':
        return 'Sáng tạo'
      default:
        return category
    }
  }

  // Lấy độ khó text
  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 3) return 'Dễ'
    if (difficulty <= 6) return 'Trung bình'
    return 'Khó'
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-green-500'
    if (difficulty <= 6) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Đang tải thành tựu...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen !bg-white dark:!bg-gray-900 border border-gray-100/20 dark:border-gray-700/50">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header với thống kê */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              Đã mở khóa {unlockedCount} / {achievements.length} thành tựu
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tiếp tục phấn đấu để mở khóa thêm nhiều thành tựu!
            </p>
          </div>
          
          {/* Thống kê nhanh */}
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Trophy className="w-3 h-3 mr-1" />
              {unlockedCount} đã đạt
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Target className="w-3 h-3 mr-1" />
              {achievements.length - unlockedCount} còn lại
            </Badge>
          </div>
        </div>

        {/* Thanh điều khiển - Sắp xếp và Lọc */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-border">
          {/* Sắp xếp */}
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Sắp xếp theo
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={sortBy === 'default' ? 'default' : 'outline'}
                onClick={() => setSortBy('default')}
                className="text-xs transition-all"
              >
                Mặc định
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'difficulty' ? 'default' : 'outline'}
                onClick={() => setSortBy('difficulty')}
                className="text-xs transition-all"
              >
                Độ khó
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'progress' ? 'default' : 'outline'}
                onClick={() => setSortBy('progress')}
                className="text-xs transition-all"
              >
                Tiến độ
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'xpReward' ? 'default' : 'outline'}
                onClick={() => setSortBy('xpReward')}
                className="text-xs transition-all"
              >
                Phần thưởng
              </Button>
            </div>
          </div>

          {/* Lọc */}
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Lọc theo
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filterBy === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterBy('all')}
                className="text-xs transition-all"
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'unlocked' ? 'default' : 'outline'}
                onClick={() => setFilterBy('unlocked')}
                className="text-xs transition-all"
              >
                Đã mở
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'locked' ? 'default' : 'outline'}
                onClick={() => setFilterBy('locked')}
                className="text-xs transition-all"
              >
                Chưa mở
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'submission' ? 'default' : 'outline'}
                onClick={() => setFilterBy('submission')}
                className="text-xs transition-all"
              >
                Bài tập
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'experience' ? 'default' : 'outline'}
                onClick={() => setFilterBy('experience')}
                className="text-xs transition-all"
              >
                Kinh nghiệm
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'accuracy' ? 'default' : 'outline'}
                onClick={() => setFilterBy('accuracy')}
                className="text-xs transition-all"
              >
                Độ chính xác
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'support' ? 'default' : 'outline'}
                onClick={() => setFilterBy('support')}
                className="text-xs transition-all"
              >
                Hỗ trợ
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'teamwork' ? 'default' : 'outline'}
                onClick={() => setFilterBy('teamwork')}
                className="text-xs transition-all"
              >
                Đồng đội
              </Button>
              <Button
                size="sm"
                variant={filterBy === 'creativity' ? 'default' : 'outline'}
                onClick={() => setFilterBy('creativity')}
                className="text-xs transition-all"
              >
                Sáng tạo
              </Button>
            </div>
          </div>
        </div>

        {/* Grid thành tựu với animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAchievements.map((achievement, index) => (
            <Card
              key={achievement.id}
              className={`relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-lg ${
                achievement.unlocked
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-md'
                  : 'border-border opacity-70 hover:opacity-90'
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards'
              }}
            >
              {/* Badge góc trên phải */}
              {achievement.unlocked && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-0.5 shadow-lg animate-pulse">
                    <Trophy className="w-3 h-3 mr-1 inline" />
                    Đạt được
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-primary/30 to-primary/20 text-primary shadow-lg scale-110'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getIcon(achievement.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg mb-1 line-clamp-1">
                      {achievement.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getCategoryColor(achievement.category)}`}
                      >
                        {getCategoryName(achievement.category)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getDifficultyColor(achievement.difficulty)}`}
                      >
                        {getDifficultyText(achievement.difficulty)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-xs mt-2 line-clamp-2">
                  {achievement.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">Tiến độ</span>
                      <span className="font-semibold">
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          achievement.unlocked
                            ? 'bg-gradient-to-r from-primary via-primary/80 to-primary'
                            : 'bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30'
                        }`}
                        style={{
                          width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Phần thưởng và độ khó */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    {achievement.xpReward > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Không có XP</div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < achievement.difficulty
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Không có kết quả */}
        {displayedAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Không tìm thấy thành tựu nào
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Thử thay đổi bộ lọc hoặc tiếp tục làm bài tập để mở khóa thành tựu mới!
            </p>
          </div>
        )}
      </div>

      {/* CSS cho animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  )
}