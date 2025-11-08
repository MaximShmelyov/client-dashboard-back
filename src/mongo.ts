import mongoose from 'mongoose';
import { logger } from './utils/logger';

const MONGO_URI = process.env.MONGO_URI;

export async function connectMongo() {
  if (!MONGO_URI) throw new Error('MONGO_URI is not set');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
  }
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
