import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bravo_company_bulletin_secure_cookie_key_32_bytes_long!';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(SESSION_SECRET, 'salt', 32);

export function getSessionUser(req) {
  try {
    const sessionCookie = req.cookies.get('bravo_session');
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    
    const parts = sessionCookie.value.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Session parsing error:', e.message);
    return null;
  }
}
