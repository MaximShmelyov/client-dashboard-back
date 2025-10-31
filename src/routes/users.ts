import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).userId },
    select: { id: true, email: true, name: true },
  });
  res.json(user);
});

export default router;
