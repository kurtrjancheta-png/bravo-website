import { NextResponse } from 'next/server';
import { getSheetData } from '../../../../lib/googleSheets';
import { broadcastNotification } from '../../../../lib/pushBroadcast.js';

const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://script.google.com/macros/s/AKfycbzajHQKzjp7rN9hVj6pSiPJkOP1An5wCrYKjU3mQCZgbyl5_G_ek21FEUabG87m4qJ9/exec';
const CCQ_SPREADSHEET_ID = '1HhWc6ZAVjbpJT4EwyX0D6zJ4FBxh7jNPuRxqGLE-YT8';

const cleanDutyName = (name) => {
  if (!name) return '';
  const str = String(name).trim();
  if (str.toUpperCase().startsWith('FC')) {
    return str.substring(2).trim();
  }
  return str;
};

export async function GET(req) {
  try {
    const now = new Date();
    const phOffset = 8 * 60 * 60000; 
    const phTimeToday = new Date(now.getTime() + phOffset);
    
    const notificationsToSend = [];

    // Trigger barracks guard list verification alert at exactly 9:30 PM PHT (2130H)
    const currentHour = phTimeToday.getUTCHours(); 
    const currentMinute = phTimeToday.getUTCMinutes();
    if (currentHour === 21 && currentMinute === 30) {
      notificationsToSend.push({
        title: "ATTENTION",
        body: "THE LIST OF INCOMING BARRACKS GUARDS HAS BEEN PUBLISHED. ALL CADETS WILL VERIFY THE LIST OF INCOMING GUARDS.",
        url: "/?showIncomingGuards=true"
      });
    }

    // ── 1. FETCH & PROCESS CALENDAR EVENTS ────────────────────────
    try {
      const res = await fetch(CALENDAR_API_URL, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const activities = data
          .filter(d => d.ID && d.ID !== 'ID')
          .map(d => ({
            id: d.ID,
            title: d.Title || 'Untitled Event',
            dateRaw: d.Date || '',
            isAllDay: (!d.Date || d.Date.includes('T00:00:00'))
          }));

        const currentHour = phTimeToday.getUTCHours(); 
        const currentMinute = phTimeToday.getUTCMinutes();
        const is7AM = currentHour === 7 && currentMinute === 0;
        const is12PM = currentHour === 12 && currentMinute === 0;
        const is3PM = currentHour === 15 && currentMinute === 0;

        const todayActivities = activities.filter(a => {
          if (!a.dateRaw) return false;
          try {
            const actDate = new Date(a.dateRaw);
            return actDate.getFullYear() === now.getFullYear() &&
                   actDate.getMonth() === now.getMonth() &&
                   actDate.getDate() === now.getDate();
          } catch (e) {
            return false;
          }
        });

        // Process Untimed / All Day Events
        const allDayEvents = todayActivities.filter(a => a.isAllDay);
        if (allDayEvents.length > 0 && (is7AM || is12PM || is3PM)) {
          const titles = allDayEvents.map(a => a.title).join(', ');
          notificationsToSend.push({
            title: "Today's Events Summary",
            body: `You have the following events today: ${titles}`,
            url: '/event-calendar'
          });
        }

        // Process Timed Events
        const timedEvents = todayActivities.filter(a => !a.isAllDay);
        timedEvents.forEach(act => {
          const actDate = new Date(act.dateRaw);
          const diffMs = actDate.getTime() - now.getTime(); 
          const diffMins = Math.round(diffMs / 60000);
          const cleanTitle = cleanDutyName(act.title);

          if (diffMins === 15) {
            notificationsToSend.push({
              title: `Uniform Call`,
              body: `Uniform for ${cleanTitle}`,
              url: '/event-calendar'
            });
          } else if (diffMins === 10) {
            notificationsToSend.push({
              title: `10 Mins to First Call`,
              body: `It is Now 10 minutes before First call for: ${cleanTitle}`,
              url: '/event-calendar'
            });
          } else if (diffMins === 5) {
            notificationsToSend.push({
              title: `5 Mins to First Call`,
              body: `It is Now 5 minutes before First call for: ${cleanTitle}`,
              url: '/event-calendar'
            });
          } else if (diffMins === 0) {
            notificationsToSend.push({
              title: `First Call`,
              body: `It is Now First call for: ${cleanTitle}`,
              url: '/event-calendar'
            });
          } else if (diffMins === -4) {
            notificationsToSend.push({
              title: `Attention Call`,
              body: `It is Now ATTENTION CALL for: ${cleanTitle}`,
              url: '/event-calendar'
            });
          } else if (diffMins === -5) {
            notificationsToSend.push({
              title: `Assembly Call`,
              body: `It is Now ASSEMBLY CALL for: ${cleanTitle}`,
              url: '/event-calendar'
            });
          }
        });
      }
    } catch (calErr) {
      console.error('Calendar processing error:', calErr);
    }

    // ── 2. FETCH & PROCESS CCQ SCHEDULE OF CALLS ─────────────────
    try {
      const ccqSocRows = await getSheetData(CCQ_SPREADSHEET_ID, 'SOC');
      if (ccqSocRows && ccqSocRows.length > 0) {
        
        const parseSocTimePHT = (timeStr, phTimeToday) => {
          if (!timeStr) return null;
          const clean = String(timeStr).trim().toUpperCase();
          const digits = clean.replace(/[^0-9]/g, '');
          if (digits.length < 3) return null;
          
          let hours = 0;
          let minutes = 0;
          
          if (digits.length === 3) {
            hours = parseInt(digits.substring(0, 1), 10);
            minutes = parseInt(digits.substring(1), 10);
          } else if (digits.length >= 4) {
            hours = parseInt(digits.substring(0, 2), 10);
            minutes = parseInt(digits.substring(2, 4), 10);
          }
          
          const y = phTimeToday.getUTCFullYear();
          const m = phTimeToday.getUTCMonth();
          const d = phTimeToday.getUTCDate();
          
          // Convert PHT time to UTC Date representation (PHT is UTC+8)
          return new Date(Date.UTC(y, m, d, hours - 8, minutes, 0, 0));
        };

        const announcements = {
          firstCall: [],
          min5: [],
          min10: [],
          uniformCall: []
        };

        ccqSocRows.filter(r => {
          const time = r['TIME'];
          const act  = r['ACTIVITY'];
          return (time || act) && String(time).toUpperCase() !== 'TIME';
        }).forEach(r => {
          const dutyTime = parseSocTimePHT(r['TIME'], phTimeToday);
          if (!dutyTime) return;

          const diffMs = dutyTime.getTime() - now.getTime();
          const diffMins = Math.round(diffMs / 60000);
          const activity = cleanDutyName(r['ACTIVITY']);

          if (diffMins === 0) {
            announcements.firstCall.push({ activity });
          } else if (diffMins === 5) {
            announcements.min5.push({ activity });
          } else if (diffMins === 10) {
            announcements.min10.push({ activity });
          } else if (diffMins === 15) {
            announcements.uniformCall.push({ 
              activity, 
              uniform: r['UNIFORM'], 
              formation: r['FORMATION'] 
            });
          }
        });

        // Construct combined message
        const parts = [];

        if (announcements.firstCall.length > 0) {
          const duties = announcements.firstCall.map(a => a.activity).join(', ');
          parts.push(`First call for: ${duties}`);
        }

        if (announcements.min5.length > 0) {
          const duties = announcements.min5.map(a => a.activity).join(', ');
          parts.push(`5 minutes before First call for: ${duties}`);
        }

        if (announcements.min10.length > 0) {
          const duties = announcements.min10.map(a => a.activity).join(', ');
          parts.push(`10 minutes before First call for: ${duties}`);
        }

        if (announcements.uniformCall.length > 0) {
          const uniformParts = announcements.uniformCall.map(a => {
            const u = a.uniform || '—';
            const f = a.formation || '—';
            return `Uniform for ${a.activity} : ${u} and formation is ${f}`;
          });
          parts.push(uniformParts.join('. '));
        }

        if (parts.length > 0) {
          let finalMessage = '';
          parts.forEach((part, index) => {
            let prefix = '';
            if (index === 0) {
              prefix = part.startsWith('Uniform for') ? '' : 'It is Now ';
            } else if (index === 1) {
              prefix = part.startsWith('Uniform for') ? ' Likewise, ' : ' Likewise, it is Now ';
            } else {
              prefix = part.startsWith('Uniform for') ? ' Furthermore, ' : ' Furthermore, it is Now ';
            }
            finalMessage += prefix + part + (part.endsWith('.') ? '' : '.');
          });

          notificationsToSend.push({
            title: '🔔 Duty Announcement',
            body: finalMessage,
            url: '/ccq-bulletin'
          });
        }
      }
    } catch (ccqErr) {
      console.error('CCQ SOC processing error:', ccqErr);
    }

    // ── 3. SEND WEB PUSH BROADCASTS ──────────────────────────────
    let pushSuccess = 0;
    for (const payload of notificationsToSend) {
      try {
        await broadcastNotification(payload);
        pushSuccess++;
      } catch (err) {
        console.error('Failed to trigger push for payload', payload, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      notificationsTriggered: pushSuccess
    });

  } catch (error) {
    console.error('Cron notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
