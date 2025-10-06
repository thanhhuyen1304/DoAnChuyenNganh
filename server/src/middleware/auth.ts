import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

interface JwtPayload {
    userId: string;
}

interface AuthRequest extends Request {
    user?: IUser;
}

// Khai báo module augmentation cho Express
declare module 'express-serve-static-core' {
    interface Request {
        user?: IUser;
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        // Lấy token từ header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Không có token xác thực' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // Tìm user từ token
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        // Thêm user vào request
        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};