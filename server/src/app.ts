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
import challengeRoutes from './routes/challenge.routes';
import scraperRoutes from './routes/scraper.routes';

// Passport strategies
import './config/passport';

// Load env vars
config();

// Environment configuration
const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com'
};

// Định nghĩa interface cho Error
interface ErrorWithStack extends Error {
    status?: number;
    stack?: string;
}

const app = express();
const PORT = ENV.PORT;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/scraper', scraperRoutes);

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
mongoose.connect(ENV.MONGODB_URI)
    .then(() => {
        console.log('Kết nối MongoDB thành công');
        console.log(`Database: ${ENV.MONGODB_URI}`);
        // Start server sau khi kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
            console.log(`Environment: ${ENV.NODE_ENV}`);
        });
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });