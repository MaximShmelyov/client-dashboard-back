declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    ENVIRONMENT: string;
    PASSWORD_ROUNDS: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: `${number}${'m' | 'd' | 'h' | 's'}`;
    REFRESH_TOKEN_EXPIRES_IN_MINUTES: string;
    COOKIES_MAX_AGE: string;
    ACTIVATION_CODE_TTL_MINUTES: string;
    RESET_CODE_TTL_MINUTES: string;
    BITRIX_URL: string;
  }
}
