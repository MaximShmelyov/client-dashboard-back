import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

const createRedisStore = () =>
  new RedisStore({
    sendCommand: async (...args: string[]) => redis.sendCommand(args),
  });

export function createLimiters() {
  return {
    loginLimiter: rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many login attempts. Please try again later.',
      store: createRedisStore(),
    }),
    apiLimiter: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.',
      store: createRedisStore(),
    }),
    registerLimiter: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      limit: 10,
      message:
        'Too many registration attempts from this IP, please try again later.',
      store: createRedisStore(),
    }),
    requestCodeLimiter: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      limit: 5,
      message:
        'Too many attempts to request an activation code. Please try again later.',
      store: createRedisStore(),
    }),
  };
}
