import { getSheetData, isExpired } from '../../lib/googleSheets';
import CalendarClient from './CalendarClient';
import { Suspense } from 'react';

const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'YOUR_SCRIPT_URL_HERE';

export const revalidate = 30; // 30 sec caching

export default async function EventCalendarPage() {
  
  // 1. Fetch SOI data for birthdays
  let soiData = [];
  try {
    soiData = await getSheetData(SOI_SHEET_ID, 'SOI');
  } catch (error) {
    console.error('Failed to fetch SOI data:', error);
  }

  // Parse birthdays from SOI
  // Google Sheets date format: "Date(YYYY,M,D)"
  const birthdays = soiData.map(cadet => {
    const dobString = String(cadet['BIRTHDATE '] || cadet['BIRTHDATE'] || '');
    let birthDate = null;
    let birthMonth = null;
    let birthDay = null;

    if (dobString.includes('Date(')) {
      const match = dobString.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        // match[2] is month (0-indexed in JS, so 0=Jan, 5=Jun)
        birthMonth = parseInt(match[2], 10); 
        birthDay = parseInt(match[3], 10);
      }
    }

    // Extract name
    const firstName = String(cadet['FIRST NAME '] || cadet['FIRST NAME'] || '').trim();
    const lastName = String(cadet['SURNAME '] || cadet['SURNAME'] || '').trim();
    const className = String(cadet['CLASS '] || cadet['CLASS'] || '').trim();
    
    // Default avatar fallback
    const defaultAvatar = `/avatars/default.png`; // Fallback image if needed, or we'll render initials
    
    return {
      type: 'BIRTHDAY',
      name: `${firstName} ${lastName}`,
      lastName: lastName || firstName, // fallback to firstName if no lastName
      className: className,
      birthMonth,
      birthDay
    };
  }).filter(b => b.birthMonth !== null && b.birthDay !== null);

  // 2. Fetch all Activities from the new S3 Calendar API
  let activities = [];
  if (CALENDAR_API_URL && CALENDAR_API_URL !== 'YOUR_SCRIPT_URL_HERE') {
    try {
      const res = await fetch(CALENDAR_API_URL, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // The API returns [{ ID, Title, Date, EndDate, Council, Description, Color, Urgency }]
        activities = data.map(d => {
          let eventDateRaw = d.Date || '';
          
          return {
            id: d.ID,
            type: 'ACTIVITY',
            title: d.Title,
            council: d.Council,
            content: d.Description || d.Title || 'Untitled Activity',
            urgency: d.Urgency || 'LIGHT',
            color: d.Color || '#3b82f6',
            dateRaw: eventDateRaw,
            endDateRaw: d.EndDate || ''
          };
        });
      }
    } catch (e) {
      console.error('Failed to fetch calendar API:', e);
    }
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 100%)', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '16px', 
        padding: '2.5rem',
        marginBottom: '2.5rem'
      }}>
        <h1 style={{ color: 'var(--gold-primary)', fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Event Calendar
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.6 }}>
          Track upcoming company activities and celebrate cadet birthdays.
        </p>
      </div>

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading Calendar...</div>}>
        <CalendarClient birthdays={birthdays} activities={activities} />
      </Suspense>
    </div>
  );
}
