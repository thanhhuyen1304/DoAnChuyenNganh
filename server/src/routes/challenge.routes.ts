import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getChallenges,
  getAdminChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  toggleChallengeStatus,
  getChallengeStats,
  getSolutionsStatus,
  unlockSolution,
  getSolution
} from '../controllers/challenge.controller';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/auth';

const router = express.Router();

// Validation rules
const challengeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề là bắt buộc')
    .isLength({ max: 200 })
    .withMessage('Tiêu đề không được vượt quá 200 ký tự'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Mô tả là bắt buộc'),
  
  body('problemStatement')
    .trim()
    .notEmpty()
    .withMessage('Đề bài là bắt buộc'),
  
  body('language')
    .isIn(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'])
    .withMessage('Ngôn ngữ không hợp lệ'),
  
  body('difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Độ khó không hợp lệ'),
  
  body('category')
    .isIn(['Syntax', 'Logic', 'Performance', 'Security'])
    .withMessage('Danh mục không hợp lệ'),
  
  body('buggyCode')
    .trim()
    .notEmpty()
    .withMessage('Code có lỗi là bắt buộc'),
  
  body('testCases')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất 1 test case'),
  
  body('testCases.*.input')
    .trim()
    .notEmpty()
    .withMessage('Input của test case là bắt buộc'),
  
  body('testCases.*.expectedOutput')
    .trim()
    .notEmpty()
    .withMessage('Expected output của test case là bắt buộc'),
  
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Điểm số phải từ 1 đến 1000'),
  
  body('timeLimit')
    .isInt({ min: 1, max: 60 })
    .withMessage('Giới hạn thời gian phải từ 1 đến 60 giây'),
  
  body('memoryLimit')
    .isInt({ min: 1, max: 512 })
    .withMessage('Giới hạn bộ nhớ phải từ 1 đến 512MB')
];

const updateChallengeValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tiêu đề không được vượt quá 200 ký tự'),
  
  body('language')
    .optional()
    .isIn(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'])
    .withMessage('Ngôn ngữ không hợp lệ'),
  
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Độ khó không hợp lệ'),
  
  body('category')
    .optional()
    .isIn(['Syntax', 'Logic', 'Performance', 'Security'])
    .withMessage('Danh mục không hợp lệ'),
  
  body('points')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Điểm số phải từ 1 đến 1000'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Giới hạn thời gian phải từ 1 đến 60 giây'),
  
  body('memoryLimit')
    .optional()
    .isInt({ min: 1, max: 512 })
    .withMessage('Giới hạn bộ nhớ phải từ 1 đến 512MB')
];

// Public routes
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit phải từ 1 đến 50'),
  query('language').optional().isString().trim().withMessage('Language phải là chuỗi'),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('category').optional().isIn(['Syntax', 'Logic', 'Performance', 'Security']),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Từ khóa tìm kiếm không được vượt quá 100 ký tự')
], getChallenges);

// Protected routes (require authentication)
router.use(authenticateToken);

router.get('/:id', [
  param('id').isMongoId().withMessage('ID không hợp lệ')
], getChallengeById);

// Admin routes (require admin role)
router.get('/admin/all', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1 đến 100'),
  query('language').optional().isString().trim().withMessage('Language phải là chuỗi'),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('category').optional().isIn(['Syntax', 'Logic', 'Performance', 'Security']),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Từ khóa tìm kiếm không được vượt quá 100 ký tự'),
  query('isActive').optional().isBoolean().withMessage('isActive phải là boolean')
], getAdminChallenges);

router.post('/', [
  isAdmin,
  ...challengeValidation
], createChallenge);

router.put('/:id', [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
  ...updateChallengeValidation
], updateChallenge);

router.delete('/:id', [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
  isAdmin
], deleteChallenge);

router.patch('/:id/toggle-status', [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
  isAdmin
], toggleChallengeStatus);

router.get('/admin/stats', [
  isAdmin
], getChallengeStats);

// Solution routes (require authentication)
// Lấy danh sách lời giải với trạng thái unlock
router.get('/:id/solutions', [
  param('id').isMongoId().withMessage('ID không hợp lệ')
], getSolutionsStatus);

// Mở khóa lời giải
router.post('/:id/solutions/:solutionIndex/unlock', [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
  param('solutionIndex').isInt({ min: 0 }).withMessage('Solution index phải là số nguyên không âm')
], unlockSolution);

// Lấy chi tiết lời giải đã unlock
router.get('/:id/solutions/:solutionIndex', [
  param('id').isMongoId().withMessage('ID không hợp lệ'),
  param('solutionIndex').isInt({ min: 0 }).withMessage('Solution index phải là số nguyên không âm')
], getSolution);

export default router;
