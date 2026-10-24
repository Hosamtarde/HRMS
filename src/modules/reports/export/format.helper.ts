import { ReportColumnType } from '../interfaces/report-result.interface';

export function formatCell(value: unknown, type: ReportColumnType): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (type) {
    case 'money':
      return `${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ₪`;
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'number':
      return Number(value).toLocaleString('en-US');
    case 'date':
      return String(value).slice(0, 10);
    default:
      return String(value);
  }
}