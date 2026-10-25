import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportFormatInterceptor } from './report-format.interceptor';
import { ReportScopeGuard } from './report-scope.guard';
import { CurrentScope } from './decorators/report-scope.decorator';
import type { ReportScope } from './interfaces/report-scope.interface';
import { AttendanceReportService } from './services/attendance-report.service';
import { LeaveReportService } from './services/leave-report.service';
import { PayrollReportService } from './services/payroll-report.service';
import { PerformanceReportService } from './services/performance-report.service';
import { TasksReportService } from './services/tasks-report.service';
import { RecruitmentReportService } from './services/recruitment-report.service';
import { DashboardService } from './services/dashboard.service';

@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, ReportScopeGuard)
@Roles(Role.HR_ADMIN, Role.MANAGER)
@UseInterceptors(ReportFormatInterceptor)
export class ReportsController {
  constructor(
    private readonly attendanceReportService: AttendanceReportService,
    private readonly leaveReportService: LeaveReportService,
    private readonly payrollReportService: PayrollReportService,
    private readonly performanceReportService: PerformanceReportService,
    private readonly tasksReportService: TasksReportService,
    private readonly recruitmentReportService: RecruitmentReportService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('dashboard')
  dashboard(@CurrentScope() scope: ReportScope) {
    return this.dashboardService.build(scope);
  }

  @Get('attendance')
  attendance(@Query() query: ReportQueryDto, @CurrentScope() scope: ReportScope) {
    return this.attendanceReportService.build(query, scope);
  }

  @Get('leave-balances')
  leaveBalances(@Query() query: ReportQueryDto, @CurrentScope() scope: ReportScope) {
    return this.leaveReportService.build(query, scope);
  }

  @Roles(Role.HR_ADMIN)
  @Get('payroll')
  payroll(@Query() query: ReportQueryDto, @CurrentScope() scope: ReportScope) {
    return this.payrollReportService.build(query, scope);
  }

  @Get('performance')
  performance(@Query() query: ReportQueryDto, @CurrentScope() scope: ReportScope) {
    return this.performanceReportService.build(query, scope);
  }

  @Get('tasks')
  tasks(@Query() query: ReportQueryDto, @CurrentScope() scope: ReportScope) {
    return this.tasksReportService.build(query, scope);
  }

  @Roles(Role.HR_ADMIN)
  @Get('recruitment')
  recruitment(@Query() query: ReportQueryDto) {
    return this.recruitmentReportService.build(query);
  }
}