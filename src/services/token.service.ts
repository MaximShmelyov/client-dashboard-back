import jwt from 'jsonwebtoken';
import { ENV } from '../env';

export abstract class TokenService {
  static generateTokens(userId: number) {
    if (!ENV.ACCESS_TOKEN_EXPIRES_IN) throw new Error('');
    if (!ENV.ACCESS_SECRET) throw new Error('');
    const accessToken = jwt.sign({ userId }, ENV.ACCESS_SECRET, {
      expiresIn: ENV.ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jwt.sign({ userId }, ENV.REFRESH_SECRET, {
      expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
  }
}
