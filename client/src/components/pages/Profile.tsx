import React, { useEffect, useState } from 'react'
import { Award, Star, Clock, Code, Edit2, Save, X, Trophy, Zap, Target } from 'lucide-react'
import Header from '../Header'

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase()

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
  const [form, setForm] = useState<{ avatar: string, favoriteLanguages: string[] }>({ avatar: '', favoriteLanguages: [] })
  const [email, setEmail] = useState<string>('')
  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [avatarFileName, setAvatarFileName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUser(u)
        setForm({ avatar: u?.avatar || '', favoriteLanguages: u?.favoriteLanguages || [] })
        setEmail(u?.email || '')
        setPhone(u?.phone || '')
      } catch {
        setUser(null)
      }
    }
  }, [])

  // Refresh current user from server to pick up ban status changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.status === 403) {
          // Banned or forbidden
          const json = await res.json().catch(() => null)
          setError(json?.message || 'Tài khoản bị khóa')
          // Clear local token to prevent further API calls if desired
          // localStorage.removeItem('token')
          return
        }

        if (!res.ok) return
        const json = await res.json()
        if (json?.success && json.data?.user) {
          setUser(json.data.user)
          // update local storage so UI across app sees the change
          localStorage.setItem('user', JSON.stringify(json.data.user))
        }
      } catch (e) {
        console.error('Error fetching current user', e)
      }
    }
    fetchCurrentUser()
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
    // validate passwords
    if (newPassword || oldPassword || confirmPassword) {
      if (!oldPassword) {
        setError('Vui lòng nhập mật khẩu hiện tại')
        setSaving(false)
        return
      }
      if (!newPassword) {
        setError('Vui lòng nhập mật khẩu mới')
        setSaving(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Mật khẩu mới không khớp')
        setSaving(false)
        return
      }
    }
    try {
      const token = localStorage.getItem('token')
      const payload: any = { avatar: form.avatar }
      if (email) payload.email = email
      if (phone) payload.phone = phone
      if (form.favoriteLanguages) payload.favoriteLanguages = form.favoriteLanguages
      if (newPassword && oldPassword) {
        payload.oldPassword = oldPassword
        payload.newPassword = newPassword
      }

      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json?.success) {
        // Tạo object updated với dữ liệu mới từ server
        const updated = {
          ...user,
          ...json.data,
          favoriteLanguages: form.favoriteLanguages // Đảm bảo favoriteLanguages được cập nhật từ form
        }
        
        // Cập nhật state và localStorage
        setUser(updated)
        setForm({ 
          avatar: updated.avatar || '', 
          favoriteLanguages: form.favoriteLanguages 
        })
        setEmail(updated.email || '')
        setPhone(updated.phone || '')
        
        // Lưu vào localStorage và trigger event cho multi-tab sync
        localStorage.setItem('user', JSON.stringify(updated))
        window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(updated) }))
        
        // Reset form editing state
        setIsEditing(false)
        
        // Clear sensitive fields
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setAvatarFileName('')
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
    setForm({ avatar: user?.avatar || '', favoriteLanguages: user?.favoriteLanguages || [] })
    setIsEditing(false)
    setError('')
    setEmail(user?.email || '')
    setPhone(user?.phone || '')
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setAvatarFileName('')
  }

  const completionPercent = progress ? Math.min(100, Math.round(((progress.completed || 0) / Math.max(1, progress.total || 0)) * 100)) : 0
  const xpPercent = user?.experience ? Math.min(100, Math.round((user.experience / getXPForNextRank(user.rank || 'Newbie')) * 100)) : 0
  const rankInfo = getRankInfo(user?.rank || 'Newbie')

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center py-8 md:py-12 overflow-visible relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
        {user?.isBanned && (
          <div className="w-full max-w-4xl mx-auto p-4 mb-4 rounded border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200">
            <div className="font-semibold">
              Tài khoản của bạn đã bị khóa
            </div>
            {user.banReason && (
              <div className="text-sm mt-1">Lý do: {user.banReason}</div>
            )}
            <div className="text-sm mt-1">{user.bannedUntil ? `Khóa đến: ${new Date(user.bannedUntil).toLocaleString()}` : 'Khóa vĩnh viễn'}</div>
          </div>
        )}
        {/* Background decorations */}
        <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="container mx-auto px-4 relative z-20">
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
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
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

          <div className="bg-white/40 dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
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

          <div className="bg-white/40 dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
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

          <div className="bg-white/40 dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-700/50">
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
              <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh đại diện</label>
                    <div className="mt-1 flex flex-col items-center space-y-4">
                      {/* Preview circle */}
                      <div className="relative w-32 h-32 group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] rounded-full opacity-25 blur-lg group-hover:opacity-75 transition duration-200"></div>
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                          <img
                            src={form.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=7c3aed&color=fff`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Upload area */}
                      <div 
                        className="w-full max-w-md p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files[0]
                          if (file && file.type.startsWith('image/')) {
                            setAvatarFileName(file.name)
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = reader.result as string
                              setForm((s) => ({ ...s, avatar: result }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        onClick={() => document.getElementById('avatar-input')?.click()}
                      >
                        <input
                          id="avatar-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            setAvatarFileName(f.name)
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = reader.result as string
                              setForm((s) => ({ ...s, avatar: result }))
                            }
                            reader.readAsDataURL(f)
                          }}
                        />
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-primary-600 dark:text-primary-400">Chọn ảnh</span> hoặc kéo thả vào đây
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (tối đa 2MB)</p>
                          {avatarFileName && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-2">
                              Đã chọn: {avatarFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số điện thoại</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-medium text-gray-900 dark:text-white">Đổi mật khẩu</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Nhập mật khẩu mới"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-medium text-gray-900 dark:text-white">Ngôn ngữ yêu thích</h3>
                    <div className="flex flex-wrap gap-2">
                      {['JavaScript', 'Python', 'Java', 'C++', 'C#'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            const current = form.favoriteLanguages || []
                            if (current.includes(lang)) {
                              setForm(f => ({ ...f, favoriteLanguages: current.filter(l => l !== lang) }))
                            } else {
                              setForm(f => ({ ...f, favoriteLanguages: [...current, lang] }))
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            form.favoriteLanguages?.includes(lang)
                              ? 'bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Chọn các ngôn ngữ lập trình mà bạn yêu thích</p>
                  </div>
                </div>
                
                  <div className="flex gap-3 mt-6">
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
            ) : (
              <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
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
                    <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">Số điện thoại:</span>
                    <span className="text-gray-800 dark:text-white">{user?.phone || 'Chưa cập nhật'}</span>
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
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
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
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Code size={20} />
                Ngôn ngữ yêu thích
              </h2>
              {user?.favoriteLanguages?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.favoriteLanguages.map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white rounded-full text-sm font-medium"
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
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100/20 dark:border-gray-700/50">
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
    </>
  );
};

export default Profile;
