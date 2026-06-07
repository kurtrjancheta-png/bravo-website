import { getSheetData } from '../../lib/googleSheets';
import ExoPunishmentClient from './ExoPunishmentClient';

export const revalidate = 30; // seconds

export default async function ExoPunishmentPage() {
  const data = await getSheetData('1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk', 'CHARACTER');

  // Extract "UPDATED AS OF" date
  let updatedAsOf = 'Unknown';
  const updatedRow = data.find(row => String(row['Column 1']).toUpperCase().includes('UPDATED AS OF'));
  if (updatedRow) {
    updatedAsOf = String(updatedRow['Column 5'] || '').trim();
  }

  // Filter valid rows: Column 1 (NO) must be a number > 0, Column 3 must exist
  const validRows = data.filter(row => {
    const no = parseInt(row['Column 1']);
    return !isNaN(no) && no > 0 && row['Column 3'] && String(row['Column 3']).trim() !== '';
  });

  // Group by cadet (LAST NAME)
  const cadetMap = new Map();

  validRows.forEach(row => {
    const name = String(row['Column 3']).trim();
    const rank = String(row['Column 2']).trim();
    const isConfined = String(row['Column 8'] || '').toLowerCase() === 'yes';
    
    if (!cadetMap.has(name)) {
      cadetMap.set(name, {
        name,
        rank,
        totalDemerits: 0,
        totalTour: 0,
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
    cadet.totalDemerits += Number(row['Column 7']) || 0;
    cadet.totalTour += Number(row['Column 11']) || 0;
    cadet.totalTourServed += Number(row['Column 12']) || 0;
    cadet.totalTourRemaining += Number(row['Column 13']) || 0;

    // Update confinement (take the latest/longest if multiple, for now just assign if exists)
    if (isConfined) {
      cadet.isConfined = true;
      const start = String(row['Column 9'] || '');
      const end = String(row['Column 10'] || '');
      if (start && end) {
        cadet.confinementStart = start;
        cadet.confinementEnd = end;
      }
    }

    // Add offense details
    cadet.offenses.push({
      description: String(row['Column 4'] || ''),
      classOfOffense: String(row['Column 5'] || ''),
      natureOfOffense: String(row['Column 6'] || ''),
      remarks: String(row['Column 16'] || '')
    });
  });

  const cadets = Array.from(cadetMap.values());

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1>EXO Punishment List</h1>
        <p>Monitoring Dashboard for Cadet Punishments</p>
        {updatedAsOf !== 'Unknown' && (
          <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            UPDATED AS OF: {updatedAsOf}
          </div>
        )}
      </header>

      <ExoPunishmentClient initialCadets={cadets} />
    </div>
  );
}
