import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportFormatInterceptor } from './report-format.interceptor';
import { AttendanceReportService } from './services/attendance-report.service';

@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN, Role.MANAGER)
@UseInterceptors(ReportFormatInterceptor)
export class ReportsController {
  constructor(
    private readonly attendanceReportService: AttendanceReportService,
  ) {}

  @Get('attendance')
  attendance(@Query() query: ReportQueryDto) {
    return this.attendanceReportService.build(query);
  }
}