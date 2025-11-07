import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'express-async-errors';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import YAML from 'yamljs';
import { ENV } from './env';
import { connectRedis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { createLimiters } from './middleware/limiters';
import { requestLogger } from './middleware/requestLogger';
import { connectMongo } from './mongo';
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
    origin: ['http://localhost:5173', 'http://localhost:8081'], // web + expo dev
    credentials: true,
  }),
);

const apiSpec = path.join(__dirname, '..', 'openapi', 'v1', 'schema.yaml');
const swaggerDoc = YAML.load(apiSpec);

app.get('/docs', (req, res) => res.json(swaggerDoc));

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
);

app.use(errorHandler);

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

  app.listen(ENV.PORT, () => {
    logger.debug(`Server running at http://localhost:${ENV.PORT}`);
  });
}

bootstrap().catch(console.error);
