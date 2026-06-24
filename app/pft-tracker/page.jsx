import { getSheetData } from '../../lib/googleSheets';
import PFTDashboard from './PFTDashboard';

// PFT Google Sheet ID
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';

// Tab names in the Google Sheet for each PFT type
const MOCK_PFT_TAB = process.env.MOCK_PFT_TAB || 'MOCK PFT';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';
const PFT2_TAB = process.env.PFT2_TAB || 'PFT2';

export const revalidate = 30;

const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const ROSTER_TAB = 'ROSTER';

function createEmptyData() {
  return {
    passed: [], failed: [], smc: [], fad: []
  };
}

// Parses rows and groups them by Class and Status
function parsePFTData(rows, genderMap = {}) {
  const data = {
    'all': createEmptyData(),
    '1cl': createEmptyData(),
    '2cl': createEmptyData(),
    '3cl': createEmptyData()
  };

  if (!rows || rows.length === 0) return data;

  // Dynamically inspect Object.keys across rows to get the correct column index order
  let allKeys = [];
  for (let r of rows) {
    const rKeys = Object.keys(r);
    if (rKeys.length > allKeys.length) {
      allKeys = rKeys;
    }
  }

  let currentClass = null;
  let nameIdx = -1;

  // Try finding NAME column index in the sheet keys
  for (let i = 0; i < allKeys.length; i++) {
    const k = allKeys[i];
    if (k && k.trim().toUpperCase() === 'NAME') {
      nameIdx = i;
      break;
    }
  }

  // Fallback scan if header name wasn't matched exactly
  if (nameIdx === -1) {
    for (let r of rows) {
      for (let i = 0; i < allKeys.length; i++) {
        const val = typeof r[allKeys[i]] === 'string' ? r[allKeys[i]].trim().toUpperCase() : '';
        if (val === 'NAME' || val.includes('1CL')) {
          nameIdx = i;
          break;
        }
      }
      if (nameIdx !== -1) break;
    }
  }

  if (nameIdx === -1) nameIdx = 0; // absolute fallback

  const nameKey = allKeys[nameIdx];
  const pushupKey = allKeys[nameIdx + 2];
  const situpKey = allKeys[nameIdx + 4];
  const pullupKey = allKeys[nameIdx + 6];
  const runKey = allKeys[nameIdx + 8];
  const averageKey = allKeys[nameIdx + 9];
  const remarksKey = allKeys[nameIdx + 10];

  if (nameKey) {
    const upperKey = nameKey.toUpperCase();
    if (upperKey.includes('1CL') || upperKey.includes('1ST CLASS')) currentClass = '1cl';
    else if (upperKey.includes('2CL') || upperKey.includes('2ND CLASS')) currentClass = '2cl';
    else if (upperKey.includes('3CL') || upperKey.includes('3RD CLASS')) currentClass = '3cl';
  }

  rows.forEach((row) => {
    // Check if this row is a class header
    let rowValues = Object.values(row).map(v => typeof v === 'string' ? v.trim().toUpperCase() : '');
    if (rowValues.includes('1CL') || rowValues.includes('1ST CLASS')) { currentClass = '1cl'; return; }
    if (rowValues.includes('2CL') || rowValues.includes('2ND CLASS')) { currentClass = '2cl'; return; }
    if (rowValues.includes('3CL') || rowValues.includes('3RD CLASS')) { currentClass = '3cl'; return; }

    if (!currentClass || !remarksKey || !nameKey) return;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS' || val === 'STATUS') return;

    const name = (typeof row[nameKey] === 'string' ? row[nameKey] : '').trim();
    if (!name || name.toUpperCase() === 'NAME') return;

    // Look up gender using cadet's surname (first word of name, stripped of CDT prefix)
    const cleanName = name.replace(/CDT\s+/, '').trim().toUpperCase();
    const surname = cleanName.split(/\s+/)[0];
    
    let gender = 'M'; // Default to Male
    if (genderMap && genderMap[surname]) {
      gender = genderMap[surname];
    } else if (genderMap) {
      // Fuzzy contains check fallback
      for (const [sName, g] of Object.entries(genderMap)) {
        if (cleanName.includes(sName)) {
          gender = g;
          break;
        }
      }
    }

    const pushups = parseFloat(row[pushupKey]) || 0;
    const situps = parseFloat(row[situpKey]) || 0;
    const pullups = parseFloat(row[pullupKey]) || 0;
    const run = parseFloat(row[runKey]) || 0;
    const average = parseFloat(row[averageKey]) || 0;

    const cadet = {
      name,
      gender,
      class: currentClass,
      scores: {
        pushups,
        situps,
        pullups,
        run,
        average
      },
      remarks: val
    };

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

    mockData = parsePFTData(mockRows, genderMap);
    pft1Data = parsePFTData(pft1Rows, genderMap);
    pft2Data = parsePFTData(pft2Rows, genderMap);
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
