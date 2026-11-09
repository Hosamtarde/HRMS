import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { OrgListQueryDto } from './dto/org-list-query.dto';
import {
  ManagerChangeResult,
  OrgAncestor,
  OrgCircle,
  OrgListItem,
  OrgListResult,
  OrgNode,
} from './interfaces/org-chart.interface';
import {
  buildListFilters,
  buildTree,
  ListItemRow,
  ListRow,
  toListItem,
  toPerson,
} from './org-chart.helper';

const PERSON_FIELDS = `p.user_id AS user_id, p.reports_to AS reports_to, u.first_name AS first_name, u.last_name AS last_name, u.role AS role, p.position AS position, d.department_name AS department_name`;

const PERSON_FROM = `FROM employee_profiles p JOIN users u ON u.user_id = p.user_id LEFT JOIN departments d ON d.department_id = p.department_id`;

const LIST_FROM = `FROM employee_profiles p
JOIN users u ON u.user_id = p.user_id
LEFT JOIN departments d ON d.department_id = p.department_id
LEFT JOIN users m ON m.user_id = p.reports_to
LEFT JOIN (SELECT reports_to, COUNT(*) AS total FROM employee_profiles WHERE reports_to IS NOT NULL GROUP BY reports_to) r ON r.reports_to = p.user_id`;

const LIST_FIELDS = `p.user_id AS user_id, u.first_name AS first_name, u.last_name AS last_name, u.role AS role, p.position AS position, d.department_name AS department_name, p.reports_to AS reports_to, CONCAT(m.first_name, ' ', m.last_name) AS manager_name, COALESCE(r.total, 0) AS direct_reports`;

const SUBTREE_SQL = `WITH RECURSIVE subtree AS (
  SELECT user_id, reports_to, 0 AS depth FROM employee_profiles WHERE user_id = ?
  UNION ALL
  SELECT c.user_id, c.reports_to, s.depth + 1 FROM employee_profiles c
  JOIN subtree s ON c.reports_to = s.user_id WHERE s.depth < ?
)
SELECT ${PERSON_FIELDS}, s.depth AS depth
FROM subtree s
JOIN employee_profiles p ON p.user_id = s.user_id
JOIN users u ON u.user_id = p.user_id
LEFT JOIN departments d ON d.department_id = p.department_id
ORDER BY s.depth, u.first_name`;

const SUBTREE_CONTAINS_SQL = `WITH RECURSIVE subtree AS (
  SELECT user_id, reports_to, 0 AS depth FROM employee_profiles WHERE user_id = ?
  UNION ALL
  SELECT c.user_id, c.reports_to, s.depth + 1 FROM employee_profiles c
  JOIN subtree s ON c.reports_to = s.user_id WHERE s.depth < ?
)
SELECT user_id FROM subtree WHERE user_id = ? LIMIT 1`;

const ANCESTORS_SQL = `WITH RECURSIVE chain AS (
  SELECT user_id, reports_to, 0 AS depth FROM employee_profiles WHERE user_id = ?
  UNION ALL
  SELECT c.user_id, c.reports_to, ch.depth + 1 FROM employee_profiles c
  JOIN chain ch ON c.user_id = ch.reports_to WHERE ch.depth < ?
)
SELECT ${PERSON_FIELDS}, ch.depth AS depth
FROM chain ch
JOIN employee_profiles p ON p.user_id = ch.user_id
JOIN users u ON u.user_id = p.user_id
LEFT JOIN departments d ON d.department_id = p.department_id
WHERE ch.depth > 0
ORDER BY ch.depth`;

const SUBTREE_IDS_SQL = `WITH RECURSIVE subtree AS (
  SELECT user_id, reports_to, 0 AS depth FROM employee_profiles WHERE user_id = ?
  UNION ALL
  SELECT c.user_id, c.reports_to, s.depth + 1 FROM employee_profiles c
  JOIN subtree s ON c.reports_to = s.user_id WHERE s.depth < ?
)
SELECT user_id FROM subtree`;

@Injectable()
export class OrgChartService {
  private readonly maxDepth = 10;
  private readonly chartDepth = 2;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getChart(rootUserId?: number): Promise<OrgNode> {
    const root = rootUserId ?? (await this.findRoot());
    const rows = await this.dataSource.query<ListRow[]>(SUBTREE_SQL, [
      root,
      this.chartDepth,
    ]);
    if (!rows.length) {
      throw new NotFoundException('Employee profile not found');
    }
    const counts = await this.countDirectReports(rows.map((r) => r.user_id));

    const tree = buildTree(rows, counts, root);
    if (!tree) {
      throw new NotFoundException('Employee profile not found');
    }
    return tree;
  }

  async getList(query: OrgListQueryDto): Promise<OrgListResult> {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const { where, params } = buildListFilters(query);

    const rows = await this.dataSource.query<ListItemRow[]>(
      `SELECT ${LIST_FIELDS} ${LIST_FROM} ${where} ORDER BY p.reports_to IS NULL DESC, u.first_name ASC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    const totals = await this.dataSource.query<{ total: string }[]>(
      `SELECT COUNT(*) AS total ${LIST_FROM} ${where}`,
      params,
    );
    const total = Number(totals[0].total);

    return {
      data: rows.map((row): OrgListItem => toListItem(row)),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  async getCircle(userId: number): Promise<OrgCircle> {
    const rows = await this.dataSource.query<ListRow[]>(
      `SELECT ${PERSON_FIELDS} ${PERSON_FROM} WHERE p.user_id = ?`,
      [userId],
    );
    if (!rows.length) {
      throw new NotFoundException('Employee profile not found');
    }
    const row = rows[0];
    const managerRows: ListRow[] = row.reports_to
      ? await this.dataSource.query<ListRow[]>(
          `SELECT ${PERSON_FIELDS} ${PERSON_FROM} WHERE p.user_id = ?`,
          [row.reports_to],
        )
      : [];
    const peerRows = await this.dataSource.query<ListRow[]>(
      `SELECT ${PERSON_FIELDS} ${PERSON_FROM} WHERE p.reports_to <=> ? AND p.user_id <> ? ORDER BY u.first_name`,
      [row.reports_to, userId],
    );
    const reportRows = await this.dataSource.query<ListRow[]>(
      `SELECT ${PERSON_FIELDS} ${PERSON_FROM} WHERE p.reports_to = ? ORDER BY u.first_name`,
      [userId],
    );
    return {
      self: toPerson(row),
      manager: managerRows.length ? toPerson(managerRows[0]) : null,
      peers: peerRows.map((r) => toPerson(r)),
      directReports: reportRows.map((r) => toPerson(r)),
      chain: await this.getAncestors(userId),
    };
  }

  async getAncestors(userId: number): Promise<OrgAncestor[]> {
    const rows = await this.dataSource.query<ListRow[]>(ANCESTORS_SQL, [
      userId,
      this.maxDepth,
    ]);
    return rows.map((r) => ({ ...toPerson(r), depth: Number(r.depth) }));
  }

  async isInSubtree(
    rootUserId: number,
    candidateUserId: number,
  ): Promise<boolean> {
    const rows = await this.dataSource.query<{ user_id: number }[]>(
      SUBTREE_CONTAINS_SQL,
      [rootUserId, this.maxDepth, candidateUserId],
    );
    return rows.length > 0;
  }

  async getSubtreeIds(rootUserId: number): Promise<number[]> {
    const rows = await this.dataSource.query<{ user_id: number }[]>(
      SUBTREE_IDS_SQL,
      [rootUserId, this.maxDepth],
    );
    return rows.map((row) => Number(row.user_id));
  }

  async changeManager(
    userId: number,
    managerId: number | null,
  ): Promise<ManagerChangeResult> {
    const result = await this.dataSource.transaction(async (manager) => {
      const current = await manager.query<
        { user_id: number; reports_to: number | null }[]
      >(
        `SELECT user_id, reports_to FROM employee_profiles WHERE user_id = ? FOR UPDATE`,
        [userId],
      );
      if (!current.length) {
        throw new NotFoundException('Employee profile not found');
      }
      const previousManagerId: number | null = current[0].reports_to;
      if (managerId !== null) {
        const target = await manager.query<{ user_id: number }[]>(
          `SELECT user_id FROM employee_profiles WHERE user_id = ?`,
          [managerId],
        );
        if (!target.length) {
          throw new BadRequestException(
            'The new manager has no employee profile',
          );
        }
        const cycle = await manager.query<{ user_id: number }[]>(
          SUBTREE_CONTAINS_SQL,
          [userId, this.maxDepth, managerId],
        );
        if (cycle.length) {
          throw new BadRequestException(
            'This change would create a cycle in the hierarchy',
          );
        }
      } else {
        const otherRoots = await manager.query<{ user_id: number }[]>(
          `SELECT user_id FROM employee_profiles WHERE reports_to IS NULL AND user_id <> ? LIMIT 1`,
          [userId],
        );
        if (otherRoots.length) {
          throw new BadRequestException('The hierarchy already has a root');
        }
      }
      await manager.query(
        `UPDATE employee_profiles SET reports_to = ? WHERE user_id = ?`,
        [managerId, userId],
      );
      return { userId, previousManagerId, managerId };
    });
    if (result.previousManagerId !== result.managerId) {
      await this.emitManagerChanged(result);
    }
    return result;
  }

  private async emitManagerChanged(result: ManagerChangeResult): Promise<void> {
    const ids = [result.userId];
    if (result.managerId) {
      ids.push(result.managerId);
    }
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.dataSource.query<
      { user_id: number; full_name: string }[]
    >(
      `SELECT user_id, CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE user_id IN (${placeholders})`,
      ids,
    );
    const names = new Map<number, string>();
    for (const row of rows) {
      names.set(Number(row.user_id), row.full_name);
    }
    this.eventEmitter.emit(NOTIFICATION_EVENTS.MANAGER_CHANGED, {
      userId: result.userId,
      employeeName: names.get(result.userId) ?? '',
      managerId: result.managerId,
      managerName: result.managerId
        ? (names.get(result.managerId) ?? '')
        : null,
      previousManagerId: result.previousManagerId,
    });
  }

  private async findRoot(): Promise<number> {
    const rows = await this.dataSource.query<{ user_id: number }[]>(
      `SELECT user_id FROM employee_profiles WHERE reports_to IS NULL ORDER BY user_id LIMIT 1`,
    );
    if (!rows.length) {
      throw new NotFoundException('The organisation chart has no root');
    }
    return Number(rows[0].user_id);
  }

  private async countDirectReports(
    userIds: number[],
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (!userIds.length) {
      return counts;
    }
    const placeholders = userIds.map(() => '?').join(', ');
    const rows = await this.dataSource.query<
      { manager_id: number; total: string }[]
    >(
      `SELECT reports_to AS manager_id, COUNT(*) AS total FROM employee_profiles WHERE reports_to IN (${placeholders}) GROUP BY reports_to`,
      userIds,
    );
    for (const row of rows) {
      counts.set(Number(row.manager_id), Number(row.total));
    }
    return counts;
  }
}
