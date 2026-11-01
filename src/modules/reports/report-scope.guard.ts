import {
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
      reportScope?: { departmentIds: number[] | null };
    }>();

    const requested = request.query.departmentId
      ? Number(request.query.departmentId)
      : null;

    if (request.user.role === Role.HR_ADMIN) {
      request.reportScope = {
        departmentIds: requested === null ? null : [requested],
      };
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

    const allowed = [
      ...new Set(
        profiles
          .map((profile) => profile.department_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    if (allowed.length === 0) {
      throw new ForbiddenException(
        'No employees report to you, so no report scope applies to you',
      );
    }

    if (requested !== null && !allowed.includes(requested)) {
      throw new ForbiddenException(
        'You can only view reports for departments your team belongs to',
      );
    }

    request.reportScope = {
      departmentIds: requested === null ? allowed : [requested],
    };

    return true;
  }
}