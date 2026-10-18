import { RequestType } from '../enums/enums';

export const LOW_LEAVE_BALANCE_THRESHOLD = 3;

export const COMPANY_NAME = 'HRMS';

export const REQUEST_LABELS: Record<RequestType, string> = {
  [RequestType.LEAVE]: 'الإجازة',
  [RequestType.LOAN]: 'القرض',
  [RequestType.PERMISSION]: 'الاستئذان',
  [RequestType.CUSTOM]: 'الطلب',
};