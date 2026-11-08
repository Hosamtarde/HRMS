import type { Request } from 'express';
import { Role } from '../enums/enums';

export interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
