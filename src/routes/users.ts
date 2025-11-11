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
import bcrypt from 'bcryptjs';
import { Router } from 'express';
// import { Request } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { ENV } from '../env';
import { authMiddleware } from '../middleware/auth';
import { verifiedMiddleware } from '../middleware/verified';
import { prisma } from '../prisma';
import {
  createCalculationRequest,
  createCallbackRequest,
} from '../services/callback.service';
import { getContacts } from '../services/contacts.service';
import { Contact } from '../types/bitrix';
import { components } from '../types/openapi';
import calculationRequestToString from '../utils/bitrixCalculationRequestConverter';
import { createMulterS3ImageUploader } from '../utils/multerS3ImageUploader';
import { createS3Client } from '../utils/s3Client';

declare module 'express-serve-static-core' {
  interface Request {
    fileUploadFailed?: boolean;
  }
}

type MulterS3File = Express.Multer.File & {
  key: string;
  location: string;
};

type AccountInfoResponse = components['schemas']['AccountInfoResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
type RequestCalculationRequest =
  components['schemas']['RequestCalculationRequest'];
type RequestCalculationResponse =
  components['schemas']['RequestCalculationResponse'];

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
  const s3Client = createS3Client();
  const multerS3Uploader = createMulterS3ImageUploader(s3Client);

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

  /**
   * POST /users/requestcalculation
   * Creates a new calculation request.
   * Requires authentication and verified user status.
   *
   * Request (multipart/form-data):
   *   - photo (optional, file)
   *   - other fields according to RequestCalculationRequest schema
   *
   * Actions:
   *   - Attempts to upload the photo (if provided) to S3 with a unique filename.
   *   - If the photo fails to upload or is invalid, the request proceeds without the photo.
   *   - Generates a description for the request.
   *   - Creates a calculation request in the CRM.
   *
   * Response: 200 application/json
   *   - fileUploadFailed: boolean — true if the file upload failed or the file was invalid.
   *
   * Errors:
   *   - 401 Unauthorized
   *   - 403 Forbidden (blocked, inactive, or unverified user)
   *
   */
  router.post(
    '/requestcalculation',
    limiters.apiLimiter,
    authMiddleware,
    verifiedMiddleware,
    (req, res, next) => {
      req.log.debug(`Uploading photo to S3 storage.`);
      multerS3Uploader.single('photo')(req, res, function (err) {
        if (err) {
          req.log.error(`Got error in multerUploader.single: ${err}`);
          req.file = undefined;
          req.fileUploadFailed = true;
        }
        next();
      });
    },
    async (req, res) => {
      const requestCalculationRequest: RequestCalculationRequest = req.body;
      const contact = (req as any).contact as Contact;

      let photoUrl: string = '';

      if (req.file) {
        const file = req.file as MulterS3File;
        photoUrl = `${ENV.S3_PUBLIC_URL}${file.key}`;
        req.log.info(`Photo already uploaded to S3: ${photoUrl}`);
      } else {
        req.log.debug(`Got no file in calculation request`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photo, ...requestWithoutPhoto } = requestCalculationRequest;
      const description = calculationRequestToString(
        requestWithoutPhoto,
        photoUrl,
      );
      await createCalculationRequest(Number.parseInt(contact.ID), description);

      const requestCalculationResponse: RequestCalculationResponse = {
        fileUploadFailed: req.fileUploadFailed,
      };
      res.status(200).json(requestCalculationResponse);
    },
  );
  return router;
}
