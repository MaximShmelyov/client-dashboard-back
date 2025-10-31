import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  const id = (req as any).user.id as number;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, createdAt: true },
  });
  res.json(user);
});

export default router;
