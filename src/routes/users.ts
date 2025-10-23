import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/me", authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: (req as any).userId }, select: {id: true, email: true, name: true} });
    res.json(user);
});

export default router;
