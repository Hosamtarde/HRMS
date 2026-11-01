export interface OrgPerson {
  userId: number;
  fullName: string;
  role: string;
  position: string | null;
  departmentName: string | null;
}

export interface OrgNode extends OrgPerson {
  directReportsCount: number;
  children: OrgNode[];
}

export interface OrgAncestor extends OrgPerson {
  depth: number;
}

export interface OrgCircle {
  self: OrgPerson;
  manager: OrgPerson | null;
  peers: OrgPerson[];
  directReports: OrgPerson[];
  chain: OrgAncestor[];
}

export interface ManagerChangeResult {
  userId: number;
  previousManagerId: number | null;
  managerId: number | null;
}