import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'TALENT' | 'CUSTOMER' | 'ADMIN';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'TALENT' | 'CUSTOMER' | 'ADMIN';
  }
}
