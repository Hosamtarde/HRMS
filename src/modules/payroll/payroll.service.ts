import { Injectable, NotFoundException, BadRequestException,Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntity } from './payroll.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { RequestEntity } from '../requests/request.entity';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { RequestType, RequestStatus } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { DataSource } from 'typeorm';
import { LoanRepaymentsService } from '../loan-repayments/loan-repayments.service';
import { RequestsService } from '../requests/requests.service';
import {
  DAYS_PER_SALARY_MONTH,
  HALF_PAID_DEDUCTION_RATE,
} from './payroll.constants';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly employeeProfilesRepository: Repository<EmployeeProfileEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly dataSource: DataSource,
    private readonly loanRepaymentsService: LoanRepaymentsService,
    private readonly requestsService: RequestsService,
  ) {}

  
  async generateForEmployee(
    userId: number,
    salaryMonth: string,
    bonuses = 0,
  ): Promise<PayrollEntity> {
    return this.dataSource.transaction(async (manager) => {
      const profilesRepo = manager.getRepository(EmployeeProfileEntity);
      const payrollRepo = manager.getRepository(PayrollEntity);

      const profile = await profilesRepo.findOne({ where: { user_id: userId } });

      if (!profile) {
        throw new NotFoundException(`Employee profile #${userId} not found`);
      }

      const existing = await payrollRepo.findOne({
        where: { user_id: userId, salary_month: salaryMonth },
      });

      if (existing) {
        throw new BadRequestException(
          `Payroll for this employee already generated for ${salaryMonth}`,
        );
      }

      const basicSalary = Number(profile.basic_salary);
      const dailyRate = basicSalary / DAYS_PER_SALARY_MONTH;

      const loanInstallment =
        await this.loanRepaymentsService.consumeNextInstallment(
          manager,
          userId,
          null,
        );

      const { unpaidDays, halfPaidDays } =
        await this.requestsService.getLeaveDaysInMonth(userId, salaryMonth);

      const unpaidDeduction = unpaidDays * dailyRate;
      const halfPaidDeduction =
        halfPaidDays * dailyRate * HALF_PAID_DEDUCTION_RATE;

      const deductions =
        Math.round(
          (loanInstallment + unpaidDeduction + halfPaidDeduction) * 100,
        ) / 100;

      const netSalary = Math.round((basicSalary + bonuses - deductions) * 100) / 100;

      const payroll = await payrollRepo.save(
        payrollRepo.create({
          user_id: userId,
          basic_salary: basicSalary,
          bonuses,
          deductions,
          net_salary: netSalary,
          salary_month: salaryMonth,
        }),
      );

      if (loanInstallment > 0) {
        await this.loanRepaymentsService.attachPayroll(
          manager,
          userId,
          payroll.payroll_id,
        );
      }

      this.logger.log(
        `Payroll #${payroll.payroll_id} for user #${userId} (${salaryMonth}) — ` +
          `basic ${basicSalary}, bonuses ${bonuses}, loan ${loanInstallment}, ` +
          `unpaid ${unpaidDays}d, half-paid ${halfPaidDays}d, net ${netSalary}`,
      );

      return payroll;
    });
  }
  
  async generate(
    dto: GeneratePayrollDto,
  ): Promise<PayrollEntity[] | PayrollEntity> {
    if (dto.user_id) {
      const payroll = await this.generateForEmployee(
        dto.user_id,
        dto.salary_month,
        dto.bonuses ?? 0,
      );
      this.logger.log(
        `Payroll generated for user #${dto.user_id} — month ${dto.salary_month}, net ${payroll.net_salary}`,
      );
      return payroll;
    }

    const allProfiles = await this.employeeProfilesRepository.find({
      relations: { user: true },
    });

    const activeProfiles = allProfiles.filter((p) => p.user.status === true);

    this.logger.log(
      `Starting bulk payroll for ${activeProfiles.length} active employees — month ${dto.salary_month}`,
    );

    const results: PayrollEntity[] = [];
    let skipped = 0;

    for (const profile of activeProfiles) {
      try {
        const payroll = await this.generateForEmployee(
          profile.user_id,
          dto.salary_month,
          dto.bonuses ?? 0,
        );
        results.push(payroll);
      } catch (error) {
        skipped++;
        this.logger.warn(
          `Skipped payroll for user #${profile.user_id}: ${(error as Error).message}`,
        );
        continue;
      }
    }

    this.logger.log(
      `Bulk payroll finished — generated ${results.length}, skipped ${skipped}`,
    );

    return results;
  }


  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<PayrollEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.payrollRepository.findAndCount({
      relations: { user: true },
      order: { payroll_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findByEmployee(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<PayrollEntity>> {
    const { page, limit } = paginationDto;

    const [data, total] = await this.payrollRepository.findAndCount({
      where: { user_id: userId },
      order: { salary_month: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException(
        `No payroll records found for user #${userId}`,
      );
    }

    return buildPaginatedResult(data, total, page, limit);
  }

    async findOne(id: number): Promise<PayrollEntity> {
    const payroll = await this.payrollRepository.findOne({
      where: { payroll_id: id },
      relations: { user: true },
    });

    if (!payroll) {
      throw new NotFoundException(`Payroll record #${id} not found`);
    }

    return payroll;
  }

  async update(id: number, dto: UpdatePayrollDto): Promise<PayrollEntity> {
    const payroll = await this.findOne(id);

    if (dto.bonuses !== undefined) {
      payroll.bonuses = dto.bonuses;
    }
    if (dto.deductions !== undefined) {
      payroll.deductions = dto.deductions;
    }

    payroll.net_salary =
      Number(payroll.basic_salary) +
      Number(payroll.bonuses) -
      Number(payroll.deductions);

    const saved = await this.payrollRepository.save(payroll);

    this.logger.log(
      `Payroll #${id} updated — bonuses ${saved.bonuses}, deductions ${saved.deductions}, net ${saved.net_salary}`,
    );

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const payroll = await this.findOne(id);

    await this.payrollRepository.remove(payroll);

    this.logger.warn(
      `Payroll #${id} deleted — user #${payroll.user_id}, month ${payroll.salary_month}`,
    );

    return { message: `Payroll record #${id} deleted successfully` };
  }
  
}