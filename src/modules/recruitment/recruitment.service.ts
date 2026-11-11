import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RecruitmentEntity } from './recruitment.entity';
import { ApplyDto } from './dto/apply.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { RecruitmentStatus } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import {
  allowedNextStatuses,
  canTransition,
  isTerminalStatus,
  safeUploadName,
} from './recruitment-rules.helper';
import {
  buildMeetingRoomName,
  buildMeetingUrl,
  canScheduleInterview,
  InterviewScheduledEvent,
  isFutureInterviewTime,
} from './interview.helper';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);
  private readonly jitsiBaseUrl: string;

  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepository: Repository<RecruitmentEntity>,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService,
  ) {
    this.jitsiBaseUrl =
      config.get<string>('JITSI_BASE_URL') ?? 'https://meet.jit.si';
  }

  async apply(dto: ApplyDto, cvFilePath: string): Promise<RecruitmentEntity> {
    const application = this.recruitmentRepository.create({
      ...dto,
      cv_file: cvFilePath,
      application_status: RecruitmentStatus.PENDING,
    });
    return this.recruitmentRepository.save(application);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RecruitmentEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.recruitmentRepository.findAndCount({
      order: { submission_date: 'DESC', application_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number): Promise<RecruitmentEntity> {
    const application = await this.recruitmentRepository.findOne({
      where: { application_id: id },
    });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    return application;
  }

  async updateStatus(
    id: number,
    status: RecruitmentStatus,
  ): Promise<RecruitmentEntity> {
    const application = await this.findOne(id);
    const current = application.application_status;

    if (!canTransition(current, status)) {
      throw new BadRequestException(
        isTerminalStatus(current)
          ? `This application is already ${current} and cannot change again.`
          : `An application that is ${current} can only move to: ${allowedNextStatuses(current).join(', ')}.`,
      );
    }

    if (status === RecruitmentStatus.INTERVIEW_SCHEDULED) {
      throw new BadRequestException(
        'Use the interview scheduling endpoint to move an application to interview_scheduled.',
      );
    }

    application.application_status = status;
    const saved = await this.recruitmentRepository.save(application);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.APPLICATION_STATUS, {
      applicationId: saved.application_id,
      applicantName: saved.applicant_name,
      email: saved.email,
      position: saved.applied_position,
      status,
    });

    this.logger.log(
      `Application #${id} status changed from ${current} to ${status}`,
    );

    return saved;
  }

  async scheduleInterview(
    id: number,
    dto: ScheduleInterviewDto,
  ): Promise<RecruitmentEntity> {
    const application = await this.findOne(id);
    const current = application.application_status;

    if (!canScheduleInterview(current)) {
      throw new BadRequestException(
        `An application that is ${current} cannot be scheduled for an interview.`,
      );
    }

    const interviewAt = new Date(dto.interview_at);
    if (!isFutureInterviewTime(interviewAt)) {
      throw new BadRequestException('The interview time must be in the future');
    }

    const rescheduled = current === RecruitmentStatus.INTERVIEW_SCHEDULED;
    const meetingUrl =
      application.meeting_url ??
      buildMeetingUrl(this.jitsiBaseUrl, buildMeetingRoomName(id));

    application.interview_at = interviewAt;
    application.meeting_url = meetingUrl;
    application.reminder_sent_at = null;
    application.application_status = RecruitmentStatus.INTERVIEW_SCHEDULED;
    const saved = await this.recruitmentRepository.save(application);

    const event: InterviewScheduledEvent = {
      applicationId: saved.application_id,
      applicantName: saved.applicant_name,
      email: saved.email,
      position: saved.applied_position,
      interviewAt,
      meetingUrl,
      rescheduled,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENTS.INTERVIEW_SCHEDULED, event);

    this.logger.log(
      `Application #${id} interview ${rescheduled ? 'rescheduled' : 'scheduled'} for ${interviewAt.toISOString()}`,
    );

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const application = await this.findOne(id);
    const fileName = safeUploadName(application.cv_file);

    await this.recruitmentRepository.remove(application);

    if (fileName) {
      const filePath = join(process.cwd(), 'uploads', fileName);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.warn(
          `Application #${id} deleted but its CV file was not: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`Application #${id} deleted`);

    return { message: `Application #${id} deleted successfully` };
  }
}
