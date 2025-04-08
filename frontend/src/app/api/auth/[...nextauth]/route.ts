import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { BACKEND_URL } from '@/app/utils/constants';
import NextAuth from 'next-auth/next';
import { AuthOptions } from 'next-auth';

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
// Validate environment variables
// This function checks if the required environment variables are set
validateEnv();

async function refreshToken(token: JWT): Promise<JWT> {
  const res = await fetch(BACKEND_URL + '/auth/refresh', {
    method: 'POST',
    headers: {
      authorization: `Refresh ${token.backendTokens.refreshToken}`,
    },
  });
  console.log('refreshed');

  if (!res.ok) {
    console.log(res.statusText);
    return token;
  }
  const response = await res.json();

  return {
    ...token,
    backendTokens: response,
  };
}

export const authOptions: AuthOptions = {
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
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'jsmith',
        },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Missing username or password');
        }
        const { username, password } = credentials;
        const res = await fetch(BACKEND_URL + '/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const error = await res.json(); // Assuming your API sends a JSON error message
          throw new Error(error?.message || 'Invalid email ');
        }
        const user = await res.json();
        return user;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const res = await fetch(`${BACKEND_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            expiresAt: account.expires_at,
          }),
        });

        if (!res.ok) return false;

        const backendUser = await res.json();
        Object.assign(user, backendUser);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) return { ...token, ...user };

      if (new Date().getTime() < token.backendTokens.expiresIn) return token;

      return await refreshToken(token);
    },

    async session({ token, session }) {
      session.user = token.user;
      session.backendTokens = token.backendTokens;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
