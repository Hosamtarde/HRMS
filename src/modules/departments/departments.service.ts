import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<DepartmentEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.departmentsRepository.findAndCount({
      relations: { manager: true },
      order: { department_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number): Promise<DepartmentEntity> {
    const department = await this.departmentsRepository.findOne({
      where: { department_id: id },
      relations: { manager: true }
    });
    if (!department) {
      throw new NotFoundException(`Department #${id} not found`);
    }
    return department;
  }

  async create(dto: CreateDepartmentDto): Promise<DepartmentEntity> {
    const department = this.departmentsRepository.create(dto);
    return this.departmentsRepository.save(department);
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<DepartmentEntity> {
    const department = await this.findOne(id);
    Object.assign(department, dto);
    return this.departmentsRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentsRepository.remove(department);
  }
}