import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: unknown =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.extractMessage(exceptionResponse, exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} — ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(
    exceptionResponse: unknown,
    exception: unknown,
  ): string | string[] {
    if (
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const raw: unknown = exceptionResponse.message;
      if (typeof raw === 'string') {
        return raw;
      }
      if (Array.isArray(raw)) {
        return (raw as unknown[]).filter(
          (item): item is string => typeof item === 'string',
        );
      }
    }
    if (exception instanceof HttpException) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
