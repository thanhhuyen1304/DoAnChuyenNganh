import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import passport from 'passport';

const router = Router();
const authController = new AuthController();

// Validation middleware
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Tên người dùng phải có ít nhất 3 ký tự'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

const loginValidation = [
    // identifier can be an email or a username
    body('identifier')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Email hoặc tên đăng nhập là bắt buộc'),
    body('password')
        .not()
        .isEmpty()
        .withMessage('Mật khẩu là bắt buộc')
];

// Auth routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authenticate, authController.getCurrentUser);

// OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    authController.googleCallback
);

router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    authController.githubCallback
);

router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    authController.facebookCallback
);

export default router;