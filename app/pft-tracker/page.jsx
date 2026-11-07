import { getSheetData } from '../../lib/googleSheets';
import PFTDashboard from './PFTDashboard';
import { parsePFTData, createEmptyData } from '../../lib/pftParser';

// PFT Google Sheet ID (Active 2nd Term PFT Sheet)
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';

// Tab names in the Google Sheet for 2nd Term PFTs
const MOCK_PFT_TAB = process.env.MOCK_PFT_TAB || 'MOCK PFT';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';
const PFT2_TAB = process.env.PFT2_TAB || 'PFT2';

// CAMP / 1st Term Sheet ID fallback
const CAMP_SHEET_ID = process.env.CAMP_SHEET_ID || '1YfrsGwikWtcLLsXFodHL47Yy8JoYRpp54Dt3mrAVA14';

export const revalidate = 30;

const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const ROSTER_TAB = 'ROSTER';

export default async function PFTTracker() {
  let mockData = null;
  let pft1Data = null;
  let pft2Data = null;
  let term1Pft1Data = null;
  let term1Pft2Data = null;

  if (PFT_SHEET_ID) {
    const [
      mockRows, 
      pft1Rows, 
      pft2Rows, 
      rosterRows,
      campPft1Rows,
      campPft2Rows,
      t1p1Rows,
      t1p2Rows
    ] = await Promise.all([
      getSheetData(PFT_SHEET_ID, MOCK_PFT_TAB).catch(() => []),
      getSheetData(PFT_SHEET_ID, PFT1_TAB).catch(() => []),
      getSheetData(PFT_SHEET_ID, PFT2_TAB).catch(() => []),
      getSheetData(ROSTER_SHEET_ID, ROSTER_TAB).catch(() => []),
      // Also look for 1st Term PFT tabs in CAMP sheet or PFT sheet
      getSheetData(CAMP_SHEET_ID, 'PFT 1').catch(() => []),
      getSheetData(CAMP_SHEET_ID, 'PFT 2').catch(() => []),
      getSheetData(PFT_SHEET_ID, '1ST TERM PFT 1').catch(() => []),
      getSheetData(PFT_SHEET_ID, '1ST TERM PFT 2').catch(() => []),
    ]);

    // Parse Roster for surname -> gender and class mapping
    const genderMap = {};
    const classMap = {};
    if (rosterRows && rosterRows.length > 0) {
      rosterRows.forEach((row) => {
        const surname = (row['SURNAME'] || row['LAST NAME'] || '').trim().toUpperCase();
        const gender = (row['GENDER'] || '').trim().toUpperCase();
        const rawClass = (row['CLASS'] || row['CL'] || '').trim().toUpperCase();
        let cls = '';
        if (rawClass === '1' || rawClass === '1CL' || rawClass.includes('1ST')) cls = '1cl';
        else if (rawClass === '2' || rawClass === '2CL' || rawClass.includes('2ND')) cls = '2cl';
        else if (rawClass === '3' || rawClass === '3CL' || rawClass.includes('3RD')) cls = '3cl';
        else if (rawClass === '4' || rawClass === '4CL' || rawClass.includes('4TH')) cls = '4cl';

        if (surname && gender) {
          genderMap[surname] = gender;
        }
        if (surname && cls) {
          classMap[surname] = cls;
        }
      });
    }

    mockData = parsePFTData(mockRows, genderMap, classMap).data;
    pft1Data = parsePFTData(pft1Rows, genderMap, classMap).data;
    pft2Data = parsePFTData(pft2Rows, genderMap, classMap).data;

    // Check for 1st Term PFT data
    const bestT1P1 = (t1p1Rows && t1p1Rows.length > 0) ? t1p1Rows : campPft1Rows;
    const bestT1P2 = (t1p2Rows && t1p2Rows.length > 0) ? t1p2Rows : campPft2Rows;
    term1Pft1Data = parsePFTData(bestT1P1, genderMap, classMap).data;
    term1Pft2Data = parsePFTData(bestT1P2, genderMap, classMap).data;
  }

  const term2Data = {
    mock: mockData,
    pft1: pft1Data,
    pft2: pft2Data
  };

  const term1Data = {
    pft1: term1Pft1Data,
    pft2: term1Pft2Data
  };

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 className="section-title" style={{ margin: 0 }}>PFT TRACKER</h1>
          <span style={{
            background: 'rgba(217, 119, 6, 0.15)',
            border: '1px solid #d97706',
            color: '#f59e0b',
            padding: '0.2rem 0.65rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            AY 2026-2027 • 2ND TERM
          </span>
        </div>
        <div className="section-subtitle">
          Athletic Council Physical Fitness Test Results & Performance Analytics
        </div>
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
          term2Data={term2Data}
          term1Data={term1Data}
          activeTerm="2nd"
          latestPFT="pft1"
        />
      )}
    </div>
  );
}
