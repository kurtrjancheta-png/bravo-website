import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { scriptUrl, action, ...payload } = body;
    
    if (!scriptUrl) {
      return NextResponse.json({ success: false, error: 'Apps Script URL is missing.' }, { status: 400 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets Web App responded with status: ${response.status}. Details: ${errorText}`);
    }

    const resText = await response.text();
    let result;
    try {
      result = JSON.parse(resText);
    } catch (parseErr) {
      console.error("Non-JSON response from Google Apps Script:", resText);
      throw new Error(`Google Apps Script did not return JSON. Response started with: ${resText.substring(0, 300)}`);
    }

    // If Google Sheet update was successful, trigger push notifications
    if (result && (result.status === 'success' || result.success)) {
      let notificationPayload = null;

      if (action === 'publishOCAOC') {
        notificationPayload = {
          title: '💂‍♂️ OC/AOC Updated',
          body: `OC: ${payload.ocName || 'TBA'}, AOC: ${payload.aocName || 'TBA'}`,
          url: '/ccq-bulletin'
        };
      } else if (action === 'publishGuards') {
        notificationPayload = {
          title: '🛡️ Interior Guard Detail Updated',
          body: 'The interior guards detail has been posted.',
          url: '/ccq-bulletin'
        };
      } else if (action === 'publishSOC') {
        notificationPayload = {
          title: '📅 Schedule of Calls Updated',
          body: 'A new Schedule of Calls has been uploaded for today.',
          url: '/ccq-bulletin'
        };
      } else if (action === 'publishBestBest') {
        notificationPayload = {
          title: '🏆 Best-Best Awards Published',
          body: 'The Best-Best have been publised.',
          url: '/ccq-bulletin'
        };
      } else if (action === 'publishAll') {
        notificationPayload = {
          title: '🔔 CCQ Daily Bulletin Updated',
          body: 'The CCQ Bulletin Board has been updated for today.',
          url: '/ccq-bulletin'
        };
      }

      if (notificationPayload) {
        try {
          const hostname = req.nextUrl?.origin || 'http://localhost:3000';
          await fetch(`${hostname}/api/web-push/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationPayload)
          });
        } catch (pushErr) {
          console.error('Failed to trigger push notification broadcast:', pushErr);
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("CCQ Publish Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
