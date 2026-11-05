import { Injectable, NotFoundException, ConflictException,Logger  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from './employee-profile.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Role } from '../../common/enums/enums';
import { EmployeeCard } from './interfaces/employee-card.interface';
import { getToday } from '../../common/utils/date.util';

@Injectable()
export class EmployeesService {
    private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly employeeProfilesRepository: Repository<EmployeeProfileEntity>,
    private readonly dataSource: DataSource, 
  ) {}

  async create(dto: CreateEmployeeDto): Promise<EmployeeProfileEntity> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(`Employee creation rejected: email already exists — ${dto.email}`);
      throw new ConflictException('A user with this email already exists');
    }

    const savedProfile = await this.dataSource.transaction(async (manager) => {
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
      return manager.save(profile);
    });

    this.logger.log(
      `Employee created: user #${savedProfile.user_id} (${dto.email}) in department ${dto.department_id}`,
    );

    return savedProfile;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<EmployeeProfileEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.employeeProfilesRepository.findAndCount({
      relations: { user: true, department: true },
      order: { user_id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
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
    this.logger.log(`Employee #${profile.user_id} deactivated (soft delete)`);
  }

    async findCard(userId: number): Promise<EmployeeCard> {
    const rows = await this.employeeProfilesRepository.manager.query(      `SELECT
         u.user_id AS userId,
         CONCAT(u.first_name, ' ', u.last_name) AS fullName,
         u.email AS email,
         u.profile_image AS profileImage,
         p.position AS position,
         d.department_name AS department,
         CASE WHEN m.user_id IS NULL THEN NULL
              ELSE CONCAT(m.first_name, ' ', m.last_name) END AS managerName,
         (SELECT COUNT(*) FROM employee_profiles r WHERE r.reports_to = u.user_id) AS directReports,
         (SELECT a.attendance_status FROM attendance_records a
            WHERE a.user_id = u.user_id AND a.attendance_date = ?) AS todayStatus
       FROM users u
       LEFT JOIN employee_profiles p ON p.user_id = u.user_id
       LEFT JOIN departments d ON d.department_id = p.department_id
       LEFT JOIN users m ON m.user_id = p.reports_to
       WHERE u.user_id = ? AND u.status = true`,
      [getToday(), userId],
    );

    if (!rows.length) {
      throw new NotFoundException(`Employee #${userId} not found`);
    }

    const row = rows[0];

    return {
      userId: Number(row.userId),
      fullName: row.fullName,
      email: row.email,
      profileImage: row.profileImage ?? null,
      position: row.position ?? null,
      department: row.department ?? null,
      managerName: row.managerName ?? null,
      directReports: Number(row.directReports),
      todayStatus: row.todayStatus ?? null,
    };
  }

}