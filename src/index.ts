import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'express-async-errors';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import YAML from 'yamljs';
import { ENV } from './env';
import { connectRedis, disconnectRedis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { createLimiters } from './middleware/limiters';
import { requestLogger } from './middleware/requestLogger';
import { connectMongo, disconnectMongo } from './mongo';
import { createAuthRouter } from './routes/auth';
import { createOrdersRouter } from './routes/orders';
import { createUsersRouter } from './routes/users';
import { logger } from './utils/logger';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());
app.use(
  cors({
    origin: [ENV.FRONTEND_PUBLIC_URL_CORS /*, 'http://localhost:8081'*/], // web + expo dev
    credentials: true,
  }),
);

const apiSpec = path.join(__dirname, '..', 'openapi', 'v1', 'schema.yaml');
const swaggerDoc = YAML.load(apiSpec);

app.set('trust proxy', true);

app.use((req, res, next) => {
  const clientIp = req.headers['x-real-ip'] || req.ip;
  req.log.info(`Client IP: ${clientIp}`);
  req.log.info(`Request.ip is ${req.ip}`);
  next();
});

app.get('/docs', (req, res) => res.json(swaggerDoc));

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
    ignorePaths: /\/profile\/requestcalculation/i, // ignore multipart/form-data endpoint as it breaks them
  }),
);

let server: http.Server;

async function bootstrap() {
  await connectMongo();
  await connectRedis();

  const limiters = createLimiters();

  app.use(
    '/auth',
    createAuthRouter({
      apiLimiter: limiters.apiLimiter,
      loginLimiter: limiters.loginLimiter,
      registerLimiter: limiters.registerLimiter,
      requestCodeLimiter: limiters.requestCodeLimiter,
    }),
  );
  app.use('/profile', createUsersRouter({ apiLimiter: limiters.apiLimiter }));
  app.use('/orders', createOrdersRouter({ apiLimiter: limiters.apiLimiter }));
  app.use(errorHandler);

  server = app.listen(ENV.PORT, '0.0.0.0', () => {
    logger.info(`Server running at port ${ENV.PORT}`);
  });
}

bootstrap().catch((e) => logger.error(e));

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async (err) => {
    if (err) {
      logger.error(`Error during server close ${String(err)}`);
      process.exit(1);
    }
    try {
      await disconnectMongo();
      await disconnectRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (e) {
      logger.error(`Error during shutdown ${String(e)}`);
      process.exit(1);
    }
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
