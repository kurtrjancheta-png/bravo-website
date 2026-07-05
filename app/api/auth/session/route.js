import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bravo_company_bulletin_secure_cookie_key_32_bytes_long!';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(SESSION_SECRET, 'salt', 32);

function decryptSession(cookieValue) {
  try {
    const parts = cookieValue.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Failed to decrypt session:', e.message);
    return null;
  }
}

export async function GET(req) {
  try {
    const sessionCookie = req.cookies.get('bravo_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: 'No active session.' }, { status: 401 });
    }

    const sessionData = decryptSession(sessionCookie.value);
    
    if (sessionData) {
      return NextResponse.json({ success: true, user: sessionData });
    }

    return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
  } catch (err) {
    console.error('Session API error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve session.' }, { status: 500 });
  }
}
