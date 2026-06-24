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

  if (pftDataRows && pftDataRows.length > 0) {
    const keys = Object.keys(pftDataRows[0]);
    
    // If we can't find a STATUS column, we guess the last column might be status in PFT
    // Looking closely at pft-tracker/page.jsx, it checks the last key typically.
    // Let's do a fallback scan on each row.
    pftDataRows.forEach(row => {
      // Find row name to ensure it's a cadet row
      const nameKey = keys.find(k => String(k).toUpperCase() === 'NAME') || keys[0];
      const name = String(row[nameKey] || '').trim();
      
      if (!name || name === 'NAME' || name.includes('CLASS')) return; // Skip headers

      // Find the value that represents passed/failed for this cadet
      let val = '';
      for (const k of keys) {
        const strVal = String(row[k] || '').trim().toUpperCase();
        if (strVal === 'PASSED' || strVal === 'P' || strVal === 'FAILED' || strVal === 'F' || strVal.includes('SMC') || strVal.includes('FAD')) {
          val = strVal;
          break;
        }
      }

      if (val.includes('PASSED') || val === 'P') {
        pftPassed++;
      } else if (val.includes('FAILED') || val === 'F') {
        pftFailed++;
      } else if (val !== '') {
        pftOther++;
      }
    });
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
      other: pftOther
    }
  };

  return <TacODashboardClient metrics={metrics} />;
}
