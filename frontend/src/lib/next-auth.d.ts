import NextAuth from 'next-auth';
import { User as UserType } from '@prisma/client';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: UserType;
    accessToken: string;
    refreshToken: string;
    error?: string;
  }

  // Define what gets returned from authorize in CredentialsProvider
  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
    user: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user: UserType;
    error?: string;
  }
}

export default NextAuth;
