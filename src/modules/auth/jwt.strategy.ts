import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

interface CachedUser {
  user_id: number;
  email: string;
  role: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 30000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cache = new Map<number, CachedUser>();

  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const now = Date.now();
    const cached = this.cache.get(payload.sub);

    if (cached && cached.expiresAt > now) {
      return {
        user_id: cached.user_id,
        email: cached.email,
        role: cached.role,
      };
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.status) {
      this.cache.delete(payload.sub);
      throw new UnauthorizedException('Account is inactive or does not exist');
    }

    this.cache.set(payload.sub, {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      expiresAt: now + CACHE_TTL_MS,
    });

    return { user_id: user.user_id, email: user.email, role: user.role };
  }
}