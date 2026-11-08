import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../modules/activity-logs/activity-logs.service';
import { ActivityAction } from '../enums/enums';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor<
  unknown,
  unknown
> {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  private readonly actionByMethod: Record<string, ActivityAction> = {
    POST: ActivityAction.CREATE,
    PUT: ActivityAction.UPDATE,
    PATCH: ActivityAction.UPDATE,
    DELETE: ActivityAction.DELETE,
  };

  private readonly excludedEntities = ['auth'];

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;

    const action = this.actionByMethod[method];

    if (!action) {
      return next.handle();
    }

    const route = request.route as { path?: string } | undefined;
    const path = route?.path ?? request.url;
    const entity = this.extractEntity(path);

    if (this.excludedEntities.includes(entity)) {
      return next.handle();
    }

    const userId = request.user?.user_id;
    const entityId = this.extractEntityId(request);

    return next.handle().pipe(
      tap(() => {
        void this.activityLogsService.record({
          user_id: userId,
          action,
          entity,
          entity_id: entityId,
          method,
          path: request.originalUrl ?? path,
        });
      }),
    );
  }

  private extractEntity(path: string): string {
    const firstSegment = path.split('/').filter(Boolean)[0];
    return firstSegment ?? 'unknown';
  }

  private extractEntityId(request: AuthenticatedRequest): number | undefined {
    const rawId = request.params?.id;
    if (!rawId) return undefined;
    const parsed = Number(rawId);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
