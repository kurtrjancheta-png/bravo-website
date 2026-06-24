import { getSheetData } from '../../lib/googleSheets';
import PFTDashboard from './PFTDashboard';
import { parsePFTData, createEmptyData } from '../../lib/pftParser';

// PFT Google Sheet ID
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';

// Tab names in the Google Sheet for each PFT type
const MOCK_PFT_TAB = process.env.MOCK_PFT_TAB || 'MOCK PFT';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';
const PFT2_TAB = process.env.PFT2_TAB || 'PFT2';

export const revalidate = 30;

const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const ROSTER_TAB = 'ROSTER';

// parsePFTData and createEmptyData are now imported from lib/pftParser.js

export default async function PFTTracker() {
  let mockData = null;
  let pft1Data = null;
  let pft2Data = null;

  if (PFT_SHEET_ID) {
    const [mockRows, pft1Rows, pft2Rows, rosterRows] = await Promise.all([
      getSheetData(PFT_SHEET_ID, MOCK_PFT_TAB),
      getSheetData(PFT_SHEET_ID, PFT1_TAB),
      getSheetData(PFT_SHEET_ID, PFT2_TAB),
      getSheetData(ROSTER_SHEET_ID, ROSTER_TAB),
    ]);

    // Parse Roster for surname -> gender mapping
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

    mockData = parsePFTData(mockRows, genderMap).data;
    pft1Data = parsePFTData(pft1Rows, genderMap).data;
    pft2Data = parsePFTData(pft2Rows, genderMap).data;
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
