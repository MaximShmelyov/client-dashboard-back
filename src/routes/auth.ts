import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { components, paths } from '../types/openapi';

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisteredResponse = components['schemas']['RegisteredResponse'];
type AuthResponse = components['schemas']['AuthResponse'];
type RegisterConflictResponse =
  paths['/auth/register']['post']['responses']['409']['content']['application/json'];
type ErrorResponse = components['schemas']['ErrorResponse'];

const router = Router();
const authService = new AuthService();

router.post('/register', async (req, res) => {
  const body: RegisterRequest = req.body;
  const { email, password, name } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const conflictResponse: RegisterConflictResponse = {
      statusCode: 409,
      error: 'Conflict',
      message: 'User already exists',
    };
    return res.status(409).json(conflictResponse);
  }

  const hashed = await bcrypt.hash(password, ENV.PASSWORD_ROUNDS);
  await authService.register(email, hashed, name);

  const registeredResponse: RegisteredResponse = {
    message: 'Registered',
  };

  res.status(201).json(registeredResponse);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const tokens = TokenService.generateTokens(user.id);
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ENV.COOKIES_MAX_AGE,
  });
  res.json({
    accessToken: tokens.accessToken,
    user: { id: user.id, email: user.email },
  });
});

router.get('/requestcode/:email', async (req, res) => {
  const email = req.params.email;

  const user = await prisma.user.findUnique({
    where: { email, activated: false, blocked: false },
  });
  if (!user) {
    const errorResponse: ErrorResponse = {
      statusCode: 400,
      error: 'Unauthorized',
      message: 'No valid user found',
    };
    return res.status(400).json(errorResponse);
  }
});

router.post('/refresh', (req, res) => {
  const refresh = req.cookies.refreshToken;
  if (!refresh) return res.status(401).json({ error: 'Missing refresh token' });

  try {
    const payload = jwt.verify(refresh, ENV.REFRESH_SECRET) as {
      userId: number;
    };
    const tokens = TokenService.generateTokens(payload.userId);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ENV.COOKIES_MAX_AGE,
    });
    res.json({ accessToken: tokens.accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (_, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true });
});

export default router;
