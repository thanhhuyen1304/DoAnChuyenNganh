import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import passport from 'passport';
import { config } from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes';

// Passport strategies
import './config/passport';

// Load env vars
config();

// Định nghĩa interface cho Error
interface ErrorWithStack extends Error {
    status?: number;
    stack?: string;
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: ErrorWithStack, req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Có lỗi xảy ra!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => {
        console.log('Kết nối MongoDB thành công');
        // Start server sau khi kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });