import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import path from 'path';
import session from 'express-session';
import passport from 'passport';

// Load env vars FIRST - before importing passport config
// Đảm bảo load .env từ thư mục server (nơi chứa file này)
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });
console.log(`[Environment] Loading .env from: ${envPath}`);

// Routes
import authRoutes from './routes/auth.routes';
import challengeRoutes from './routes/challenge.routes';
import scraperRoutes from './routes/scraper.routes';
import userRoutes from './routes/user.routes';
import favoriteRoutes from './routes/favorite.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import feedbackRoutes from './routes/feedback.routes';
import achievementRoutes from './routes/achievement.routes';
import systemSettingsRoutes from './routes/systemSettings.routes';
import chatRoutes from './routes/chat.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import trainingDataRoutes from './routes/trainingData.routes';

// Passport strategies - must be imported AFTER dotenv config
import './config/passport';

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
// Enable CORS for all origins in development
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/training-data', trainingDataRoutes);

// Catch-all redirect for legacy routes without /api prefix (helpful for debugging)
app.get('/auth/:provider', (req: Request, res: Response) => {
    const provider = req.params.provider;
    res.redirect(`/api/auth/${provider}`);
});

app.get('/auth/:provider/callback', (req: Request, res: Response) => {
    const provider = req.params.provider;
    res.redirect(`/api/auth/${provider}/callback?${new URLSearchParams(req.query as any).toString()}`);
});

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
    .then(async () => {
        console.log('Kết nối MongoDB thành công');
        console.log(`Database: ${ENV.MONGODB_URI}`);
        
        // Sync training data từ MongoDB vào file JSON khi khởi động server
        try {
            const { syncTrainingDataService } = await import('./services/syncTrainingDataService');
            await syncTrainingDataService.syncIfNeeded();
        } catch (error) {
            console.error('Lỗi khi sync training data khi khởi động:', error);
            // Không dừng server nếu sync lỗi
        }
        
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