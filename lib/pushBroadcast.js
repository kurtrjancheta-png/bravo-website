import webpush from 'web-push';
import { getSheetData } from './googleSheets.js';

const PUSH_APPS_SCRIPT_URL = process.env.PUSH_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwqZ-placeholder-url/exec';

let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return true;
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        'mailto:notifications@bravocompany.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
      return true;
    } catch (err) {
      console.error('Failed to configure VAPID keys in helper:', err);
      return false;
    }
  }
  return false;
}

export async function broadcastNotification({ title, body, url, image }) {
  if (!title || !body) {
    throw new Error('Missing title or body parameters.');
  }

  if (!ensureVapidConfigured()) {
    console.warn('VAPID keys are not defined in environmental variables. Skipping notification dispatch.');
    return { success: true, message: 'VAPID keys not configured. Simulating success.', sentCount: 0 };
  }

  const pushSheetId = process.env.PUSH_SHEET_ID;
  if (!pushSheetId) {
    throw new Error('PUSH_SHEET_ID environment variable is missing.');
  }

  // 1. Fetch all subscribers from Google Sheets
  const rows = await getSheetData(pushSheetId, 'PUSH_SUBSCRIBERS');
  if (!rows || rows.length === 0) {
    return { success: true, totalSubscribers: 0, sentCount: 0, failedCount: 0, prunedCount: 0, message: 'No registered subscribers found.' };
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
    return { success: true, totalSubscribers: 0, sentCount: 0, failedCount: 0, prunedCount: 0, message: 'No valid subscription keys found.' };
  }

  // 3. Prepare payload JSON string
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

  return {
    success: true,
    totalSubscribers: subscribers.length,
    sentCount: successCount,
    failedCount: failureCount,
    prunedCount: expiredEndpoints.length
  };
}
