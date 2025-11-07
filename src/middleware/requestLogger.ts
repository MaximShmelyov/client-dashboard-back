import crypto from 'crypto';
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => req.headers['x-request-id'] || crypto.randomUUID(),
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
