import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 4000,
  ENVIRONMENT: process.env.ENVIRONMENT,
  PASSWORD_ROUNDS: Number(process.env.PASSWORD_ROUNDS!),
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN!,
  REFRESH_TOKEN_EXPIRES_IN_MINUTES: Number(
    process.env.REFRESH_TOKEN_EXPIRES_IN_MINUTES!,
  ),
  COOKIES_MAX_AGE: Number(process.env.COOKIES_MAX_AGE!),
  ACTIVATION_CODE_TTL_MINUTES: Number(process.env.ACTIVATION_CODE_TTL_MINUTES!),
  RESET_CODE_TTL_MINUTES: Number(process.env.RESET_CODE_TTL_MINUTES!),
  BITRIX_URL: process.env.BITRIX_WEBHOOK_URL!,
  BITRIX_ITEMS_PER_PAGE: process.env.BITRIX_ITEMS_PER_PAGE
    ? Number(process.env.BITRIX_ITEMS_PER_PAGE)
    : 50,
  REDIS_URL: process.env.REDIS_URL!,
  REDIS_SECRET: process.env.REDIS_SECRET!,
  REDIS_MAX_RETRY_COUNT: process.env.REDIS_MAX_RETRY_COUNT
    ? Number(process.env.REDIS_MAX_RETRY_COUNT)
    : 0,
  REDIS_CACHE_TTL_SHORT: process.env.REDIS_CACHE_TTL_SHORT
    ? Number(process.env.REDIS_CACHE_TTL_SHORT)
    : 60,
  REDIS_CACHE_TTL_LONG: process.env.REDIS_CACHE_TTL_LONG
    ? Number(process.env.REDIS_CACHE_TTL_LONG)
    : 300,
};
