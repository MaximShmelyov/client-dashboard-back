import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { ResetRepository } from '../repositories/reset.repository';
import { logger } from '../utils/logger';

const resetRepo = new ResetRepository();

/**
 * Service for handling password reset logic.
 */
export class ResetAuthService {
  /**
   * Requests a new reset code for the user.
   * @param userId User ID
   * @returns Generated reset code
   * @throws Error if user is not found
   */
  async requestResetCode(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User with id: ${userId} not found`);
    const code = await resetRepo.create(user.id, ENV.RESET_CODE_TTL_MINUTES);
    logger.debug(`Generated reset code: ${code} for user: ${userId}`);
    return code;
  }

  /**
   * Resets the user's password using a reset code.
   * @param userId User ID
   * @param code Reset code to verify
   * @returns true if password reset was successful, otherwise false
   */
  async resetPasswordByCode(userId: number, code: string): Promise<boolean> {
    const valid = await resetRepo.verify(userId, code);
    if (!valid) {
      logger.warn('Invalid or expired reset code');
      return false;
    }

    await resetRepo.consume(userId, code);

    const newPassword = this.generateNewPassword();
    const newHashed = await bcrypt.hash(newPassword, ENV.PASSWORD_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashed },
    });
    // @TODO: notify user about new password
    logger.debug(`User ${userId} got new password: ${newPassword}`);

    return true;
  }

  /**
   * Generates a new random password (8 lowercase hex characters).
   * @returns New password string
   */
  private generateNewPassword(): string {
    return crypto.randomBytes(4).toString('hex').toLowerCase();
  }
}
