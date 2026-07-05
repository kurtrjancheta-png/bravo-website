import { getSessionUser } from './session';

export async function logActivity(req, action, details) {
  const APPS_SCRIPT_URL = process.env.SECURITY_LOGS_APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    console.warn("SECURITY_LOGS_APPS_SCRIPT_URL is not defined. Skipping log write. Logged action:", { action, details });
    return;
  }

  // Run asynchronously without blocking the main request thread
  (async () => {
    try {
      let username = 'Anonymous';
      let role = 'Guest';

      if (req) {
        const user = getSessionUser(req);
        if (user) {
          username = user.username || 'Unknown';
          role = user.role || user.council || 'Unknown';
        }
      }

      // Extract client headers safely
      const ip = req ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP') : 'Server Task';
      const userAgent = req ? (req.headers.get('user-agent') || 'Unknown Agent') : 'Server Process';

      const payload = {
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
        username,
        role,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details),
        ip,
        userAgent
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      
      const responseText = await res.text();
      console.log('Security logger Apps Script response:', responseText);
    } catch (err) {
      console.error('Failed to dispatch security log:', err.message);
    }
  })();
}
