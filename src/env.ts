import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 4000,
  PASSWORD_ROUNDS: Number(process.env.PASSWORD_ROUNDS!),
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN!,
  REFRESH_TOKEN_EXPIRES_IN_MINUTES: Number(
    process.env.REFRESH_TOKEN_EXPIRES_IN_MINUTES!,
  ),
  COOKIES_MAX_AGE: Number(process.env.COOKIES_MAX_AGE!),
  ACTIVATION_CODE_TTL_MINUTES: Number(process.env.ACTIVATION_CODE_TTL_MINUTES!),
};
