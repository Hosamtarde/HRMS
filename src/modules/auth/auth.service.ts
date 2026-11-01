import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      this.logger.warn(`Login failed: no account found for ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.status) {
      this.logger.warn(`Login blocked: inactive account ${dto.email}`);
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      this.logger.warn(`Login failed: wrong password for ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);

    this.logger.log(`User #${user.user_id} logged in as ${user.role}`);

    return {
      ...tokens,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    let payload: { sub: number };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') as any,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.refreshTokensRepository.findOne({
      where: { token_hash: this.hashToken(token) },
    });

    if (!stored || stored.revoked_at !== null) {
      this.logger.warn(
        `Refresh rejected: reused or unknown token for user #${payload.sub}`,
      );
      await this.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.status) {
      await this.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Account is inactive or does not exist');
    }

    stored.revoked_at = new Date();
    await this.refreshTokensRepository.save(stored);

    return this.issueTokens(user);
  }

  async logout(userId: number) {
    await this.revokeAllForUser(userId);
    this.logger.log(`User #${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Account does not exist');
    }
    return {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number,
      profile_image: user.profile_image,
      status: user.status,
    };
  }

  private async issueTokens(user: {
    user_id: number;
    email: string;
    role: string;
  }) {
    const payload = { sub: user.user_id, email: user.email, role: user.role };

    const access_token = await this.jwtService.signAsync(payload);

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') as any,
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    const decoded = this.jwtService.decode(refresh_token) as { exp: number };

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        user_id: user.user_id,
        token_hash: this.hashToken(refresh_token),
        expires_at: new Date(decoded.exp * 1000),
        revoked_at: null,
      }),
    );

    return { access_token, refresh_token };
  }

  private async revokeAllForUser(userId: number): Promise<void> {
    await this.refreshTokensRepository.update(
      { user_id: userId, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}