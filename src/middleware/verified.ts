import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { components } from '../types/openapi';

type ErrorResponse = components['schemas']['ErrorResponse'];

export async function verifiedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user: User = (req as any).user as User;
  if (!user.verifiedClient) {
    const forbiddenErrorResponse: ErrorResponse = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Account is not verified client',
    };
    return res.status(403).json(forbiddenErrorResponse);
  }

  next();
}
