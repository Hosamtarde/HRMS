import { Role } from '../../common/enums/enums';

export interface TaskAccessFacts {
  role: Role;
  actorId: number;
  assignedById: number;
  assigneeIds: number[];
  scopeIds: number[];
}

export function hasScopeOver(
  assigneeIds: number[],
  scopeIds: number[],
): boolean {
  if (!assigneeIds.length) {
    return false;
  }
  return assigneeIds.some((id) => scopeIds.includes(id));
}

export function canViewTask(facts: TaskAccessFacts): boolean {
  const { role, actorId, assignedById, assigneeIds, scopeIds } = facts;

  if (role === Role.HR_ADMIN) {
    return true;
  }
  if (assignedById === actorId) {
    return true;
  }
  if (assigneeIds.includes(actorId)) {
    return true;
  }
  return role === Role.MANAGER && hasScopeOver(assigneeIds, scopeIds);
}

export function canManageTask(facts: TaskAccessFacts): boolean {
  const { role, actorId, assignedById, assigneeIds, scopeIds } = facts;

  if (role === Role.HR_ADMIN) {
    return true;
  }
  if (assignedById === actorId) {
    return true;
  }
  return role === Role.MANAGER && hasScopeOver(assigneeIds, scopeIds);
}
