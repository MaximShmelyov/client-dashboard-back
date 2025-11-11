import mongoose from 'mongoose';
import { logger } from './utils/logger';

const MONGO_URI = process.env.MONGO_URI;
const RETRY_INTERVAL_MS = 5000; // 5 seconds

export async function connectMongo() {
  if (!MONGO_URI) throw new Error('MONGO_URI is not set');

  while (true) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');
      }
      break; // Connected!
    } catch (err) {
      logger.error(
        `MongoDB connection failed, retrying in ${RETRY_INTERVAL_MS / 1000}s: ${err}`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
