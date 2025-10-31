import bcrypt from 'bcrypt';
import { Router } from 'express';
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
type ActivationCodeSentResponse =
  components['schemas']['ActivationCodeSentResponse'];
type AccessTokenResponse = components['schemas']['AccessTokenResponse'];
type AccountActivatedResponse =
  components['schemas']['AccountActivatedResponse'];

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

router.get('/activate', async (req, res) => {
  const code = req.query.code as string;
  const email = req.query.email as string;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const errorResponse: ErrorResponse = {
      statusCode: 400,
      error: 'Error',
      message: 'No valid user found',
    };
    return res.status(400).json(errorResponse);
  }

  if (!(await authService.activateAccount(user.id, code))) {
    const errorResponse: ErrorResponse = {
      statusCode: 401,
      error: 'Error',
      message: 'Invalid code provided',
    };
    return res.status(401).json(errorResponse);
  }

  const accountActivatedResponse: AccountActivatedResponse = {
    message: 'Account activated',
  };
  res.status(200).json(accountActivatedResponse);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  const invalidCredentialsError: ErrorResponse = {
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Invalid credentials',
  };

  if (!user) return res.status(401).json(invalidCredentialsError);

  if (user.blocked || !user.activated) {
    const notAllowedError: ErrorResponse = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Account blocked or not active',
    };
    return res.status(403).json(notAllowedError);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json(invalidCredentialsError);

  const tokens = TokenService.generateTokens(user.id);
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ENV.COOKIES_MAX_AGE,
  });
  const authResponse: AuthResponse = {
    accessToken: tokens.accessToken,
    user: {
      email: user.email,
      name: user.name || undefined,
      createdAt: user.createdAt.toISOString(),
    },
  };
  res.status(200).json(authResponse);
});

router.get('/requestcode', async (req, res) => {
  const email = req.query.email as string;

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

  const code = await authService.requestCode(user.id);
  // @TODO: request code sending

  const activationCodeSentResponse: ActivationCodeSentResponse = {
    message: 'Activation code sent',
  };
  res.status(200).json(activationCodeSentResponse);
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    const errorResponse: ErrorResponse = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing refresh token',
    };
    return res.status(401).json(errorResponse);
  }

  try {
    const payload = await authService.verifyRefreshToken(refreshToken);
    if (!payload) throw new Error('payload is null');
    const tokens = TokenService.generateTokens(payload.userId);
    await authService.updateRefreshToken(
      payload.userId,
      tokens.refreshToken,
      ENV.REFRESH_TOKEN_EXPIRES_IN_MINUTES,
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ENV.COOKIES_MAX_AGE,
    });
    const accessTokenResponse: AccessTokenResponse = {
      accessToken: tokens.accessToken,
    };
    res.status(200).json(accessTokenResponse);
  } catch {
    const errorResponse: ErrorResponse = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    };
    res.status(401).json(errorResponse);
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new Error('refresh token is missing');
    const payload = await authService.verifyRefreshToken(refreshToken);
    if (!payload) throw new Error('payload is null');

    await authService.removeRefreshToken(payload.userId, refreshToken);
  } catch (e) {
    console.error(e);
  } finally {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }
  res.sendStatus(204);
});

export default router;
