import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSheetData } from '../../../../lib/googleSheets';

const PUSH_APPS_SCRIPT_URL = process.env.PUSH_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwqZ-placeholder-url/exec';

// Configure VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:notifications@bravocompany.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

import { getSessionUser } from '../../../../lib/session';

export async function POST(req) {
  try {
    const user = getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { title, body, url, image } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Missing title or body parameters.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys are not defined in environmental variables. Skipping notification dispatch.');
      return NextResponse.json({ success: true, message: 'VAPID keys not configured. Simulating success.' });
    }

    const pushSheetId = process.env.PUSH_SHEET_ID;
    if (!pushSheetId) {
      return NextResponse.json({ success: false, error: 'PUSH_SHEET_ID environment variable is missing.' }, { status: 500 });
    }

    // 1. Fetch all subscribers from Google Sheets
    const rows = await getSheetData(pushSheetId, 'PUSH_SUBSCRIBERS');
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No registered subscribers found.' });
    }

    // 2. Map rows to subscription objects and deduplicate by endpoint
    const seenEndpoints = new Set();
    const subscribers = rows
      .map(row => {
        const endpoint = String(row['ENDPOINT'] || '').trim();
        const p256dh = String(row['P256DH'] || '').trim();
        const auth = String(row['AUTH'] || '').trim();
        if (endpoint && p256dh && auth) {
          if (seenEndpoints.has(endpoint)) {
            return null; // Skip duplicate
          }
          seenEndpoints.add(endpoint);
          return {
            endpoint,
            keys: { p256dh, auth }
          };
        }
        return null;
      })
      .filter(Boolean);

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No valid subscription keys found.' });
    }

    // 3. Prepare payload JSON string
    // Limit body length to keep the push notification clean and fit on all devices
    const cleanBody = body.length > 180 ? body.substring(0, 180).trim() + '...' : body;
    const notificationPayload = JSON.stringify({
      title,
      body: cleanBody,
      data: {
        url: url || '/'
      },
      image: image || null
    });

    let successCount = 0;
    let failureCount = 0;
    const expiredEndpoints = [];

    // 4. Dispatch push notifications in parallel
    const pushPromises = subscribers.map(async (subscriber) => {
      try {
        await webpush.sendNotification(subscriber, notificationPayload);
        successCount++;
      } catch (error) {
        failureCount++;
        // If status code is 410 or 404, it means the subscriber registration has expired or revoked permission
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredEndpoints.push(subscriber.endpoint);
        }
        console.error('Push error for endpoint:', subscriber.endpoint, error.message);
      }
    });

    await Promise.all(pushPromises);

    // 5. Clean up expired endpoints by sending delete commands to Google Apps Script
    if (expiredEndpoints.length > 0 && !PUSH_APPS_SCRIPT_URL.includes('placeholder')) {
      console.log(`Pruning ${expiredEndpoints.length} expired subscribers...`);
      const prunePromises = expiredEndpoints.map(async (endpoint) => {
        try {
          await fetch(PUSH_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'unsubscribe',
              endpoint
            })
          });
        } catch (pruneErr) {
          console.error('Failed to prune expired subscription:', endpoint, pruneErr);
        }
      });
      // Run pruning in the background
      Promise.all(prunePromises).catch(err => console.error('Pruning task error:', err));
    }

    return NextResponse.json({
      success: true,
      totalSubscribers: subscribers.length,
      sentCount: successCount,
      failedCount: failureCount,
      prunedCount: expiredEndpoints.length
    });

  } catch (error) {
    console.error('Error broadcasting web push notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
