import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Get the API URL from environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Get cookies directly from the request
  const cookieHeader = req.headers.get('cookie') || '';
  console.log('Incoming cookie header:', cookieHeader);

  try {
    // Forward the request to your backend with cookies
    const response = await fetch(`${apiUrl}/auth/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    // Create the Next.js response
    const nextResponse = NextResponse.json(data);

    // Forward Set-Cookie headers from backend to client
    const backendCookies = response.headers.getSetCookie();
    if (backendCookies && backendCookies.length > 0) {
      backendCookies.forEach((cookie) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 401 }
    );
  }
}
