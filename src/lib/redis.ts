import { createClient } from 'redis';
import { ENV } from '../env';

export const redis = createClient({
  url: ENV.REDIS_URL,
  password: ENV.REDIS_SECRET,
  socket: {
    reconnectStrategy(retries) {
      if (retries >= ENV.REDIS_MAX_RETRY_COUNT)
        return new Error('Max retries reached.');
      return 1000 /* Wait for 1 second */;
    },
  },
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('Connected to Redis');
  }
}
