import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { DepartmentEntity } from '../../departments/department.entity';
import { AttendanceEntity } from '../../attendance/attendance.entity';
import { RequestEntity } from '../../requests/request.entity';
import { AssignedTaskEntity } from '../../tasks/assigned-task.entity';
import { PerformanceReviewEntity } from '../../performance/reviews/performance-review.entity';
import { RecruitmentEntity } from '../../recruitment/recruitment.entity';
import { ReportResult } from '../interfaces/report-result.interface';
import { ReportScope } from '../interfaces/report-scope.interface';

interface CountByDepartment {
  departmentId: number | null;
  departmentName: string | null;
  value: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EmployeeProfileEntity)
    private readonly profilesRepository: Repository<EmployeeProfileEntity>,
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepository: Repository<RecruitmentEntity>,
  ) {}

  async build(scope: ReportScope): Promise<ReportResult> {
    const today = this.today();

    const [employees, presentToday, pendingRequests, overdueTasks, pendingReviews] =
      await Promise.all([
        this.countEmployees(scope),
        this.countPresentToday(scope, today),
        this.countPendingRequests(scope),
        this.countOverdueTasks(scope),
        this.countPendingReviews(scope),
      ]);

    const departments = new Map<
      string,
      {
        department: string;
        employees: number;
        presentToday: number;
        pendingRequests: number;
        overdueTasks: number;
        pendingReviews: number;
      }
    >();

    const put = (
      list: CountByDepartment[],
      key: 'employees' | 'presentToday' | 'pendingRequests' | 'overdueTasks' | 'pendingReviews',
    ) => {
      for (const item of list) {
        const name = item.departmentName ?? 'بدون قسم';

        if (!departments.has(name)) {
          departments.set(name, {
            department: name,
            employees: 0,
            presentToday: 0,
            pendingRequests: 0,
            overdueTasks: 0,
            pendingReviews: 0,
          });
        }

        departments.get(name)![key] = Number(item.value);
      }
    };

    put(employees, 'employees');
    put(presentToday, 'presentToday');
    put(pendingRequests, 'pendingRequests');
    put(overdueTasks, 'overdueTasks');
    put(pendingReviews, 'pendingReviews');

    const rows = [...departments.values()]
      .map((row) => ({
        ...row,
        presenceRate:
          row.employees === 0
            ? 0
            : Math.round((row.presentToday / row.employees) * 1000) / 10,
      }))
      .sort((a, b) => b.employees - a.employees);

    const totalOf = (
      key: 'employees' | 'presentToday' | 'pendingRequests' | 'overdueTasks' | 'pendingReviews',
    ) => rows.reduce((sum, row) => sum + row[key], 0);

    const totalEmployees = totalOf('employees');
    const totalPresent = totalOf('presentToday');

    const newApplications = scope.departmentIds
      ? null
      : await this.recruitmentRepository.count({
          where: { application_status: 'pending' as never },
        });

    const summary = [
      { label: 'موظفون نشطون', value: totalEmployees },
      {
        label: 'حضور اليوم',
        value:
          totalEmployees === 0
            ? '—'
            : `${totalPresent} (${Math.round((totalPresent / totalEmployees) * 1000) / 10}%)`,
      },
      { label: 'طلبات معلّقة', value: totalOf('pendingRequests') },
      { label: 'مهام متأخرة', value: totalOf('overdueTasks') },
      { label: 'تقييمات معلّقة', value: totalOf('pendingReviews') },
    ];

    if (newApplications !== null) {
      summary.push({ label: 'طلبات توظيف جديدة', value: newApplications });
    }

    return {
      title: 'لوحة المؤشرات',
      period: { from: today, to: today },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'department', label: 'القسم', type: 'text', width: 22 },
        { key: 'employees', label: 'الموظفون', type: 'number', width: 14 },
        { key: 'presentToday', label: 'حضور اليوم', type: 'number', width: 14 },
        { key: 'presenceRate', label: 'نسبة الحضور', type: 'percent', width: 14 },
        { key: 'pendingRequests', label: 'طلبات معلّقة', type: 'number', width: 16 },
        { key: 'overdueTasks', label: 'مهام متأخرة', type: 'number', width: 14 },
        { key: 'pendingReviews', label: 'تقييمات معلّقة', type: 'number', width: 16 },
      ],
      rows,
      summary,
    };
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private base() {
    return this.profilesRepository
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .leftJoin(DepartmentEntity, 'd', 'd.department_id = p.department_id')
      .select('p.department_id', 'departmentId')
      .addSelect('d.department_name', 'departmentName')
      .where('u.status = true')
      .groupBy('p.department_id')
      .addGroupBy('d.department_name');
  }

  private scoped(builder: ReturnType<typeof this.base>, scope: ReportScope) {
    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    return builder.getRawMany<CountByDepartment>();
  }

  private countEmployees(scope: ReportScope) {
    return this.scoped(this.base().addSelect('COUNT(*)', 'value'), scope);
  }

  private countPresentToday(scope: ReportScope, today: string) {
    return this.scoped(
      this.base()
        .leftJoin(
          AttendanceEntity,
          'a',
          "a.user_id = p.user_id AND a.attendance_date = :today AND a.attendance_status IN ('present', 'late')",
          { today },
        )
        .addSelect('COUNT(a.attendance_id)', 'value'),
      scope,
    );
  }

  private countPendingRequests(scope: ReportScope) {
    return this.scoped(
      this.base()
        .leftJoin(
          RequestEntity,
          'rq',
          "rq.user_id = p.user_id AND rq.request_status = 'pending'",
        )
        .addSelect('COUNT(rq.request_id)', 'value'),
      scope,
    );
  }

  private countOverdueTasks(scope: ReportScope) {
    return this.scoped(
      this.base()
        .leftJoin(AssignedTaskEntity, 'at', 'at.user_id = p.user_id')
        .leftJoin(
          'tasks',
          't',
          't.task_id = at.task_id AND t.deadline < CURDATE()',
        )
        .addSelect(
          'SUM(CASE WHEN t.task_id IS NOT NULL AND at.completion_percentage < 100 THEN 1 ELSE 0 END)',
          'value',
        ),
      scope,
    );
  }

  private countPendingReviews(scope: ReportScope) {
    return this.scoped(
      this.base()
        .leftJoin(
          PerformanceReviewEntity,
          'pv',
          "pv.reviewed_user_id = p.user_id AND pv.review_status = 'pending'",
        )
        .addSelect('COUNT(pv.review_id)', 'value'),
      scope,
    );
  }
}