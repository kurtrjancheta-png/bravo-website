import { getSheetData } from '../../lib/googleSheets';
import PFTDashboard from './PFTDashboard';

// ===== CONFIGURE THESE =====
// PFT Google Sheet ID
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';

// Tab names in the Google Sheet for each PFT type (override via env vars)
const MOCK_PFT_TAB = process.env.MOCK_PFT_TAB || 'MOCK PFT';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT 1';
const PFT2_TAB = process.env.PFT2_TAB || 'PFT 2';

export const revalidate = 30;

// Count remarks from rows, only including valid cadet rows
function countRemarks(rows, isMock = false) {
  const counts = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };

  // Valid rows based on Google Sheet structure (0-indexed array where 0 = Row 2)
  // 1CL: Rows 2-35 (index 0-33)
  // 2CL: Rows 41-80 (index 39-78)
  // 3CL: Rows 87-126 (index 85-124)
  const isValidRow = (index) => {
    return (index >= 0 && index <= 33) ||
           (index >= 39 && index <= 78) ||
           (index >= 85 && index <= 124);
  };

  rows.forEach((row, i) => {
    if (!isValidRow(i)) return;

    // Find the "remarks" column (case-insensitive)
    const remarksKey = Object.keys(row).find(k => k.toLowerCase().includes('remarks'));
    if (!remarksKey) return;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS') return; // Skip empty and header duplicates

    counts.total++;

    if (val.includes('PASSED') || val === 'P') {
      counts.passed++;
    } else if (val.includes('FAILED') || val === 'F') {
      counts.failed++;
    } else if (val.includes('SMC')) {
      counts.smc++;
    } else if (val.includes('FAD') || val.includes('GUARD') || val.includes('SIQ')) {
      counts.fad++;
    }
  });

  return counts;
}

export default async function PFTTracker() {
  let mockData = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };
  let pft1Data = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };
  let pft2Data = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };

  if (PFT_SHEET_ID) {
    const [mockRows, pft1Rows, pft2Rows] = await Promise.all([
      getSheetData(PFT_SHEET_ID, MOCK_PFT_TAB),
      getSheetData(PFT_SHEET_ID, PFT1_TAB),
      getSheetData(PFT_SHEET_ID, PFT2_TAB),
    ]);

    mockData = countRemarks(mockRows, true);
    
    // Per user request, PFT 1 and PFT 2 do not have recorded scores yet, 
    // so we zero them out to ignore copied template data.
    // When they are ready, you can change these back to: countRemarks(pft1Rows)
    pft1Data = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };
    pft2Data = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };
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
          <p>Set the <code>PFT_SHEET_ID</code> environment variable in Vercel to your PFT Google Sheet ID. Optionally set <code>MOCK_PFT_TAB</code>, <code>PFT1_TAB</code>, <code>PFT2_TAB</code> for custom tab names.</p>
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
