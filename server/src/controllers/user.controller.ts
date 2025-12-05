import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Submission from '../models/submission.model'
import Challenge from '../models/challenge.model'
import User from '../models/user.model'
import { LanguagePreference } from '../models/languagePreference.model'
import bcrypt from 'bcryptjs'

// GET /api/users/me/progress
export const getMyProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' })
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Total active challenges
    const totalChallenges = await Challenge.countDocuments({ isActive: true })

    // Completed challenges: distinct challenge IDs where user has Accepted submissions
    const completedDistinct = await Submission.distinct('challenge', { user: userObjectId, status: 'Accepted' })
    const completedCount = Array.isArray(completedDistinct) ? completedDistinct.length : 0

    // Learning time: Calculate actual time spent on submissions
    // Get all submissions sorted by time to calculate time gaps
    const allSubmissions = await Submission.find({ user: userObjectId })
      .select('submittedAt')
      .sort({ submittedAt: 1 })
      .lean()
    
    let learningTimeMinutes = 0
    
    if (allSubmissions.length > 0) {
      // Group submissions by day and calculate learning time per session
      // A session is defined as submissions within 30 minutes of each other
      const MAX_SESSION_GAP_MS = 30 * 60 * 1000 // 30 minutes
      const MAX_SESSION_DURATION_MS = 3 * 60 * 60 * 1000 // 3 hours max per session
      
      let sessionStartTime: Date | null = null
      let lastSubmissionTime: Date | null = null
      let totalLearningTimeMs = 0
      
      for (const submission of allSubmissions) {
        const currentTime = new Date(submission.submittedAt)
        
        if (!lastSubmissionTime) {
          // First submission - start new session
          sessionStartTime = currentTime
          lastSubmissionTime = currentTime
        } else {
          const timeSinceLastSubmission = currentTime.getTime() - lastSubmissionTime.getTime()
          
          if (timeSinceLastSubmission > MAX_SESSION_GAP_MS) {
            // Gap is too large - end previous session and start new one
            if (sessionStartTime) {
              const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
              // Cap session duration at maximum
              totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
            }
            sessionStartTime = currentTime
          }
          
          lastSubmissionTime = currentTime
        }
      }
      
      // Add the last session
      if (sessionStartTime && lastSubmissionTime) {
        const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
        totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
      }
      
      learningTimeMinutes = Math.round(totalLearningTimeMs / 60000)
    }

    // Ranking: compute completedCount per user and derive percentile
    const perUser = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', challenge: '$challenge' } } },
      { $group: { _id: '$_id.user', completedCount: { $sum: 1 } } }
    ])

    const totalUsersWithCompletions = perUser.length
    const currentUserEntry = perUser.find((p: any) => p._id.toString() === userId)
    const currentCompleted = currentUserEntry ? currentUserEntry.completedCount : 0
    const higherCount = perUser.filter((p: any) => p.completedCount > currentCompleted).length
    const rankingPercent = totalUsersWithCompletions === 0 ? 100 : Math.max(1, Math.round(((totalUsersWithCompletions - higherCount) / Math.max(1, totalUsersWithCompletions)) * 100))

    return res.json({
      success: true,
      data: {
        completed: currentCompleted,
        total: totalChallenges,
        learningTimeMinutes,
        rankingPercent
      }
    })
  } catch (err) {
    console.error('getMyProgress error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// GET /api/users/:username/progress  (public)
export const getProgressByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params
    if (!username) return res.status(400).json({ success: false, message: 'Username is required' })

    // find user by username (case-insensitive)
    const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const userId = (user._id as any).toString()
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Total active challenges
    const totalChallenges = await Challenge.countDocuments({ isActive: true })

    // Completed challenges
    const completedDistinct = await Submission.distinct('challenge', { user: userObjectId, status: 'Accepted' })
    const completedCount = Array.isArray(completedDistinct) ? completedDistinct.length : 0

    // Learning time: Calculate actual time spent on submissions
    const allSubmissions = await Submission.find({ user: userObjectId })
      .select('submittedAt')
      .sort({ submittedAt: 1 })
      .lean()
    
    let learningTimeMinutes = 0
    
    if (allSubmissions.length > 0) {
      const MAX_SESSION_GAP_MS = 30 * 60 * 1000 // 30 minutes
      const MAX_SESSION_DURATION_MS = 3 * 60 * 60 * 1000 // 3 hours max per session
      
      let sessionStartTime: Date | null = null
      let lastSubmissionTime: Date | null = null
      let totalLearningTimeMs = 0
      
      for (const submission of allSubmissions) {
        const currentTime = new Date(submission.submittedAt)
        
        if (!lastSubmissionTime) {
          sessionStartTime = currentTime
          lastSubmissionTime = currentTime
        } else {
          const timeSinceLastSubmission = currentTime.getTime() - lastSubmissionTime.getTime()
          
          if (timeSinceLastSubmission > MAX_SESSION_GAP_MS) {
            if (sessionStartTime) {
              const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
              totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
            }
            sessionStartTime = currentTime
          }
          
          lastSubmissionTime = currentTime
        }
      }
      
      if (sessionStartTime && lastSubmissionTime) {
        const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
        totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
      }
      
      learningTimeMinutes = Math.round(totalLearningTimeMs / 60000)
    }

    // Ranking percentile (based on completed counts)
    const perUser = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', challenge: '$challenge' } } },
      { $group: { _id: '$_id.user', completedCount: { $sum: 1 } } }
    ])

    const totalUsersWithCompletions = perUser.length
    const currentUserEntry = perUser.find((p: any) => p._1.d && p._id.toString() === userId)
    const currentCompleted = currentUserEntry ? currentUserEntry.completedCount : 0
    const higherCount = perUser.filter((p: any) => p.completedCount > currentCompleted).length
    const rankingPercent = totalUsersWithCompletions === 0 ? 100 : Math.max(1, Math.round(((totalUsersWithCompletions - higherCount) / Math.max(1, totalUsersWithCompletions)) * 100))

    return res.json({
      success: true,
      data: {
        username: user.username,
        completed: currentCompleted,
        total: totalChallenges,
        learningTimeMinutes,
        rankingPercent
      }
    })
  } catch (err) {
    console.error('getProgressByUsername error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// GET /api/users/me/completed-challenges
export const getMyCompletedChallenges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' })
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Get distinct challenge IDs where user has Accepted submissions
    const completedChallengeIds = await Submission.distinct('challenge', {
      user: userObjectId,
      status: 'Accepted'
    })

    // Convert ObjectIds to strings
    const challengeIds = completedChallengeIds.map((id: any) => id.toString())

    return res.json({
      success: true,
      completedChallenges: challengeIds
    })
  } catch (error: any) {
    console.error('Error getting completed challenges:', error)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// GET /api/users/me/today-stats
export const getTodayStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' })
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Get start and end of today in UTC+7 (Asia/Saigon timezone)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    // Adjust for UTC+7 timezone
    todayStart.setHours(todayStart.getHours() - 7)
    
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    todayEnd.setHours(todayEnd.getHours() - 7)

    // Get all submissions today
    const todaySubmissions = await Submission.find({
      user: userObjectId,
      submittedAt: { $gte: todayStart, $lte: todayEnd }
    }).populate('challenge', 'title difficulty')

    // Count completed challenges today (distinct challenges with Accepted status)
    const completedToday = await Submission.distinct('challenge', {
      user: userObjectId,
      status: 'Accepted',
      submittedAt: { $gte: todayStart, $lte: todayEnd }
    })

    // Calculate total learning time today (based on submission times, not execution times)
    const todaySubmissionsForTime = await Submission.find({
      user: userObjectId,
      submittedAt: { $gte: todayStart, $lte: todayEnd }
    })
      .select('submittedAt')
      .sort({ submittedAt: 1 })
      .lean()
    
    let learningTimeMinutes = 0
    
    if (todaySubmissionsForTime.length > 0) {
      const MAX_SESSION_GAP_MS = 30 * 60 * 1000 // 30 minutes
      const MAX_SESSION_DURATION_MS = 3 * 60 * 60 * 1000 // 3 hours max per session
      
      let sessionStartTime: Date | null = null
      let lastSubmissionTime: Date | null = null
      let totalLearningTimeMs = 0
      
      for (const submission of todaySubmissionsForTime) {
        const currentTime = new Date(submission.submittedAt)
        
        if (!lastSubmissionTime) {
          sessionStartTime = currentTime
          lastSubmissionTime = currentTime
        } else {
          const timeSinceLastSubmission = currentTime.getTime() - lastSubmissionTime.getTime()
          
          if (timeSinceLastSubmission > MAX_SESSION_GAP_MS) {
            if (sessionStartTime) {
              const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
              totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
            }
            sessionStartTime = currentTime
          }
          
          lastSubmissionTime = currentTime
        }
      }
      
      if (sessionStartTime && lastSubmissionTime) {
        const sessionDuration = lastSubmissionTime.getTime() - sessionStartTime.getTime()
        totalLearningTimeMs += Math.min(sessionDuration, MAX_SESSION_DURATION_MS)
      }
      
      learningTimeMinutes = Math.round(totalLearningTimeMs / 60000)
    }

    // Get list of challenges attempted today with their status
    const challengesAttempted = todaySubmissions.reduce((acc: any[], sub: any) => {
      const challengeId = sub.challenge._id.toString()
      if (!acc.find((c: any) => c.id === challengeId)) {
        acc.push({
          id: challengeId,
          title: sub.challenge.title,
          difficulty: sub.challenge.difficulty,
          completed: completedToday.some((c: any) => c.toString() === challengeId),
          attempts: todaySubmissions.filter((s: any) => s.challenge._id.toString() === challengeId).length,
          bestStatus: sub.status
        })
      }
      return acc
    }, [])

    return res.json({
      success: true,
      data: {
        completedCount: completedToday.length,
        totalAttempts: todaySubmissions.length,
        learningTimeMinutes,
        challengesAttempted,
        date: now.toISOString().split('T')[0]
      }
    })
  } catch (err) {
    console.error('getTodayStats error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// PATCH /api/users/me  (update profile)
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa xác thực' })

    const allowed: any = {}
    const { avatar, email, phone, password, favoriteLanguages } = req.body || {}
    if (typeof avatar === 'string') allowed.avatar = avatar.trim()
    if (typeof email === 'string' && email.trim().length > 3) allowed.email = email.trim()
    if (typeof phone === 'string' && phone.trim().length > 0) allowed.phone = phone.trim()
    
    // Handle favoriteLanguages in updateMe (for backward compatibility)
    if (Array.isArray(favoriteLanguages)) {
      const validLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C']
      const invalidLanguages = favoriteLanguages.filter(
        (lang: string) => !validLanguages.includes(lang)
      )
      if (invalidLanguages.length === 0) {
        allowed.favoriteLanguages = [...new Set(favoriteLanguages)] // Remove duplicates
      } else {
        return res.status(400).json({
          success: false,
          message: `Ngôn ngữ không hợp lệ: ${invalidLanguages.join(', ')}`,
        })
      }
    }

    // Password handled separately (hashed)
    // Check if there's at least one field to update
    const hasPasswordUpdate = password && typeof password === 'string' && password.trim().length > 0
    if (Object.keys(allowed).length === 0 && !hasPasswordUpdate) {
      return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' })
    }

    // Validate email uniqueness
    if (allowed.email) {
      const existsEmail = await User.findOne({ email: allowed.email, _id: { $ne: req.user?.id } })
      if (existsEmail) return res.status(400).json({ success: false, message: 'Email đã được sử dụng' })
    }

    // Validate phone uniqueness
    if (allowed.phone) {
      const existsPhone = await User.findOne({ phone: allowed.phone, _id: { $ne: req.user?.id } })
      if (existsPhone) return res.status(400).json({ success: false, message: 'Số điện thoại đã được sử dụng' })
    }

    // Prepare update object
    const updateObj: any = { ...allowed }

    // Handle password change - chỉ xử lý nếu password có giá trị thực sự (không phải null/undefined/empty)
    if (password && typeof password === 'string' && password.trim().length > 0) {
      const { oldPassword } = req.body
      if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ' })
      }

      // Get user with password (need to explicitly select password field)
      const user = await User.findById(userId).select('+password')
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      }

      // Verify old password
      const isMatch = await user.comparePassword(oldPassword)
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' })
      }

      // Validate and hash new password
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      }
      const salt = await bcrypt.genSalt(10)
      const hashed = await bcrypt.hash(password.trim(), salt)
      updateObj.password = hashed
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateObj }, { new: true })
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })

    return res.json({
      success: true,
      data: {
        id: (updated._id as any).toString(),
        email: updated.email,
        username: updated.username, // Include username in response but don't allow updates
        avatar: updated.avatar,
        phone: updated.phone,
        favoriteLanguages: updated.favoriteLanguages || [], // Include favoriteLanguages in response
      }
    })
  } catch (err) {
    console.error('updateMe error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}
// GET /api/users/me/preferences  (get user preferences)
export const getMyPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa xác thực' })

    // Try to get from LanguagePreference collection (favorite table)
    let languagePreference = await LanguagePreference.findOne({ 
      user_id: new mongoose.Types.ObjectId(userId),
      type: 'language_preference'
    })

    // If not found, check User model for backward compatibility
    if (!languagePreference) {
      const user = await User.findById(userId).select('favoriteLanguages')
      if (user && user.favoriteLanguages && user.favoriteLanguages.length > 0) {
        // Migrate from User model to LanguagePreference collection
        languagePreference = new LanguagePreference({
          user_id: new mongoose.Types.ObjectId(userId),
          type: 'language_preference',
          languages: user.favoriteLanguages,
        })
        await languagePreference.save()
        console.log(`[Language Preferences] Migrated preferences from User model for user ${userId}`)
      }
    }

    // Get background preference from User model settings field
    const user = await User.findById(userId).select('settings')
    const backgroundPreference = user?.settings?.background || null

    return res.json({
      success: true,
      data: {
        favoriteLanguages: languagePreference?.languages || [],
        background: backgroundPreference,
      }
    })
  } catch (err) {
    console.error('getMyPreferences error', err)
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

// PATCH /api/users/me/preferences  (update language preferences and background)
export const updateMyPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa xác thực' })

    const { favoriteLanguages, background } = req.body

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const updatePromises: Promise<any>[] = []

    // Update language preferences if provided
    if (favoriteLanguages !== undefined) {
      // Validate favoriteLanguages
      if (!Array.isArray(favoriteLanguages)) {
        return res.status(400).json({ 
          success: false, 
          message: 'favoriteLanguages phải là một mảng' 
        })
      }

      // Validate each language
      const validLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C']
      const invalidLanguages = favoriteLanguages.filter(
        (lang: string) => !validLanguages.includes(lang)
      )

      if (invalidLanguages.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Ngôn ngữ không hợp lệ: ${invalidLanguages.join(', ')}. Các ngôn ngữ hợp lệ: ${validLanguages.join(', ')}`,
        })
      }

      // Remove duplicates
      const uniqueLanguages = [...new Set(favoriteLanguages)]

      // Update or create in LanguagePreference collection (favorite table)
      const langUpdatePromise = LanguagePreference.findOneAndUpdate(
        { 
          user_id: userObjectId,
          type: 'language_preference'
        },
        {
          user_id: userObjectId,
          type: 'language_preference',
          languages: uniqueLanguages,
          updated_at: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )
      updatePromises.push(langUpdatePromise)

      // Also update User model for backward compatibility
      const userLangUpdatePromise = User.findByIdAndUpdate(
        userId,
        { $set: { favoriteLanguages: uniqueLanguages } },
        { new: true }
      )
      updatePromises.push(userLangUpdatePromise)

      console.log(`[Language Preferences] Updated preferences for user ${userId}:`, uniqueLanguages)
    }

    // Update background preference if provided
    if (background !== undefined) {
      // Validate background structure
      if (typeof background !== 'object' || background === null) {
        return res.status(400).json({
          success: false,
          message: 'background phải là một object',
        })
      }

      if (!background.id || typeof background.id !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'background.id là bắt buộc và phải là string',
        })
      }

      if (!background.url || typeof background.url !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'background.url là bắt buộc và phải là string',
        })
      }

      // Update User model with background in settings field
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      }

      // Initialize settings if it doesn't exist
      if (!user.settings) {
        user.settings = {}
      }

      user.settings.background = {
        id: background.id,
        url: background.url,
        label: background.label || background.id,
      }

      await user.save()
      console.log(`[Background Preference] Updated background for user ${userId}:`, background.id)
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    // Get updated preferences to return
    const updatedLangPref = favoriteLanguages !== undefined 
      ? await LanguagePreference.findOne({ user_id: userObjectId, type: 'language_preference' })
      : null

    const updatedUser = await User.findById(userId).select('settings')
    const updatedBackground = updatedUser?.settings?.background || null

    return res.json({
      success: true,
      message: 'Cập nhật preferences thành công',
      data: {
        favoriteLanguages: updatedLangPref?.languages || undefined,
        background: updatedBackground || undefined,
      }
    })
  } catch (err: any) {
    console.error('updateMyPreferences error', err)
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Preference đã tồn tại cho user này' 
      })
    }
    
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' })
  }
}

export default { getMyProgress, getTodayStats, getProgressByUsername, updateMe, getMyPreferences, updateMyPreferences }