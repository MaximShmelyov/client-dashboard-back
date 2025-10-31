import * as crypto from 'node:crypto';
import { ActivationCode } from '../models/ActivationCode';

export class ActivationRepository {
  async create(userId: number, ttlMinutes: number): Promise<string> {
    await this.clearCodes(userId);
    const code = crypto.randomInt(1000, 9999).toString();
    const expiresAt = new Date(
      Date.now() + ttlMinutes * 60 * 1000 /* @TODO: use ENV */,
    );
    await ActivationCode.create({ userId, code, expiresAt });
    return code;
  }

  async verify(userId: number, code: string): Promise<boolean> {
    const record = await ActivationCode.findOne({ userId, code });
    return !!record;
  }

  async consume(userId: number, code: string): Promise<boolean> {
    const result = await ActivationCode.findOneAndDelete({ userId, code });
    return !!result;
  }

  private async clearCodes(userId: number) {
    await ActivationCode.deleteMany({ userId });
  }
}
