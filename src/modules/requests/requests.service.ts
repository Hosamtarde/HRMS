import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { DataSource, In } from 'typeorm';
import { LoanRepaymentsService } from '../loan-repayments/loan-repayments.service';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { LOW_LEAVE_BALANCE_THRESHOLD } from '../leave-balances/leave-balance.constants';
import { OrgChartService } from '../org-chart/org-chart.service';
import {
  canAccessRequest,
  clampToMonth,
  countLeaveDays,
  datesInSpan,
  daysInSpan,
  deductsFromBalance,
  isPending,
  isValidLeaveRange,
  reviewDenialReason,
} from './request-rules.helper';

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
    private readonly eventEmitter: EventEmitter2,
    private readonly orgChartService: OrgChartService,
  ) {}

  async create(userId: number, dto: CreateRequestDto): Promise<RequestEntity> {
    if (dto.request_type === RequestType.LEAVE) {
      const leaveType = await this.leaveTypesService.findOne(
        dto.leave_type_id!,
      );
      await this.assertSufficientBalance(userId, dto, leaveType);
    }

    const request = this.requestsRepository.create({
      ...dto,
      user_id: userId,
      request_status: RequestStatus.PENDING,
    });

    const saved = await this.requestsRepository.save(request);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.REQUEST_SUBMITTED, {
      requestId: saved.request_id,
      employeeId: userId,
      requestType: saved.request_type,
    });

    return saved;
  }

  private async assertSufficientBalance(
    userId: number,
    dto: CreateRequestDto,
    leaveType: LeaveTypeEntity,
  ): Promise<void> {
    if (!isValidLeaveRange(dto.start_date!, dto.end_date!)) {
      throw new BadRequestException('end_date must not be before start_date');
    }

    if (!deductsFromBalance(leaveType.payment_type)) {
      return;
    }

    const requestedDays = countLeaveDays(dto.start_date!, dto.end_date!);
    const year = new Date(dto.start_date!).getUTCFullYear();

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

    let where: Record<string, unknown> = { user_id: userId };
    if (role === Role.HR_ADMIN) {
      where = {};
    } else if (role === Role.MANAGER) {
      const scopeIds = await this.orgChartService.getSubtreeIds(userId);
      where = scopeIds.length ? { user_id: In(scopeIds) } : { user_id: userId };
    }

    const [data, total] = await this.requestsRepository.findAndCount({
      where,
      relations: { user: true, reviewer: true },
      order: { created_at: 'DESC', request_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  private async resolveScope(
    role: Role,
    actorId: number,
    ownerId: number,
  ): Promise<boolean> {
    if (role !== Role.MANAGER || ownerId === actorId) {
      return false;
    }
    return this.orgChartService.isInSubtree(actorId, ownerId);
  }

  async findOne(
    id: number,
    userId: number,
    role: Role,
  ): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({
      where: { request_id: id },
      relations: { user: true, reviewer: true },
    });

    if (!request) {
      throw new NotFoundException(`Request #${id} not found`);
    }

    const isInScope = await this.resolveScope(role, userId, request.user_id);

    if (
      !canAccessRequest({
        role,
        actorId: userId,
        ownerId: request.user_id,
        isInScope,
      })
    ) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  async review(
    id: number,
    dto: ReviewRequestDto,
    reviewerId: number,
  ): Promise<RequestEntity> {
    const ctx: { remaining: number | null; typeName: string } = {
      remaining: null,
      typeName: '',
    };

    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RequestEntity);

      const request = await repo.findOne({
        where: { request_id: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) {
        throw new NotFoundException(`Request #${id} not found`);
      }

      if (!isPending(request.request_status)) {
        this.logger.warn(
          `Review rejected: request #${id} already ${request.request_status}`,
        );
        throw new BadRequestException(
          'This request has already been processed',
        );
      }

      const [reviewer] = await manager.query<{ role: Role }[]>(
        `SELECT role FROM users WHERE user_id = ?`,
        [reviewerId],
      );
      const reviewerRole = reviewer?.role ?? Role.EMPLOYEE;

      const isInScope =
        reviewerRole === Role.HR_ADMIN || request.user_id === reviewerId
          ? false
          : await this.orgChartService.isInSubtree(reviewerId, request.user_id);

      const denial = reviewDenialReason({
        role: reviewerRole,
        actorId: reviewerId,
        ownerId: request.user_id,
        isInScope,
      });

      if (denial === 'own_request') {
        throw new ForbiddenException('You cannot review your own request');
      }
      if (denial === 'out_of_scope') {
        throw new ForbiddenException('This employee does not report to you');
      }

      if (
        dto.status === RequestStatus.APPROVED &&
        request.request_type === RequestType.LEAVE
      ) {
        const leaveType = await this.leaveTypesService.findOne(
          request.leave_type_id,
        );

        if (deductsFromBalance(leaveType.payment_type)) {
          const days = countLeaveDays(request.start_date, request.end_date);
          const year = new Date(request.start_date).getUTCFullYear();

          ctx.remaining = await this.leaveBalancesService.consumeDays(
            manager,
            request.user_id,
            request.leave_type_id,
            year,
            days,
          );
          ctx.typeName = leaveType.type_name;
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

      const updated = await repo.save(request);

      this.logger.log(
        `Request #${id} (${request.request_type}) ${dto.status} by user #${reviewerId}`,
      );

      return updated;
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.REQUEST_REVIEWED, {
      requestId: saved.request_id,
      employeeId: saved.user_id,
      requestType: saved.request_type,
      reviewerId,
      approved: dto.status === RequestStatus.APPROVED,
    });

    if (
      ctx.remaining !== null &&
      ctx.remaining <= LOW_LEAVE_BALANCE_THRESHOLD
    ) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.LEAVE_BALANCE_LOW, {
        userId: saved.user_id,
        typeName: ctx.typeName,
        remainingDays: ctx.remaining,
      });
    }

    return saved;
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

    const isInScope = await this.resolveScope(role, userId, request.user_id);

    if (
      !canAccessRequest({
        role,
        actorId: userId,
        ownerId: request.user_id,
        isInScope,
      })
    ) {
      throw new ForbiddenException('You do not have access to this request');
    }

    if (!isPending(request.request_status)) {
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

    this.eventEmitter.emit(NOTIFICATION_EVENTS.REQUEST_CANCELLED, {
      requestId: id,
      employeeId: request.user_id,
      requestType: request.request_type,
    });

    return { message: `Request #${id} has been deleted` };
  }

  async getLeaveDaysInMonth(
    userId: number,
    salaryMonth: string,
  ): Promise<{ unpaidDays: number; halfPaidDays: number }> {
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

      const span = clampToMonth(leave.start_date, leave.end_date, salaryMonth);

      if (!span) {
        continue;
      }

      const days = daysInSpan(span);

      if (paymentType === PaymentType.UNPAID) {
        unpaidDays += days;
      } else {
        halfPaidDays += days;
      }
    }

    return { unpaidDays, halfPaidDays };
  }

  async getApprovedLeaveDates(
    userId: number,
    salaryMonth: string,
  ): Promise<Set<string>> {
    const approvedLeaves = await this.requestsRepository.find({
      where: {
        user_id: userId,
        request_type: RequestType.LEAVE,
        request_status: RequestStatus.APPROVED,
      },
      select: { start_date: true, end_date: true },
    });

    const dates = new Set<string>();

    for (const leave of approvedLeaves) {
      const span = clampToMonth(leave.start_date, leave.end_date, salaryMonth);

      if (!span) {
        continue;
      }

      for (const date of datesInSpan(span)) {
        dates.add(date);
      }
    }

    return dates;
  }
}
