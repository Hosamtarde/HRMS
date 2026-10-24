import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { PdfService } from './pdf.service';

@Module({
  providers: [ExcelService, PdfService],
  exports: [ExcelService, PdfService],
})
export class ExportModule {}