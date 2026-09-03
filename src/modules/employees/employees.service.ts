import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from './employee-profile.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Role } from '../../common/enums/enums';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly employeeProfilesRepository: Repository<EmployeeProfileEntity>,
    private readonly dataSource: DataSource, // 👈 يخلينا نستخدم Transactions
  ) {}

  async create(dto: CreateEmployeeDto): Promise<EmployeeProfileEntity> {

    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = manager.create(UserEntity, {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        password: hashedPassword,
        phone_number: dto.phone_number,
        role: Role.EMPLOYEE,
        status: true,
      });
      const savedUser = await manager.save(user);

      const profile = manager.create(EmployeeProfileEntity, {
        user_id: savedUser.user_id,
        department_id: dto.department_id,
        position: dto.position,
        hire_date: dto.hire_date,
        basic_salary: dto.basic_salary,
        employment_type: dto.employment_type,
      });
      const savedProfile = await manager.save(profile);

      return savedProfile;
    });
  }

  async findAll(): Promise<EmployeeProfileEntity[]> {
    return this.employeeProfilesRepository.find({
      relations: { user: true, department: true },
    });
  }

  async findOne(userId: number): Promise<EmployeeProfileEntity> {
    const profile = await this.employeeProfilesRepository.findOne({
      where: { user_id: userId },
      relations: { user: true, department: true },
    });
    if (!profile) {
      throw new NotFoundException(`Employee #${userId} not found`);
    }
    return profile;
  }

  async update(userId: number, dto: UpdateEmployeeDto): Promise<EmployeeProfileEntity> {
    const profile = await this.findOne(userId);

    if (dto.first_name || dto.last_name || dto.phone_number) {
      await this.usersRepository.update(userId, {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number,
      });
    }

    Object.assign(profile, {
      department_id: dto.department_id ?? profile.department_id,
      position: dto.position ?? profile.position,
      hire_date: dto.hire_date ?? profile.hire_date,
      basic_salary: dto.basic_salary ?? profile.basic_salary,
      employment_type: dto.employment_type ?? profile.employment_type,
    });

    return this.employeeProfilesRepository.save(profile);
  }

  async remove(userId: number): Promise<void> {
    const profile = await this.findOne(userId);
    await this.usersRepository.update(profile.user_id, { status: false });
  }
}