import { getSheetData, isExpired } from '../../lib/googleSheets';
import CalendarClient from './CalendarClient';
import { Suspense } from 'react';

const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://script.google.com/macros/s/AKfycbzajHQKzjp7rN9hVj6pSiPJkOP1An5wCrYKjU3mQCZgbyl5_G_ek21FEUabG87m4qJ9/exec';

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
        activities = data
          .filter(d => d.ID && d.ID !== 'ID')
          .map(d => {
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
    <div className="dashboard-container" style={{ padding: '0.2rem' }}>
      <div className="section-header" style={{ padding: '1rem' }}>
        <h1 className="section-title">EVENT CALENDAR</h1>
        <div className="section-subtitle">Track upcoming company activities and celebrate cadet birthdays.</div>
      </div>

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading Calendar...</div>}>
        <CalendarClient birthdays={birthdays} activities={activities} />
      </Suspense>
    </div>
  );
}
