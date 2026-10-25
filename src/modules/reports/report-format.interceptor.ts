import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Response } from 'express';
import { ReportFormat } from '../../common/enums/enums';
import { ReportResult } from './interfaces/report-result.interface';
import { ExcelService } from './export/excel.service';
import { PdfService } from './export/pdf.service';

const CONTENT_TYPES: Record<string, string> = {
  [ReportFormat.EXCEL]:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ReportFormat.PDF]: 'application/pdf',
};

const EXTENSIONS: Record<string, string> = {
  [ReportFormat.EXCEL]: 'xlsx',
  [ReportFormat.PDF]: 'pdf',
};

@Injectable()
export class ReportFormatInterceptor implements NestInterceptor {
  constructor(
    private readonly excelService: ExcelService,
    private readonly pdfService: PdfService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const format = http.getRequest<{ query: { format?: string } }>().query
      .format;

    if (format !== ReportFormat.EXCEL && format !== ReportFormat.PDF) {
      return next.handle();
    }

    const response = http.getResponse<Response>();

    return next.handle().pipe(
      switchMap(async (report: ReportResult) => {
        const file =
          format === ReportFormat.EXCEL
            ? await this.excelService.build(report)
            : await this.pdfService.build(report);

        const niceName = this.nameOf(report, format);
        const safeName = `report_${report.period.from}_${report.period.to}.${EXTENSIONS[format]}`;

        response.setHeader('Content-Type', CONTENT_TYPES[format]);
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(niceName)}`,
        );

        return new StreamableFile(file);
      }),
    );
  }

  private nameOf(report: ReportResult, format: string): string {
    const slug = report.title.replace(/[\\/:*?"<>|]/g, '').trim();
    return `${slug} ${report.period.from}_${report.period.to}.${EXTENSIONS[format]}`;
  }
}