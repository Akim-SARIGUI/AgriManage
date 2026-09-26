import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { Role as SharedRole } from '@agrimanage/shared';
import { Role as PrismaRole } from '@agrimanage/database';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SALT_ROUNDS = 12;

type TokenRole = SharedRole;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        passwordHash,
        role: PrismaRole.USER,
      },
    });

    return this.toAuthUser(user);
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Message neutre (pas de fuite d’info sur l’existence du compte)
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé. Réessayez plus tard.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const lockedUntil =
        attempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil,
        },
      });

      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (dto.expectedRole && user.role !== dto.expectedRole) {
      if (dto.expectedRole === SharedRole.ADMIN) {
        throw new UnauthorizedException(
          'Compte non administrateur. Utilisez la connexion agriculteur.',
        );
      }
      throw new UnauthorizedException(
        'Compte administrateur. Utilisez la connexion admin.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    await this.issueTokens(user.id, user.email, user.role as TokenRole, res);
    return this.toAuthUser(user);
  }

  async logout(userId: string, res: Response) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    this.clearAuthCookies(res);
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toAuthUser(user);
  }

  async updateProfile(
    userId: string,
    payload: { fullName?: string; email?: string },
  ) {
    if (payload.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: payload.email.toLowerCase(),
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.fullName !== undefined
          ? { fullName: payload.fullName.trim() }
          : {}),
        ...(payload.email !== undefined
          ? { email: payload.email.toLowerCase() }
          : {}),
      },
    });

    return this.toAuthUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS),
      },
    });

    return { success: true as const };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Session expirée');
    }

    let payload: { sub: string; email: string; role: TokenRole };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Session expirée');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      throw new UnauthorizedException('Session invalide');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    await this.issueTokens(payload.sub, payload.email, payload.role, res);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toAuthUser(user);
  }

  async requestPasswordReset(email: string) {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    // Always return success to avoid account enumeration
    if (!user) {
      return { success: true };
    }

    const resetCode = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 30 * 60_000);

    await this.prisma.passwordReset.create({
      data: {
        email: normalized,
        resetCode,
        expiresAt,
      },
    });

    // Mail wiring comes in a later phase — code logged in development only
    if (this.config.get('NODE_ENV') !== 'production') {
      console.info(`[dev] Password reset code for ${normalized}: ${resetCode}`);
    }

    return { success: true };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const normalized = email.toLowerCase();
    const record = await this.prisma.passwordReset.findFirst({
      where: {
        email: normalized,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    if (record.resetCode !== code) {
      await this.prisma.passwordReset.update({
        where: { id: record.id },
        data: {
          failedAttempts: { increment: 1 },
          lastAttempt: new Date(),
        },
      });
      throw new BadRequestException('Code invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: normalized },
        data: { passwordHash, loginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordReset.deleteMany({ where: { email: normalized } }),
      this.prisma.refreshToken.deleteMany({
        where: { user: { email: normalized } },
      }),
    ]);

    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: TokenRole, res: Response) {
    const accessToken = await this.jwt.signAsync({
      sub: userId,
      email,
      role,
    });

    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as `${number}d` | `${number}h` | `${number}m` | `${number}s`,
      },
    );

    const expiresAt = this.parseExpiryDate(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...common,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...common,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: PrismaRole;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as SharedRole,
    };
  }
}
