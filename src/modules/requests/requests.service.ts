import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { RequestStatus, Role } from '../../common/enums/enums';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
  ) {}

  async create(userId: number, dto: CreateRequestDto): Promise<RequestEntity> {
    const request = this.requestsRepository.create({
      ...dto,
      user_id: userId,
      request_status: RequestStatus.PENDING, 
    });
    return this.requestsRepository.save(request);
  }

  async findAll(userId: number, role: Role): Promise<RequestEntity[]> {
    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    return this.requestsRepository.find({
      where: isManagerOrAdmin ? {} : { user_id: userId },
      relations: { user: true, reviewer: true },
      order: { created_at: 'DESC' },
    });
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
    // موظف عادي ما يقدر يشوف طلب حدا تاني
    if (!isManagerOrAdmin && request.user_id !== userId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    return request;
  }

  async review(id: number, dto: ReviewRequestDto, reviewerId: number): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({ where: { request_id: id } });

    if (!request) {
      throw new NotFoundException(`Request #${id} not found`);
    }

    if (request.request_status !== RequestStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    request.request_status = dto.status;
    request.reviewed_by = reviewerId;

    return this.requestsRepository.save(request);
  }
}