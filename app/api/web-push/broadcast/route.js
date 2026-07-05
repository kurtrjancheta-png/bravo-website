import { NextResponse } from 'next/server';
import { broadcastNotification } from '../../../../lib/pushBroadcast.js';
import { logActivity } from '../../../../lib/logger.js';
import { getSessionUser } from '../../../../lib/session.js';

export async function POST(req) {
  try {
    const user = getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
      logActivity(req, 'Unauthorized Access Attempt', { path: '/api/web-push/broadcast' });
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { title, body, url, image } = await req.json();
    logActivity(req, 'Broadcast Push Alert', { title, body });

    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Missing title or body parameters.' }, { status: 400 });
    }

    const result = await broadcastNotification({ title, body, url, image });
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error broadcasting web push notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
