import { OrgListQueryDto } from './dto/org-list-query.dto';
import {
  OrgListItem,
  OrgNode,
  OrgPerson,
} from './interfaces/org-chart.interface';

export interface ListRow {
  user_id: number;
  reports_to: number | null;
  first_name: string;
  last_name: string;
  role: string;
  position: string | null;
  department_name: string | null;
  depth?: number;
}

export interface ListItemRow {
  user_id: number;
  first_name: string;
  last_name: string;
  role: string;
  position: string | null;
  department_name: string | null;
  reports_to: number | null;
  manager_name: string | null;
  direct_reports: number | string;
}

export function toPerson(row: ListRow): OrgPerson {
  return {
    userId: Number(row.user_id),
    fullName: `${row.first_name} ${row.last_name}`,
    role: row.role,
    position: row.position,
    departmentName: row.department_name,
  };
}

export function toListItem(row: ListItemRow): OrgListItem {
  return {
    userId: Number(row.user_id),
    fullName: `${row.first_name} ${row.last_name}`,
    role: row.role,
    position: row.position,
    departmentName: row.department_name,
    managerId: row.reports_to === null ? null : Number(row.reports_to),
    managerName: row.manager_name,
    directReportsCount: Number(row.direct_reports),
  };
}

export function buildTree(
  rows: ListRow[],
  counts: Map<number, number>,
  rootUserId: number,
): OrgNode | null {
  const nodes = new Map<number, OrgNode>();

  for (const row of rows) {
    nodes.set(Number(row.user_id), {
      ...toPerson(row),
      directReportsCount: counts.get(Number(row.user_id)) ?? 0,
      children: [],
    });
  }

  for (const row of rows) {
    const id = Number(row.user_id);
    if (id === rootUserId || row.reports_to === null) {
      continue;
    }
    const parent = nodes.get(Number(row.reports_to));
    const node = nodes.get(id);
    if (parent && node) {
      parent.children.push(node);
    }
  }

  return nodes.get(rootUserId) ?? null;
}

export function buildListFilters(query: OrgListQueryDto): {
  where: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.q) {
    conditions.push(
      `(CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR p.position LIKE ?)`,
    );
    params.push(`%${query.q}%`, `%${query.q}%`);
  }
  if (query.departmentId) {
    conditions.push('p.department_id = ?');
    params.push(query.departmentId);
  }
  if (query.managerId) {
    conditions.push('p.reports_to = ?');
    params.push(query.managerId);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
