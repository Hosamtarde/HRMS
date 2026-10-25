import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../departments/department.entity';
import { Role } from '../../common/enums/enums';

@Injectable()
export class ReportScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
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

    const managed = await this.departmentsRepository.find({
      where: { manager_id: request.user.user_id },
      select: { department_id: true },
    });

    if (managed.length === 0) {
      throw new ForbiddenException(
        'You do not manage any department, so no report scope applies to you',
      );
    }

    const allowed = managed.map((department) => department.department_id);

    if (requested !== null && !allowed.includes(requested)) {
      throw new ForbiddenException(
        'You can only view reports for departments you manage',
      );
    }

    request.reportScope = {
      departmentIds: requested === null ? allowed : [requested],
    };

    return true;
  }
}