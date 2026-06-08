import { getSheetData } from '../lib/googleSheets';
import SlideshowClient from './SlideshowClient';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
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

export const revalidate = 30;

export default async function Home() {
  // Fetch old data
  const trackers = await getSheetData(SHEET_ID, 'Trackers');

  // Fetch all dissemination sheets concurrently
  const disseminationPromises = COUNCILS.map(async (council) => {
    try {
      const data = await getSheetData(DISSEMINATION_SHEET_ID, council.id);
      return data.map(row => ({ ...row, council: council.name }));
    } catch (e) {
      console.error(`Failed to fetch disseminations for ${council.name}`);
      return [];
    }
  });

  const results = await Promise.all(disseminationPromises);
  
  // Aggregate and filter out empty rows or neutral default states
  let allDisseminations = results.flat().filter(d => {
    const type = String(d['TYPE'] || '').trim().toUpperCase();
    const urgency = String(d['URGENCY'] || '').trim().toUpperCase();
    const content = String(d['CONTENT'] || '').trim();
    
    // Skip if it's the dropdown default placeholder or lacks actual content
    if (type === 'TYPE' || urgency.startsWith('URGE') || !content) {
      return false;
    }
    return true;
  }).map(d => {
    let dateAnnounced = String(d['DATE ANNOUNCED'] || '');
    if (dateAnnounced.includes('Date(')) {
      const match = dateAnnounced.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const dateObj = new Date(year, month, day);
        dateAnnounced = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return { ...d, 'DATE ANNOUNCED': dateAnnounced };
  });
  
  // Sort by urgency roughly (4: FOR IMMEDIATE COMPLIANCE, 3: EMERGENCY, 2: MODERATE, 1: LIGHT)
  const urgencyWeight = {
    'FOR IMMEDIATE COMPLIANCE': 4,
    'EMERGENCY': 3,
    'MODERATE': 2,
    'LIGHT': 1
  };

  allDisseminations.sort((a, b) => {
    const uA = String(a['URGENCY'] || '').trim().toUpperCase();
    const uB = String(b['URGENCY'] || '').trim().toUpperCase();
    const weightA = urgencyWeight[uA] || 0;
    const weightB = urgencyWeight[uB] || 0;
    return weightB - weightA; // Higher urgency first
  });

  // Today's date formatted
  const today = new Date();
  const options = { month: 'short', day: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: '3rem' }}>
        <h1 className="hero-title">BRAVO COMPANY</h1>
        <div className="hero-subtitle">
          <span style={{ color: 'var(--accent-gold)' }}>&#9656;</span> DIGITAL BULLETIN BOARD SYSTEM
        </div>
        
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">{allDisseminations.length || '-'}</span>
            <span className="stat-label">Active Disseminations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{trackers.length || '-'}</span>
            <span className="stat-label">Active Trackers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{COUNCILS.length}</span>
            <span className="stat-label">Councils</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{dateStr}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
      </div>

      {SHEET_ID === '' && (
         <div className="info-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ color: '#ef4444' }}>Configuration Needed</h3>
            <p>Please set the <code>GOOGLE_SHEET_ID</code> in Vercel to see your live data below.</p>
         </div>
      )}

      {/* Dissemination Flashcards */}
      <div className="section-header" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">COUNCIL DISSEMINATIONS</h2>
        <div className="section-subtitle">Live Updates from All Councils</div>
      </div>
      
      <div style={{ marginBottom: '4rem' }}>
        <SlideshowClient disseminations={allDisseminations} />
      </div>

    </div>
  );
}
