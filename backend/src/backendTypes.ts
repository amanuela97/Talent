import { User } from '@prisma/client';
import { Request } from 'express';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface RequestWithUser extends Request {
  user: {
    email: string;
    sub: {
      name: string;
    };
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserPayload {
  email: string;
  sub: {
    name: string;
  };
}

export type Role = 'TALENT' | 'CUSTOMER' | 'ADMIN';
