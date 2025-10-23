import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../env";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    try {
        const token = authHeader.split(" ")[1];
        const payload = jwt.verify(token, ENV.ACCESS_SECRET) as { userId: number };
        (req as any).userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
