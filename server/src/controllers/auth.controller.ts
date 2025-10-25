import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

// Environment configuration
const ENV = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com'
};

// Interface cho request có user
interface AuthRequest extends Request {
    user?: IUser & {
        id: string;
        email: string;
        role?: string;
    };
}

interface JwtPayload {
    userId: string;
}

const JWT_SECRET: Secret = ENV.JWT_SECRET;
const JWT_EXPIRE = ENV.JWT_EXPIRE;
const CLIENT_URL = ENV.CLIENT_URL;

const generateToken = (userId: string): string => {
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign({ userId }, JWT_SECRET, options);
};

export class AuthController {
    // Đăng ký người dùng
    async register(req: Request, res: Response): Promise<any> {
        try {
            // Kiểm tra lỗi validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors.array() 
                });
            }

            const { email, username, password } = req.body;

            // Kiểm tra email đã tồn tại
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email đã được sử dụng' 
                });
            }

            // Kiểm tra username đã tồn tại
            user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Tên người dùng đã được sử dụng' 
                });
            }

            // Tạo user mới
            user = new User({
                email,
                username,
                password
            });

            await user.save();

            // Tạo JWT token
            const token = generateToken(user.id);

            return res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        avatar: user.avatar,
                        experience: user.experience,
                        rank: user.rank,
                        badges: user.badges,
                        favoriteLanguages: user.favoriteLanguages,
                        role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
                    }
                }
            });

        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Lỗi server' 
            });
        }
    }

    // Đăng nhập
    async login(req: Request, res: Response): Promise<any> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors.array() 
                });
            }

            const { email, password } = req.body;

            // Tìm user và lấy cả password để so sánh
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng' 
                });
            }

            // So sánh mật khẩu
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng' 
                });
            }

            // Tạo JWT token
            const token = generateToken(user.id);

            return res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        avatar: user.avatar,
                        experience: user.experience,
                        rank: user.rank,
                        badges: user.badges,
                        favoriteLanguages: user.favoriteLanguages,
                        role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
                    }
                }
            });

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Lỗi server' 
            });
        }
    }

    // Lấy thông tin người dùng hiện tại
    async getCurrentUser(req: AuthRequest, res: Response): Promise<any> {
        try {
            const user = await User.findById(req.user?.id);
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Không tìm thấy người dùng' 
                });
            }

            return res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        avatar: user.avatar,
                        experience: user.experience,
                        rank: user.rank,
                        badges: user.badges,
                        favoriteLanguages: user.favoriteLanguages,
                        role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
                    }
                }
            });

        } catch (error) {
            console.error('Lỗi lấy thông tin user:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Lỗi server' 
            });
        }
    }

    // OAuth callbacks
    async googleCallback(_req: Request, res: Response): Promise<void> {
        try {
            res.redirect(`${CLIENT_URL}/auth/success`);
        } catch (error) {
            console.error('Lỗi Google OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error`);
        }
    }

    async githubCallback(_req: Request, res: Response): Promise<void> {
        try {
            res.redirect(`${CLIENT_URL}/auth/success`);
        } catch (error) {
            console.error('Lỗi GitHub OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error`);
        }
    }

    async facebookCallback(_req: Request, res: Response): Promise<void> {
        try {
            res.redirect(`${CLIENT_URL}/auth/success`);
        } catch (error) {
            console.error('Lỗi Facebook OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error`);
        }
    }
}