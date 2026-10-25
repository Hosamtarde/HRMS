import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { DepartmentEntity } from '../departments/department.entity';
import { ExportModule } from './export/export.module';
import { ReportsController } from './reports.controller';
import { ReportFormatInterceptor } from './report-format.interceptor';
import { ReportScopeGuard } from './report-scope.guard';
import { AttendanceReportService } from './services/attendance-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeProfileEntity, DepartmentEntity]),
    ExportModule,
  ],
  controllers: [ReportsController],
  providers: [
    AttendanceReportService,
    ReportFormatInterceptor,
    ReportScopeGuard,
  ],
})
export class ReportsModule {}