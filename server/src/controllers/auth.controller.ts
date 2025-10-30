import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import passport from 'passport';
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
                password,
                loginMethod: 'local'
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

            const { identifier, password } = req.body;

            // identifier có thể là email hoặc username
            const query: any = {};
            if (typeof identifier === 'string' && identifier.includes('@')) {
                query.email = identifier.toLowerCase();
            } else {
                // tìm theo username hoặc email fallback
                query.$or = [{ username: identifier }, { email: identifier }];
            }

            // Tìm user và lấy cả password để so sánh
            const user = await User.findOne(query).select('+password');
            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Email / tên đăng nhập hoặc mật khẩu không đúng' 
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

    // OAuth callbacks - Updated to generate JWT tokens
    async googleCallback(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user as IUser;
            if (!user) {
                return res.redirect(`${CLIENT_URL}/auth/error?message=Không thể xác thực tài khoản Google`);
            }

            // Update loginMethod if not set
            if (user.loginMethod !== 'google') {
                user.loginMethod = 'google';
                await user.save();
            }

            // Generate JWT token
            const token = generateToken(user.id);

            // Redirect to frontend with token
            res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                experience: user.experience,
                rank: user.rank,
                badges: user.badges,
                favoriteLanguages: user.favoriteLanguages,
                loginMethod: user.loginMethod,
                role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
            }))}`);
        } catch (error) {
            console.error('Lỗi Google OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error?message=Đã xảy ra lỗi khi đăng nhập bằng Google`);
        }
    }

    async githubCallback(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user as IUser;
            if (!user) {
                return res.redirect(`${CLIENT_URL}/auth/error?message=Không thể xác thực tài khoản GitHub`);
            }

            // Update loginMethod if not set
            if (user.loginMethod !== 'github') {
                user.loginMethod = 'github';
                await user.save();
            }

            // Generate JWT token
            const token = generateToken(user.id);

            // Redirect to frontend with token
            res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                experience: user.experience,
                rank: user.rank,
                badges: user.badges,
                favoriteLanguages: user.favoriteLanguages,
                loginMethod: user.loginMethod,
                role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
            }))}`);
        } catch (error) {
            console.error('Lỗi GitHub OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error?message=Đã xảy ra lỗi khi đăng nhập bằng GitHub`);
        }
    }

    async facebookCallback(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user as IUser;
            if (!user) {
                return res.redirect(`${CLIENT_URL}/auth/error?message=Không thể xác thực tài khoản Facebook`);
            }

            // Update loginMethod if not set
            if (user.loginMethod !== 'facebook') {
                user.loginMethod = 'facebook';
                await user.save();
            }

            // Generate JWT token
            const token = generateToken(user.id);

            // Redirect to frontend with token
            res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                experience: user.experience,
                rank: user.rank,
                badges: user.badges,
                favoriteLanguages: user.favoriteLanguages,
                loginMethod: user.loginMethod,
                role: user.email === ENV.ADMIN_EMAIL ? 'admin' : 'user'
            }))}`);
        } catch (error) {
            console.error('Lỗi Facebook OAuth:', error);
            res.redirect(`${CLIENT_URL}/auth/error?message=Đã xảy ra lỗi khi đăng nhập bằng Facebook`);
        }
    }

    // Đổi mật khẩu
    async changePassword(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
                });
            }

            const user = await User.findById(req.user?.id).select('+password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Kiểm tra login method
            if (user.loginMethod !== 'local') {
                return res.status(400).json({
                    success: false,
                    message: 'Chỉ có thể đổi mật khẩu cho tài khoản đăng nhập bằng email/password'
                });
            }

            // Kiểm tra mật khẩu hiện tại
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng'
                });
            }

            // Cập nhật mật khẩu mới
            user.password = newPassword;
            await user.save();

            return res.json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server'
            });
        }
    }
}