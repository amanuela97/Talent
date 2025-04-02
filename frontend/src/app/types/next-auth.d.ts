import type { User as BaseUser } from '../../../../types';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      userId: string;
      role: 'TALENT' | 'CUSTOMER' | 'ADMIN';
      name: string;
      email: string;
    } & Omit<BaseUser, 'passwordHash'>;
  }

  interface User extends Omit<BaseUser, 'passwordHash'> {
    userId: string;
    role: 'TALENT' | 'CUSTOMER' | 'ADMIN';
    name: string;
    email: string;
  }
}
