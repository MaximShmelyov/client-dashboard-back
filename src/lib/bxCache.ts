import { ENV } from '../env';
import { BitrixService } from '../services/bitrix24.service';
import { redis } from './redis';

const CACHE_PREFIX = 'bitrix:';
const DEFAULT_CACHE_TTL = ENV.REDIS_CACHE_TTL_LONG;

export class CachedBitrixService {
  static async call<T = any>(
    method: string,
    params: Record<string, any> = {},
    ttl: number = DEFAULT_CACHE_TTL,
  ): Promise<T> {
    if (!redis.isOpen) return BitrixService.call<T>(method, params);

    const cacheKey = `${CACHE_PREFIX}${method}:${JSON.stringify(params)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(
        `Return cached BX value: ${method}, ${JSON.stringify(params)}`,
      );
      return JSON.parse(cached) as T;
    }

    console.log(`Call to BX: ${method}`);
    const result = await BitrixService.call<T>(method, params);

    await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });

    return result;
  }
}
