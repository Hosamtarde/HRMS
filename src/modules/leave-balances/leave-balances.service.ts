import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalanceEntity } from './leave-balance.entity';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { LeaveTypeEntity } from '../leave-types/leave-type.entity';
import { UserEntity } from '../users/user.entity';
import { PaymentType } from '../../common/enums/enums';
import {
  SERVICE_TIERS,
  CARRY_OVER_CAP,
  PRORATE_FIRST_YEAR,
} from './leave-balance.constants';

/** الشكل الموحّد الذي تُعرض به الأرصدة في كل المسارات */
export interface PresentedLeaveBalance {
  balance_id: number;
  user_id: number;
  user?: UserEntity;
  leave_type_id: number;
  type_name?: string;
  payment_type?: PaymentType;
  year: number;
  total_days: number;
  carried_over: number;
  used_days: number;
  available_days: number;
  is_manual: boolean;
}

@Injectable()
export class LeaveBalancesService {
  private readonly logger = new Logger(LeaveBalancesService.name);

  constructor(
    @InjectRepository(LeaveBalanceEntity)
    private readonly leaveBalancesRepository: Repository<LeaveBalanceEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly employeeProfilesRepository: Repository<EmployeeProfileEntity>,
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypesRepository: Repository<LeaveTypeEntity>,
  ) {}

  /** الرصيد المتاح = المستحق + المرحّل − المستهلك */
  private computeAvailable(balance: LeaveBalanceEntity): number {
    return (
      Number(balance.total_days) +
      Number(balance.carried_over) -
      Number(balance.used_days)
    );
  }

  /** شكل العرض الموحّد — أرقام لا نصوص، مع الرصيد المتاح محسوباً */
  private present(balance: LeaveBalanceEntity): PresentedLeaveBalance {
    return {
      balance_id: balance.balance_id,
      user_id: balance.user_id,
      user: balance.user,
      leave_type_id: balance.leave_type_id,
      type_name: balance.leaveType?.type_name,
      payment_type: balance.leaveType?.payment_type,
      year: balance.year,
      total_days: Number(balance.total_days),
      carried_over: Number(balance.carried_over),
      used_days: Number(balance.used_days),
      available_days: this.computeAvailable(balance),
      is_manual: balance.is_manual,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    year?: number,
  ): Promise<PaginatedResult<PresentedLeaveBalance>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.leaveBalancesRepository.findAndCount({
      where: year ? { year } : {},
      relations: { user: true, leaveType: true },
      order: { year: 'DESC', user_id: 'ASC', leave_type_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(
      data.map((balance) => this.present(balance)),
      total,
      page,
      limit,
    );
  }

  async findByUser(
    userId: number,
    year: number,
  ): Promise<PresentedLeaveBalance[]> {
    const balances = await this.leaveBalancesRepository.find({
      where: { user_id: userId, year },
      relations: { leaveType: true },
      order: { leave_type_id: 'ASC' },
    });

    return balances.map((balance) => this.present(balance));
  }

  /** الكيان الخام — للاستخدام الداخلي حيث نحتاج صفاً قابلاً للحفظ */
  async findOne(id: number): Promise<LeaveBalanceEntity> {
    const balance = await this.leaveBalancesRepository.findOne({
      where: { balance_id: id },
      relations: { user: true, leaveType: true },
    });

    if (!balance) {
      throw new NotFoundException(`Leave balance #${id} not found`);
    }

    return balance;
  }

  async findOnePresented(id: number): Promise<PresentedLeaveBalance> {
    return this.present(await this.findOne(id));
  }

  async update(
    id: number,
    dto: UpdateLeaveBalanceDto,
  ): Promise<PresentedLeaveBalance> {
    const balance = await this.findOne(id);

    if (dto.total_days !== undefined) balance.total_days = dto.total_days;
    if (dto.carried_over !== undefined) balance.carried_over = dto.carried_over;
    if (dto.used_days !== undefined) balance.used_days = dto.used_days;

    balance.is_manual = true;

    const saved = await this.leaveBalancesRepository.save(balance);

    this.logger.warn(
      `Leave balance #${id} manually adjusted for user #${balance.user_id} ` +
        `— available is now ${this.computeAvailable(saved)} days`,
    );

    return this.present(saved);
  }

  /** يستخدمه موديول الطلبات للتحقق قبل تقديم طلب إجازة */
  async getAvailableDays(
    userId: number,
    leaveTypeId: number,
    year: number,
  ): Promise<number | null> {
    const balance = await this.leaveBalancesRepository.findOne({
      where: { user_id: userId, leave_type_id: leaveTypeId, year },
    });

    if (!balance) {
      return null;
    }

    return this.computeAvailable(balance);
  }

  /** مدة الخدمة بالسنوات حتى نهاية السنة المحتسَبة */
  private yearsOfService(hireDate: string, year: number): number {
    const hire = new Date(hireDate);
    const endOfYear = new Date(Date.UTC(year, 11, 31));
    const ms = endOfYear.getTime() - hire.getTime();
    return ms / (1000 * 60 * 60 * 24 * 365.25);
  }

  /** الاستحقاق حسب الشريحة، مع التناسب لمن عُيّن خلال السنة */
  private entitlementFor(hireDate: string, year: number): number {
    const years = this.yearsOfService(hireDate, year);

    const tier = SERVICE_TIERS.find(
      (t) => years >= t.minYears && years < t.maxYears,
    );
    const fullDays = tier ? tier.days : SERVICE_TIERS[0].days;

    const hire = new Date(hireDate);
    const hiredThisYear = hire.getUTCFullYear() === year;

    if (!hiredThisYear || !PRORATE_FIRST_YEAR) {
      return fullDays;
    }

    const monthsWorked = 12 - hire.getUTCMonth();
    const prorated = (fullDays * monthsWorked) / 12;

    return Math.round(prorated * 2) / 2;
  }

  async calculateForYear(year: number) {
    const [profiles, leaveTypes] = await Promise.all([
      this.employeeProfilesRepository.find({ relations: { user: true } }),
      this.leaveTypesRepository.find(),
    ]);

    const activeProfiles = profiles.filter((p) => p.user?.status === true);

    let created = 0;
    let updated = 0;
    let skippedManual = 0;
    let skippedNotHired = 0;

    for (const profile of activeProfiles) {
      const hireYear = new Date(profile.hire_date).getUTCFullYear();
      if (hireYear > year) {
        skippedNotHired++;
        continue;
      }

      for (const leaveType of leaveTypes) {
        const existing = await this.leaveBalancesRepository.findOne({
          where: {
            user_id: profile.user_id,
            leave_type_id: leaveType.leave_type_id,
            year,
          },
        });

        if (existing?.is_manual) {
          skippedManual++;
          continue;
        }

        const totalDays = leaveType.uses_service_tiers
          ? this.entitlementFor(profile.hire_date, year)
          : Number(leaveType.default_days);

        const carriedOver = leaveType.uses_service_tiers
          ? await this.carryOverFrom(
              profile.user_id,
              leaveType.leave_type_id,
              year - 1,
            )
          : 0;

        if (existing) {
          existing.total_days = totalDays;
          existing.carried_over = carriedOver;
          await this.leaveBalancesRepository.save(existing);
          updated++;
        } else {
          await this.leaveBalancesRepository.save(
            this.leaveBalancesRepository.create({
              user_id: profile.user_id,
              leave_type_id: leaveType.leave_type_id,
              year,
              total_days: totalDays,
              carried_over: carriedOver,
              used_days: 0,
              is_manual: false,
            }),
          );
          created++;
        }
      }
    }

    this.logger.log(
      `Leave balances for ${year}: ${created} created, ${updated} updated, ` +
        `${skippedManual} manual rows left alone, ${skippedNotHired} not yet hired`,
    );

    return { year, created, updated, skippedManual, skippedNotHired };
  }

  /** المتبقي من السنة الماضية، بحد أقصى CARRY_OVER_CAP */
  private async carryOverFrom(
    userId: number,
    leaveTypeId: number,
    previousYear: number,
  ): Promise<number> {
    const previous = await this.leaveBalancesRepository.findOne({
      where: { user_id: userId, leave_type_id: leaveTypeId, year: previousYear },
    });

    if (!previous) {
      return 0;
    }

    const remaining = this.computeAvailable(previous);

    return Math.max(0, Math.min(remaining, CARRY_OVER_CAP));
  }
}