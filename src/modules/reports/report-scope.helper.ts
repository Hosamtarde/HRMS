import { Role } from '../../common/enums/enums';
import { ReportScope } from './interfaces/report-scope.interface';

export const INVALID_DEPARTMENT = 'invalid';

export type ParsedDepartmentId = number | null | typeof INVALID_DEPARTMENT;

export type ScopeDenial = 'no_team' | 'department_out_of_scope' | null;

export interface ScopeFacts {
  role: Role;
  requestedDepartmentId: number | null;
  allowedDepartmentIds: number[];
}

export function parseDepartmentId(raw?: string): ParsedDepartmentId {
  if (raw === undefined || raw === '') {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return INVALID_DEPARTMENT;
  }

  return parsed;
}

export function distinctDepartmentIds(
  rows: { department_id?: number | null }[],
): number[] {
  return [
    ...new Set(
      rows
        .map((row) => row.department_id)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];
}

export function scopeDenialReason(facts: ScopeFacts): ScopeDenial {
  const { role, requestedDepartmentId, allowedDepartmentIds } = facts;

  if (role === Role.HR_ADMIN) {
    return null;
  }
  if (allowedDepartmentIds.length === 0) {
    return 'no_team';
  }
  if (
    requestedDepartmentId !== null &&
    !allowedDepartmentIds.includes(requestedDepartmentId)
  ) {
    return 'department_out_of_scope';
  }
  return null;
}

export function resolveReportScope(facts: ScopeFacts): ReportScope {
  const { role, requestedDepartmentId, allowedDepartmentIds } = facts;

  if (role === Role.HR_ADMIN) {
    return {
      departmentIds:
        requestedDepartmentId === null ? null : [requestedDepartmentId],
    };
  }

  return {
    departmentIds:
      requestedDepartmentId === null
        ? allowedDepartmentIds
        : [requestedDepartmentId],
  };
}
