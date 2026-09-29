import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from './attendance.entity';
import { AttendanceStatus } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';


@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private readonly workStartTime = '08:00:00';
  private readonly graceMinutes = 15;

  private toSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private determineStatus(checkInTime: string): AttendanceStatus {
    const allowedSeconds =
      this.toSeconds(this.workStartTime) + this.graceMinutes * 60;

    return this.toSeconds(checkInTime) > allowedSeconds
      ? AttendanceStatus.LATE
      : AttendanceStatus.PRESENT;
  }

  async checkIn(userId: number): Promise<AttendanceEntity> {
    const today = this.getToday();

    const existing = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });

    if (existing) {
      throw new BadRequestException('You have already checked in today');
    }

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; 

    const record = this.attendanceRepository.create({
      user_id: userId,
      check_in_time: currentTime,
      attendance_date: today,
      attendance_status: this.determineStatus(currentTime),
    });

    return this.attendanceRepository.save(record);
  }

  async checkOut(userId: number): Promise<AttendanceEntity> {
    const today = this.getToday();

    const record = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });

    if (!record) {
      throw new BadRequestException('You have not checked in today');
    }

    if (record.check_out_time) {
      throw new BadRequestException('You have already checked out today');
    }

    const now = new Date();
    const checkOutTime = now.toTimeString().split(' ')[0];

    const inSeconds = this.toSeconds(record.check_in_time);
    const outSeconds = this.toSeconds(checkOutTime);
    const workingHours = Number(((outSeconds - inSeconds) / 3600).toFixed(2));

    record.check_out_time = checkOutTime;
    record.working_hours = workingHours;

    return this.attendanceRepository.save(record);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<AttendanceEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.attendanceRepository.findAndCount({
      relations: { user: true },
      order: { attendance_date: 'DESC', user_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findByEmployee(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<AttendanceEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.attendanceRepository.findAndCount({
      where: { user_id: userId },
      relations: { user: true },
      order: { attendance_date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException(
        `No attendance records found for user #${userId}`,
      );
    }

    return buildPaginatedResult(data, total, page, limit);
  }
}