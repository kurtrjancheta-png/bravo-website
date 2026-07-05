import { NextResponse } from 'next/server';
import { logActivity } from '../../../../lib/logger';

export async function POST(req) {
  logActivity(req, 'Logout', 'User logged out.');
  const response = NextResponse.json({ success: true });
  response.cookies.set('bravo_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  return response;
}

export async function GET(req) {
  logActivity(req, 'Logout', 'User logged out (via GET).');
  const response = NextResponse.json({ success: true });
  response.cookies.set('bravo_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  return response;
}
