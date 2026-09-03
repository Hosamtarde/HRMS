import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity])],
  providers: [AttendanceService],
  exports: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}