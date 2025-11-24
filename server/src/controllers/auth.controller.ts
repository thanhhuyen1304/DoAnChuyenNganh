import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import escapeStringRegexp from 'escape-string-regexp';
import User, { IUser } from '../models/user.model';
import { sendSMS } from '../services/smsService';

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

// Helper function để xác định role của user
const getUserRole = (user: IUser): string => {
    // Ưu tiên role từ database, nếu không có thì kiểm tra email admin
    if (user.role) {
        return user.role;
    }
    if (user.email === ENV.ADMIN_EMAIL) {
        return 'admin';
    }
    return 'user';
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
                        role: getUserRole(user)
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

            // Normalize identifier: trim và lowercase
            const normalizedIdentifier = typeof identifier === 'string' 
                ? identifier.trim().toLowerCase() 
                : String(identifier).trim().toLowerCase();

            // identifier có thể là email hoặc username
            const query: any = {};
            if (normalizedIdentifier.includes('@')) {
                // Nếu có @, tìm theo email
                query.email = normalizedIdentifier;
            } else {
                // Nếu không có @, tìm theo username (case-insensitive) hoặc email fallback
                // Escape regex để tránh lỗi khi username có ký tự đặc biệt
                const escapedIdentifier = escapeStringRegexp(normalizedIdentifier);
                query.$or = [
                    { username: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } }, 
                    { email: normalizedIdentifier }
                ];
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

            // Kiểm tra trạng thái banned
            if (user.isBanned) {
                // Kiểm tra nếu có thời hạn ban và đã hết hạn
                if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
                    // Hết hạn ban, tự động unban
                    user.isBanned = false;
                    user.banReason = undefined;
                    user.bannedUntil = undefined;
                    await user.save();
                } else {
                    // Vẫn còn bị ban
                    const banMessage = user.bannedUntil 
                        ? `Tài khoản của bạn đã bị khóa đến ${new Date(user.bannedUntil).toLocaleString('vi-VN')}. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`
                        : `Tài khoản của bạn đã bị khóa. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`;
                    
                    return res.status(403).json({ 
                        success: false,
                        message: banMessage 
                    });
                }
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
                        role: getUserRole(user)
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
                        role: getUserRole(user)
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
                    // Check banned status before issuing token
                    if (user.isBanned) {
                        if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
                            // Ban expired, auto-unban
                            user.isBanned = false;
                            user.banReason = undefined;
                            user.bannedUntil = undefined;
                            await user.save();
                        } else {
                            const banMessage = user.bannedUntil
                                ? `Tài khoản của bạn đã bị khóa đến ${new Date(user.bannedUntil).toLocaleString('vi-VN')}. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`
                                : `Tài khoản của bạn đã bị khóa. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`;
                            return res.redirect(`${CLIENT_URL}/auth/error?message=${encodeURIComponent(banMessage)}`);
                        }
                    }

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

            // Check banned status before issuing token
            if (user.isBanned) {
                if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
                    user.isBanned = false;
                    user.banReason = undefined;
                    user.bannedUntil = undefined;
                    await user.save();
                } else {
                    const banMessage = user.bannedUntil
                        ? `Tài khoản của bạn đã bị khóa đến ${new Date(user.bannedUntil).toLocaleString('vi-VN')}. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`
                        : `Tài khoản của bạn đã bị khóa. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`;
                    return res.redirect(`${CLIENT_URL}/auth/error?message=${encodeURIComponent(banMessage)}`);
                }
            }

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

            // Check banned status before issuing token
            if (user.isBanned) {
                if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
                    user.isBanned = false;
                    user.banReason = undefined;
                    user.bannedUntil = undefined;
                    await user.save();
                } else {
                    const banMessage = user.bannedUntil
                        ? `Tài khoản của bạn đã bị khóa đến ${new Date(user.bannedUntil).toLocaleString('vi-VN')}. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`
                        : `Tài khoản của bạn đã bị khóa. ${user.banReason ? `Lý do: ${user.banReason}` : ''}`;
                    return res.redirect(`${CLIENT_URL}/auth/error?message=${encodeURIComponent(banMessage)}`);
                }
            }

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

    // Yêu cầu đặt lại mật khẩu: gửi mã qua email hoặc SMS
    async requestPasswordReset(req: Request, res: Response): Promise<any> {
        try {
            const { emailOrPhone } = req.body;
            if (!emailOrPhone) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập email hoặc số điện thoại' });
            }

            // Normalize input
            const normalizedInput = typeof emailOrPhone === 'string' ? emailOrPhone.trim() : String(emailOrPhone).trim();
            if (!normalizedInput) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập email hoặc số điện thoại' });
            }

            // Nếu là email thì kiểm tra định dạng hợp lệ
            if (normalizedInput.includes('@')) {
                // Regex kiểm tra email đơn giản
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(normalizedInput)) {
                    return res.status(400).json({ success: false, message: 'Định dạng email không hợp lệ' });
                }
            }

            const query: any = {};
            if (normalizedInput.includes('@')) {
                query.email = normalizedInput.toLowerCase();
            } else {
                // Tìm theo số điện thoại hoặc email (fallback)
                query.$or = [{ phone: normalizedInput }, { email: normalizedInput }];
            }

            console.log(`[Password Reset] Searching for user with query:`, query);
            const user = await User.findOne(query);
            // Không trả về 404 để tránh tiết lộ liệu tài khoản có tồn tại hay không.
            // Nếu user không tồn tại, chỉ trả về thông báo chung (privacy) và không tạo mã.
            if (!user) {
                console.log(`[Password Reset] User not found for identifier: ${normalizedInput}`);
                return res.json({ success: true, message: 'Nếu tài khoản tồn tại, mã xác thực đã được gửi' });
            }

            console.log(`[Password Reset] User found: ${user.email || user.phone || user.username}`);

            // Tạo mã 6 chữ số (dùng crypto để an toàn hơn)
            const code = crypto.randomInt(100000, 1000000).toString();
            user.resetCode = code;
            user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
            
            try {
                await user.save();
                console.log(`[Password Reset] Code generated and saved for user: ${user.email || user.phone || user.username}`);
            } catch (saveErr: any) {
                console.error('[Password Reset] Error saving reset code:', saveErr?.message || saveErr);
                return res.status(500).json({ success: false, message: 'Lỗi khi lưu mã xác thực. Vui lòng thử lại.' });
            }
            
            // Gửi SMS nếu có số điện thoại hoặc identifier là số điện thoại
            try {
                const isPhone = typeof emailOrPhone === 'string' && !emailOrPhone.includes('@');
                const targetPhone = isPhone ? emailOrPhone : user.phone;
                
                if (targetPhone) {
                    console.log(`[Password Reset] Đang gửi SMS...`);
                    console.log(`[Password Reset] Số điện thoại gốc: ${targetPhone}`);
                    
                    const smsResult = await sendSMS(
                        targetPhone, 
                        `Ma xac thuc dat lai mat khau: ${code} (het han trong 10 phut)`
                    );
                    
                    if (smsResult.success) {
                        console.log(`[Password Reset] ✅ SMS đã được gửi thành công!`);
                        console.log(`[Password Reset] Số điện thoại: ${targetPhone}`);
                    } else {
                        console.log(`[Password Reset] ⚠️ SMS không được gửi: ${smsResult.message}`);
                        console.log(`[Password Reset] 💡 Mã xác thực vẫn có thể được gửi qua email`);
                        console.log(`[Password Reset] 💡 Kiểm tra log chi tiết ở trên để biết nguyên nhân`);
                    }
                } else {
                    console.log(`[Password Reset] ℹ️ Không có số điện thoại để gửi SMS`);
                    console.log(`[Password Reset] 💡 User: ${user.email || user.username}`);
                    console.log(`[Password Reset] 💡 User phone: ${user.phone || 'Chưa có'}`);
                    console.log(`[Password Reset] 💡 Input: ${emailOrPhone}`);
                }
            } catch (smsErr: any) {
                console.error('[Password Reset] ❌ Lỗi gửi SMS reset code:', smsErr?.message || smsErr);
                console.error('[Password Reset] Chi tiết lỗi:', {
                    code: smsErr?.code,
                    status: smsErr?.status,
                    message: smsErr?.message
                });
                console.error('[Password Reset] 💡 Mã xác thực vẫn có thể được gửi qua email');
                // Không throw error, vì mã đã được tạo và lưu, có thể gửi qua email
            }

            // Gửi email nếu có cấu hình SMTP, nếu không thì dùng Ethereal (dev) hoặc log ra console
            let previewUrl: string | undefined = undefined;
            let emailSent = false;
            
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const nodemailer = require('nodemailer');
                
                // Log cấu hình SMTP để debug
                console.log('[Password Reset] Kiểm tra cấu hình SMTP:', {
                    hasHost: !!process.env.SMTP_HOST,
                    hasUser: !!process.env.SMTP_USER,
                    hasPass: !!process.env.SMTP_PASS,
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER,
                    from: process.env.SMTP_FROM
                });
                
                if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
                    // Sử dụng SMTP đã cấu hình
                    try {
                        const transporter = nodemailer.createTransport({
                            host: process.env.SMTP_HOST,
                            port: Number(process.env.SMTP_PORT) || 587,
                            secure: process.env.SMTP_SECURE === 'true',
                            auth: {
                                user: process.env.SMTP_USER,
                                pass: process.env.SMTP_PASS
                            },
                            // Thêm tls options để tránh lỗi certificate
                            tls: {
                                rejectUnauthorized: false
                            }
                        });

                        // Verify transporter connection trước khi gửi
                        console.log('[Password Reset] Đang kiểm tra kết nối SMTP...');
                        await transporter.verify();
                        console.log('[Password Reset] ✅ Kết nối SMTP thành công!');

                        console.log(`[Password Reset] Đang gửi email đến: ${user.email}`);
                        const info = await transporter.sendMail({
                            from: process.env.SMTP_FROM || 'BugHunter Support <no-reply@bughunter.com>',
                            to: user.email,
                            subject: 'Mã xác thực đặt lại mật khẩu',
                            text: `Mã xác thực của bạn là: ${code} (hết hạn trong 10 phút)`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #333;">Mã xác thực đặt lại mật khẩu</h2>
                                    <p>Xin chào,</p>
                                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BugHunter.</p>
                                    <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 5px; margin: 20px 0;">
                                        ${code}
                                    </p>
                                    <p>Mã này sẽ hết hạn trong <strong>10 phút</strong>.</p>
                                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                    <p style="color: #666; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
                                </div>
                            `
                        });
                        
                        emailSent = true;
                        console.log('[Password Reset] ✅ Email đã được gửi thành công!');
                        console.log('[Password Reset] Message ID:', info.messageId);
                        
                        // Try to get preview URL (works for Ethereal/test accounts)
                        if (typeof nodemailer.getTestMessageUrl === 'function') {
                            previewUrl = nodemailer.getTestMessageUrl(info);
                            if (previewUrl) {
                                console.log(`[Password Reset] Preview URL: ${previewUrl}`);
                            }
                        }
                    } catch (smtpErr: any) {
                        emailSent = false;
                        console.error('[Password Reset] ❌ Lỗi gửi email qua SMTP:', smtpErr?.message || smtpErr);
                        console.error('[Password Reset] Chi tiết lỗi SMTP:', {
                            code: smtpErr?.code,
                            command: smtpErr?.command,
                            response: smtpErr?.response,
                            responseCode: smtpErr?.responseCode,
                            errno: smtpErr?.errno,
                            syscall: smtpErr?.syscall,
                            address: smtpErr?.address,
                            port: smtpErr?.port
                        });
                        
                        // Nếu là lỗi authentication, gợi ý sử dụng App Password
                        if (smtpErr?.response?.includes('535') || 
                            smtpErr?.response?.includes('Username and Password not accepted') ||
                            smtpErr?.code === 'EAUTH' ||
                            smtpErr?.responseCode === 535) {
                            console.error('[Password Reset] ⚠️ Lỗi xác thực Gmail!');
                            console.error('[Password Reset] 💡 Hướng dẫn:');
                            console.error('[Password Reset] 1. Bật 2-Step Verification cho Gmail');
                            console.error('[Password Reset] 2. Tạo App Password tại: https://myaccount.google.com/apppasswords');
                            console.error('[Password Reset] 3. Sử dụng App Password (16 ký tự) thay vì mật khẩu thông thường');
                        }
                        
                        // Nếu là lỗi kết nối
                        if (smtpErr?.code === 'ECONNREFUSED' || smtpErr?.code === 'ETIMEDOUT') {
                            console.error('[Password Reset] ⚠️ Không thể kết nối đến SMTP server!');
                            console.error('[Password Reset] 💡 Kiểm tra:');
                            console.error('[Password Reset] - SMTP_HOST có đúng không?');
                            console.error('[Password Reset] - SMTP_PORT có đúng không?');
                            console.error('[Password Reset] - Firewall có chặn kết nối không?');
                        }
                        
                        console.log(`[Password Reset] Mã xác thực (xem trong console): ${code}`);
                        console.log(`[Password Reset] User: ${user.email || user.phone}`);
                    }
                } else {
                    // Nếu không cấu hình SMTP, cố gắng dùng Ethereal (test SMTP) để gửi email dev
                    if (process.env.NODE_ENV !== 'production') {
                        try {
                            const testAccount = await nodemailer.createTestAccount();
                            const transporter = nodemailer.createTransport({
                                host: testAccount.smtp.host,
                                port: testAccount.smtp.port,
                                secure: testAccount.smtp.secure,
                                auth: { user: testAccount.user, pass: testAccount.pass }
                            });

                            const info = await transporter.sendMail({
                                from: process.env.SMTP_FROM || 'BugHunter <no-reply@bughunter.com>',
                                to: user.email,
                                subject: 'Mã xác thực đặt lại mật khẩu',
                                text: `Mã xác thực của bạn là: ${code} (hết hạn trong 10 phút)`
                            });
                            
                            // In URL preview để xem email trong trình duyệt (Ethereal)
                            previewUrl = nodemailer.getTestMessageUrl(info);
                            if (previewUrl) {
                                console.log(`Sent test reset email for ${user.email}. Preview URL: ${previewUrl}`);
                            }
                        } catch (etherealErr: any) {
                            console.error('[Password Reset] Lỗi gửi email test (ethereal):', etherealErr?.message || etherealErr);
                            console.log(`[Password Reset] Mã xác thực (xem trong console): ${code}`);
                            console.log(`[Password Reset] User: ${user.email || user.phone}`);
                        }
                    } else {
                        // production: chỉ log mã (không an toàn, khuyến nghị cấu hình SMTP)
                        console.log(`[Password Reset] Mã xác thực (xem trong console): ${code}`);
                        console.log(`[Password Reset] User: ${user.email || user.phone}`);
                    }
                }
            } catch (nodemailerErr: any) {
                // Nếu không thể require nodemailer hoặc có lỗi khác
                console.error('[Password Reset] Lỗi khi khởi tạo nodemailer:', nodemailerErr?.message || nodemailerErr);
                console.log(`[Password Reset] Mã xác thực (xem trong console): ${code}`);
                console.log(`[Password Reset] User: ${user.email || user.phone}`);
            }
            return res.json({ success: true, message: 'Nếu tài khoản tồn tại, mã xác thực đã được gửi', previewUrl });
        } catch (error: any) {
            console.error('[Password Reset] Unexpected error:', error?.message || error);
            console.error('[Password Reset] Stack:', error?.stack);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server. Vui lòng thử lại sau.' 
            });
        }
    }

    // Xác thực mã và đổi mật khẩu
    async verifyPasswordReset(req: Request, res: Response): Promise<any> {
        try {
            const { emailOrPhone, code, newPassword } = req.body;
            if (!emailOrPhone || !code || !newPassword) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
            }

            const query: any = {};
            if (typeof emailOrPhone === 'string' && emailOrPhone.includes('@')) {
                query.email = emailOrPhone.toLowerCase();
            } else {
                query.$or = [{ phone: emailOrPhone }, { email: emailOrPhone }];
            }

            // resetCode được đặt select: false, cần truy vấn kèm trường này
            const user = await User.findOne(query).select('+resetCode +resetCodeExpires');
            if (!user || !user.resetCode) {
                return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' });
            }

            if (user.resetCode !== code || (user.resetCodeExpires && user.resetCodeExpires < new Date())) {
                return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' });
            }

            // Cập nhật mật khẩu (pre-save hook sẽ hash)
            user.password = newPassword;
            user.resetCode = undefined as any;
            user.resetCodeExpires = undefined as any;
            await user.save();

            return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
        } catch (error) {
            console.error('Lỗi verifyPasswordReset:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
}