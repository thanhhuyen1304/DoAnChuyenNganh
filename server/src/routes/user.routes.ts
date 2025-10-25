import express from 'express'
import { getMyProgress, getProgressByUsername } from '../controllers/user.controller'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Protected: get current user's progress
router.get('/me/progress', authenticateToken, getMyProgress)

// Public: get progress by username (case-insensitive)
router.get('/:username/progress', getProgressByUsername)

export default router
