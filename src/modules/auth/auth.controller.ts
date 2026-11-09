import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('user_id') userId: number) {
    return this.authService.me(userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(@CurrentUser('user_id') userId: number) {
    return this.authService.logout(userId);
  }
}
