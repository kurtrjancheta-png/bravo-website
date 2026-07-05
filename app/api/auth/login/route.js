import { NextResponse } from 'next/server';
import { getSheetData } from '../../../../lib/googleSheets';
import { logActivity } from '../../../../lib/logger';
import crypto from 'crypto';

const CREDENTIALS_SHEET_ID = '1swr5eI5C8HUleLD28wr1Ax_VJ26l8DAKE-GfEzzltRc';
const CREDENTIALS_TAB_NAME = 'CREDENTIALS';
const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const SOI_TAB_NAME = 'SOI';

// Session encryption key (derived from a secret with a fallback)
const SESSION_SECRET = process.env.SESSION_SECRET || 'bravo_company_bulletin_secure_cookie_key_32_bytes_long!';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(SESSION_SECRET, 'salt', 32);

function encryptSession(sessionData) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(sessionData), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    // 1. Fetch Admin credentials
    let adminUser = null;
    try {
      const creds = await getSheetData(CREDENTIALS_SHEET_ID, CREDENTIALS_TAB_NAME);
      if (creds && creds.length > 0) {
        adminUser = creds.find(c => {
          const u = String(c['Username'] || c['Column 2'] || '').trim().toUpperCase();
          const p = String(c['password'] || c['Column 3'] || '').trim();
          return u === String(username).trim().toUpperCase() && p === String(password).trim();
        });
      }
    } catch (e) {
      console.error('Failed to fetch admin credentials:', e);
    }

    let userSession = null;

    if (adminUser) {
      const council = String(adminUser['COUNCIL'] || adminUser['Column 1'] || '').trim();
      const usernameVal = String(adminUser['Username'] || adminUser['Column 2'] || '').trim();
      userSession = {
        username: usernameVal,
        name: usernameVal,
        council: council,
        role: 'ADMIN'
      };
    } else if (password === 'AnaktiBAKA!') {
      // 2. Fetch Cadet SOI credentials
      try {
        const soi = await getSheetData(SOI_SHEET_ID, SOI_TAB_NAME);
        if (soi && soi.length > 0) {
          const normalizedInput = String(username).replace(/[-\s]/g, '').toUpperCase();
          const cadet = soi.find(row => {
            const val = String(row['SERIAL NR'] || row['SERIAL NUMBER'] || row['SERIAL_NR'] || '').trim();
            const normalizedVal = val.replace(/[-\s]/g, '').toUpperCase();
            return normalizedVal === normalizedInput;
          });

          if (cadet) {
            const serial = String(cadet['SERIAL NR'] || '').trim();
            const firstName = String(cadet['FIRST NAME'] || '').trim();
            const surname = String(cadet['SURNAME'] || '').trim();
            const cadetClass = String(cadet['CLASS'] || '').trim();

            userSession = {
              username: serial,
              name: `${firstName} ${surname}`.trim(),
              council: 'CADET',
              class: cadetClass,
              role: 'CADET'
            };
          }
        }
      } catch (e) {
        console.error('Failed to fetch SOI data:', e);
      }
    }

    if (userSession) {
      logActivity(req, 'Login Success', { username: userSession.username, role: userSession.role });
      const encryptedValue = encryptSession(userSession);
      const isProduction = process.env.NODE_ENV === 'production';
      
      const response = NextResponse.json({ success: true, user: userSession });
      response.cookies.set('bravo_session', encryptedValue, {
        httpOnly: true,
        secure: isProduction,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
      });
      return response;
    }

    logActivity(req, 'Login Failure', { attemptedUsername: username });
    return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 500 });
  }
}
