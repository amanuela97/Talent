import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import NextAuth from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import axiosInstance from '@/app/utils/axios';
import { isAxiosError } from 'axios';

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
  try {
    const res = await axiosInstance.post(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Refresh ${token.backendTokens.refreshToken}`,
        },
      }
    );

    return {
      ...token,
      backendTokens: res.data,
    };
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.statusText || 'Refresh token failed');
    } else {
      console.log('An unknown error occurred during token refresh');
    }
    return token;
  }
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
        try {
          const res = await axiosInstance.post('/auth/login', {
            email: username,
            password,
          });
          return res.data;
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error)
            ? error.response?.data?.message
            : 'Invalid email';
          throw new Error(errorMessage);
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const res = await axiosInstance.post('/auth/google-login', {
            name: user.name,
            email: user.email,
            image: user.image,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            expiresAt: account.expires_at,
          });
          Object.assign(user, res.data);
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error)
            ? error.response?.data?.message
            : 'Invalid google email account';
          console.log(errorMessage);
          return false;
        }
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
