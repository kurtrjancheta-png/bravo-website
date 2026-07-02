import { NextResponse } from 'next/server';

const formatDutyName = (name) => {
  return (name || '').replace(/^(first\s+call\s+for\s+)/i, '').trim();
};

const compileAnnouncements = (list) => {
  if (list.length === 0) return '';
  let text = list[0];
  if (list.length > 1) text += `. Likewise, ${list[1]}`;
  if (list.length > 2) text += `. Furthermore, ${list[2]}`;
  for (let i = 3; i < list.length; i++) {
    text += `. Moreover, ${list[i]}`;
  }
  return text;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { scriptUrl, action, ...payload } = body;
    
    if (!scriptUrl) {
      return NextResponse.json({ success: false, error: 'Apps Script URL is missing.' }, { status: 400 });
    }

    let finalPayload = { ...payload };
    if (action === 'publishSOC' || action === 'publishAll' || action === 'addChangelog') {
      const announcements = [];
      const rows = (action === 'addChangelog' ? payload.updatedRows : payload.rows) || [];
      rows.forEach(row => {
        if (row.isCancelled || row.isCancelled === 'true') {
          announcements.push(`Changes of Schedule: First Call for ${formatDutyName(row.activity)} is CANCELLED`);
        } else if (row.isAdded || row.isAdded === 'true') {
          announcements.push(`Changes of Schedule: At ${row.time}, First Call for ${row.activity}, Uniform is: ${row.uniform}, and formation is: ${row.formation}`);
        } else if (row.isChanged || row.isChanged === 'true') {
          if (row.changeTypeTime || row.changeTypeTime === 'true') {
            announcements.push(`Changes of Schedule: First Call for ${formatDutyName(row.activity)} is moved to: ${row.time}`);
          }
          if (row.changeTypePlace || row.changeTypePlace === 'true') {
            announcements.push(`Changes of formation: Formation for: ${formatDutyName(row.activity)} is moved to: ${row.formation}`);
          }
          if (row.changeTypeUniform || row.changeTypeUniform === 'true') {
            announcements.push(`Uniform for: ${formatDutyName(row.activity)} is changed to: ${row.uniform}`);
          }
        }
      });
      finalPayload.changesText = compileAnnouncements(announcements);
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...finalPayload }),
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
          body: finalPayload.changesText || 'A new Schedule of Calls has been uploaded for today.',
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
          body: finalPayload.changesText || 'The CCQ Bulletin Board has been updated for today.',
          url: '/ccq-bulletin'
        };
      } else if (action === 'addChangelog') {
        notificationPayload = {
          title: '🚨 Schedule Change',
          body: payload.announcementText || 'The Schedule of Calls has been changed.',
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
