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
  '/verify-email',
  '/join',
];

// Routes that should be accessible during talent onboarding
const talentOnboardingRoutes = [
  '/join',
  '/join/verify',
  '/join/pending',
  '/verify-email',
];

// Routes that require approved talent status
/*const talentApprovedRoutes = [
  '/dashboard',
  '/bookings',
  '/messages',
  '/reviews',
  '/settings',
  '/profile/edit',
];*/

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is in the auth group (public)
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  // Check if this is a talent onboarding route
  const isTalentOnboardingRoute = talentOnboardingRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  // Get the token (session)
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!session;

  // If the user is not authenticated and the route is not public, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and trying to access a public route
  // that's not part of onboarding, redirect to dashboard
  if (
    isAuthenticated &&
    isPublicRoute &&
    !isTalentOnboardingRoute &&
    path !== '/'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For approved talent routes, we'll let the component-level checks
  // handle the specific talent status requirements, since middleware
  // can't make API calls to check the talent status

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
