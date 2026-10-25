import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ReportScope } from '../interfaces/report-scope.interface';

export const CurrentScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ReportScope =>
    context.switchToHttp().getRequest<{ reportScope: ReportScope }>()
      .reportScope,
);