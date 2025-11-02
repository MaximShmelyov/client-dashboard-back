import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { components } from '../types/openapi';

type ErrorResponse = components['schemas']['ErrorResponse'];

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, ENV.ACCESS_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    if (!user) throw new Error('User not found');
    if (user.blocked || !user.activated) {
      const forbiddenErrorResponse: ErrorResponse = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account blocked or not active',
      };
      return res.status(403).json(forbiddenErrorResponse);
    }

    (req as any).user = user;
    next();
  } catch {
    const unauthorizedErrorResponse: ErrorResponse = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    };
    res.status(401).json(unauthorizedErrorResponse);
  }
}
