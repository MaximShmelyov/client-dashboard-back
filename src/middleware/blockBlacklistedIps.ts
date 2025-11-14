import { NextFunction, Request, Response } from 'express';
import { ENV } from '../env';

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
    req.log.info(`Blocked request from ${req.ip}`);
    return res.sendStatus(404);
  }
  next();
}
