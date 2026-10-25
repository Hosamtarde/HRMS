import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedTaskEntity } from '../../tasks/assigned-task.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { DepartmentEntity } from '../../departments/department.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportResult } from '../interfaces/report-result.interface';
import { ReportScope } from '../interfaces/report-scope.interface';

interface TaskRow {
  employee: string;
  department: string | null;
  totalTasks: string;
  completed: string;
  overdue: string;
  avgCompletion: string | null;
}

@Injectable()
export class TasksReportService {
  constructor(
    @InjectRepository(AssignedTaskEntity)
    private readonly assignedTasksRepository: Repository<AssignedTaskEntity>,
  ) {}

  async build(query: ReportQueryDto, scope: ReportScope): Promise<ReportResult> {
    const builder = this.assignedTasksRepository
      .createQueryBuilder('a')
      .innerJoin('a.task', 't')
      .innerJoin('a.user', 'u')
      .innerJoin(EmployeeProfileEntity, 'p', 'p.user_id = a.user_id')
      .leftJoin(DepartmentEntity, 'd', 'd.department_id = p.department_id')
      .select("CONCAT(u.first_name, ' ', u.last_name)", 'employee')
      .addSelect('d.department_name', 'department')
      .addSelect('COUNT(*)', 'totalTasks')
      .addSelect(
        'SUM(CASE WHEN a.completion_percentage = 100 THEN 1 ELSE 0 END)',
        'completed',
      )
      .addSelect(
        'SUM(CASE WHEN a.completion_percentage = 100 THEN 0 WHEN t.deadline < CURDATE() THEN 1 ELSE 0 END)',
        'overdue',
      )
      .addSelect('AVG(a.completion_percentage)', 'avgCompletion')
      .where('t.deadline BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      })
      .groupBy('u.user_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .addGroupBy('d.department_name')
      .orderBy('d.department_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC');

    if (scope.departmentIds) {
      builder.andWhere('p.department_id IN (:...departmentIds)', {
        departmentIds: scope.departmentIds,
      });
    }

    const raw = await builder.getRawMany<TaskRow>();

    const rows = raw.map((row) => {
      const total = Number(row.totalTasks);
      const completed = Number(row.completed);

      return {
        employee: row.employee,
        department: row.department ?? 'بدون قسم',
        totalTasks: total,
        completed,
        inProgress: total - completed,
        overdue: Number(row.overdue),
        avgCompletion: Math.round(Number(row.avgCompletion ?? 0) * 10) / 10,
        completionRate:
          total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
      };
    });

    const totalTasks = rows.reduce((sum, row) => sum + row.totalTasks, 0);
    const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0);
    const totalOverdue = rows.reduce((sum, row) => sum + row.overdue, 0);

    return {
      title: 'تقرير المهام',
      period: { from: query.from, to: query.to },
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'employee', label: 'الموظف', type: 'text', width: 24 },
        { key: 'department', label: 'القسم', type: 'text', width: 18 },
        { key: 'totalTasks', label: 'عدد المهام', type: 'number', width: 14 },
        { key: 'completed', label: 'منجزة', type: 'number', width: 12 },
        { key: 'inProgress', label: 'قيد التنفيذ', type: 'number', width: 14 },
        { key: 'overdue', label: 'متأخرة', type: 'number', width: 12 },
        { key: 'avgCompletion', label: 'متوسط الإنجاز', type: 'percent', width: 16 },
        { key: 'completionRate', label: 'نسبة الإتمام', type: 'percent', width: 14 },
      ],
      rows,
      summary: [
        { label: 'عدد الموظفين', value: rows.length },
        { label: 'إجمالي المهام', value: totalTasks },
        { label: 'منجزة بالكامل', value: totalCompleted },
        { label: 'متأخرة', value: totalOverdue },
        {
          label: 'نسبة الإتمام العامة',
          value:
            totalTasks === 0
              ? '—'
              : `${Math.round((totalCompleted / totalTasks) * 1000) / 10}%`,
        },
      ],
    };
  }
}