import * as crypto from 'node:crypto';
import { ResetCode } from '../models/ResetCode';

/**
 * Repository for managing user password reset codes.
 */
export class ResetRepository {
  /**
   * Creates a new reset code for the user and saves it to the database.
   * Removes all previous codes for the user.
   * @param userId User ID
   * @param ttlMinutes Code time-to-live in minutes
   * @returns Generated reset code (8-character uppercase HEX string)
   */
  async create(userId: number, ttlMinutes: number): Promise<string> {
    await this.clearCodes(userId);
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await ResetCode.create({ userId, code, expiresAt });
    return code;
  }

  /**
   * Checks if a valid reset code exists for the user.
   * @param userId User ID
   * @param code Code to verify
   * @returns true if the code exists, otherwise false
   */
  async verify(userId: number, code: string): Promise<boolean> {
    const record = await ResetCode.findOne({ userId, code });
    return !!record;
  }

  /**
   * Deletes (consumes) the reset code after use.
   * @param userId User ID
   * @param code Code to delete
   * @returns true if the code was found and deleted, otherwise false
   */
  async consume(userId: number, code: string): Promise<boolean> {
    const result = await ResetCode.findOneAndDelete({ userId, code });
    return !!result;
  }

  /**
   * Removes all reset codes for the user.
   * @param userId User ID
   */
  private async clearCodes(userId: number) {
    await ResetCode.deleteMany({ userId });
  }
}
