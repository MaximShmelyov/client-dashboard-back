import { NextFunction, Request, Response } from 'express';

export async function verifiedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
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
