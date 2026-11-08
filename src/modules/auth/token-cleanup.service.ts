import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async removeExpiredTokens(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result = await this.refreshTokensRepository.delete({
      expires_at: LessThan(cutoff),
    });

    if (result.affected) {
      this.logger.log(`Removed ${result.affected} expired refresh tokens`);
    }
  }
}
