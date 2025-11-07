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
import { requestLogger } from './middleware/requestLogger';
import { connectMongo } from './mongo';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
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

app.use('/auth', authRoutes);
app.use('/profile', userRoutes);
app.use('/orders', orderRoutes);

app.use(errorHandler);

async function bootstrap() {
  await connectMongo();
  try {
    await connectRedis();
  } catch {
    logger.warn('Work w/o redis');
  }

  app.listen(ENV.PORT, () => {
    logger.debug(`Server running at http://localhost:${ENV.PORT}`);
  });
}

bootstrap().catch(console.error);
