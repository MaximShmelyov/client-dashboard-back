import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

const createRedisStore = () =>
  new RedisStore({
    sendCommand: async (...args: string[]) => redis.sendCommand(args),
  });

const makeKeyGenerator = (suffix: string) => (req: Request) =>
  `${ipKeyGenerator(req.ip ?? '')}:${suffix}`;

export function createLimiters() {
  return {
    loginLimiter: rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      limit: 10,
      keyGenerator: makeKeyGenerator('/login'),
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many login attempts. Please try again later.',
      store: createRedisStore(),
    }),
    apiLimiter: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 200,
      keyGenerator: makeKeyGenerator('/api'),
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.',
      store: createRedisStore(),
    }),
    registerLimiter: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      limit: 20,
      keyGenerator: makeKeyGenerator('/register'),
      message:
        'Too many registration attempts from this IP, please try again later.',
      store: createRedisStore(),
    }),
    requestCodeLimiter: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      limit: 5,
      keyGenerator: makeKeyGenerator('/requestCode'),
      message:
        'Too many attempts to request an activation code. Please try again later.',
      store: createRedisStore(),
    }),
  };
}
