import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

const prismaBase = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? [] : ['warn', 'error'],
});

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        try {
          const result = await query(args);
          const duration = Date.now() - start;
          logger.debug({ model, operation, duration });
          return result;
        } catch (error) {
          logger.error({ model, operation, error }, 'Prisma query failed');
          throw error;
        }
      },
    },
  },
});
