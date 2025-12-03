import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter. For production, prefer Redis or a shared store.
interface Entry {
  count: number;
  expiresAt: number;
}

const store = new Map<string, Entry>();

function now() {
  return Date.now();
}

function cleanupIfExpired(key: string) {
  const e = store.get(key);
  if (!e) return;
  if (e.expiresAt <= now()) {
    store.delete(key);
  }
}

function createLimiter(options: {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string | null | undefined;
  message: string;
}) {
  const { windowMs, max, keyGenerator, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    if (!key) return next();

    cleanupIfExpired(key);

    const existing = store.get(key);
    if (!existing) {
      store.set(key, { count: 1, expiresAt: now() + windowMs });
      return next();
    }

    if (existing.expiresAt <= now()) {
      store.set(key, { count: 1, expiresAt: now() + windowMs });
      return next();
    }

    if (existing.count >= max) {
      const retryAfter = Math.max(0, Math.ceil((existing.expiresAt - now()) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message });
    }

    existing.count += 1;
    store.set(key, existing);
    next();
  };
}

// Helpers to normalize identifier (email/phone)
function getIdentifier(req: Request): string | null {
  const raw = (req.body?.emailOrPhone ?? req.body?.identifier ?? '').toString();
  if (!raw) return null;
  return raw.includes('@') ? raw.toLowerCase() : raw;
}

// OTP request: limit per IP and per identifier
export const otpRequestRateLimitIP = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // per IP
  keyGenerator: (req) => `otp-req:ip:${req.ip}`,
  message: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.',
});

export const otpRequestRateLimitIdentifier = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // per identifier
  keyGenerator: (req) => {
    const id = getIdentifier(req);
    return id ? `otp-req:id:${id}` : null;
  },
  message: 'Bạn đã yêu cầu mã quá nhiều lần cho tài khoản này. Vui lòng thử lại sau.',
});

// OTP verify: tighter limits
export const otpVerifyRateLimitIP = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 50, // per IP
  keyGenerator: (req) => `otp-verify:ip:${req.ip}`,
  message: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',
});

export const otpVerifyRateLimitIdentifier = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10, // per identifier
  keyGenerator: (req) => {
    const id = getIdentifier(req);
    return id ? `otp-verify:id:${id}` : null;
  },
  message: 'Bạn đã thử quá nhiều lần cho tài khoản này. Vui lòng thử lại sau.',
});

// ============================================
// GENERAL RATE LIMITERS
// ============================================

// General API rate limiter (per IP)
export const generalRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  keyGenerator: (req) => `general:ip:${req.ip}`,
  message: 'Bạn đã gửi quá nhiều requests. Vui lòng thử lại sau 15 phút.',
});

// Strict rate limiter (per IP) - for sensitive endpoints
export const strictRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes per IP
  keyGenerator: (req) => `strict:ip:${req.ip}`,
  message: 'Bạn đã gửi quá nhiều requests. Vui lòng thử lại sau 15 phút.',
});

// Auth rate limiter (per IP) - for login/register
export const authRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  keyGenerator: (req) => `auth:ip:${req.ip}`,
  message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
});

// Auth rate limiter (per user) - for login/register
export const authRateLimitUser = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per user
  keyGenerator: (req) => {
    const email = req.body?.email || req.body?.username;
    return email ? `auth:user:${email.toLowerCase()}` : null;
  },
  message: 'Quá nhiều lần thử đăng nhập cho tài khoản này. Vui lòng thử lại sau 15 phút.',
});

// Submission rate limiter (per user) - for code submissions
export const submissionRateLimit = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute per user
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `submission:user:${userId}` : `submission:ip:${req.ip}`;
  },
  message: 'Bạn đã submit quá nhiều lần. Vui lòng đợi một chút trước khi submit lại.',
});

// Chat rate limiter (per user) - for chatbot
export const chatRateLimit = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute per user
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `chat:user:${userId}` : `chat:ip:${req.ip}`;
  },
  message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi một chút.',
});

// File upload rate limiter (per user)
export const uploadRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes per user
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `upload:user:${userId}` : `upload:ip:${req.ip}`;
  },
  message: 'Bạn đã upload quá nhiều files. Vui lòng thử lại sau 15 phút.',
});

// Admin rate limiter (per user) - for admin operations
export const adminRateLimit = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per admin
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `admin:user:${userId}` : null;
  },
  message: 'Quá nhiều requests. Vui lòng thử lại sau.',
});

// Search rate limiter (per IP) - for search endpoints
export const searchRateLimit = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute per IP
  keyGenerator: (req) => `search:ip:${req.ip}`,
  message: 'Quá nhiều tìm kiếm. Vui lòng thử lại sau.',
});