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

// Count remarks from rows
function countRemarks(rows) {
  const counts = { passed: 0, failed: 0, smc: 0, fad: 0, total: 0 };

  for (const row of rows) {
    // Find the "remarks" column (case-insensitive)
    const remarksKey = Object.keys(row).find(k => k.toLowerCase().includes('remarks'));
    if (!remarksKey) continue;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS') continue; // Skip empty and header duplicates

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
  }

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

    mockData = countRemarks(mockRows);
    pft1Data = countRemarks(pft1Rows);
    pft2Data = countRemarks(pft2Rows);
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
