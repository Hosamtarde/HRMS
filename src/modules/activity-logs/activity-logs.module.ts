import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogEntity } from './activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogEntity])],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}