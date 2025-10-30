import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { body, validationResult } from 'express-validator';
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

// Change password validation
const changePasswordValidation = [
    body('currentPassword')
        .not()
        .isEmpty()
        .withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

router.post('/change-password', authenticate, changePasswordValidation, (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: errors.array()
        });
        return;
    }
    next();
}, authController.changePassword);

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

// Chỉ đăng ký route Facebook nếu đã cấu hình credentials để tránh lỗi Unknown strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    router.get('/facebook',
        // Không yêu cầu scope 'email' để tránh lỗi Invalid Scopes trên dialog
        passport.authenticate('facebook')
    );

    router.get('/facebook/callback',
        passport.authenticate('facebook', { session: false }),
        authController.facebookCallback
    );
} else {
    // Optional: route báo tạm thời chưa cấu hình
    router.get('/facebook', (_req: Request, res: Response) => {
        res.status(503).json({ success: false, message: 'Facebook OAuth chưa được cấu hình' });
    });
}

export default router;