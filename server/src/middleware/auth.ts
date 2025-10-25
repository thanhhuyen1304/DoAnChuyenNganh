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
        // Lấy token từ header
        const token = req.header('Authorization')?.replace('Bearer ', '');

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
                message: 'Token không hợp lệ' 
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
        res.status(401).json({ 
            success: false,
            message: 'Token không hợp lệ' 
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

// Legacy function for backward compatibility
export const authenticate = authenticateToken;