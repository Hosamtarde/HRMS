import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentEntity } from './recruitment.entity';
import { RecruitmentService } from './recruitment.service';
import { InterviewReminderService } from './interview-reminder.service';
import { RecruitmentController } from './recruitment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitmentEntity])],
  controllers: [RecruitmentController],
  providers: [RecruitmentService, InterviewReminderService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
