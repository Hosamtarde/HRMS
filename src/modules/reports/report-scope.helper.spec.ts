import { Role } from '../../common/enums/enums';
import {
  distinctDepartmentIds,
  INVALID_DEPARTMENT,
  parseDepartmentId,
  resolveReportScope,
  scopeDenialReason,
} from './report-scope.helper';

describe('report-scope.helper', () => {
  describe('parseDepartmentId', () => {
    it('reads a missing parameter as no filter', () => {
      expect(parseDepartmentId(undefined)).toBeNull();
    });

    it('reads an empty parameter as no filter', () => {
      expect(parseDepartmentId('')).toBeNull();
    });

    it('reads a whole number', () => {
      expect(parseDepartmentId('5')).toBe(5);
    });

    it('rejects text', () => {
      expect(parseDepartmentId('abc')).toBe(INVALID_DEPARTMENT);
    });

    it('rejects zero', () => {
      expect(parseDepartmentId('0')).toBe(INVALID_DEPARTMENT);
    });

    it('rejects a negative number', () => {
      expect(parseDepartmentId('-3')).toBe(INVALID_DEPARTMENT);
    });

    it('rejects a fraction', () => {
      expect(parseDepartmentId('2.5')).toBe(INVALID_DEPARTMENT);
    });
  });

  describe('distinctDepartmentIds', () => {
    it('removes duplicates', () => {
      expect(
        distinctDepartmentIds([
          { department_id: 3 },
          { department_id: 3 },
          { department_id: 7 },
        ]),
      ).toEqual([3, 7]);
    });

    it('drops employees with no department', () => {
      expect(
        distinctDepartmentIds([
          { department_id: 3 },
          { department_id: null },
          { department_id: undefined },
        ]),
      ).toEqual([3]);
    });

    it('returns an empty list when nobody has a department', () => {
      expect(distinctDepartmentIds([{ department_id: null }])).toEqual([]);
    });
  });

  describe('scopeDenialReason', () => {
    it('never blocks HR', () => {
      expect(
        scopeDenialReason({
          role: Role.HR_ADMIN,
          requestedDepartmentId: 99,
          allowedDepartmentIds: [],
        }),
      ).toBeNull();
    });

    it('blocks a manager with nobody reporting to them', () => {
      expect(
        scopeDenialReason({
          role: Role.MANAGER,
          requestedDepartmentId: null,
          allowedDepartmentIds: [],
        }),
      ).toBe('no_team');
    });

    it('blocks a manager asking for a department outside their team', () => {
      expect(
        scopeDenialReason({
          role: Role.MANAGER,
          requestedDepartmentId: 9,
          allowedDepartmentIds: [3, 7],
        }),
      ).toBe('department_out_of_scope');
    });

    it('allows a manager asking for one of their own departments', () => {
      expect(
        scopeDenialReason({
          role: Role.MANAGER,
          requestedDepartmentId: 7,
          allowedDepartmentIds: [3, 7],
        }),
      ).toBeNull();
    });

    it('allows a manager asking for no department in particular', () => {
      expect(
        scopeDenialReason({
          role: Role.MANAGER,
          requestedDepartmentId: null,
          allowedDepartmentIds: [3, 7],
        }),
      ).toBeNull();
    });
  });

  describe('resolveReportScope', () => {
    it('gives HR the whole company when no department is named', () => {
      expect(
        resolveReportScope({
          role: Role.HR_ADMIN,
          requestedDepartmentId: null,
          allowedDepartmentIds: [],
        }),
      ).toEqual({ departmentIds: null });
    });

    it('narrows HR to the department they named', () => {
      expect(
        resolveReportScope({
          role: Role.HR_ADMIN,
          requestedDepartmentId: 3,
          allowedDepartmentIds: [],
        }),
      ).toEqual({ departmentIds: [3] });
    });

    it('gives a manager every department their team spans', () => {
      expect(
        resolveReportScope({
          role: Role.MANAGER,
          requestedDepartmentId: null,
          allowedDepartmentIds: [3, 7],
        }),
      ).toEqual({ departmentIds: [3, 7] });
    });

    it('narrows a manager to the department they named', () => {
      expect(
        resolveReportScope({
          role: Role.MANAGER,
          requestedDepartmentId: 7,
          allowedDepartmentIds: [3, 7],
        }),
      ).toEqual({ departmentIds: [7] });
    });
  });
});
