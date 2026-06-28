import { getSheetData } from '../../lib/googleSheets';
import ExoPunishmentClient from './ExoPunishmentClient';
import { getCadetImageUrl } from '../../lib/imageMatcher';

export const revalidate = 30; // seconds

export default async function ExoPunishmentPage() {
  const data = await getSheetData('1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M', 'Sheet 1');

  if (!data || data.length === 0) {
    return (
      <div className="page-container">
        <header className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>F/SGT's Punishment Monitoring</h1>
          <p>Monitoring Dashboard for Cadet Punishments</p>
        </header>
        <ExoPunishmentClient initialCadets={[]} />
      </div>
    );
  }

  // Google Sheets API returns the first row as the keys of the objects.  // So we grab the keys by their index.
  const keys = Object.keys(data[0]);
  const k1 = keys[0];   // NO or "UPDATED AS OF :"
  const k2 = keys[1];   // RANK
  const k3 = keys[2];   // LAST NAME
  const k4 = keys[3];   // OFFENSE
  const k5 = keys[4];   // CLASS
  const k6 = keys[5];   // NATURE OF OFFENSE
  const k7 = keys[6];   // DEMERITS
  const k8 = keys[7];   // CONFINED?
  const k9 = keys[8];   // CONFINEMENT START
  const k10 = keys[9];  // CONFINEMENT END
  const k11 = keys[10]; // TOURING HOURS TOTAL
  const k12 = keys[11]; // TOURING CONVERTED
  const k13 = keys[12]; // TOURING SERVED
  const k14 = keys[13]; // TOURING REMAINING
  const k16 = keys[15]; // REMARKS

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
  // NOTE: We do NOT filter by NO column — many valid entries have no sequential number
  const validRows = data.filter(row => {
    const lastName = String(row[k3] || '').trim();
    const rank = String(row[k2] || '').trim().toUpperCase();
    return lastName !== '' && lastName.toUpperCase() !== 'LAST NAME' && rank !== '' && rank !== 'RANK';
  });

  const k15 = keys[14]; // DEMERIT ALLOWANCE
  const k16_idx = keys[15]; // MERIT
  const k17 = keys[18]; // REFERENCE
  const k18 = keys[19]; // REMARKS

  // Helper to parse reference string details
  function parseReference(refStr) {
    if (!refStr) return null;
    const s = String(refStr).trim();
    // Match date part
    const dateMatch = s.match(/(?:dtd\s+)?([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
    if (dateMatch) {
      const dateVal = new Date(dateMatch[1]);
      if (!isNaN(dateVal.getTime())) {
        const year = dateVal.getFullYear();
        const month = String(dateVal.getMonth() + 1).padStart(2, '0');
        const day = String(dateVal.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        const dateIndex = s.indexOf(dateMatch[0]);
        let prefix = s.substring(0, dateIndex).trim();
        if (prefix.toLowerCase().endsWith('dtd')) {
          prefix = prefix.substring(0, prefix.length - 3).trim();
        }
        const normPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return { prefix, normPrefix, date: isoDate, rawDatePart: dateMatch[1] };
      }
    }
    return null;
  }

  // Pre-process references to build a map of normalized prefix -> earliest date
  // This automatically corrects Google Sheets auto-fill drag-down errors (where the year was incremented consecutively)
  const prefixMap = new Map();
  validRows.forEach(row => {
    const refStr = row[k17] || '';
    const parsed = parseReference(refStr);
    if (parsed && parsed.normPrefix) {
      const { normPrefix, date } = parsed;
      if (!prefixMap.has(normPrefix) || new Date(date) < new Date(prefixMap.get(normPrefix))) {
        prefixMap.set(normPrefix, date);
      }
    }
  });

  // Helper to extract date from strings like "S.O. Nr 95 dtd 12 MAY 2026"
  // It checks if there's a corrected earliest date for this order prefix
  function extractDateFromReference(ref) {
    if (!ref) return null;
    const parsed = parseReference(ref);
    if (parsed && parsed.normPrefix) {
      const correctedDate = prefixMap.get(parsed.normPrefix);
      if (correctedDate) return correctedDate;
    }
    // Fallback to original parsing if prefix grouping failed
    const s = String(ref).trim();
    const dtdMatch = s.match(/dtd\s+([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
    if (dtdMatch) {
      const parsedD = new Date(dtdMatch[1]);
      if (!isNaN(parsedD.getTime())) return parsedD.toISOString().split('T')[0];
    }
    const genericMatch = s.match(/([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i);
    if (genericMatch) {
      const parsedD = new Date(genericMatch[1]);
      if (!isNaN(parsedD.getTime())) return parsedD.toISOString().split('T')[0];
    }
    return null;
  }

  // Helper to correct the year inside reference string
  function getCorrectedReference(ref) {
    if (!ref) return '';
    const parsed = parseReference(ref);
    if (parsed && parsed.normPrefix) {
      const correctedDate = prefixMap.get(parsed.normPrefix);
      if (correctedDate) {
        const correctYear = correctedDate.split('-')[0];
        return String(ref).replace(parsed.rawDatePart, (match) => {
          return match.replace(/\b[0-9]{4}\b/, correctYear);
        });
      }
    }
    return String(ref);
  }

  // Group by cadet (LAST NAME)
  const cadetMap = new Map();
  // Aggregate violations by date
  const violationsByDate = new Map();

  validRows.forEach(row => {
    const name = String(row[k3]).trim();
    const rank = String(row[k2]).trim();
    const isConfined = String(row[k8] || '').toLowerCase() === 'yes';
    
    if (!cadetMap.has(name)) {
      cadetMap.set(name, {
        name,
        rank,
        picture: getCadetImageUrl(name, '', name) || '',
        totalDemerits: 0,
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
    
    // Add demerits and tours
    cadet.totalDemerits += Number(row[k7]) || 0;
    cadet.totalMerits += Number(row[k16_idx]) || 0;
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

    // Track violation dates
    const refStr = row[k17] || '';
    const extractedDate = extractDateFromReference(refStr);

    // Add offense details
    cadet.offenses.push({
      description: String(row[k4] || ''),
      classOfOffense: String(row[k5] || ''),
      natureOfOffense: String(row[k6] || ''),
      tourTotal: Number(row[k11]) || 0,
      tourConverted: Number(row[k12]) || 0,
      tourServed: Number(row[k13]) || 0,
      tourRemaining: Number(row[k14]) || 0,
      isConfined: String(row[k8] || '').toLowerCase() === 'yes' && !!confStart && !!confEnd,
      confStart: confStart,
      confEnd: confEnd,
      remarks: String(row[k18] || ''),
      reference: getCorrectedReference(refStr),
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
        {updatedAsOf !== 'Unknown' && (
          <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            UPDATED AS OF: {updatedAsOf}
          </div>
        )}
      </header>

      <ExoPunishmentClient initialCadets={cadets} violationsOverTime={violationsOverTime} />
    </div>
  );
}
