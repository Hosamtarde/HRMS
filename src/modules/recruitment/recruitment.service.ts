import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentEntity } from './recruitment.entity';
import { ApplyDto } from './dto/apply.dto';
import { RecruitmentStatus } from '../../common/enums/enums';

@Injectable()
export class RecruitmentService {
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

  async findAll(): Promise<RecruitmentEntity[]> {
    return this.recruitmentRepository.find({ order: { submission_date: 'DESC' } });
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
}0