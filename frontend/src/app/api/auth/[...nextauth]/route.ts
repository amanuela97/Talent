import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import NextAuth from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import axiosInstance from '@/app/utils/axios';
import { isAxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User } from '@prisma/client';

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

// Function to get expiration time from JWT token
function getTokenExpiration(token: string): number {
  try {
    const decoded = jwtDecode(token);
    // exp is in seconds, convert to milliseconds for comparison with Date.now()
    return decoded.exp ? decoded.exp * 1000 : 0;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return 0; // Return 0 to force a refresh if we can't decode
  }
}

async function refreshToken(token: JWT): Promise<JWT> {
  try {
    const res = await axiosInstance.post<{
      accessToken: string;
      refreshToken: string;
    }>(
      '/auth/refreshToken',
      {
        refreshToken: token.refreshToken,
      },
      {
        withCredentials: true, // Important: this ensures cookies are received
      }
    );

    const newAccessToken = res.data.accessToken;
    const expiresAt = getTokenExpiration(newAccessToken);
    const newAccessrefreshToken = res.data.refreshToken;

    return {
      ...token,
      accessToken: newAccessToken,
      refreshToken: newAccessrefreshToken,
      accessTokenExpires: expiresAt,
      user: token.user,
    };
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error);
      console.log(error.response?.statusText || 'Refresh token failed');
    } else {
      console.log(error);
      console.log('An unknown error occurred during token refresh');
    }

    // Return the previous token but marked as expired
    // This will cause the user to be logged out
    return {
      ...token,
      accessTokenExpires: 0, // Force expiration
      error: 'RefreshTokenError',
    };
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
          label: 'Email',
          type: 'email',
          placeholder: 'email@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const { username, password } = credentials;
        try {
          const res = await axiosInstance.post<{
            user: User;
            accessToken: string;
            refreshToken: string;
          }>(
            '/auth/login',
            {
              email: username,
              password,
            },
            {
              withCredentials: true, // Important: this ensures cookies are received
            }
          );

          // Matches the structure from the backend response
          return {
            id: res.data.user.userId,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            user: res.data.user,
          };
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
          const res = await axiosInstance.post(
            '/auth/google-login',
            {
              name: user.name,
              email: user.email,
              image: user.image,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              expiresAt: account.expires_at,
            },
            {
              withCredentials: true, // Important: this ensures cookies are received
            }
          );
          // Update user object to match the new structure
          user.accessToken = res.data.accessToken;
          user.user = res.data.user;
          user.refreshToken = res.data.refreshToken;
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
      // When signing in for the first time
      if (user) {
        const expiresAt = getTokenExpiration(user.accessToken);

        // Only store the accessToken in the JWT
        return {
          ...token,
          accessToken: user.accessToken,
          accessTokenExpires: expiresAt,
          refreshToken: user.refreshToken,
          user: user.user, // Explicitly cast to unknown first
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token; // Ensure type compatibility
      }

      // Access token has expired, try to refresh it
      // Note: refresh token is managed by cookies
      const refreshedToken = await refreshToken(token);
      return refreshedToken; // Ensure type compatibility
    },

    async session({ token, session }) {
      session.user = token.user;
      session.accessToken = token.accessToken;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
