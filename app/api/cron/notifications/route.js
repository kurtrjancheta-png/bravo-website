import { NextResponse } from 'next/server';

const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://script.google.com/macros/s/AKfycbzajHQKzjp7rN9hVj6pSiPJkOP1An5wCrYKjU3mQCZgbyl5_G_ek21FEUabG87m4qJ9/exec';

export async function GET(req) {
  try {
    // 1. Fetch Calendar Events
    const res = await fetch(CALENDAR_API_URL, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch events from Apps Script: ${res.statusText}`);
    }
    
    const data = await res.json();
    const activities = data
      .filter(d => d.ID && d.ID !== 'ID')
      .map(d => ({
        id: d.ID,
        title: d.Title || 'Untitled Event',
        dateRaw: d.Date || '',
        isAllDay: (!d.Date || d.Date.includes('T00:00:00'))
      }));

    // 2. Identify Today's Events
    const now = new Date();
    // Vercel server might be in UTC, so we should convert to the local timezone (Philippines +08:00)
    const phOffset = 8 * 60 * 60000; 
    const phTime = new Date(now.getTime() + phOffset);
    
    // Determine the current minute based on PH time
    const currentHour = phTime.getUTCHours(); 
    const currentMinute = phTime.getUTCMinutes();
    const is7AM = currentHour === 7 && currentMinute === 0;
    const is12PM = currentHour === 12 && currentMinute === 0;
    const is3PM = currentHour === 15 && currentMinute === 0;

    const todayActivities = activities.filter(a => {
      if (!a.dateRaw) return false;
      try {
        const actDate = new Date(a.dateRaw);
        // Compare dates using actual time
        return actDate.getFullYear() === now.getFullYear() &&
               actDate.getMonth() === now.getMonth() &&
               actDate.getDate() === now.getDate();
      } catch (e) {
        return false;
      }
    });

    const notificationsToSend = [];

    // 3. Process Untimed / All Day Events
    const allDayEvents = todayActivities.filter(a => a.isAllDay);
    if (allDayEvents.length > 0 && (is7AM || is12PM || is3PM)) {
      const titles = allDayEvents.map(a => a.title).join(', ');
      notificationsToSend.push({
        title: 'Today\\'s Events Summary',
        body: `You have the following events today: ${titles}`,
        url: '/event-calendar'
      });
    }

    // 4. Process Timed Events
    const timedEvents = todayActivities.filter(a => !a.isAllDay);
    
    timedEvents.forEach(act => {
      const actDate = new Date(act.dateRaw);
      const diffMs = actDate.getTime() - now.getTime(); // actual diff in real time
      const diffMins = Math.round(diffMs / 60000); // Difference in minutes

      // Exactly 15 mins before
      if (diffMins === 15) {
        notificationsToSend.push({
          title: `Uniform Call`,
          body: `uniform call: ${act.title}`,
          url: '/event-calendar'
        });
      }
      // Exactly 10 mins before
      else if (diffMins === 10) {
        notificationsToSend.push({
          title: `10 Mins to First Call`,
          body: `IT is now 10 mins before first call for: ${act.title}`,
          url: '/event-calendar'
        });
      }
      // Exactly 5 mins before
      else if (diffMins === 5) {
        notificationsToSend.push({
          title: `5 Mins to First Call`,
          body: `IT is now 5 mins before first call for: ${act.title}`,
          url: '/event-calendar'
        });
      }
      // Exact Time (0 mins diff)
      else if (diffMins === 0) {
        notificationsToSend.push({
          title: `First Call`,
          body: `it is now 1st call for: ${act.title}`,
          url: '/event-calendar'
        });
      }
      // 4 mins after
      else if (diffMins === -4) {
        notificationsToSend.push({
          title: `Attention Call`,
          body: `It is now ATTENTION CALL for: ${act.title}`,
          url: '/event-calendar'
        });
      }
      // 5 mins after
      else if (diffMins === -5) {
        notificationsToSend.push({
          title: `Assembly Call`,
          body: `it is now ASSEMBLY CALL for: ${act.title}`,
          url: '/event-calendar'
        });
      }
    });

    // 5. Send push notifications
    let pushSuccess = 0;
    for (const payload of notificationsToSend) {
      try {
        const hostname = req.nextUrl?.origin || 'http://localhost:3000';
        const pushUrl = `${hostname}/api/web-push/broadcast`;
        
        await fetch(pushUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        pushSuccess++;
      } catch (err) {
        console.error('Failed to trigger push for payload', payload, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      checkedEvents: activities.length,
      todayEvents: todayActivities.length,
      notificationsTriggered: pushSuccess
    });

  } catch (error) {
    console.error('Cron notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
