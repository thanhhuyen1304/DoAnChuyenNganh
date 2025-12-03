import express from 'express';
import { body, param, query } from 'express-validator';
import {
  submitSolution,
  getUserSubmissions,
  getAllUserSubmissions,
  getSubmissionById,
  getUserSubmissionStats
} from '../controllers/submission.controller';
import { authenticateToken } from '../middleware/auth';
import { submissionRateLimit } from '../middleware/rateLimit';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

// Validation rules
const submitValidation = [
  body('challengeId')
    .notEmpty()
    .withMessage('ID bài tập là bắt buộc')
    .isMongoId()
    .withMessage('ID bài tập không hợp lệ'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code là bắt buộc'),
  
  body('language')
    .isIn(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'])
    .withMessage('Ngôn ngữ không hợp lệ')
];

// Routes
router.post('/submit', submitValidation, submissionRateLimit, submitSolution);

router.get('/challenge/:challengeId', [
  param('challengeId').isMongoId().withMessage('ID bài tập không hợp lệ')
], getUserSubmissions);

router.get('/user/all', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1 đến 100'),
  query('status').optional().isIn(['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error']),
  query('language').optional().isIn(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'])
], getAllUserSubmissions);

router.get('/stats', getUserSubmissionStats);

router.get('/:id', [
  param('id').isMongoId().withMessage('ID submission không hợp lệ')
], getSubmissionById);

export default router;
