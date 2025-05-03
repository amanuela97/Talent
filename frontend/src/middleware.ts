import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is in the auth group (public)
  const isPublicRoute = publicRoutes.some((route) => path === route);

  // Get the token (session)
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!session;

  // Redirect authenticated users away from public routes to dashboard
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    // Store the original URL to redirect after login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (api/*)
     * - static files (_next/static/*)
     * - public files (favicon.ico, etc.)
     * - images (some formats)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|public).*)',
  ],
};
