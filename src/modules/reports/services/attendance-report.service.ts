import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { AttendanceEntity } from '../../attendance/attendance.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';

interface AttendanceRow {
  employee: string;
  department: string | null;
  presentDays: string;
  lateDays: string;
  absentDays: string;
  leaveDays: string;
  totalHours: string | null;
}

@Injectable()
export class AttendanceReportService {
  constructor(
    @InjectRepository(EmployeeProfileEntity)
    private readonly profilesRepository: Repository<EmployeeProfileEntity>,
  ) {}

  async build(query: ReportQueryDto): Promise<ReportResult> {
    const builder = this.profilesRepository
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .leftJoin('p.department', 'd')
      .leftJoin(
        AttendanceEntity,
        'a',
        'a.user_id = p.user_id AND a.attendance_date BETWEEN :from AND :to',
        { from: query.from, to: query.to },
      )
      .select("CONCAT(u.first_name, ' ', u.last_name)", 'employee')
      .addSelect('d.department_name', 'department')
      .addSelect(
        "SUM(CASE WHEN a.attendance_status = 'present' THEN 1 ELSE 0 END)",
        'presentDays',
      )
      .addSelect(
        "SUM(CASE WHEN a.attendance_status = 'late' THEN 1 ELSE 0 END)",
        'lateDays',
      )
      .addSelect(
        "SUM(CASE WHEN a.attendance_status = 'absent' THEN 1 ELSE 0 END)",
        'absentDays',
      )
      .addSelect(
        "SUM(CASE WHEN a.attendance_status = 'on_leave' THEN 1 ELSE 0 END)",
        'leaveDays',
      )
      .addSelect('SUM(a.working_hours)', 'totalHours')
      .where('u.status = true')
      .groupBy('p.user_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .addGroupBy('d.department_name')
      .orderBy('d.department_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC');

    if (query.departmentId) {
      builder.andWhere('p.department_id = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    const raw = await builder.getRawMany<AttendanceRow>();

    const rows = raw.map((row) => {
      const present = Number(row.presentDays);
      const late = Number(row.lateDays);
      const absent = Number(row.absentDays);
      const leave = Number(row.leaveDays);
      const workingDays = present + late + absent;

      return {
        employee: row.employee,
        department: row.department ?? 'بدون قسم',
        presentDays: present,
        lateDays: late,
        absentDays: absent,
        leaveDays: leave,
        totalHours: Math.round(Number(row.totalHours ?? 0) * 10) / 10,
        attendanceRate:
          workingDays === 0
            ? 0
            : Math.round(((present + late) / workingDays) * 1000) / 10,
      };
    });

    const totalPresent = rows.reduce((sum, row) => sum + row.presentDays, 0);
    const totalLate = rows.reduce((sum, row) => sum + row.lateDays, 0);
    const totalAbsent = rows.reduce((sum, row) => sum + row.absentDays, 0);
    const totalWorkingDays = totalPresent + totalLate + totalAbsent;

    return {
      title: 'تقرير الحضور والغياب',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'employee', label: 'الموظف', type: 'text', width: 24 },
        { key: 'department', label: 'القسم', type: 'text', width: 20 },
        { key: 'presentDays', label: 'أيام الحضور', type: 'number', width: 14 },
        { key: 'lateDays', label: 'أيام التأخير', type: 'number', width: 14 },
        { key: 'absentDays', label: 'أيام الغياب', type: 'number', width: 14 },
        { key: 'leaveDays', label: 'أيام الإجازة', type: 'number', width: 14 },
        { key: 'totalHours', label: 'مجموع الساعات', type: 'number', width: 16 },
        { key: 'attendanceRate', label: 'نسبة الحضور', type: 'percent', width: 14 },
      ],
      rows,
      summary: [
        { label: 'عدد الموظفين', value: rows.length },
        { label: 'إجمالي أيام الحضور', value: totalPresent },
        { label: 'إجمالي أيام الغياب', value: totalAbsent },
        {
          label: 'نسبة الحضور العامة',
          value:
            totalWorkingDays === 0
              ? '—'
              : `${Math.round(((totalPresent + totalLate) / totalWorkingDays) * 1000) / 10}%`,
        },
      ],
    };
  }
}