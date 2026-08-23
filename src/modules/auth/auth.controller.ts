import { Body, Controller, Get, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/refresh — يرجع Access Token جديد
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  // GET /auth/me — محمي
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me() {
    return { message: 'You are authenticated!' };
  }

  // POST /auth/logout — محمي
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout() {
    return { message: 'Logged out successfully. Please discard your token.' };
  }
}