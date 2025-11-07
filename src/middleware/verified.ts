import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { getContacts } from '../services/contacts.service';
import { components } from '../types/openapi';

type ErrorResponse = components['schemas']['ErrorResponse'];

export async function verifiedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user: User = (req as any).user as User;
  // @TODO: cache it
  const contacts = await getContacts({ EMAIL: user.email });
  if (contacts.result.length <= 0) {
    const forbiddenErrorResponse: ErrorResponse = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Account is not verified client',
    };
    return res.status(403).json(forbiddenErrorResponse);
  }
  (req as any).contact = contacts.result[0];

  next();
}
