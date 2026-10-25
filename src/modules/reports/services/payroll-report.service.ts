import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntity } from '../../payroll/payroll.entity';
import { LoanRepaymentEntity } from '../../loan-repayments/loan-repayment.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { DepartmentEntity } from '../../departments/department.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';
import { ReportScope } from '../interfaces/report-scope.interface';

interface PayrollRow {
  employee: string;
  department: string | null;
  salaryMonth: string | Date;
  basicSalary: string;
  bonuses: string;
  deductions: string;
  netSalary: string;
  loanPortion: string;
}

@Injectable()
export class PayrollReportService {
  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
  ) {}

  async build(query: ReportQueryDto, scope: ReportScope): Promise<ReportResult> {
    const builder = this.payrollRepository
      .createQueryBuilder('pr')
      .innerJoin('pr.user', 'u')
      .innerJoin(EmployeeProfileEntity, 'p', 'p.user_id = pr.user_id')
      .leftJoin(DepartmentEntity, 'd', 'd.department_id = p.department_id')
      .leftJoin(LoanRepaymentEntity, 'lr', 'lr.payroll_id = pr.payroll_id')
      .select("CONCAT(u.first_name, ' ', u.last_name)", 'employee')
      .addSelect('d.department_name', 'department')
      .addSelect('pr.salary_month', 'salaryMonth')
      .addSelect('pr.basic_salary', 'basicSalary')
      .addSelect('pr.bonuses', 'bonuses')
      .addSelect('pr.deductions', 'deductions')
      .addSelect('pr.net_salary', 'netSalary')
      .addSelect('COALESCE(SUM(lr.amount), 0)', 'loanPortion')
      .where('pr.salary_month BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      })
      .groupBy('pr.payroll_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .addGroupBy('d.department_name')
      .addGroupBy('pr.salary_month')
      .addGroupBy('pr.basic_salary')
      .addGroupBy('pr.bonuses')
      .addGroupBy('pr.deductions')
      .addGroupBy('pr.net_salary')
      .orderBy('pr.salary_month', 'DESC')
      .addOrderBy('u.first_name', 'ASC');

    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    const raw = await builder.getRawMany<PayrollRow>();

    const rows = raw.map((row) => ({
      employee: row.employee,
      department: row.department ?? 'بدون قسم',
      salaryMonth: this.toMonth(row.salaryMonth),
      basicSalary: Number(row.basicSalary),
      bonuses: Number(row.bonuses),
      deductions: Number(row.deductions),
      loanPortion: Number(row.loanPortion),
      netSalary: Number(row.netSalary),
    }));

    const sum = (
      key: 'basicSalary' | 'bonuses' | 'deductions' | 'loanPortion' | 'netSalary',
    ) => Math.round(rows.reduce((total, row) => total + row[key], 0) * 100) / 100;

    const months = new Set(rows.map((row) => row.salaryMonth));

    return {
      title: 'تقرير الرواتب',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'employee', label: 'الموظف', type: 'text', width: 24 },
        { key: 'department', label: 'القسم', type: 'text', width: 18 },
        { key: 'salaryMonth', label: 'الشهر', type: 'text', width: 12 },
        { key: 'basicSalary', label: 'الراتب الأساسي', type: 'money', width: 18 },
        { key: 'bonuses', label: 'العلاوات', type: 'money', width: 16 },
        { key: 'deductions', label: 'الخصومات', type: 'money', width: 16 },
        { key: 'loanPortion', label: 'منها أقساط قروض', type: 'money', width: 18 },
        { key: 'netSalary', label: 'صافي الراتب', type: 'money', width: 18 },
      ],
      rows,
      summary: [
        { label: 'عدد الكشوف', value: rows.length },
        { label: 'عدد الأشهر', value: months.size },
        { label: 'إجمالي الأساسي', value: sum('basicSalary') },
        { label: 'إجمالي العلاوات', value: sum('bonuses') },
        { label: 'إجمالي الخصومات', value: sum('deductions') },
        { label: 'إجمالي أقساط القروض', value: sum('loanPortion') },
        { label: 'إجمالي المدفوع', value: sum('netSalary') },
      ],
    };
  }

  private toMonth(value: string | Date): string {
    if (typeof value === 'string') {
      return value.slice(0, 7);
    }

    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }
}