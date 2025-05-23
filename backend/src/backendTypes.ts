import { User } from '@prisma/client';
import { Request } from 'express';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  userId: string;
  username: string;
  role: Role;
}

export type Role = 'TALENT' | 'CUSTOMER' | 'ADMIN';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload; // Replace `any` with the appropriate user type if available
}
