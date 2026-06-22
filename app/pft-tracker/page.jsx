import { getSheetData } from '../../lib/googleSheets';
import PFTDashboard from './PFTDashboard';

// PFT Google Sheet ID
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';

// Tab names in the Google Sheet for each PFT type
const MOCK_PFT_TAB = process.env.MOCK_PFT_TAB || 'MOCK PFT';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT 1';
const PFT2_TAB = process.env.PFT2_TAB || 'PFT 2';

export const revalidate = 30;

function createEmptyData() {
  return {
    passed: [], failed: [], smc: [], fad: []
  };
}

// Parses rows and groups them by Class and Status
function parsePFTData(rows) {
  const data = {
    'all': createEmptyData(),
    '1cl': createEmptyData(),
    '2cl': createEmptyData(),
    '3cl': createEmptyData()
  };

  let currentClass = null;
  let nameKey = null;
  let remarksKey = null;

  // Dynamically find the keys for Name and Remarks
  for (let r of rows) {
    for (let k of Object.keys(r)) {
      const val = typeof r[k] === 'string' ? r[k].trim().toUpperCase() : '';
      if (val === 'NAME' || val.includes('1CL')) nameKey = k;
      if (val === 'REMARKS') remarksKey = k;
    }
    if (nameKey && remarksKey) break;
  }

  // Fallback if not found
  if (!remarksKey) {
    const allKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
    if (allKeys.length >= 11) {
      nameKey = allKeys[0];
      remarksKey = allKeys[10];
    }
  }

  rows.forEach((row) => {
    // Check if this row is a class header
    let rowValues = Object.values(row).map(v => typeof v === 'string' ? v.trim().toUpperCase() : '');
    if (rowValues.includes('1CL')) { currentClass = '1cl'; return; }
    if (rowValues.includes('2CL')) { currentClass = '2cl'; return; }
    if (rowValues.includes('3CL')) { currentClass = '3cl'; return; }

    if (!currentClass || !remarksKey || !nameKey) return;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS') return;

    const name = nameKey ? (typeof row[nameKey] === 'string' ? row[nameKey] : '').trim() : 'Unknown Cadet';
    const cadet = { name };

    if (val.includes('PASSED') || val === 'P') {
      data[currentClass].passed.push(cadet);
      data['all'].passed.push(cadet);
    } else if (val.includes('FAILED') || val === 'F') {
      data[currentClass].failed.push(cadet);
      data['all'].failed.push(cadet);
    } else if (val.includes('SMC')) {
      data[currentClass].smc.push(cadet);
      data['all'].smc.push(cadet);
    } else if (val.includes('FAD') || val.includes('GUARD') || val.includes('SIQ')) {
      data[currentClass].fad.push(cadet);
      data['all'].fad.push(cadet);
    }
  });

  return data;
}

export default async function PFTTracker() {
  let mockData = null;
  let pft1Data = null;
  let pft2Data = null;

  if (PFT_SHEET_ID) {
    const [mockRows, pft1Rows, pft2Rows] = await Promise.all([
      getSheetData(PFT_SHEET_ID, MOCK_PFT_TAB),
      getSheetData(PFT_SHEET_ID, PFT1_TAB),
      getSheetData(PFT_SHEET_ID, PFT2_TAB),
    ]);

    mockData = parsePFTData(mockRows);
    
    // Per user request, PFT 1 and PFT 2 do not have recorded scores yet, 
    // so we parse them as empty arrays to ignore template data.
    pft1Data = parsePFTData([]);
    pft2Data = parsePFTData([]);
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">PFT TRACKER</h1>
        <div className="section-subtitle">Physical Fitness Test Results Dashboard</div>
      </div>

      {!PFT_SHEET_ID ? (
        <div className="info-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#d97706' }}>Sheet Not Configured</h3>
          <p>Set the <code>PFT_SHEET_ID</code> environment variable in Vercel.</p>
        </div>
      ) : (
        <PFTDashboard
          mockData={mockData}
          pft1Data={pft1Data}
          pft2Data={pft2Data}
        />
      )}
    </div>
  );
}
