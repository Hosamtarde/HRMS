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

@Injectable()
export class RequestsService {
    private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly leaveTypesService: LeaveTypesService,
  ) {}

  async create(userId: number, dto: CreateRequestDto): Promise<RequestEntity> {
      if (dto.request_type === RequestType.LEAVE) {
        await this.leaveTypesService.findOne(dto.leave_type_id!);
      }

      const request = this.requestsRepository.create({
        ...dto,
        user_id: userId,
        request_status: RequestStatus.PENDING,
      });

      return this.requestsRepository.save(request);
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
    const request = await this.requestsRepository.findOne({
      where: { request_id: id },
    });

    if (!request) {
      throw new NotFoundException(`Request #${id} not found`);
    }

    if (request.request_status !== RequestStatus.PENDING) {
      this.logger.warn(
        `Review rejected: request #${id} already ${request.request_status}`,
      );
      throw new BadRequestException('This request has already been processed');
    }

    request.request_status = dto.status;
    request.reviewed_by = reviewerId;

    const saved = await this.requestsRepository.save(request);

    this.logger.log(
      `Request #${id} (${request.request_type}) ${dto.status} by user #${reviewerId}`,
    );

    return saved;
  }
}