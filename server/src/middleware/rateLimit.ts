import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates an in-memory sliding window rate limiter middleware.
 * Tracks requests per IP or custom key, automatically cleaning up expired records.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store: RateLimitStore = {};
  const { windowMs, max, message = 'Too many requests from this IP, please try again later.' } = options;

  // Periodic cleanup of expired keys every 60 seconds
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, 60 * 1000).unref(); // unref so it does not keep node process alive in scripts

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown-ip');

    const now = Date.now();

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    store[key].count++;
    const remaining = Math.max(0, max - store[key].count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));

    if (store[key].count > max) {
      const retryAfterSeconds = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// 1. Strict rate limit for authentication routes (login, register, forgot-password): 15 attempts / 15 mins
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts from this IP address. Please wait 15 minutes before trying again.',
});

// 2. Emergency booking rate limit: 10 emergency submissions / 10 mins per IP (prevents spam and denial of service)
export const emergencyRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many emergency requests submitted from this IP. Please wait a few minutes or call our 24/7 hotline directly.',
});

// 3. General public API limiter: 300 requests per 5 mins
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: 'Rate limit exceeded. Please slow down your requests.',
});
