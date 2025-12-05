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
import path from 'path';

// Load env vars FIRST - before importing passport config
config();

// Routes
import authRoutes from './routes/auth.routes';
import challengeRoutes from './routes/challenge.routes';
import scraperRoutes from './routes/scraper.routes';
import userRoutes from './routes/user.routes';
import submissionRoutes from './routes/submission.routes';
import debugRoutes from './routes/debug.routes';
import pvpRoutes from './routes/simplePvp.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import importExportRoutes from './routes/import-export.routes';
import friendRoutes from './routes/friend.routes';
import trainingDataRoutes from './routes/trainingData.routes';
import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';
import chatRoutes from './routes/chat.routes';
import aiChatRoutes from './routes/aiChatRoutes';
import notificationRoutes from './routes/notification.routes';
import achievementRoutes from './routes/achievement.routes';

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

// Initialize WebSocket Service BEFORE middleware
const wsService = new WebSocketService(server);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Enable CORS for development - Allow all origins for OAuth to work
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
      ]
    : true, // Allow all origins in development for OAuth
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(passport.initialize());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Inject WebSocket service into requests
app.use((req, res, next) => {
  (req as any).wsService = wsService;
  next();
});

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
app.use('/api/friends', friendRoutes);
app.use('/api/training-data', trainingDataRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRoutes);

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
    .then(() => {
        console.log('Kết nối MongoDB thành công');
        console.log(`Database: ${ENV.MONGODB_URI}`);
        // Start server sau khi kết nối DB thành công
        server.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
            console.log(`Environment: ${ENV.NODE_ENV}`);
            console.log('WebSocket service initialized');
        }).on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Lỗi: Port ${PORT} đang được sử dụng bởi process khác!`);
                console.error(`\n💡 Giải pháp:`);
                console.error(`   1. Chạy lệnh: npm run kill-port-5000`);
                console.error(`   2. Hoặc kill tất cả Node.js: npm run kill-all-node-force`);
                console.error(`   3. Hoặc đổi PORT trong file .env\n`);
                process.exit(1);
            } else {
                console.error('Lỗi khi khởi động server:', err);
                process.exit(1);
            }
        });
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });