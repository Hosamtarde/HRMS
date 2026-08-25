import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async findAll(): Promise<DepartmentEntity[]> {
    return this.departmentsRepository.find({ relations: { manager: true } });
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