import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentEntity } from '../../recruitment/recruitment.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';

interface RecruitmentRow {
  position: string;
  total: string;
  pending: string;
  shortlisted: string;
  interview: string;
  accepted: string;
  rejected: string;
}

@Injectable()
export class RecruitmentReportService {
  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepository: Repository<RecruitmentEntity>,
  ) {}

  async build(query: ReportQueryDto): Promise<ReportResult> {
    const raw = await this.recruitmentRepository
      .createQueryBuilder('r')
      .select('r.applied_position', 'position')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN r.application_status = 'pending' THEN 1 ELSE 0 END)",
        'pending',
      )
      .addSelect(
        "SUM(CASE WHEN r.application_status = 'shortlisted' THEN 1 ELSE 0 END)",
        'shortlisted',
      )
      .addSelect(
        "SUM(CASE WHEN r.application_status = 'interview_scheduled' THEN 1 ELSE 0 END)",
        'interview',
      )
      .addSelect(
        "SUM(CASE WHEN r.application_status = 'accepted' THEN 1 ELSE 0 END)",
        'accepted',
      )
      .addSelect(
        "SUM(CASE WHEN r.application_status = 'rejected' THEN 1 ELSE 0 END)",
        'rejected',
      )
      .where('DATE(r.submission_date) BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      })
      .groupBy('r.applied_position')
      .orderBy('total', 'DESC')
      .getRawMany<RecruitmentRow>();

    const rows = raw.map((row) => {
      const total = Number(row.total);
      const accepted = Number(row.accepted);

      return {
        position: row.position,
        total,
        pending: Number(row.pending),
        shortlisted: Number(row.shortlisted),
        interview: Number(row.interview),
        accepted,
        rejected: Number(row.rejected),
        acceptanceRate:
          total === 0 ? 0 : Math.round((accepted / total) * 1000) / 10,
      };
    });

    const totalOf = (
      key: 'total' | 'shortlisted' | 'interview' | 'accepted' | 'rejected',
    ) => rows.reduce((sum, row) => sum + row[key], 0);

    const total = totalOf('total');
    const accepted = totalOf('accepted');

    return {
      title: 'تقرير التوظيف',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'position', label: 'الوظيفة', type: 'text', width: 28 },
        { key: 'total', label: 'إجمالي الطلبات', type: 'number', width: 16 },
        { key: 'pending', label: 'قيد المراجعة', type: 'number', width: 14 },
        { key: 'shortlisted', label: 'القائمة المختصرة', type: 'number', width: 18 },
        { key: 'interview', label: 'مقابلة', type: 'number', width: 12 },
        { key: 'accepted', label: 'مقبول', type: 'number', width: 12 },
        { key: 'rejected', label: 'مرفوض', type: 'number', width: 12 },
        { key: 'acceptanceRate', label: 'نسبة القبول', type: 'percent', width: 14 },
      ],
      rows,
      summary: [
        { label: 'عدد الوظائف', value: rows.length },
        { label: 'إجمالي الطلبات', value: total },
        { label: 'وصلوا للقائمة المختصرة', value: totalOf('shortlisted') },
        { label: 'وصلوا للمقابلة', value: totalOf('interview') },
        { label: 'مقبولون', value: accepted },
        { label: 'مرفوضون', value: totalOf('rejected') },
        {
          label: 'نسبة القبول العامة',
          value: total === 0 ? '—' : `${Math.round((accepted / total) * 1000) / 10}%`,
        },
      ],
    };
  }
}