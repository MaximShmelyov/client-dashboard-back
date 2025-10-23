import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { ENV } from "../env";

const router = Router();

// helper: issue tokens
function generateTokens(userId: number) {
    const accessToken = jwt.sign({ userId }, ENV.ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, ENV.REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing data" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });

    const tokens = generateTokens(user.id);
    res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({ accessToken: tokens.accessToken, user: { id: user.id, email: user.email } });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const tokens = generateTokens(user.id);
    res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: tokens.accessToken, user: { id: user.id, email: user.email } });
});

router.post("/refresh", (req, res) => {
    const refresh = req.cookies.refreshToken;
    if (!refresh) return res.status(401).json({ error: "Missing refresh token" });

    try {
        const payload = jwt.verify(refresh, ENV.REFRESH_SECRET) as { userId: number };
        const tokens = generateTokens(payload.userId);

        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken: tokens.accessToken });
    } catch {
        res.status(401).json({ error: "Invalid refresh token" });
    }
});

router.post("/logout", (_, res) => {
    res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ success: true });
});

export default router;
