import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('bravo_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  return response;
}

export async function GET() {
  // Allow GET request for easier redirection/logout links if needed
  const response = NextResponse.json({ success: true });
  response.cookies.set('bravo_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  return response;
}
