import { getSheetData } from '../../lib/googleSheets';
import TacODashboardClient from './TacODashboardClient';

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
    const k14 = keys[13]; // TOURING REMAINING
    const k16_idx = keys[15]; // MERIT

    const validRows = fsgtData.filter(row => {
      const no = parseInt(row[k1]);
      return !isNaN(no) && no > 0 && row[k3] && String(row[k3]).trim() !== '';
    });

    totalDelinquencies = validRows.length;

    const cadetMap = new Map();
    validRows.forEach(row => {
      const name = String(row[k3]).trim();
      const rank = String(row[k2]).trim();
      const isConfined = String(row[k8] || '').toLowerCase() === 'yes';
      
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
  let pftDataRows = [];
  try {
    pftDataRows = await getSheetData('1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM', 'MOCK PFT');
  } catch (error) {
    console.error("Failed to fetch PFT data:", error);
  }

  let pftPassed = 0;
  let pftFailed = 0;
  let pftOther = 0;
  let topFailedEvents = [];

  if (pftDataRows && pftDataRows.length > 0) {
    let allKeys = [];
    for (let r of pftDataRows) {
      const rKeys = Object.keys(r);
      if (rKeys.length > allKeys.length) allKeys = rKeys;
    }

    let nameIdx = -1;
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i] && allKeys[i].trim().toUpperCase() === 'NAME') {
        nameIdx = i; break;
      }
    }

    if (nameIdx !== -1) {
      const pushupKey = allKeys[nameIdx + 2];
      const situpKey = allKeys[nameIdx + 4];
      const pullupKey = allKeys[nameIdx + 6];
      const runKey = allKeys[nameIdx + 8];
      const remarksKey = allKeys[nameIdx + 10];

      let eventFails = { 'Push-ups': 0, 'Sit-ups': 0, 'Pull-ups/Flex Arm Hang': 0, '3.2KM Run': 0 };

      pftDataRows.forEach(row => {
        let rowValues = Object.values(row).map(v => typeof v === 'string' ? v.trim().toUpperCase() : '');
        if (rowValues.includes('1CL') || rowValues.includes('1ST CLASS') || 
            rowValues.includes('2CL') || rowValues.includes('2ND CLASS') ||
            rowValues.includes('3CL') || rowValues.includes('3RD CLASS')) return; // header

        if (!remarksKey) return;
        const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
        if (!val || val === 'REMARKS' || val === 'STATUS') return;

        if (val.includes('PASSED') || val === 'P') {
          pftPassed++;
        } else if (val.includes('FAILED') || val === 'F') {
          pftFailed++;
        } else if (val !== '') {
          pftOther++;
        }

        // Count event fails (only for cadets with actual scores)
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
