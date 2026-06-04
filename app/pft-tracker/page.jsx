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

  rows.forEach((row, i) => {
    let cadetClass = null;
    
    // 1CL: Rows 2-35 (index 0-33)
    if (i >= 0 && i <= 33) cadetClass = '1cl';
    // 2CL: Rows 41-80 (index 39-78)
    else if (i >= 39 && i <= 78) cadetClass = '2cl';
    // 3CL: Rows 87-126 (index 85-124)
    else if (i >= 85 && i <= 124) cadetClass = '3cl';

    if (!cadetClass) return; // Skip invalid rows

    // Find remarks and name columns
    const remarksKey = Object.keys(row).find(k => k.toLowerCase().includes('remarks'));
    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.includes('1CL'));
    
    if (!remarksKey) return;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS') return;

    const name = nameKey ? (typeof row[nameKey] === 'string' ? row[nameKey] : '').trim() : 'Unknown Cadet';

    const cadet = { name };

    if (val.includes('PASSED') || val === 'P') {
      data[cadetClass].passed.push(cadet);
      data['all'].passed.push(cadet);
    } else if (val.includes('FAILED') || val === 'F') {
      data[cadetClass].failed.push(cadet);
      data['all'].failed.push(cadet);
    } else if (val.includes('SMC')) {
      data[cadetClass].smc.push(cadet);
      data['all'].smc.push(cadet);
    } else if (val.includes('FAD') || val.includes('GUARD') || val.includes('SIQ')) {
      data[cadetClass].fad.push(cadet);
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
