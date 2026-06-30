import { getSheetData } from '../../lib/googleSheets';
import TacODashboardClient from './TacODashboardClient';
import { parsePFTData } from '../../lib/pftParser';

export const revalidate = 60; // seconds

export default async function TacODashboardPage() {
  // 1. Fetch Character Data (FSGT Touring)
  let fsgtData = [];
  try {
    fsgtData = await getSheetData('1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M', 'Sheet 1');
  } catch (error) {
    console.error("Failed to fetch FSGT touring data:", error);
  }

  let totalTouringCadets = 0;
  let totalConfinedCadets = 0;
  let totalExcessiveDemerits = 0;
  let totalDelinquencies = 0;

  const getMaxDemerits = (rank) => {
    const r = (rank || '').toUpperCase();
    if (r.includes('1CL') || r.includes('CPT') || r.includes('LT') || r.includes('MAJ') || r.includes('COL')) return 88.2;
    if (r.includes('2CL')) return 102.9;
    if (r.includes('3CL')) return 117.6;
    return 100;
  };

  if (fsgtData && fsgtData.length > 0) {
    const keys = Object.keys(fsgtData[0]);
    const k1 = keys[0];   // NO
    const k2 = keys[1];   // RANK
    const k3 = keys[2];   // LAST NAME
    const k7 = keys[6];   // DEMERITS
    const k8 = keys[7];   // CONFINED?
    const k9 = keys[8];   // CONFINEMENT START
    const k10 = keys[9];  // CONFINEMENT END
    const k14 = keys[13]; // TOURING REMAINING
    const k16_idx = keys[15]; // MERIT

    const validRows = fsgtData.filter(row => {
    const lastName = String(row[k3] || '').trim();
    const rank = String(row[k2] || '').trim().toUpperCase();
    // Include all rows with a valid cadet name that are not header rows
    return lastName !== '' && lastName.toUpperCase() !== 'LAST NAME' && rank !== '' && rank !== 'RANK';
  });

    totalDelinquencies = validRows.length;

    const cadetMap = new Map();
    validRows.forEach(row => {
      const name = String(row[k3]).trim();
      const rank = String(row[k2]).trim();

      // Confinement only counts when CONFINED?=Yes AND both start and end dates are filled
      const confStart = row[k9] || null;
      const confEnd = row[k10] || null;
      const isConfined = String(row[k8] || '').toLowerCase() === 'yes'
        && confStart && String(confStart).trim() !== ''
        && confEnd && String(confEnd).trim() !== '';

      if (!cadetMap.has(name)) {
        cadetMap.set(name, {
          rank,
          totalDemerits: 0,
          totalMerits: 0,
          totalTourRemaining: 0,
          isConfined: false,
        });
      }

      const cadet = cadetMap.get(name);
      cadet.totalDemerits += Number(row[k7]) || 0;
      cadet.totalMerits += Number(row[k16_idx]) || 0;
      cadet.totalTourRemaining += Number(row[k14]) || 0;
      if (isConfined) cadet.isConfined = true;
    });

    cadetMap.forEach(cadet => {
      if (cadet.totalTourRemaining > 0) totalTouringCadets++;
      if (cadet.isConfined) totalConfinedCadets++;
      
      const accumulatedDemerits = Math.max(0, cadet.totalDemerits - cadet.totalMerits);
      const maxDemerits = getMaxDemerits(cadet.rank);
      if ((accumulatedDemerits / maxDemerits) > 0.5) {
        totalExcessiveDemerits++;
      }
    });
  }

  // 2. Fetch Physical Data (PFT)
  const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';
  const ROSTER_SHEET_ID = process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

  let pftPassed = 0;
  let pftFailed = 0;
  let pftOther = 0;
  let topFailedEvents = [];

  try {
    const [mockRows, pft1Rows, pft2Rows, rosterRows] = await Promise.all([
      getSheetData(PFT_SHEET_ID, 'MOCK PFT').catch(() => []),
      getSheetData(PFT_SHEET_ID, 'PFT1').catch(() => []),
      getSheetData(PFT_SHEET_ID, 'PFT2').catch(() => []),
      getSheetData(ROSTER_SHEET_ID, 'ROSTER').catch(() => []),
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

    const mockParsed = parsePFTData(mockRows, genderMap);
    const pft1Parsed = parsePFTData(pft1Rows, genderMap);
    const pft2Parsed = parsePFTData(pft2Rows, genderMap);

    // Determine which dataset is active (latest with data)
    let activeData = mockParsed;
    let activeRows = mockRows;
    if (pft2Parsed && [...pft2Parsed.data.all.passed, ...pft2Parsed.data.all.failed, ...pft2Parsed.data.all.smc].length > 0) {
      activeData = pft2Parsed;
      activeRows = pft2Rows;
    } else if (pft1Parsed && [...pft1Parsed.data.all.passed, ...pft1Parsed.data.all.failed, ...pft1Parsed.data.all.smc].length > 0) {
      activeData = pft1Parsed;
      activeRows = pft1Rows;
    }

    pftPassed = activeData.data.all.passed.length;
    pftFailed = activeData.data.all.failed.length;
    pftOther = activeData.data.all.smc.length + activeData.data.all.fad.length;

    // Calculate top failed events from activeRows
    if (activeRows && activeRows.length > 0) {
      let allKeys = [];
      for (let r of activeRows) {
        const rKeys = Object.keys(r);
        if (rKeys.length > allKeys.length) allKeys = rKeys;
      }

      let nameIdx = -1;
      for (let i = 0; i < allKeys.length; i++) {
        if (allKeys[i] && allKeys[i].trim().toUpperCase() === 'NAME') {
          nameIdx = i; break;
        }
      }

      if (nameIdx === -1) {
        for (let r of activeRows) {
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

      if (nameIdx !== -1) {
        const pushupKey = allKeys[nameIdx + 2];
        const situpKey = allKeys[nameIdx + 4];
        const pullupKey = allKeys[nameIdx + 6];
        const runKey = allKeys[nameIdx + 8];

        let eventFails = { 'Push-ups': 0, 'Sit-ups': 0, 'Pull-ups/Flex Arm Hang': 0, '3.2KM Run': 0 };

        activeRows.forEach(row => {
          let rowValues = Object.values(row).map(v => typeof v === 'string' ? v.trim().toUpperCase() : '');
          if (rowValues.includes('1CL') || rowValues.includes('1ST CLASS') || 
              rowValues.includes('2CL') || rowValues.includes('2ND CLASS') ||
              rowValues.includes('3CL') || rowValues.includes('3RD CLASS')) return; // header

          const name = String(row[allKeys[nameIdx]] || '').trim();
          if (name && name.toUpperCase() !== 'NAME') {
            const pushups = parseFloat(row[pushupKey]) || 0;
            const situps = parseFloat(row[situpKey]) || 0;
            const pullups = parseFloat(row[pullupKey]) || 0;
            const run = parseFloat(row[runKey]) || 0;
            
            // Assuming 0 means they didn't take it or failed. If they actually failed, score < 7.
            if (pushups > 0 && pushups < 7.0) eventFails['Push-ups']++;
            if (situps > 0 && situps < 7.0) eventFails['Sit-ups']++;
            if (pullups > 0 && pullups < 7.0) eventFails['Pull-ups/Flex Arm Hang']++;
            if (run > 0 && run < 7.0) eventFails['3.2KM Run']++;
          }
        });
        
        const sortedFails = Object.entries(eventFails).sort((a, b) => b[1] - a[1]);
        topFailedEvents = sortedFails.slice(0, 2);
      }
    }
  } catch (error) {
    console.error("Failed to fetch/parse PFT data for Eagle Eye:", error);
  }

  const metrics = {
    character: {
      touringCadets: totalTouringCadets,
      confinedCadets: totalConfinedCadets,
      excessiveDemerits: totalExcessiveDemerits,
      totalDelinquencies: totalDelinquencies
    },
    physical: {
      passed: pftPassed,
      failed: pftFailed,
      other: pftOther,
      topFailedEvents: topFailedEvents
    }
  };

  return <TacODashboardClient metrics={metrics} />;
}
