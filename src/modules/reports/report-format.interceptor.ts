import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Response } from 'express';
import { ReportFormat } from '../../common/enums/enums';
import { ReportResult } from './interfaces/report-result.interface';
import { ExcelService } from './export/excel.service';
import { PdfService } from './export/pdf.service';
import { MAX_REPORT_ROWS } from './report.constants';

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
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      switchMap(async (report: ReportResult) => {
        this.assertWithinLimit(report);

        if (format !== ReportFormat.EXCEL && format !== ReportFormat.PDF) {
          return report;
        }

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

  private assertWithinLimit(report: ReportResult): void {
    if (!report?.rows || report.rows.length <= MAX_REPORT_ROWS) {
      return;
    }

    throw new PayloadTooLargeException(
      `This report returned ${report.rows.length} rows, which exceeds the limit of ${MAX_REPORT_ROWS}. Narrow the date range or filter by department.`,
    );
  }

  private nameOf(report: ReportResult, format: string): string {
    const slug = report.title.replace(/[\\/:*?"<>|]/g, '').trim();
    return `${slug} ${report.period.from}_${report.period.to}.${EXTENSIONS[format]}`;
  }
}