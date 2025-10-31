declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    PASSWORD_ROUNDS: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: `${number}${'m' | 'd' | 'h' | 's'}`;
    REFRESH_TOKEN_EXPIRES_IN: `${number}${'m' | 'd' | 'h' | 's'}`;
    COOKIES_MAX_AGE: string;
    ACTIVATION_CODE_TTL_MINUTES: string;
  }
}
