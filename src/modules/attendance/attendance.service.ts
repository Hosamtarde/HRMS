import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from './attendance.entity';
import { AttendanceStatus } from '../../common/enums/enums';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
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
      attendance_status: AttendanceStatus.PRESENT,
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

    // حساب ساعات العمل (الفرق بين check-in و check-out)
    const [inH, inM, inS] = record.check_in_time.split(':').map(Number);
    const [outH, outM, outS] = checkOutTime.split(':').map(Number);
    const inSeconds = inH * 3600 + inM * 60 + inS;
    const outSeconds = outH * 3600 + outM * 60 + outS;
    const workingHours = Number(((outSeconds - inSeconds) / 3600).toFixed(2));

    record.check_out_time = checkOutTime;
    record.working_hours = workingHours;

    return this.attendanceRepository.save(record);
  }

  async findAll(): Promise<AttendanceEntity[]> {
    return this.attendanceRepository.find({ relations: { user: true } });
  }

  async findByEmployee(userId: number): Promise<AttendanceEntity[]> {
    const records = await this.attendanceRepository.find({
      where: { user_id: userId },
      relations: { user: true },
      order: { attendance_date: 'DESC' },
    });

    if (records.length === 0) {
      throw new NotFoundException(`No attendance records found for user #${userId}`);
    }

    return records;
  }
}