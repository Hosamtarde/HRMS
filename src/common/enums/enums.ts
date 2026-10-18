export enum Role {
  APPLICANT = 'applicant',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  ON_LEAVE = 'on_leave',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
}

export enum RequestType {
  LEAVE = 'leave',
  LOAN = 'loan',
  PERMISSION = 'permission',
  CUSTOM = 'custom',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentType {
  PAID = 'paid',
  HALF_PAID = 'half_paid',
  UNPAID = 'unpaid',
}

export enum RecruitmentStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  TODO = 'to-do',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum RepaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum ReviewStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
}

export enum NotificationType {
  REQUEST_SUBMITTED = 'request_submitted',
  REQUEST_REVIEWED = 'request_reviewed',
  REQUEST_CANCELLED = 'request_cancelled',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  REVIEW_PENDING = 'review_pending',
  REVIEW_SUBMITTED = 'review_submitted',
  REVIEW_REOPENED = 'review_reopened',
  PAYSLIP_GENERATED = 'payslip_generated',
  LOAN_INSTALMENT_PAID = 'loan_instalment_paid',
  LEAVE_BALANCE_LOW = 'leave_balance_low',
  APPLICATION_STATUS = 'application_status',
}