export type ReportColumnType = 'text' | 'number' | 'money' | 'percent' | 'date';

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
  width?: number;
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportResult {
  title: string;
  period: { from: string; to: string };
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary: ReportSummaryItem[];
  generatedAt: string;
}