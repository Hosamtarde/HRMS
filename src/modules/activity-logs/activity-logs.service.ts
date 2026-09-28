import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLogEntity } from './activity-log.entity';
import { ActivityAction } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';

interface CreateLogData {
  user_id?: number;
  action: ActivityAction;
  entity: string;
  entity_id?: number;
  method: string;
  path: string;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogsRepository: Repository<ActivityLogEntity>,
  ) {}

  async record(data: CreateLogData): Promise<void> {
    try {
      const log = this.activityLogsRepository.create(data);
      await this.activityLogsRepository.save(log);
    } catch (error) {
      this.logger.error(
        `Failed to record activity log for ${data.method} ${data.path}: ${(error as Error).message}`,
      );
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ActivityLogEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.activityLogsRepository.findAndCount({
      relations: { user: true },
      order: { log_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }
}