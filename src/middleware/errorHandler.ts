import { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  req.log.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
      requestId: (req as any).id,
    },
    'Unhandled error',
  );

  if (err.status && err.errors) {
    res.status(err.status).json({
      statusCode: err.status,
      error: err.name,
      message: err.message,
      details: err.errors,
    });
  } else {
    req.log.error(err);
    res.status(500).json({ statusCode: 500, error: 'Internal Server Error' });
  }
}
