/**
 * Users Router Module
 *
 * Provides endpoints for user account information and password management.
 *
 * Endpoints:
 *   - GET  /users/me              Get current authenticated user info
 *   - POST /users/changepassword  Change password for authenticated user
 *
 * All endpoints require authentication and are rate-limited.
 *
 * @module routes/users
 */
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { ENV } from '../env';
import { authMiddleware } from '../middleware/auth';
import { verifiedMiddleware } from '../middleware/verified';
import { prisma } from '../prisma';
import { createCallbackRequest } from '../services/callback.service';
import { getContacts } from '../services/contacts.service';
import { Contact } from '../types/bitrix';
import { components } from '../types/openapi';

type AccountInfoResponse = components['schemas']['AccountInfoResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];

/**
 * Creates an Express router for user-related endpoints.
 *
 * @param {Object} limiters - Object containing rate limiters for endpoints.
 * @param {RateLimitRequestHandler} limiters.apiLimiter - General API limiter.
 * @returns {Router} Configured Express router.
 */
export function createUsersRouter(limiters: {
  apiLimiter: RateLimitRequestHandler;
}): Router {
  const router = Router();

  /**
   * GET /users/me
   * Returns information about the currently authenticated user.
   * Requires authentication.
   *
   * Response: 200 AccountInfoResponse
   */
  router.get('/me', limiters.apiLimiter, authMiddleware, async (req, res) => {
    const user: User = (req as any).user as User;
    const contact = await getContacts({ EMAIL: user.email });
    const accountInfoResponse: AccountInfoResponse = {
      user: {
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString(),
        verifiedClient: contact.result.length > 0,
      },
    };
    res.status(200).json(accountInfoResponse);
  });

  /**
   * POST /users/changepassword
   * Changes the password for the authenticated user.
   * Requires authentication.
   *
   * Body: { oldPassword: string, newPassword: string }
   * Response: 204 No Content | 403 ErrorResponse (if old password invalid)
   */
  router.post(
    '/changepassword',
    limiters.apiLimiter,
    authMiddleware,
    async (req, res) => {
      const user: User = (req as any).user as User;
      const changePasswordRequest: ChangePasswordRequest = req.body;

      const validOldPassword = await bcrypt.compare(
        changePasswordRequest.oldPassword,
        user.password,
      );
      if (!validOldPassword) {
        const invalidPasswordError: ErrorResponse = {
          statusCode: 403,
          error: 'Forbidden',
          message: "Password doesn't match",
        };
        return res.status(403).json(invalidPasswordError);
      }

      const newHashed = await bcrypt.hash(
        changePasswordRequest.newPassword,
        ENV.PASSWORD_ROUNDS,
      );
      // @TODO: send notification (by email) to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newHashed,
        },
      });

      res.sendStatus(204);
    },
  );

  router.get(
    '/requestcallback',
    limiters.apiLimiter,
    authMiddleware,
    verifiedMiddleware,
    async (req, res) => {
      const contact = (req as any).contact as Contact;
      await createCallbackRequest(Number.parseInt(contact.ID));
      res.sendStatus(204);
    },
  );
  return router;
}
