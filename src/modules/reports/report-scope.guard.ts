import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { OrgChartService } from '../org-chart/org-chart.service';
import { Role } from '../../common/enums/enums';
import { ReportScope } from './interfaces/report-scope.interface';
import {
  distinctDepartmentIds,
  INVALID_DEPARTMENT,
  parseDepartmentId,
  resolveReportScope,
  scopeDenialReason,
} from './report-scope.helper';

@Injectable()
export class ReportScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(EmployeeProfileEntity)
    private readonly profilesRepository: Repository<EmployeeProfileEntity>,
    private readonly orgChartService: OrgChartService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: { user_id: number; role: Role };
      query: { departmentId?: string };
      reportScope?: ReportScope;
    }>();

    const parsed = parseDepartmentId(request.query.departmentId);

    if (parsed === INVALID_DEPARTMENT) {
      throw new BadRequestException(
        'departmentId must be a positive whole number',
      );
    }

    const role = request.user.role;

    if (role === Role.HR_ADMIN) {
      request.reportScope = resolveReportScope({
        role,
        requestedDepartmentId: parsed,
        allowedDepartmentIds: [],
      });
      return true;
    }

    const scopeIds = await this.orgChartService.getSubtreeIds(
      request.user.user_id,
    );

    const profiles = scopeIds.length
      ? await this.profilesRepository.find({
          where: { user_id: In(scopeIds) },
          select: { department_id: true },
        })
      : [];

    const allowedDepartmentIds = distinctDepartmentIds(profiles);

    const facts = {
      role,
      requestedDepartmentId: parsed,
      allowedDepartmentIds,
    };

    const denial = scopeDenialReason(facts);

    if (denial === 'no_team') {
      throw new ForbiddenException(
        'No employees report to you, so no report scope applies to you',
      );
    }
    if (denial === 'department_out_of_scope') {
      throw new ForbiddenException(
        'You can only view reports for departments your team belongs to',
      );
    }

    request.reportScope = resolveReportScope(facts);

    return true;
  }
}
