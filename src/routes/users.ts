import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';
import { components } from '../types/openapi';

type AccountInfoResponse = components['schemas']['AccountInfoResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  const id = (req as any).user.id as number;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, createdAt: true },
  });
  if (!user) {
    const errorResponse: ErrorResponse = {
      statusCode: 400,
      error: 'Error',
      message: 'No user found',
    };
    return res.status(400).json(errorResponse);
  }
  const accountInfoResponse: AccountInfoResponse = {
    user: {
      email: user.email,
      name: user.name || undefined,
      createdAt: user.createdAt.toISOString(),
    },
  };
  res.status(200).json(accountInfoResponse);
});

export default router;
