import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceReviewEntity } from '../../performance/reviews/performance-review.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { DepartmentEntity } from '../../departments/department.entity';
import { ReviewStatus } from '../../../common/enums/enums';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';
import { ReportScope } from '../interfaces/report-scope.interface';

interface ReviewRow {
  employee: string;
  department: string | null;
  planName: string;
  reviewer: string | null;
  reviewStatus: ReviewStatus;
  totalScore: string | null;
  finalPercentage: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار التقييم',
  submitted: 'مُسلَّم',
};

@Injectable()
export class PerformanceReportService {
  constructor(
    @InjectRepository(PerformanceReviewEntity)
    private readonly reviewsRepository: Repository<PerformanceReviewEntity>,
  ) {}

  async build(query: ReportQueryDto, scope: ReportScope): Promise<ReportResult> {
    const builder = this.reviewsRepository
      .createQueryBuilder('r')
      .innerJoin('r.plan', 'pl')
      .innerJoin('r.reviewedUser', 'u')
      .leftJoin('r.reviewer', 'rv')
      .innerJoin(EmployeeProfileEntity, 'p', 'p.user_id = r.reviewed_user_id')
      .leftJoin(DepartmentEntity, 'd', 'd.department_id = p.department_id')
      .select("CONCAT(u.first_name, ' ', u.last_name)", 'employee')
      .addSelect('d.department_name', 'department')
      .addSelect('pl.plan_name', 'planName')
      .addSelect(
        "CASE WHEN rv.user_id IS NULL THEN NULL ELSE CONCAT(rv.first_name, ' ', rv.last_name) END",
        'reviewer',
      )
      .addSelect('r.review_status', 'reviewStatus')
      .addSelect('r.total_score', 'totalScore')
      .addSelect('r.final_percentage', 'finalPercentage')
      .where('pl.period_start <= :to AND pl.period_end >= :from', {
        from: query.from,
        to: query.to,
      })
      .orderBy('pl.plan_name', 'ASC')
      .addOrderBy('d.department_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC');

    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    const raw = await builder.getRawMany<ReviewRow>();

    const rows = raw.map((row) => ({
      employee: row.employee,
      department: row.department ?? 'بدون قسم',
      planName: row.planName,
      reviewer: row.reviewer ?? '—',
      reviewStatus: STATUS_LABELS[row.reviewStatus] ?? row.reviewStatus,
      totalScore: row.totalScore === null ? null : Number(row.totalScore),
      finalPercentage:
        row.finalPercentage === null ? null : Number(row.finalPercentage),
    }));

    const scored = rows
      .map((row) => row.finalPercentage)
      .filter((value): value is number => value !== null);

    const average =
      scored.length === 0
        ? null
        : Math.round(
            (scored.reduce((total, value) => total + value, 0) /
              scored.length) *
              10,
          ) / 10;

    const submitted = raw.filter(
      (row) => row.reviewStatus === ReviewStatus.SUBMITTED,
    ).length;

    return {
      title: 'تقرير تقييم الأداء',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'employee', label: 'الموظف', type: 'text', width: 22 },
        { key: 'department', label: 'القسم', type: 'text', width: 16 },
        { key: 'planName', label: 'خطة التقييم', type: 'text', width: 24 },
        { key: 'reviewer', label: 'المُقيِّم', type: 'text', width: 20 },
        { key: 'reviewStatus', label: 'الحالة', type: 'text', width: 16 },
        { key: 'totalScore', label: 'الدرجة', type: 'number', width: 12 },
        { key: 'finalPercentage', label: 'النسبة', type: 'percent', width: 12 },
      ],
      rows,
      summary: [
        { label: 'عدد التقييمات', value: rows.length },
        { label: 'مُسلَّمة', value: submitted },
        { label: 'بانتظار التقييم', value: rows.length - submitted },
        { label: 'متوسط النتائج', value: average === null ? '—' : `${average}%` },
        {
          label: 'أعلى نتيجة',
          value: scored.length === 0 ? '—' : `${Math.max(...scored)}%`,
        },
        {
          label: 'أدنى نتيجة',
          value: scored.length === 0 ? '—' : `${Math.min(...scored)}%`,
        },
      ],
    };
  }
}