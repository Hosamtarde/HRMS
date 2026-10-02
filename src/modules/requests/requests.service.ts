import { Injectable, NotFoundException, BadRequestException,Logger , ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { RequestStatus, Role, RequestType } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { LeaveTypesService } from '../leave-types/leave-types.service';
import { LeaveBalancesService } from '../leave-balances/leave-balances.service';
import { LeaveTypeEntity } from '../leave-types/leave-type.entity';
import { PaymentType } from '../../common/enums/enums';
import { DataSource } from 'typeorm';
import { LoanRepaymentsService } from '../loan-repayments/loan-repayments.service';

@Injectable()
export class RequestsService {
    private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly leaveTypesService: LeaveTypesService,
    private readonly leaveBalancesService: LeaveBalancesService,
    private readonly dataSource: DataSource,
    private readonly loanRepaymentsService: LoanRepaymentsService,    
  ) {}

  async create(userId: number, dto: CreateRequestDto): Promise<RequestEntity> {
    if (dto.request_type === RequestType.LEAVE) {
      const leaveType = await this.leaveTypesService.findOne(dto.leave_type_id!);
      await this.assertSufficientBalance(userId, dto, leaveType);
    }

    const request = this.requestsRepository.create({
      ...dto,
      user_id: userId,
      request_status: RequestStatus.PENDING,
    });

    return this.requestsRepository.save(request);
  }

  private countLeaveDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / 86400000) + 1;
  }

  private async assertSufficientBalance(
    userId: number,
    dto: CreateRequestDto,
    leaveType: LeaveTypeEntity,
  ): Promise<void> {
    const start = new Date(dto.start_date!);
    const end = new Date(dto.end_date!);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('end_date must not be before start_date');
    }

    if (leaveType.payment_type === PaymentType.UNPAID) {
      return;
    }

    const requestedDays = this.countLeaveDays(dto.start_date!, dto.end_date!);
    const year = start.getUTCFullYear();

    const available = await this.leaveBalancesService.getAvailableDays(
      userId,
      leaveType.leave_type_id,
      year,
    );

    if (available === null) {
      this.logger.warn(
        `Leave request blocked: no ${year} balance row for user #${userId}, ` +
          `leave type #${leaveType.leave_type_id}`,
      );
      throw new BadRequestException(
        `No leave balance has been calculated for "${leaveType.type_name}" in ${year}. Please contact HR.`,
      );
    }

    if (requestedDays > available) {
      this.logger.warn(
        `Leave request blocked for user #${userId}: ` +
          `requested ${requestedDays} days, available ${available}`,
      );
      throw new BadRequestException(
        `Insufficient balance. Requested ${requestedDays} days, available ${available}.`,
      );
    }
  }

  async findAll(
    userId: number,
    role: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RequestEntity>> {
    const { page, limit } = paginationDto;
    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    const [data, total] = await this.requestsRepository.findAndCount({
      where: isManagerOrAdmin ? {} : { user_id: userId },
      relations: { user: true, reviewer: true },
      order: { created_at: 'DESC', request_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number, userId: number, role: Role): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({
      where: { request_id: id },
      relations: { user: true, reviewer: true },
    });

    if (!request) {
      throw new NotFoundException(`Request #${id} not found`);
    }

    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;
    
    if (!isManagerOrAdmin && request.user_id !== userId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    return request;
  }

  async review(
    id: number,
    dto: ReviewRequestDto,
    reviewerId: number,
  ): Promise<RequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RequestEntity);

      const request = await repo.findOne({ where: { request_id: id } });

      if (!request) {
        throw new NotFoundException(`Request #${id} not found`);
      }

      if (request.request_status !== RequestStatus.PENDING) {
        this.logger.warn(
          `Review rejected: request #${id} already ${request.request_status}`,
        );
        throw new BadRequestException('This request has already been processed');
      }

      if (
        dto.status === RequestStatus.APPROVED &&
        request.request_type === RequestType.LEAVE
      ) {
        const leaveType = await this.leaveTypesService.findOne(
          request.leave_type_id,
        );

        if (leaveType.payment_type !== PaymentType.UNPAID) {
          const days = this.countLeaveDays(
            request.start_date,
            request.end_date,
          );
          const year = new Date(request.start_date).getUTCFullYear();

          await this.leaveBalancesService.consumeDays(
            manager,
            request.user_id,
            request.leave_type_id,
            year,
            days,
          );
        }
      }
            if (
        dto.status === RequestStatus.APPROVED &&
        request.request_type === RequestType.LOAN
      ) {
        await this.loanRepaymentsService.generateSchedule(manager, request);
      }

      request.request_status = dto.status;
      request.reviewed_by = reviewerId;

      const saved = await repo.save(request);

      this.logger.log(
        `Request #${id} (${request.request_type}) ${dto.status} by user #${reviewerId}`,
      );

      return saved;
    });
  }

    async remove(
    id: number,
    userId: number,
    role: Role,
  ): Promise<{ message: string }> {
    const request = await this.requestsRepository.findOne({
      where: { request_id: id },
    });

    if (!request) {
      throw new NotFoundException(`Request #${id} not found`);
    }

    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    if (!isManagerOrAdmin && request.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    if (request.request_status !== RequestStatus.PENDING) {
      this.logger.warn(
        `Delete rejected: request #${id} is already ${request.request_status}`,
      );
      throw new BadRequestException(
        `Only pending requests can be deleted. This request has already been ${request.request_status}.`,
      );
    }

    await this.requestsRepository.remove(request);

    this.logger.log(
      `Request #${id} (${request.request_type}) deleted by user #${userId}`,
    );

    return { message: `Request #${id} has been deleted` };
  }

  
  async getLeaveDaysInMonth(
    userId: number,
    salaryMonth: string,
  ): Promise<{ unpaidDays: number; halfPaidDays: number }> {
    const [yearStr, monthStr] = salaryMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;

    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));

    const approvedLeaves = await this.requestsRepository.find({
      where: {
        user_id: userId,
        request_type: RequestType.LEAVE,
        request_status: RequestStatus.APPROVED,
      },
      relations: { leaveType: true },
    });

    let unpaidDays = 0;
    let halfPaidDays = 0;

    for (const leave of approvedLeaves) {
      const paymentType = leave.leaveType?.payment_type;

      if (
        paymentType !== PaymentType.UNPAID &&
        paymentType !== PaymentType.HALF_PAID
      ) {
        continue;
      }

      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);

      const from = start > monthStart ? start : monthStart;
      const to = end < monthEnd ? end : monthEnd;

      if (to.getTime() < from.getTime()) {
        continue;
      }

      const days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;

      if (paymentType === PaymentType.UNPAID) {
        unpaidDays += days;
      } else {
        halfPaidDays += days;
      }
    }

    return { unpaidDays, halfPaidDays };
  }
  
}