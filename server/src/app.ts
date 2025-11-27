import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { createServer } from 'http';

// Load env vars FIRST - before importing passport config
config();

// Routes
import authRoutes from './routes/auth.routes';
import challengeRoutes from './routes/challenge.routes';
import scraperRoutes from './routes/scraper.routes';
import userRoutes from './routes/user.routes';
import submissionRoutes from './routes/submission.routes';
import debugRoutes from './routes/debug.routes';
import pvpRoutes from './routes/pvp.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import importExportRoutes from './routes/import-export.routes';

// WebSocket Service
import { WebSocketService } from './services/websocket.service';

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
const server = createServer(app);
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
app.use('/api/submissions', submissionRoutes);
app.use('/api/debug', debugRoutes); // Debug routes - không cần auth
app.use('/api/pvp', pvpRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/import-export', importExportRoutes);

// Error handling middleware
app.use((err: ErrorWithStack, req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Có lỗi xảy ra!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Initialize WebSocket Service
const wsService = new WebSocketService(server);

// Connect to MongoDB
mongoose.connect(ENV.MONGODB_URI)
    .then(() => {
        console.log('Kết nối MongoDB thành công');
        console.log(`Database: ${ENV.MONGODB_URI}`);
        // Start server sau khi kết nối DB thành công
        server.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
            console.log(`Environment: ${ENV.NODE_ENV}`);
            console.log('WebSocket service initialized');
        });
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });