import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalanceEntity } from './leave-balance.entity';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';

@Injectable()
export class LeaveBalancesService {
  private readonly logger = new Logger(LeaveBalancesService.name);

  constructor(
    @InjectRepository(LeaveBalanceEntity)
    private readonly leaveBalancesRepository: Repository<LeaveBalanceEntity>,
  ) {}

  private computeAvailable(balance: LeaveBalanceEntity): number {
    return (
      Number(balance.total_days) +
      Number(balance.carried_over) -
      Number(balance.used_days)
    );
  }

  async findAll(
    paginationDto: PaginationDto,
    year?: number,
  ): Promise<PaginatedResult<LeaveBalanceEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.leaveBalancesRepository.findAndCount({
      where: year ? { year } : {},
      relations: { user: true, leaveType: true },
      order: { year: 'DESC', user_id: 'ASC', leave_type_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findByUser(userId: number, year: number) {
    const balances = await this.leaveBalancesRepository.find({
      where: { user_id: userId, year },
      relations: { leaveType: true },
      order: { leave_type_id: 'ASC' },
    });

    return balances.map((balance) => ({
      balance_id: balance.balance_id,
      leave_type_id: balance.leave_type_id,
      type_name: balance.leaveType?.type_name,
      payment_type: balance.leaveType?.payment_type,
      year: balance.year,
      total_days: Number(balance.total_days),
      carried_over: Number(balance.carried_over),
      used_days: Number(balance.used_days),
      available_days: this.computeAvailable(balance),
      is_manual: balance.is_manual,
    }));
  }

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

  async update(
    id: number,
    dto: UpdateLeaveBalanceDto,
  ): Promise<LeaveBalanceEntity> {
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

    return saved;
  }

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
}