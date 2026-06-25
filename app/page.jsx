import { getSheetData, isExpired } from '../lib/googleSheets';
import AnnouncementsGrid from './AnnouncementsGrid';
import TopPerformers from './TopPerformers';
import { parsePFTData } from '../lib/pftParser';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const DISSEMINATION_SHEET_ID = '1YeaoloRz4REe_iVomGfFI9WugalrDFsHiz04eOcD0a8';

const COUNCILS = [
  { id: 'TACO', name: "Tac O's Corner" },
  { id: 'CO', name: "CO's Corner" },
  { id: 'EXO', name: "EX-O's Corner" },
  { id: 'FSGT', name: "FSGT's Corner" },
  { id: 'S1', name: 'S1 Personnel' },
  { id: 'S2', name: 'S2 Security' },
  { id: 'S3', name: 'S3 Operations' },
  { id: 'S4', name: 'S4 Logistics' },
  { id: 'S5', name: 'S5 Plans & Programs' },
  { id: 'S6', name: 'S6 Signal' },
  { id: 'S7', name: 'S7 Civil-Military' },
  { id: 'S8', name: 'S8 Education & Training' },
  { id: 'S10', name: 'S10 Finance' },
  { id: 'ATHLETIC', name: 'Athletic' },
  { id: 'GAD', name: 'GAD' },
  { id: 'HONOR COMM', name: 'Honor Committee' },
  { id: 'CCPB', name: 'CCPB' }
];

const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';

export const revalidate = 30;

export default async function Home() {
  const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
  const ROSTER_TAB = 'ROSTER';

  // Fetch old data
  const [trackers, pft1Rows, rosterRows] = await Promise.all([
    getSheetData(SHEET_ID, 'Trackers'),
    getSheetData(PFT_SHEET_ID, PFT1_TAB),
    getSheetData(ROSTER_SHEET_ID, ROSTER_TAB)
  ]);
  
  const genderMap = {};
  if (rosterRows && rosterRows.length > 0) {
    rosterRows.forEach((row) => {
      const surname = (row['SURNAME'] || '').trim().toUpperCase();
      const gender = (row['GENDER'] || '').trim().toUpperCase();
      if (surname && gender) {
        genderMap[surname] = gender;
      }
    });
  }

  const { topPerformers } = parsePFTData(pft1Rows, genderMap);

  // Fetch all dissemination sheets concurrently
  const disseminationPromises = COUNCILS.map(async (council) => {
    try {
      const data = await getSheetData(DISSEMINATION_SHEET_ID, council.id);
      return data.map((row, index) => ({ 
        ...row, 
        council: council.name, 
        councilId: council.id,
        sheetRowIndex: row._sheetRowIndex || index 
      }));
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
    
    // Skip if expired
    if (isExpired(d)) {
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
    
    let eventDate = String(d['EVENT DATE'] || '');
    if (eventDate.includes('Date(')) {
      const match = eventDate.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const dateObj = new Date(year, month, day);
        eventDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } else if (eventDate && eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Handle YYYY-MM-DD
      const parts = eventDate.split('-');
      const dateObj = new Date(parts[0], parseInt(parts[1])-1, parts[2]);
      eventDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return { ...d, 'DATE ANNOUNCED': dateAnnounced, 'EVENT DATE': eventDate };
  });
  
  // Sort by urgency roughly (4: FOR STRICT COMPLIANCE, 3: URGENT, 2: ATTENTION, 1: FOR INFO)
  const urgencyWeight = {
    'FOR STRICT COMPLIANCE': 4,
    'FOR IMMEDIATE COMPLIANCE': 4,
    'EMERGENCY': 3,
    'URGENT': 3,
    'MODERATE': 2,
    'ATTENTION': 2,
    'LIGHT': 1,
    'FOR INFO': 1
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

      {/* Top Performers Section */}
      <TopPerformers topPerformers={topPerformers} />

      <div style={{ marginBottom: '4rem', marginTop: '2rem' }}>
        <AnnouncementsGrid disseminations={allDisseminations} />
      </div>

    </div>
  );
}
