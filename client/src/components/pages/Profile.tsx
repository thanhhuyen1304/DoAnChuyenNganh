import React, { useEffect, useState } from 'react'
import { Award, Star, Clock, Code, Edit2, Save, X, Trophy, Zap, Target } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface ProgressData {
  completed: number
  total: number
  learningTimeMinutes: number
  rankingPercent: number
}

const rankConfig: Record<string, { color: string; gradient: string; icon: string }> = {
  Newbie: { color: 'text-gray-500', gradient: 'from-gray-400 to-gray-600', icon: '🌱' },
  Junior: { color: 'text-blue-500', gradient: 'from-blue-400 to-blue-600', icon: '⭐' },
  Intermediate: { color: 'text-purple-500', gradient: 'from-purple-400 to-purple-600', icon: '🔥' },
  Senior: { color: 'text-orange-500', gradient: 'from-orange-400 to-orange-600', icon: '💎' },
  Expert: { color: 'text-yellow-500', gradient: 'from-yellow-300 to-yellow-500', icon: '👑' },
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<any | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [form, setForm] = useState<{ username: string; avatar: string; favoriteLanguages: string[] }>({ username: '', avatar: '', favoriteLanguages: [] })

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUser(u)
        setForm({ username: u?.username || '', avatar: u?.avatar || '', favoriteLanguages: u?.favoriteLanguages || [] })
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        const res = await fetch(`${API_BASE_URL}/users/me/progress`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        // Kiểm tra response status
        if (!res.ok) {
          // Nếu không phải JSON, có thể là HTML error page
          setError(`Lỗi ${res.status}: ${res.statusText}`)
          setLoading(false)
          return
        }
        
        // Parse JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          setError(`Lỗi: Server trả về ${contentType || 'unknown'} thay vì JSON. ${text.substring(0, 100)}`)
          setLoading(false)
          return
        }
        
        let json
        try {
          json = await res.json()
        } catch (parseError) {
          const text = await res.text()
          setError(`Lỗi parse JSON. Response: ${text.substring(0, 100)}`)
          setLoading(false)
          return
        }
        
        if (json?.success) {
          setProgress(json.data)
        } else {
          setError(json?.message || 'Không lấy được tiến độ')
        }
      } catch (e: any) {
        setError(e?.message || 'Lỗi mạng khi tải tiến độ')
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  const getRankInfo = (rank: string) => rankConfig[rank] || rankConfig.Newbie

  const getXPForNextRank = (currentRank: string): number => {
    const rankLevels: Record<string, number> = {
      Newbie: 100,
      Junior: 500,
      Intermediate: 1500,
      Senior: 3000,
      Expert: 10000,
    }
    return rankLevels[currentRank] || 100
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: form.username, avatar: form.avatar, favoriteLanguages: form.favoriteLanguages })
      })
      const json = await res.json()
      if (json?.success) {
        const updated = { ...user, ...json.data }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
        setIsEditing(false)
        // Trigger storage event for multi-tab sync
        window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(updated) }))
      } else {
        setError(json?.message || 'Cập nhật thất bại')
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi mạng')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ username: user?.username || '', avatar: user?.avatar || '', favoriteLanguages: user?.favoriteLanguages || [] })
    setIsEditing(false)
    setError('')
  }

  const completionPercent = progress ? Math.min(100, Math.round(((progress.completed || 0) / Math.max(1, progress.total || 0)) * 100)) : 0
  const xpPercent = user?.experience ? Math.min(100, Math.round((user.experience / getXPForNextRank(user.rank || 'Newbie')) * 100)) : 0
  const rankInfo = getRankInfo(user?.rank || 'Newbie')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-3xl shadow-2xl mb-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl"></div>
                <img
                  src={(form.avatar && form.avatar.trim()) || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || user?.email || 'User')}&background=7c3aed&color=fff`}
                  alt="avatar"
                  className="relative w-32 h-32 rounded-full border-4 border-white/50 shadow-2xl"
                />
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="absolute top-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X size={18} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                    {user?.username || 'Người dùng'}
                  </h1>
                  {user?.loginMethod && user.loginMethod !== 'local' && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                      {user.loginMethod === 'google' && '🔵 Google'}
                      {user.loginMethod === 'github' && '⚫ GitHub'}
                      {user.loginMethod === 'facebook' && '🔵 Facebook'}
                    </span>
                  )}
                </div>
                <p className="text-white/90 mb-4">{user?.email}</p>
                
                {/* Rank Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="text-2xl">{rankInfo.icon}</span>
                  <span className={`font-bold text-white ${rankInfo.color.replace('text-', '')}`}>
                    {user?.rank || 'Newbie'}
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-medium transition-all hover:scale-105"
                >
                  <Edit2 size={18} />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bài đã hoàn thành</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{progress?.completed ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số bài</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{progress?.total ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian học</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{progress?.learningTimeMinutes ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">phút</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{user?.experience ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Edit2 size={20} />
                  Chỉnh sửa hồ sơ
                </h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tên người dùng
                    </label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Tên người dùng"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ảnh đại diện (URL)
                    </label>
                    <input
                      value={form.avatar}
                      onChange={(e) => setForm((s) => ({ ...s, avatar: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ngôn ngữ yêu thích (phân tách bằng dấu phẩy)
                    </label>
                    <input
                      value={form.favoriteLanguages.join(', ')}
                      onChange={(e) => setForm((s) => ({ ...s, favoriteLanguages: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Python, JavaScript, C++"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60"
                    >
                      <Save size={18} />
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Thông tin cá nhân</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">Tên người dùng:</span>
                    <span className="text-gray-800 dark:text-white">{user?.username || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">Email:</span>
                    <span className="text-gray-800 dark:text-white">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">Hạng:</span>
                    <span className={`font-bold ${getRankInfo(user?.rank || 'Newbie').color}`}>
                      {rankInfo.icon} {user?.rank || 'Newbie'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Section */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Tiến độ học tập</h2>
              
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải tiến độ...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <div className="space-y-6">
                  {/* Completion Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoàn thành bài tập</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
                      <div
                        className="h-4 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress?.completed || 0} / {progress?.total || 0} bài đã hoàn thành
                    </p>
                  </div>

                  {/* Experience Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience Points</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white">
                        {user?.experience || 0} / {getXPForNextRank(user?.rank || 'Newbie')} XP
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
                      <div
                        className={`h-4 bg-gradient-to-r ${rankInfo.gradient} transition-all duration-500`}
                        style={{ width: `${xpPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cần {getXPForNextRank(user?.rank || 'Newbie') - (user?.experience || 0)} XP để lên hạng tiếp theo
                    </p>
                  </div>

                  {/* Ranking */}
                  {progress?.rankingPercent && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Bạn đang ở top {100 - (progress.rankingPercent || 0)}% người dùng
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Favorite Languages */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Code size={20} />
                Ngôn ngữ yêu thích
              </h2>
              {user?.favoriteLanguages && user.favoriteLanguages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.favoriteLanguages.map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có ngôn ngữ yêu thích</p>
              )}
            </div>

            {/* Badges */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Award size={20} />
                Huy hiệu
              </h2>
              {user?.badges && user.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium"
                    >
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có huy hiệu nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile


