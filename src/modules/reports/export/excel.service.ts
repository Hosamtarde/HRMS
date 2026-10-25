import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { ReportColumnType, ReportResult } from '../interfaces/report-result.interface';

const NUMBER_FORMATS: Record<ReportColumnType, string> = {
  money: '#,##0.00 "₪"',
  percent: '0.0"%"',
  number: 'General',
  date: 'yyyy-mm-dd',
  text: '@',
};

const HEADER_FILL = 'FF1D4E89';
const TITLE_COLOR = 'FF101A2B';
const MUTED_COLOR = 'FF6B7A91';

@Injectable()
export class ExcelService {
  async build(report: ReportResult): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'NexusHR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Report', {
      views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    });

    const lastColumn = report.columns.length;

    sheet.mergeCells(1, 1, 1, lastColumn);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = report.title;
    titleCell.font = { size: 16, bold: true, color: { argb: TITLE_COLOR } };
    titleCell.alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells(2, 1, 2, lastColumn);
    const periodCell = sheet.getCell(2, 1);
    periodCell.value = `الفترة: ${report.period.from} — ${report.period.to}   |   تاريخ الإصدار: ${report.generatedAt.slice(0, 10)}`;
    periodCell.font = { size: 10, color: { argb: MUTED_COLOR } };
    periodCell.alignment = { horizontal: 'right' };

    const headerRow = sheet.getRow(4);
    report.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getColumn(index + 1).width = column.width ?? 18;
      sheet.getColumn(index + 1).numFmt = NUMBER_FORMATS[column.type];
    });
    headerRow.height = 22;

    report.rows.forEach((row, rowIndex) => {
      const sheetRow = sheet.getRow(rowIndex + 5);

      report.columns.forEach((column, columnIndex) => {
        const cell = sheetRow.getCell(columnIndex + 1);
        const value = row[column.key];

        cell.value =
          value === null || value === undefined
            ? ''
            : column.type === 'text' || column.type === 'date'
              ? String(value)
              : Number(value);

        cell.alignment = {
          horizontal: column.type === 'text' ? 'right' : 'center',
        };

        if (rowIndex % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F5F9' },
          };
        }
      });
    });

    let summaryRowNumber = report.rows.length + 7;

    for (const item of report.summary) {
      const labelCell = sheet.getCell(summaryRowNumber, 1);
      labelCell.value = item.label;
      labelCell.font = { bold: true, color: { argb: TITLE_COLOR } };

      const valueCell = sheet.getCell(summaryRowNumber, 2);
      valueCell.value = item.value;

      summaryRowNumber += 1;
    }

    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: lastColumn },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }
}