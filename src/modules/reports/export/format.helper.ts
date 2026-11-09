import { ReportColumnType } from '../interfaces/report-result.interface';

const EM_DASH = '\u2014';
const SHEKEL = '\u20AA';

export function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return JSON.stringify(value) ?? '';
}

export function formatCell(value: unknown, type: ReportColumnType): string {
  if (value === null || value === undefined || value === '') {
    return EM_DASH;
  }

  switch (type) {
    case 'money':
      return `${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${SHEKEL}`;
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'number':
      return Number(value).toLocaleString('en-US');
    case 'date':
      return toText(value).slice(0, 10);
    default:
      return toText(value);
  }
}
