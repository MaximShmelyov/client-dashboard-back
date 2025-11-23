import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { getContacts } from '../services/contacts.service';
import { BitrixListResponse, Contact } from '../types/bitrix';
import { components } from '../types/openapi';

type ErrorResponse = components['schemas']['ErrorResponse'];

export async function verifiedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user: User = (req as any).user as User;
  // @TODO: cache it
  let contacts: BitrixListResponse<Contact> | null = null;
  try {
    contacts = await getContacts({ EMAIL: user.email });
  } catch (e) {
    req.log.warn(e);
  }
  if (!contacts) {
    const contact: Contact = {
      ID: '-1',
      NAME: 'Unknown',
    };
    (req as any).contact = contact;
  } else {
    if (contacts.result.length <= 0) {
      const forbiddenErrorResponse: ErrorResponse = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is not verified client',
      };
      return res.status(403).json(forbiddenErrorResponse);
    }
    (req as any).contact = contacts.result[0];
  }
  next();
}
