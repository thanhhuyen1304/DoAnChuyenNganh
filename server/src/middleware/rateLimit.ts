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
