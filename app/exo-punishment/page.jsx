import { getSheetData, getSheetBreakdown } from '../../lib/googleSheets';
import ExoPunishmentClient from './ExoPunishmentClient';
import { getCadetImageUrl } from '../../lib/imageMatcher';

export const revalidate = 30; // seconds

export default async function ExoPunishmentPage() {
  const [data, breakdownData] = await Promise.all([
    getSheetData('1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M', 'Sheet 1'),
    getSheetBreakdown('1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M', 'BREAKDOWN')
  ]);

  if (!data || data.length === 0) {
    return (
      <div className="page-container">
        <header className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>F/SGT's Punishment Monitoring</h1>
          <p>Monitoring Dashboard for Cadet Punishments</p>
        </header>
        <ExoPunishmentClient initialCadets={[]} breakdownData={breakdownData || []} />
      </div>
    );
  }

  // Google Sheets API returns rows as objects.
  const keys = Object.keys(data[0] || {});

  // Dynamically find column names from header row or fallback to standard indices
  const headerRow = data.find(row => {
    const vals = Object.values(row).map(v => String(v || '').trim().toUpperCase());
    return vals.includes('LAST NAME') || vals.includes('RANK');
  });

  let k1 = keys[0];   // NO or "UPDATED AS OF :"
  let k2 = keys[1];   // RANK
  let k3 = keys[2];   // LAST NAME
  let k4 = keys[3];   // OFFENSE
  let k5 = keys[4];   // CLASS
  let k6 = keys[5];   // NATURE OF OFFENSE
  let k7 = keys[6];   // DEMERITS
  let k8 = keys[7];   // CONFINED?
  let k9 = keys[8];   // CONFINEMENT START
  let k10 = keys[9];  // CONFINEMENT END
  let k11 = keys[10]; // TOURING HOURS TOTAL
  let k12 = keys[11]; // TOURING CONVERTED
  let k13 = keys[12]; // TOURING SERVED
  let k14 = keys[13]; // TOURING REMAINING
  let k15 = keys[14]; // DEMERIT ALLOWANCE
  let k16_idx = keys[15]; // MERIT
  let k17 = keys[18] || keys[keys.length - 2]; // REFERENCE
  let k18 = keys[19] || keys[keys.length - 1]; // REMARKS

  if (headerRow) {
    for (const [colKey, headerVal] of Object.entries(headerRow)) {
      const v = String(headerVal || '').trim().toUpperCase();
      if (v === 'LAST NAME' || v === 'NAME') k3 = colKey;
      else if (v === 'RANK') k2 = colKey;
      else if (v === 'OFFENSE') k4 = colKey;
      else if (v.startsWith('CLASS')) k5 = colKey;
      else if (v.includes('NATURE')) k6 = colKey;
      else if (v.includes('DEMERIT') && !v.includes('ALLOWANCE') && !v.includes('TOTAL') && !v.includes('REMAINING')) k7 = colKey;
      else if (v.includes('CONFINED') && !v.includes('START') && !v.includes('END')) k8 = colKey;
      else if (v.includes('START')) k9 = colKey;
      else if (v.includes('END')) k10 = colKey;
      else if (v.includes('HOURS') || (v.includes('TOURING') && v.includes('TOTAL'))) k11 = colKey;
      else if (v.includes('CONVERTED')) k12 = colKey;
      else if (v.includes('SERVED')) k13 = colKey;
      else if (v.includes('REMAINING') && v.includes('TOURING')) k14 = colKey;
      else if (v.includes('ALLOWANCE')) k15 = colKey;
      else if (v.includes('MERIT') && !v.includes('DEMERIT')) k16_idx = colKey;
      else if (v.includes('REFERENCE') || v === 'REF') k17 = colKey;
      else if (v.includes('REMARK')) k18 = colKey;
    }
  }

  // Extract "UPDATED AS OF" date from the first data row (col E = CLASS col)
  let updatedAsOf = 'Unknown';
  if (data[0]) {
    const dateCandidate = String(data[0][k5] || '').trim();
    if (dateCandidate && !dateCandidate.toUpperCase().includes('CLASS') && dateCandidate !== '') {
      updatedAsOf = dateCandidate;
    }
  }
  // Also check any row where col A mentions UPDATED AS OF
  const updatedRow = data.find(row => String(row[k1] || '').toUpperCase().includes('UPDATED AS OF'));
  if (updatedRow) updatedAsOf = String(updatedRow[k5] || updatedRow[k4] || '').trim();

  // Filter valid rows: must have a LAST NAME and not be a header row
  let lastSeenRank = '3CL';
  const validRows = data.filter(row => {
    const lastName = String(row[k3] || '').trim();
    if (!lastName || lastName.toUpperCase() === 'LAST NAME' || lastName.toUpperCase() === 'NAME') {
      return false;
    }
    const rankVal = String(row[k2] || '').trim().toUpperCase();
    if (rankVal === 'RANK') return false;
    if (rankVal) lastSeenRank = rankVal;
    return true;
  });

  const MONTHS = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
  };

  // Robust date parser for military order references
  function parseAwardDate(refStr) {
    if (!refStr) return null;
    const s = String(refStr).trim();

    // 1. Day Month Year (e.g. 15 OCTOBER 2026, 15-Oct-2026, 15 Sept. 2026, 15/Oct/2026)
    const m1 = s.match(/([0-9]{1,2})[\s\-\/\.]*([a-zA-Z]+)[\s\-\/\.]*([0-9]{4})/i);
    if (m1) {
      const d = parseInt(m1[1], 10);
      const monStr = m1[2].toLowerCase();
      let y = parseInt(m1[3], 10);
      if (y > 2026) y = 2026; // Auto-correct drag-down year increments (2027-2035 -> 2026)
      if (MONTHS[monStr] && d >= 1 && d <= 31) {
        return `${y}-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // 2. Month Day Year (e.g. September 15, 2026, Oct 15 2026)
    const m2 = s.match(/([a-zA-Z]+)[\s\-\/\.]*([0-9]{1,2}),?[\s\-\/\.]*([0-9]{4})/i);
    if (m2) {
      const monStr = m2[1].toLowerCase();
      const d = parseInt(m2[2], 10);
      let y = parseInt(m2[3], 10);
      if (y > 2026) y = 2026;
      if (MONTHS[monStr] && d >= 1 && d <= 31) {
        return `${y}-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // 3. ISO format YYYY-MM-DD
    const m3 = s.match(/([0-9]{4})[\-\/]([0-9]{1,2})[\-\/]([0-9]{1,2})/);
    if (m3) {
      let y = parseInt(m3[1], 10);
      if (y > 2026) y = 2026;
      return `${y}-${String(parseInt(m3[2], 10)).padStart(2, '0')}-${String(parseInt(m3[3], 10)).padStart(2, '0')}`;
    }

    // 4. Numeric DD/MM/YYYY or MM/DD/YYYY
    const m4 = s.match(/([0-9]{1,2})[\/]([0-9]{1,2})[\/]([0-9]{4})/);
    if (m4) {
      const p1 = parseInt(m4[1], 10);
      const p2 = parseInt(m4[2], 10);
      let y = parseInt(m4[3], 10);
      if (y > 2026) y = 2026;
      if (p1 > 12) {
        return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      } else {
        return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      }
    }

    // 5. Day Month without year (defaults to 2026)
    const m5 = s.match(/([0-9]{1,2})[\s\-\/\.]*([a-zA-Z]+)/i);
    if (m5) {
      const d = parseInt(m5[1], 10);
      const monStr = m5[2].toLowerCase();
      if (MONTHS[monStr] && d >= 1 && d <= 31) {
        return `2026-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // 6. Month Day without year (defaults to 2026)
    const m6 = s.match(/([a-zA-Z]+)[\s\-\/\.]*([0-9]{1,2})/i);
    if (m6) {
      const monStr = m6[1].toLowerCase();
      const d = parseInt(m6[2], 10);
      if (MONTHS[monStr] && d >= 1 && d <= 31) {
        return `2026-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    return null;
  }

  // Group by cadet (LAST NAME)
  const cadetMap = new Map();
  // Aggregate violations by date
  const violationsByDate = new Map();

  validRows.forEach(row => {
    const name = String(row[k3] || '').trim();
    let rank = String(row[k2] || '').trim();
    if (!rank && lastSeenRank) rank = lastSeenRank;

    if (!cadetMap.has(name)) {
      cadetMap.set(name, {
        name,
        rank,
        picture: getCadetImageUrl(name, '', name) || '',
        totalDemerits: 0,
        secondTermDemerits: 0,
        allTimeDemerits: 0,
        term1Demerits: 0,
        totalMerits: 0,
        totalTour: 0,
        totalTourConverted: 0,
        totalTourServed: 0,
        totalTourRemaining: 0,
        isConfined: false,
        confinementStart: null,
        confinementEnd: null,
        offenses: []
      });
    }

    const cadet = cadetMap.get(name);
    if (rank && !cadet.rank) cadet.rank = rank;
    
    // Extract reference text dynamically
    let refStr = String(row[k17] || '').trim();
    if (!refStr) {
      for (const [colKey, colVal] of Object.entries(row)) {
        if (colKey.toUpperCase().includes('REFERENCE') || colKey.toUpperCase() === 'REF') {
          const s = String(colVal || '').trim();
          if (s) { refStr = s; break; }
        }
      }
    }
    if (!refStr) {
      for (const val of Object.values(row)) {
        if (typeof val === 'string' && (/\bdtd\b/i.test(val) || /\bS\.?O\.?\b/i.test(val) || /\bS\.?R\.?\b/i.test(val))) {
          refStr = val.trim();
          break;
        }
      }
    }

    // Extract award date from reference or other cells in the row
    let extractedDate = parseAwardDate(refStr);
    if (!extractedDate && row[k18]) {
      extractedDate = parseAwardDate(row[k18]);
    }
    if (!extractedDate) {
      for (const val of Object.values(row)) {
        if (typeof val === 'string' && (/\b2026\b/.test(val) || /\b(sep|sept|oct|nov|dec)/i.test(val))) {
          const candidate = parseAwardDate(val);
          if (candidate) {
            extractedDate = candidate;
            break;
          }
        }
      }
    }

    // Cleanly parse demerits
    let rowDemerits = 0;
    const rawDem = String(row[k7] !== undefined && row[k7] !== null ? row[k7] : '').trim();
    const cleanDem = rawDem.replace(/[^0-9.]/g, '');
    if (cleanDem) rowDemerits = parseFloat(cleanDem) || 0;

    let rowMerits = 0;
    const rawMerit = String(row[k16_idx] !== undefined && row[k16_idx] !== null ? row[k16_idx] : '').trim();
    const cleanMerit = rawMerit.replace(/[^0-9.]/g, '');
    if (cleanMerit) rowMerits = parseFloat(cleanMerit) || 0;

    // 2nd Term Rule: Demerits awarded on or after September 11, 2026 are included in the deduction of merit allowance for 2nd term.
    const isAwardedAfterSep11 = !!(extractedDate && extractedDate >= '2026-09-11');

    if (isAwardedAfterSep11) {
      cadet.totalDemerits += rowDemerits;
      cadet.totalMerits += rowMerits;
    }

    cadet.secondTermDemerits = cadet.totalDemerits;
    cadet.allTimeDemerits += rowDemerits;
    if (!isAwardedAfterSep11) {
      cadet.term1Demerits += rowDemerits;
    }

    cadet.totalTour += Number(row[k11]) || 0;
    cadet.totalTourConverted += Number(row[k12]) || 0;
    cadet.totalTourServed += Number(row[k13]) || 0;
    cadet.totalTourRemaining += Number(row[k14]) || 0;

    // Confinement is only real when CONFINED?=Yes AND both start and end dates exist
    const confStart = row[k9] || null;
    const confEnd = row[k10] || null;
    const isConfined = String(row[k8] || '').toLowerCase() === 'yes'
      && confStart && String(confStart).trim() !== ''
      && confEnd && String(confEnd).trim() !== '';

    // Update confinement — only mark confined if this offense actually has dates
    if (isConfined) {
      cadet.isConfined = true;
      cadet.confinementStart = String(confStart);
      cadet.confinementEnd = String(confEnd);
    }

    // Add offense details
    cadet.offenses.push({
      description: String(row[k4] || ''),
      classOfOffense: String(row[k5] || ''),
      natureOfOffense: String(row[k6] || ''),
      demerits: rowDemerits,
      isAwardedAfterSep11,
      term: isAwardedAfterSep11 ? '2nd Term' : '1st Term',
      tourTotal: Number(row[k11]) || 0,
      tourConverted: Number(row[k12]) || 0,
      tourServed: Number(row[k13]) || 0,
      tourRemaining: Number(row[k14]) || 0,
      isConfined: String(row[k8] || '').toLowerCase() === 'yes' && !!confStart && !!confEnd,
      confStart: confStart,
      confEnd: confEnd,
      remarks: String(row[k18] || ''),
      reference: refStr,
      date: extractedDate
    });

    if (extractedDate) {
      if (!violationsByDate.has(extractedDate)) {
        violationsByDate.set(extractedDate, {
          date: extractedDate,
          total: 0,
          class1: 0,
          class2: 0,
          class3: 0,
          class4: 0
        });
      }
      
      const dayData = violationsByDate.get(extractedDate);
      dayData.total += 1;
      
      const classVal = String(row[k5] || '').trim().toUpperCase();
      if (classVal === 'I' || classVal === '1') {
        dayData.class1 += 1;
      } else if (classVal === 'II' || classVal === '2') {
        dayData.class2 += 1;
      } else if (classVal === 'III' || classVal === '3') {
        dayData.class3 += 1;
      } else if (classVal === 'IV' || classVal === '4') {
        dayData.class4 += 1;
      }
    }
  });

  const cadets = Array.from(cadetMap.values());

  const violationsOverTime = Array.from(violationsByDate.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1>F/SGT's Punishment Monitoring</h1>
        <p>Monitoring Dashboard for Cadet Punishments</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
            📌 2nd Term Merit Allowance Active (Cutoff: Awarded after 11 Sept 2026)
          </div>
          {updatedAsOf !== 'Unknown' && (
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              UPDATED AS OF: {updatedAsOf}
            </div>
          )}
        </div>
      </header>

      <ExoPunishmentClient initialCadets={cadets} violationsOverTime={violationsOverTime} breakdownData={breakdownData || []} />
    </div>
  );
}
