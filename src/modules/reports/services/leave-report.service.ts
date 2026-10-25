import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalanceEntity } from '../../leave-balances/leave-balance.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { DepartmentEntity } from '../../departments/department.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';
import { ReportScope } from '../interfaces/report-scope.interface';
import { LOW_LEAVE_BALANCE_THRESHOLD } from '../../../common/constants/notification.constants';

interface LeaveRow {
  employee: string;
  department: string | null;
  leaveType: string;
  totalDays: string;
  carriedOver: string;
  usedDays: string;
}

@Injectable()
export class LeaveReportService {
  constructor(
    @InjectRepository(LeaveBalanceEntity)
    private readonly balancesRepository: Repository<LeaveBalanceEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly profilesRepository: Repository<EmployeeProfileEntity>,
  ) {}

  async build(query: ReportQueryDto, scope: ReportScope): Promise<ReportResult> {
    const year = new Date(query.from).getFullYear();

    const builder = this.balancesRepository
      .createQueryBuilder('b')
      .innerJoin('b.user', 'u')
      .innerJoin('b.leaveType', 'lt')
      .innerJoin(
        EmployeeProfileEntity,
        'p',
        'p.user_id = b.user_id',
      )
      .leftJoin(
        DepartmentEntity,
        'd',
        'd.department_id = p.department_id',
      )
      .select("CONCAT(u.first_name, ' ', u.last_name)", 'employee')
      .addSelect('d.department_name', 'department')
      .addSelect('lt.type_name', 'leaveType')
      .addSelect('b.total_days', 'totalDays')
      .addSelect('b.carried_over', 'carriedOver')
      .addSelect('b.used_days', 'usedDays')
      .where('b.year = :year', { year })
      .andWhere('u.status = true')
      .orderBy('d.department_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC')
      .addOrderBy('lt.type_name', 'ASC');

    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    const raw = await builder.getRawMany<LeaveRow>();

    const rows = raw.map((row) => {
      const entitled = Number(row.totalDays) + Number(row.carriedOver);
      const used = Number(row.usedDays);
      const remaining = Math.round((entitled - used) * 10) / 10;

      return {
        employee: row.employee,
        department: row.department ?? 'بدون قسم',
        leaveType: row.leaveType,
        entitled: Math.round(entitled * 10) / 10,
        usedDays: Math.round(used * 10) / 10,
        remaining,
        usageRate:
          entitled === 0 ? 0 : Math.round((used / entitled) * 1000) / 10,
      };
    });

    const missing = await this.countEmployeesWithoutBalances(year, scope);
    const runningLow = rows.filter(
      (row) => row.entitled > 0 && row.remaining <= LOW_LEAVE_BALANCE_THRESHOLD,
    ).length;

    return {
      title: 'تقرير أرصدة الإجازات',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'employee', label: 'الموظف', type: 'text', width: 24 },
        { key: 'department', label: 'القسم', type: 'text', width: 18 },
        { key: 'leaveType', label: 'نوع الإجازة', type: 'text', width: 20 },
        { key: 'entitled', label: 'الرصيد المستحق', type: 'number', width: 16 },
        { key: 'usedDays', label: 'المستهلك', type: 'number', width: 14 },
        { key: 'remaining', label: 'المتبقي', type: 'number', width: 14 },
        { key: 'usageRate', label: 'نسبة الاستهلاك', type: 'percent', width: 16 },
      ],
      rows,
      summary: [
        { label: 'السنة', value: year },
        { label: 'عدد الأرصدة', value: rows.length },
        { label: `أرصدة متبقّيها ${LOW_LEAVE_BALANCE_THRESHOLD} أيام أو أقل`, value: runningLow  },
        { label: 'موظفون بلا أرصدة محسوبة', value: missing },
      ],
    };
  }

  private async countEmployeesWithoutBalances(
    year: number,
    scope: ReportScope,
  ): Promise<number> {
    const builder = this.profilesRepository
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .leftJoin(
        LeaveBalanceEntity,
        'b',
        'b.user_id = p.user_id AND b.year = :year',
        { year },
      )
      .where('u.status = true')
      .andWhere('b.balance_id IS NULL');

    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    return builder.getCount();
  }
}