import { OrgListQueryDto } from './dto/org-list-query.dto';
import {
  buildListFilters,
  buildTree,
  ListItemRow,
  ListRow,
  toListItem,
  toPerson,
} from './org-chart.helper';

const person = (
  userId: number,
  reportsTo: number | null,
  firstName = `user${userId}`,
): ListRow => ({
  user_id: userId,
  reports_to: reportsTo,
  first_name: firstName,
  last_name: 'Tarade',
  role: 'employee',
  position: 'Developer',
  department_name: 'Engineering',
});

const listRow = (overrides: Partial<ListItemRow> = {}): ListItemRow => ({
  user_id: 20,
  first_name: 'Hosam',
  last_name: 'Tarade',
  role: 'employee',
  position: 'Developer',
  department_name: 'Engineering',
  reports_to: 30,
  manager_name: 'Sami Odeh',
  direct_reports: 0,
  ...overrides,
});

const query = (overrides: Partial<OrgListQueryDto>): OrgListQueryDto =>
  overrides;

describe('org-chart.helper', () => {
  describe('toPerson', () => {
    it('joins the first and last name', () => {
      expect(toPerson(person(20, 30, 'Hosam')).fullName).toBe('Hosam Tarade');
    });

    it('keeps a missing department as null', () => {
      expect(
        toPerson({ ...person(20, 30), department_name: null }).departmentName,
      ).toBeNull();
    });

    it('coerces an id arriving as a string', () => {
      expect(
        toPerson({ ...person(20, 30), user_id: '20' as unknown as number })
          .userId,
      ).toBe(20);
    });
  });

  describe('toListItem', () => {
    it('reports the root as having no manager', () => {
      const item = toListItem(
        listRow({ reports_to: null, manager_name: null }),
      );
      expect(item.managerId).toBeNull();
      expect(item.managerName).toBeNull();
    });

    it('keeps the manager id as a number', () => {
      expect(toListItem(listRow({ reports_to: 30 })).managerId).toBe(30);
    });

    it('turns the counted direct reports into a number', () => {
      expect(
        toListItem(listRow({ direct_reports: '4' })).directReportsCount,
      ).toBe(4);
    });

    it('treats nobody reporting in as zero', () => {
      expect(
        toListItem(listRow({ direct_reports: 0 })).directReportsCount,
      ).toBe(0);
    });
  });

  describe('buildTree', () => {
    it('hangs direct reports under the root', () => {
      const tree = buildTree(
        [person(10, null), person(20, 10), person(21, 10)],
        new Map([[10, 2]]),
        10,
      );

      expect(tree?.userId).toBe(10);
      expect(tree?.children.map((c) => c.userId)).toEqual([20, 21]);
    });

    it('nests a third level under the second', () => {
      const tree = buildTree(
        [person(10, null), person(20, 10), person(30, 20)],
        new Map(),
        10,
      );

      expect(tree?.children[0].children[0].userId).toBe(30);
    });

    it('attaches the direct report count from the counts map', () => {
      const tree = buildTree([person(10, null)], new Map([[10, 7]]), 10);
      expect(tree?.directReportsCount).toBe(7);
    });

    it('treats a person with no counted reports as having none', () => {
      const tree = buildTree([person(10, null)], new Map(), 10);
      expect(tree?.directReportsCount).toBe(0);
    });

    it('leaves out a row whose manager is not in the result', () => {
      const tree = buildTree(
        [person(10, null), person(20, 10), person(99, 55)],
        new Map(),
        10,
      );

      expect(tree?.children.map((c) => c.userId)).toEqual([20]);
    });

    it('does not adopt a second rootless person', () => {
      const tree = buildTree(
        [person(10, null), person(11, null)],
        new Map(),
        10,
      );

      expect(tree?.children).toHaveLength(0);
    });

    it('returns nothing when the requested root is absent', () => {
      expect(buildTree([person(20, 10)], new Map(), 10)).toBeNull();
    });
  });

  describe('buildListFilters', () => {
    it('produces no condition when nothing was asked for', () => {
      expect(buildListFilters(query({}))).toEqual({ where: '', params: [] });
    });

    it('searches the full name and the position with one term', () => {
      const { where, params } = buildListFilters(query({ q: 'hosam' }));

      expect(where).toContain('LIKE ?');
      expect(params).toEqual(['%hosam%', '%hosam%']);
    });

    it('filters by department', () => {
      const { where, params } = buildListFilters(query({ departmentId: 3 }));

      expect(where).toBe('WHERE p.department_id = ?');
      expect(params).toEqual([3]);
    });

    it('filters by manager', () => {
      const { where, params } = buildListFilters(query({ managerId: 30 }));

      expect(where).toBe('WHERE p.reports_to = ?');
      expect(params).toEqual([30]);
    });

    it('joins several filters with AND and keeps the parameter order', () => {
      const { where, params } = buildListFilters(
        query({ q: 'hosam', departmentId: 3, managerId: 30 }),
      );

      expect(where.split(' AND ')).toHaveLength(3);
      expect(params).toEqual(['%hosam%', '%hosam%', 3, 30]);
    });
  });
});
