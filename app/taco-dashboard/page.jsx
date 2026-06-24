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
  let totalTouringHoursRemaining = 0;

  if (fsgtData && fsgtData.length > 0) {
    const keys = Object.keys(fsgtData[0]);
    // The keys based on exo-punishment/page.jsx:
    // k11 = keys[10] // TOURING HOURS TOTAL
    // k14 = keys[13] // TOURING REMAINING
    
    // We will scan dynamically just in case columns moved
    const findKey = (search) => keys.find(k => String(k).toUpperCase().includes(search));
    const remainingKey = findKey('REMAINING') || keys[13];

    fsgtData.forEach(row => {
      if (remainingKey && row[remainingKey] !== undefined) {
        const remaining = parseInt(row[remainingKey], 10);
        if (!isNaN(remaining) && remaining > 0) {
          totalTouringCadets++;
          totalTouringHoursRemaining += remaining;
        }
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
      hoursRemaining: totalTouringHoursRemaining
    },
    physical: {
      passed: pftPassed,
      failed: pftFailed,
      other: pftOther
    }
  };

  return <TacODashboardClient metrics={metrics} />;
}
