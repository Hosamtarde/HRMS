import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentEntity } from './recruitment.entity';
import { ApplyDto } from './dto/apply.dto';
import { RecruitmentStatus } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepository: Repository<RecruitmentEntity>,
  ) {}

  async apply(dto: ApplyDto, cvFilePath: string): Promise<RecruitmentEntity> {
    const application = this.recruitmentRepository.create({
      ...dto,
      cv_file: cvFilePath,
      application_status: RecruitmentStatus.PENDING,
    });
    return this.recruitmentRepository.save(application);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RecruitmentEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.recruitmentRepository.findAndCount({
      order: { submission_date: 'DESC', application_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number): Promise<RecruitmentEntity> {
    const application = await this.recruitmentRepository.findOne({
      where: { application_id: id },
    });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    return application;
  }

  async updateStatus(id: number, status: RecruitmentStatus): Promise<RecruitmentEntity> {
    const application = await this.findOne(id);
    application.application_status = status;
    return this.recruitmentRepository.save(application);
  }

    async remove(id: number): Promise<{ message: string }> {
    const application = await this.findOne(id);
    const fileName = application.cv_file;

    await this.recruitmentRepository.remove(application);

    if (fileName) {
      const filePath = join(process.cwd(), 'uploads', fileName);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.warn(
          `Application #${id} deleted but its CV file was not: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`Application #${id} deleted`);

    return { message: `Application #${id} deleted successfully` };
  }
  
}0