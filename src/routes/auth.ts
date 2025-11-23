/**
 * Auth Router Module
 *
 * Provides authentication and authorization endpoints:
 * - User registration and activation
 * - Login and logout
 * - Token refresh
 * - Password reset and verification
 *
 * Endpoints:
 *   - POST   /auth/register         Register new user
 *   - GET    /auth/activate         Activate user account
 *   - POST   /auth/login            User login
 *   - GET    /auth/requestcode      Request activation code
 *   - POST   /auth/refresh          Refresh access token
 *   - GET    /auth/resetpassword    Request password reset code
 *   - GET    /auth/verifyresetcode  Verify password reset code and reset password
 *   - POST   /auth/logout           Logout user and remove refresh token
 *
 * Each endpoint uses appropriate rate limiting.
 *
 * @module routes/auth
 */
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { AuthService } from '../services/auth.service';
import { getContacts } from '../services/contacts.service';
import { ResetAuthService } from '../services/reset.auth.service';
import { TokenService } from '../services/token.service';
import { BitrixListResponse, Contact } from '../types/bitrix';
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
type VerifyResetQuery =
  paths['/auth/verifyresetcode']['get']['parameters']['query'];

/**
 * Creates an Express router for authentication-related endpoints.
 *
 * @param {Object} limiters - Object containing rate limiters for endpoints.
 * @param {RateLimitRequestHandler} limiters.apiLimiter - General API limiter.
 * @param {RateLimitRequestHandler} limiters.registerLimiter - Registration limiter.
 * @param {RateLimitRequestHandler} limiters.loginLimiter - Login limiter.
 * @param {RateLimitRequestHandler} limiters.requestCodeLimiter - Code request limiter.
 * @returns {Router} Configured Express router.
 */
export function createAuthRouter(limiters: {
  apiLimiter: RateLimitRequestHandler;
  registerLimiter: RateLimitRequestHandler;
  loginLimiter: RateLimitRequestHandler;
  requestCodeLimiter: RateLimitRequestHandler;
}): Router {
  const router = Router();
  const authService = new AuthService();
  const resetAuthService = new ResetAuthService();

  /**
   * POST /auth/register
   * Registers a new user. If user exists and not activated, deletes old record.
   * Body: { email, password, name }
   * Response: 201 RegisteredResponse | 409 RegisterConflictResponse
   */
  router.post('/register', limiters.registerLimiter, async (req, res) => {
    const body: RegisterRequest = req.body;
    const { email, password, name } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.activated) {
        const conflictResponse: RegisterConflictResponse = {
          statusCode: 409,
          error: 'Conflict',
          message: 'User already exists',
        };
        return res.status(409).json(conflictResponse);
      } else {
        await prisma.user.delete({ where: { id: existing.id } });
      }
    }

    const hashed = await bcrypt.hash(password, ENV.PASSWORD_ROUNDS);
    await authService.register(email, hashed, name);

    const registeredResponse: RegisteredResponse = {
      message: 'Registered',
    };

    res.status(201).json(registeredResponse);
  });

  /**
   * GET /auth/activate
   * Activates a user account using code and email.
   * Query: ?code=...&email=...
   * Response: 200 AccountActivatedResponse | 400/401 ErrorResponse
   */
  router.get('/activate', limiters.apiLimiter, async (req, res) => {
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

  /**
   * POST /auth/login
   * Authenticates user and returns access token and user info.
   * Body: { email, password }
   * Response: 200 AuthResponse | 401/403 ErrorResponse
   */
  router.post('/login', limiters.loginLimiter, async (req, res) => {
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
    let contact: BitrixListResponse<Contact> | null = null;
    try {
      contact = await getContacts({ EMAIL: user.email });
    } catch (e) {
      req.log.warn(e);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json(invalidCredentialsError);

    const isProd = ENV.ENVIRONMENT === 'production';
    const tokens = TokenService.generateTokens(user.id);
    await authService.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      ENV.REFRESH_TOKEN_EXPIRES_IN_MINUTES,
    );
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: ENV.COOKIES_MAX_AGE,
    });
    const authResponse: AuthResponse = {
      accessToken: tokens.accessToken,
      user: {
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString(),
        verifiedClient: contact ? contact.result.length > 0 : false,
      },
    };
    res.status(200).json(authResponse);
  });

  /**
   * GET /auth/requestcode
   * Requests activation code for non-activated user.
   * Query: ?email=...
   * Response: 200 ActivationCodeSentResponse | 400 ErrorResponse
   */
  router.get('/requestcode', limiters.requestCodeLimiter, async (req, res) => {
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
    req.log.info(`Generated code: ${code}`);

    const activationCodeSentResponse: ActivationCodeSentResponse = {
      message: 'Activation code sent',
    };
    res.status(200).json(activationCodeSentResponse);
  });

  /**
   * POST /auth/refresh
   * Refreshes access token using refresh token from cookies.
   * Response: 200 AccessTokenResponse | 401 ErrorResponse
   */
  router.post('/refresh', limiters.apiLimiter, async (req, res) => {
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
      await authService.removeRefreshToken(payload.userId, refreshToken);
      const tokens = TokenService.generateTokens(payload.userId);
      await authService.saveRefreshToken(
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

  /**
   * GET /auth/resetpassword
   * Requests password reset code for activated user.
   * Query: ?email=...
   * Response: 204 No Content | 400 ErrorResponse
   */
  router.get(
    '/resetpassword',
    limiters.requestCodeLimiter,
    async (req, res) => {
      const email = req.query.email as string;
      const user = await prisma.user.findUnique({
        where: { email, activated: true, blocked: false },
      });
      if (!user) {
        const errorResponse: ErrorResponse = {
          statusCode: 400,
          error: 'Bad request',
          message: 'No valid user found',
        };
        return res.status(400).json(errorResponse);
      }

      const resetCode = resetAuthService.requestResetCode(user.id);
      // @TODO: send reset code to user
      req.log.info(`Reset code: ${resetCode} for user ${user.id} generated.`);

      res.sendStatus(204);
    },
  );

  /**
   * GET /auth/verifyresetcode
   * Verifies reset code and resets password.
   * Query: ?email=...&code=...
   * Response: 204 No Content | 400/401 ErrorResponse
   */
  router.get('/verifyresetcode', limiters.apiLimiter, async (req, res) => {
    const { code, email } = req.query as VerifyResetQuery;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      const errorResponse: ErrorResponse = {
        statusCode: 400,
        error: 'Bad request',
        message: 'No valid user found',
      };
      return res.status(400).json(errorResponse);
    }
    if (!(await resetAuthService.resetPasswordByCode(user.id, code))) {
      const wrongCodeError: ErrorResponse = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid code',
      };
      return res.status(401).json(wrongCodeError);
    }

    res.sendStatus(204);
  });

  /**
   * POST /auth/logout
   * Logs out user and removes refresh token.
   * Response: 204 No Content
   */
  router.post('/logout', limiters.apiLimiter, async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error('refresh token is missing');
      const payload = await authService.verifyRefreshToken(refreshToken);
      if (!payload) throw new Error('payload is null');

      await authService.removeRefreshToken(payload.userId, refreshToken);
    } catch (e) {
      req.log.error(e);
    } finally {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    }
    res.sendStatus(204);
  });
  return router;
}
