import { Role } from '../../common/enums/enums';
import {
  canManageTask,
  canViewTask,
  hasScopeOver,
  TaskAccessFacts,
} from './task-access.helper';

const ASSIGNER = 10;
const ASSIGNEE = 20;
const OTHER_ASSIGNEE = 21;
const MANAGER_IN_CHARGE = 30;
const MANAGER_ELSEWHERE = 40;
const STRANGER = 50;

function facts(overrides: Partial<TaskAccessFacts>): TaskAccessFacts {
  return {
    role: Role.EMPLOYEE,
    actorId: STRANGER,
    assignedById: ASSIGNER,
    assigneeIds: [ASSIGNEE, OTHER_ASSIGNEE],
    scopeIds: [],
    ...overrides,
  };
}

describe('task-access.helper', () => {
  describe('hasScopeOver', () => {
    it('is false when the task has no assignees', () => {
      expect(hasScopeOver([], [MANAGER_IN_CHARGE, ASSIGNEE])).toBe(false);
    });

    it('is true when at least one assignee is inside the scope', () => {
      expect(
        hasScopeOver([ASSIGNEE, OTHER_ASSIGNEE], [MANAGER_IN_CHARGE, ASSIGNEE]),
      ).toBe(true);
    });

    it('is false when no assignee is inside the scope', () => {
      expect(
        hasScopeOver([ASSIGNEE, OTHER_ASSIGNEE], [MANAGER_ELSEWHERE]),
      ).toBe(false);
    });
  });

  describe('canViewTask', () => {
    it('lets HR see any task', () => {
      expect(canViewTask(facts({ role: Role.HR_ADMIN }))).toBe(true);
    });

    it('lets the person who assigned the task see it', () => {
      expect(canViewTask(facts({ actorId: ASSIGNER }))).toBe(true);
    });

    it('lets an assignee see the task', () => {
      expect(canViewTask(facts({ actorId: ASSIGNEE }))).toBe(true);
    });

    it('lets a manager see a task assigned to someone under them', () => {
      expect(
        canViewTask(
          facts({
            role: Role.MANAGER,
            actorId: MANAGER_IN_CHARGE,
            scopeIds: [MANAGER_IN_CHARGE, ASSIGNEE],
          }),
        ),
      ).toBe(true);
    });

    it('refuses a manager whose scope does not contain any assignee', () => {
      expect(
        canViewTask(
          facts({
            role: Role.MANAGER,
            actorId: MANAGER_ELSEWHERE,
            scopeIds: [MANAGER_ELSEWHERE, 41, 42],
          }),
        ),
      ).toBe(false);
    });

    it('refuses an unrelated employee', () => {
      expect(canViewTask(facts({ actorId: STRANGER }))).toBe(false);
    });
  });

  describe('canManageTask', () => {
    it('lets HR manage any task', () => {
      expect(canManageTask(facts({ role: Role.HR_ADMIN }))).toBe(true);
    });

    it('lets the person who assigned the task manage it', () => {
      expect(canManageTask(facts({ actorId: ASSIGNER }))).toBe(true);
    });

    it('refuses an assignee who is only an assignee', () => {
      expect(canManageTask(facts({ actorId: ASSIGNEE }))).toBe(false);
    });

    it('lets a manager manage a task assigned to someone under them', () => {
      expect(
        canManageTask(
          facts({
            role: Role.MANAGER,
            actorId: MANAGER_IN_CHARGE,
            scopeIds: [MANAGER_IN_CHARGE, ASSIGNEE],
          }),
        ),
      ).toBe(true);
    });

    it('refuses a manager whose scope does not contain any assignee', () => {
      expect(
        canManageTask(
          facts({
            role: Role.MANAGER,
            actorId: MANAGER_ELSEWHERE,
            scopeIds: [MANAGER_ELSEWHERE, 41, 42],
          }),
        ),
      ).toBe(false);
    });

    it('refuses an unrelated employee', () => {
      expect(canManageTask(facts({ actorId: STRANGER }))).toBe(false);
    });

    it('refuses an employee who happens to carry a stale empty scope', () => {
      expect(
        canManageTask(facts({ actorId: STRANGER, scopeIds: [STRANGER] })),
      ).toBe(false);
    });
  });
});
