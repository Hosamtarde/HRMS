import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly employeeProfilesRepository: Repository<EmployeeProfileEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
  ) {}

  
  private async calculateLoanDeduction(userId: number): Promise<number> {
    const approvedLoan = await this.requestsRepository.findOne({
      where: {
        user_id: userId,
        request_type: RequestType.LOAN,
        request_status: RequestStatus.APPROVED,
      },
    });

    if (!approvedLoan || !approvedLoan.loan_amount || !approvedLoan.repayment_period) {
      return 0;
    }

    return Number(approvedLoan.loan_amount) / approvedLoan.repayment_period;
  }

  async generateForEmployee(userId: number, salaryMonth: string, bonuses = 0): Promise<PayrollEntity> {
    const profile = await this.employeeProfilesRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(`Employee profile #${userId} not found`);
    }

    const existing = await this.payrollRepository.findOne({
      where: { user_id: userId, salary_month: salaryMonth },
    });
    if (existing) {
      throw new BadRequestException(`Payroll for this employee already generated for ${salaryMonth}`);
    }

    const basicSalary = Number(profile.basic_salary);
    const loanDeduction = await this.calculateLoanDeduction(userId);
    const netSalary = basicSalary + bonuses - loanDeduction;

    const payroll = this.payrollRepository.create({
      user_id: userId,
      basic_salary: basicSalary,
      bonuses,
      deductions: loanDeduction,
      net_salary: netSalary,
      salary_month: salaryMonth,
    });

    return this.payrollRepository.save(payroll);
  }

  
  async generate(dto: GeneratePayrollDto): Promise<PayrollEntity[] | PayrollEntity> {
    if (dto.user_id) {
      return this.generateForEmployee(dto.user_id, dto.salary_month, dto.bonuses ?? 0);
    }

    const allProfiles = await this.employeeProfilesRepository.find({
      relations: { user: true },
    });

    const activeProfiles = allProfiles.filter((p) => p.user.status === true);

    const results: PayrollEntity[] = [];
    for (const profile of activeProfiles) {
      try {
        const payroll = await this.generateForEmployee(profile.user_id, dto.salary_month, dto.bonuses ?? 0);
        results.push(payroll);
      } catch {

        continue;
      }
    }

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
}