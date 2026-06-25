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

  // Extract "UPDATED AS OF" date
  let updatedAsOf = 'Unknown';
  if (String(k1).toUpperCase().includes('UPDATED AS OF')) {
    updatedAsOf = String(k5 || '').trim();
  }
  const updatedRow = data.find(row => String(row[k1]).toUpperCase().includes('UPDATED AS OF'));
  if (updatedRow && updatedAsOf === 'Unknown') {
    updatedAsOf = String(updatedRow[k5] || '').trim();
  }

  // Filter valid rows: Column 1 (NO) must be a number > 0, Column 3 must exist
  const validRows = data.filter(row => {
    const no = parseInt(row[k1]);
    return !isNaN(no) && no > 0 && row[k3] && String(row[k3]).trim() !== '';
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

    // Update confinement
    if (isConfined) {
      cadet.isConfined = true;
      const start = String(row[k9] || '');
      const end = String(row[k10] || '');
      if (start && end) {
        cadet.confinementStart = start;
        cadet.confinementEnd = end;
      }
    }

    // Add offense details
    cadet.offenses.push({
      description: String(row[k4] || ''),
      classOfOffense: String(row[k5] || ''),
      natureOfOffense: String(row[k6] || ''),
      tourTotal: Number(row[k11]) || 0,
      tourConverted: Number(row[k12]) || 0,
      tourServed: Number(row[k13]) || 0,
      tourRemaining: Number(row[k14]) || 0,
      isConfined: String(row[k8] || '').toLowerCase() === 'yes',
      confStart: row[k9] || null,
      confEnd: row[k10] || null,
      remarks: String(row[k18] || ''),
      reference: getCorrectedReference(row[k17] || '')
    });

    // Track violation dates
    const refStr = row[k17] || '';
    const extractedDate = extractDateFromReference(refStr);
    if (extractedDate) {
      violationsByDate.set(extractedDate, (violationsByDate.get(extractedDate) || 0) + 1);
    }
  });

  const cadets = Array.from(cadetMap.values());

  const violationsOverTime = Array.from(violationsByDate.entries())
    .map(([date, count]) => ({ date, count }))
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
