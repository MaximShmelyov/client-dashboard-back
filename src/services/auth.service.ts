import { ENV } from '../env';
import { prisma } from '../prisma';
import { ActivationRepository } from '../repositories/activation.repository';

const activationRepo = new ActivationRepository();

export class AuthService {
  async register(email: string, password: string, name?: string) {
    const user = await prisma.user.create({ data: { email, password, name } });

    const code = await activationRepo.create(
      user.id,
      ENV.ACTIVATION_CODE_TTL_MINUTES,
    );
    console.log(`Registered user ${user.email}, code: ${code}`);

    return { user };
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
}
