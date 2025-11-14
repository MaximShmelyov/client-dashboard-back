import { NextFunction, Request, Response } from 'express';
import { ENV } from '../env';
import { logger } from '../utils/logger';

const blacklistedIpList = (ENV.BLACKLISTED_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

export async function blockBlacklistedIps(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.ip && blacklistedIpList.includes(req.ip)) {
    logger.info(`Blocked request from ${req.ip}`);
    return res.sendStatus(404);
  }
  next();
}
