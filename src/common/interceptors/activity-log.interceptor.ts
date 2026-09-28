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

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  private readonly actionByMethod: Record<string, ActivityAction> = {
    POST: ActivityAction.CREATE,
    PUT: ActivityAction.UPDATE,
    PATCH: ActivityAction.UPDATE,
    DELETE: ActivityAction.DELETE,
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    const action = this.actionByMethod[method];

    if (!action) {
      return next.handle();
    }

    const path: string = request.route?.path ?? request.url;
    const userId: number | undefined = request.user?.user_id;
    const entity = this.extractEntity(path);
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

  private extractEntityId(request: any): number | undefined {
    const rawId = request.params?.id;
    if (!rawId) return undefined;
    const parsed = Number(rawId);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}