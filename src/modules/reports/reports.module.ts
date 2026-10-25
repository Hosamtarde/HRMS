import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { DepartmentEntity } from '../departments/department.entity';
import { LeaveBalanceEntity } from '../leave-balances/leave-balance.entity';
import { PayrollEntity } from '../payroll/payroll.entity';
import { ExportModule } from './export/export.module';
import { ReportsController } from './reports.controller';
import { ReportFormatInterceptor } from './report-format.interceptor';
import { ReportScopeGuard } from './report-scope.guard';
import { AttendanceReportService } from './services/attendance-report.service';
import { LeaveReportService } from './services/leave-report.service';
import { PayrollReportService } from './services/payroll-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeProfileEntity,
      DepartmentEntity,
      LeaveBalanceEntity,
      PayrollEntity,
    ]),
    ExportModule,
  ],
  controllers: [ReportsController],
  providers: [
    AttendanceReportService,
    LeaveReportService,
    PayrollReportService,
    ReportFormatInterceptor,
    ReportScopeGuard,
  ],
})
export class ReportsModule {}