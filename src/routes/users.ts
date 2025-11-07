import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { ENV } from '../env';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';
import { getContacts } from '../services/contacts.service';
import { components } from '../types/openapi';

type AccountInfoResponse = components['schemas']['AccountInfoResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];

const router = Router();

router.get('/me', authMiddleware, async (req, res) => {
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

router.post('/changepassword', authMiddleware, async (req, res) => {
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
});

export default router;
