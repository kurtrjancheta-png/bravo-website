import CalendarManagerClient from './CalendarManagerClient';
import { Suspense } from 'react';
import { getSheetData } from '../../lib/googleSheets';

const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://script.google.com/macros/s/AKfycbzajHQKzjp7rN9hVj6pSiPJkOP1An5wCrYKjU3mQCZgbyl5_G_ek21FEUabG87m4qJ9/exec';

export const revalidate = 0; // Dynamic route since it's a manager

export default async function CalendarManagerPage() {
  
  // 1. Fetch SOI data for birthdays
  let soiData = [];
  try {
    soiData = await getSheetData(SOI_SHEET_ID, 'SOI');
  } catch (error) {
    console.error('Failed to fetch SOI data for Manager:', error);
  }

  // Parse birthdays from SOI
  const birthdays = soiData.map(cadet => {
    const dobString = String(cadet['BIRTHDATE '] || cadet['BIRTHDATE'] || '');
    let birthMonth = null;
    let birthDay = null;

    if (dobString.includes('Date(')) {
      const match = dobString.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        birthMonth = parseInt(match[2], 10); 
        birthDay = parseInt(match[3], 10);
      }
    }

    const firstName = String(cadet['FIRST NAME '] || cadet['FIRST NAME'] || '').trim();
    const lastName = String(cadet['SURNAME '] || cadet['SURNAME'] || '').trim();
    const className = String(cadet['CLASS '] || cadet['CLASS'] || '').trim();
    
    return {
      type: 'BIRTHDAY',
      name: `${firstName} ${lastName}`,
      lastName: lastName || firstName,
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
        activities = data.map(d => ({
          id: d.ID,
          title: d.Title,
          council: d.Council,
          description: d.Description,
          urgency: d.Urgency || 'LIGHT',
          color: d.Color || '#3b82f6',
          date: d.Date || '',
          endDate: d.EndDate || ''
        }));
      }
    } catch (e) {
      console.error('Failed to fetch calendar API for Manager:', e);
    }
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 100%)', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '16px', 
        padding: '2.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: 'var(--gold-primary)', fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Calendar Manager
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.6 }}>
            S3 Operations control panel for scheduling and managing unit activities.
          </p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--gold-primary)', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>S3 ONLY</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Restricted Access</div>
        </div>
      </div>

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading Manager...</div>}>
        <CalendarManagerClient initialActivities={activities} birthdays={birthdays} apiUrl={CALENDAR_API_URL} />
      </Suspense>
    </div>
  );
}
