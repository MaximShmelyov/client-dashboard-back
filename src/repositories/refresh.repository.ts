import { RefreshToken } from '../models/RefreshToken';

export class RefreshRepository {
  /**
   * Add newToken to db and obsolete previous user's token(-s)
   * @param userId
   * @param newToken - refresh token
   * @param ttlMinutes
   */
  async update(
    userId: number,
    newToken: string,
    ttlMinutes: number,
  ): Promise<void> {
    await this.deleteByUserId(userId);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await RefreshToken.create({ userId, token: newToken, expiresAt });
  }

  /**
   * Verify refresh token exists in db.
   * @param userId
   * @param token
   */
  async verify(userId: number, token: string): Promise<boolean> {
    const record = await RefreshToken.findOne({ userId, token: token });
    return !!record;
  }

  /**
   * Delete refresh token from db
   * (logout a session)
   * @param userId
   * @param token
   */
  async delete(userId: number, token: string): Promise<void> {
    await RefreshToken.findOneAndDelete({ userId, token: token });
  }

  /**
   * Delete all refresh tokens for user from db
   * (logout all user's session)
   * @param userId
   */
  async deleteByUserId(userId: number) {
    await RefreshToken.deleteMany({ userId });
  }
}
