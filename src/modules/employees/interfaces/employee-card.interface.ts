export interface EmployeeCard {
  userId: number;
  fullName: string;
  email: string;
  profileImage: string | null;
  position: string | null;
  department: string | null;
  managerName: string | null;
  directReports: number;
  todayStatus: string | null;
}