import NextAuth, { User as NextAuthUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import globalForPrisma from '@/app/utils/prisma';

const prisma = globalForPrisma.prisma;

function validateEnv() {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
  ];
  for (const var_name of required) {
    if (!process.env[var_name]) {
      throw new Error(`Environment variable ${var_name} is missing`);
    }
  }
}
validateEnv();

const handler = NextAuth({
  providers: [
    // ✅ Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // ✅ Email & Password Authentication
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        // Check if user exists in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          throw new Error('Incorrect password');
        }

        const nextAuthUser = {
          id: user.userId, // Convert ID to string if necessary
          ...user,
        };

        return nextAuthUser; // Login successful, return user data
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false; // Safety check

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // ✅ Check if Google account is already linked
          const googleAccount = existingUser.accounts.find(
            (acc) => acc.provider === 'google'
          );

          if (!googleAccount) {
            // ✅ Link Google account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.userId, // ✅ Fix: Use `userId` instead of `id`
                provider: 'google',
                providerAccountId: account.providerAccountId, // ✅ Fix: Ensure ID is not undefined
                accessToken: account.access_token,
                expiresAt: account.expires_at,
              },
            });
          }

          if (!existingUser.profilePicture) {
            await prisma.user.update({
              where: { userId: existingUser.userId },
              data: { profilePicture: user.image || null }, // ✅ Fix: Use `profilePicture` instead of `image`
            });
          }

          user.id = existingUser.userId; // Store user ID
          user.role = existingUser.role; // Store role
          user.profilePicture = user.image || null;
        } else {
          const isAdmin = process.env.ADMIN_LIST
            ? process.env.ADMIN_LIST.split(',').includes(
                user.email || 'no-email'
              )
            : false;
          // ✅ Create new user if not exists
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              profilePicture: user.image || null, // ✅ Fix: Use `profilePicture` instead of `image`
              role: isAdmin ? 'ADMIN' : 'CUSTOMER',
              passwordHash: await bcrypt.hash(
                crypto.randomBytes(32).toString('hex'),
                10
              ), // Secure random hash
              accounts: {
                create: {
                  provider: 'google',
                  providerAccountId: account.providerAccountId,
                  accessToken: account.access_token,
                  expiresAt: account.expires_at,
                },
              },
            },
          });
          user.id = newUser.userId;
          user.role = newUser.role;
          user.profilePicture = newUser.profilePicture;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user as NextAuthUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = token.user as NextAuthUser;
        if (!process.env.NEXTAUTH_SECRET) {
          throw new Error('NEXTAUTH_SECRET is not defined');
        }
        session.accessToken = jwt.sign(token, process.env.NEXTAUTH_SECRET);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
