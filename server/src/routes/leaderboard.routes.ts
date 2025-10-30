import express from 'express'
import { getTopLearners } from '../controllers/leaderboard.controller'

const router = express.Router()

// Public leaderboard
router.get('/top', getTopLearners)

export default router
