import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AttendanceEntity } from './attendance.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { OrgChartService } from '../org-chart/org-chart.service';
import { Role } from '../../common/enums/enums';
import { getToday } from '../../common/utils/date.util';
import {
  canViewEmployeeAttendance,
  determineStatus,
  monthRange,
  workingHoursBetween,
} from './attendance.helper';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    private readonly orgChartService: OrgChartService,
  ) {}

  async checkIn(userId: number): Promise<AttendanceEntity> {
    const today = getToday();

    const existing = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });

    if (existing) {
      throw new BadRequestException('You have already checked in today');
    }

    const currentTime = new Date().toTimeString().split(' ')[0];

    const record = this.attendanceRepository.create({
      user_id: userId,
      check_in_time: currentTime,
      attendance_date: today,
      attendance_status: determineStatus(currentTime),
    });

    return this.attendanceRepository.save(record);
  }

  async checkOut(userId: number): Promise<AttendanceEntity> {
    const today = getToday();

    const record = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });

    if (!record) {
      throw new BadRequestException('You have not checked in today');
    }

    if (record.check_out_time) {
      throw new BadRequestException('You have already checked out today');
    }

    const checkOutTime = new Date().toTimeString().split(' ')[0];

    record.check_out_time = checkOutTime;
    record.working_hours = workingHoursBetween(
      record.check_in_time,
      checkOutTime,
    );

    return this.attendanceRepository.save(record);
  }

  async findAll(
    userId: number,
    role: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<AttendanceEntity>> {
    const { page, limit } = paginationDto;

    let where: Record<string, unknown> = { user_id: userId };
    if (role === Role.HR_ADMIN) {
      where = {};
    } else if (role === Role.MANAGER) {
      const scopeIds = await this.orgChartService.getSubtreeIds(userId);
      where = scopeIds.length ? { user_id: In(scopeIds) } : { user_id: userId };
    }

    const [data, total] = await this.attendanceRepository.findAndCount({
      where,
      relations: { user: true },
      order: { attendance_date: 'DESC', user_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findByEmployee(
    userId: number,
    requesterId: number,
    role: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<AttendanceEntity>> {
    const { page, limit } = paginationDto;

    const isInScope =
      role === Role.MANAGER && userId !== requesterId
        ? await this.orgChartService.isInSubtree(requesterId, userId)
        : false;

    if (
      !canViewEmployeeAttendance({
        role,
        actorId: requesterId,
        targetId: userId,
        isInScope,
      })
    ) {
      throw new ForbiddenException(
        'You do not have access to this attendance record',
      );
    }

    const [data, total] = await this.attendanceRepository.findAndCount({
      where: { user_id: userId },
      relations: { user: true },
      order: { attendance_date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async getAttendedDates(
    userId: number,
    salaryMonth: string,
  ): Promise<Set<string>> {
    const { start, end } = monthRange(salaryMonth);

    const records = await this.attendanceRepository.find({
      where: {
        user_id: userId,
        attendance_date: Between(start, end),
      },
      select: { attendance_date: true },
    });

    return new Set(records.map((r) => r.attendance_date));
  }
}
