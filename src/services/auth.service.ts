import jwt from 'jsonwebtoken';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { ActivationRepository } from '../repositories/activation.repository';
import { RefreshRepository } from '../repositories/refresh.repository';
import { logger } from '../utils/logger';

const activationRepo = new ActivationRepository();
const refreshRepo = new RefreshRepository();

export class AuthService {
  async register(email: string, password: string, name?: string) {
    const user = await prisma.user.create({ data: { email, password, name } });
    logger.debug(`Registered user ${user.email}`);

    return { user };
  }

  async requestCode(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User with id: ${userId} not found`);
    const code = await activationRepo.create(
      user.id,
      ENV.ACTIVATION_CODE_TTL_MINUTES,
    );
    logger.debug(`Generated code: ${code} for user: ${userId}`);
    return code;
  }

  async activateAccount(userId: number, code: string): Promise<boolean> {
    const valid = await activationRepo.verify(userId, code);
    if (!valid) throw new Error('Invalid or expired activation code');

    await prisma.user.update({
      where: { id: userId },
      data: { activated: true },
    });

    await activationRepo.consume(userId, code);

    return true;
  }

  /**
   * Add new refresh token to db for specified user.
   * @param userId
   * @param token
   * @param ttlMinutes
   */
  async saveRefreshToken(
    userId: number,
    token: string,
    ttlMinutes: number,
  ): Promise<void> {
    await refreshRepo.save(userId, token, ttlMinutes);
  }

  /**
   * Verify refresh token is valid and exists in db.
   * @param token - refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ userId: number } | null> {
    const payload = jwt.verify(token, ENV.REFRESH_SECRET) as {
      userId: number;
    };
    if (!(await refreshRepo.verify(payload.userId, token))) {
      return null;
    }

    return payload;
  }

  /**
   * Logout by removing refresh token(-s) from db.
   * If no refresh token is provided, all tokens for user will be deleted.
   * @param userId
   * @param token
   */
  async removeRefreshToken(userId: number, token?: string): Promise<void> {
    if (!token) {
      await refreshRepo.deleteByUserId(userId);
    } else {
      await refreshRepo.delete(userId, token);
    }
  }
}
