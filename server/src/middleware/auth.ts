import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

interface JwtPayload {
    userId: string;
}

// Khai báo module augmentation cho Express
declare module 'express-serve-static-core' {
    interface Request {
        user?: IUser & {
            id: string;
            email: string;
            role?: string;
        };
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware xác thực JWT token
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        // Lấy token từ nhiều nguồn khác nhau
        let token = null;
        
        // 1. Từ header Authorization
        const authHeader = req.header('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }
        
        // 2. Từ query parameter (cho WebSocket connections)
        if (!token && req.query.token) {
            token = req.query.token as string;
        }
        
        // 3. Từ request body (cho API calls)
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Không có token xác thực' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Tìm user từ token
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Token không hợp lệ - User không tồn tại' 
            });
        }

        // Thêm user vào request
        req.user = {
            ...user.toObject(),
            id: (user._id as any).toString(),
            email: user.email,
            role: user.email === (process.env.ADMIN_EMAIL || 'admin@bughunter.com') ? 'admin' : 'user'
        } as any;
        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token không hợp lệ hoặc hết hạn' 
        });
    }
};

// Middleware kiểm tra quyền admin
export const isAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Chưa xác thực'
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập'
        });
        return;
    }

    next();
};

// Middleware cho phép token tùy chọn (cho các route không bắt buộc đăng nhập)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        // Lấy token từ nhiều nguồn khác nhau
        let token = null;
        
        // 1. Từ header Authorization
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }
        
        // 2. Từ query parameter (cho WebSocket connections)
        if (!token && req.query.token) {
            token = req.query.token as string;
        }
        
        // 3. Từ request body (cho API calls)
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }

        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

                // Tìm user từ token
                const user = await User.findById(decoded.userId);
                if (user) {
                    // Thêm user vào request
                    req.user = {
                        ...user.toObject(),
                        id: (user._id as any).toString(),
                        email: user.email,
                        role: user.email === (process.env.ADMIN_EMAIL || 'admin@bughunter.com') ? 'admin' : 'user'
                    } as any;
                }
            } catch (error) {
                // Token không hợp lệ, nhưng không reject request
                console.log('Optional auth: Invalid token ignored');
            }
        }
        
        next();

    } catch (error) {
        // Không reject request cho optional auth
        next();
    }
};

// Legacy function for backward compatibility
export const authenticate = authenticateToken;