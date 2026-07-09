import { NextResponse } from 'next/server';

export function middleware(req) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const { pathname } = req.nextUrl;

  if (isMaintenance) {
    // Let next assets, api routes, static resources, and the custom error page load normally
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname === '/something-went-wrong' ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Redirect all other requests to the "oops" error page
    return NextResponse.redirect(new URL('/something-went-wrong', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except internal next.js files, api, static files, images
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
