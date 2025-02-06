import { type NextRequest, NextResponse } from 'next/server';

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/', // Home page (Login)
  '/refresh', // Token refresh page
];

// Public static asset extensions that don't require authentication
const PUBLIC_ASSETS = [
  '.svg', // SVG images
  '.png', // PNG images
  '.jpg', // JPG images
  '.jpeg', // JPEG images
  '.ico', // Icon files
  '.webp', // WebP images
  '.gif', // GIF images
];

export const config = {
  matcher: [
    /*
     * Match all request paths except those starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (website icon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const cookieAuthToken = req.cookies.get('privy-token');
  const cookieSession = req.cookies.get('privy-session');
  const { pathname, searchParams } = req.nextUrl;

  const response = NextResponse.next();

  // Check for a `ref` query parameter in the URL and set the cookie
  const referralCode = searchParams.get('ref');
  if (referralCode) {
    response.cookies.set('referralCode', referralCode, {
      httpOnly: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Skip middleware for public pages
  if (PUBLIC_PAGES.includes(pathname)) {
    return response;
  }

  // Skip middleware for static assets
  if (PUBLIC_ASSETS.some((ext) => pathname.toLowerCase().endsWith(ext))) {
    return response;
  }

  // Skip middleware for Privy OAuth authentication flow
  if (
    req.nextUrl.searchParams.has('privy_oauth_code') ||
    req.nextUrl.searchParams.has('privy_oauth_state') ||
    req.nextUrl.searchParams.has('privy_oauth_provider')
  ) {
    return response;
  }

  // User authentication status check
  const definitelyAuthenticated = Boolean(cookieAuthToken); // User is definitely authenticated (has access token)
  const maybeAuthenticated = Boolean(cookieSession); // User might be authenticated (has session)

  // Handle token refresh cases
  if (!definitelyAuthenticated && maybeAuthenticated) {
    const redirectUrl = new URL('/refresh', req.url);
    // Ensure redirect_uri is the current page path
    redirectUrl.searchParams.set('redirect_uri', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle unauthenticated cases
  if (!definitelyAuthenticated && !maybeAuthenticated) {
    const loginUrl = new URL('/', req.url);
    // Ensure redirect_uri is the current page path
    loginUrl.searchParams.set('redirect_uri', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
