import { getSheetData } from '../../lib/googleSheets';
import CalendarClient from './CalendarClient';
import { Suspense } from 'react';

const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const DISSEMINATION_SHEET_ID = '1YeaoloRz4REe_iVomGfFI9WugalrDFsHiz04eOcD0a8';

const COUNCILS = [
  { id: 'S1', name: 'S1 Personnel' },
  { id: 'S2', name: 'S2 Security' },
  { id: 'S3', name: 'S3 Operations' },
  { id: 'S4', name: 'S4 Logistics' },
  { id: 'S5', name: 'S5 Plans & Programs' },
  { id: 'S6', name: 'S6 Signal' },
  { id: 'S7', name: 'S7 Civil-Military' },
  { id: 'S8', name: 'S8 Education & Training' },
  { id: 'S10', name: 'S10 Finance' },
  { id: 'ATHLETIC', name: 'Athletic Council' },
  { id: 'GAD', name: 'GAD' },
  { id: 'HONOR COMM', name: 'Honor Committee' },
  { id: 'CCPB', name: 'CCPB' }
];

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

  // 2. Fetch all Disseminations for Activities
  const disseminationPromises = COUNCILS.map(async (council) => {
    try {
      const data = await getSheetData(DISSEMINATION_SHEET_ID, council.id);
      return data.map(row => ({ ...row, council: council.name }));
    } catch (e) {
      return [];
    }
  });

  const results = await Promise.all(disseminationPromises);
  const allDisseminations = results.flat();

  const activities = allDisseminations.filter(d => {
    const type = String(d['TYPE'] || '').trim().toUpperCase();
    return type === 'ACTIVITY';
  }).map(d => {
    let eventDateRaw = String(d['EVENT DATE'] || d['DATE ANNOUNCED'] || '');
    
    if (eventDateRaw.includes('Date(')) {
      const match = eventDateRaw.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10); // 0-indexed
        const day = parseInt(match[3], 10);
        // Convert to a valid string that new Date() can parse safely
        const dateObj = new Date(year, month, day);
        eventDateRaw = dateObj.toISOString();
      }
    }

    return {
      type: 'ACTIVITY',
      council: d.council,
      content: d['CONTENT'] || 'Untitled Activity',
      urgency: String(d['URGENCY'] || 'LIGHT').toUpperCase().trim(),
      dateRaw: eventDateRaw
    };
  });

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
