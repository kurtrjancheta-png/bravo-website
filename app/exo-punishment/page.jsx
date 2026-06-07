import { getSheetData } from '../../lib/googleSheets';
import ExoPunishmentClient from './ExoPunishmentClient';

export const revalidate = 30; // seconds

export default async function ExoPunishmentPage() {
  // Use the correct sheet ID and sheet name
  const data = await getSheetData('1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk', 'CHARACTER');

  // Find all rows that represent a cadet (they have a RANK in Column 2 and LAST NAME in Column 3)
  const cadets = data
    .filter(row => row['Column 2'] && row['Column 3'] && row['Column 4'] && String(row['Column 2']).trim() !== 'RANK')
    .map(row => {
      return {
        rank: String(row['Column 2'] || ''),
        name: String(row['Column 3'] || ''),
        offense: String(row['Column 4'] || ''),
        classOfOffense: String(row['Column 5'] || ''),
        natureOfOffense: String(row['Column 6'] || ''),
        demerits: Number(row['Column 7']) || 0,
        isConfined: String(row['Column 8'] || '').toLowerCase() === 'yes',
        confinementStart: String(row['Column 9'] || ''),
        confinementEnd: String(row['Column 10'] || ''),
        tourTotal: Number(row['Column 11']) || 0,
        tourServed: Number(row['Column 12']) || 0,
        tourRemaining: Number(row['Column 13']) || 0,
        remarks: String(row['Column 16'] || ''),
      };
    });

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>EXO Punishment List</h1>
        <p>Monitoring Dashboard for Cadet Punishments</p>
      </header>

      <ExoPunishmentClient initialCadets={cadets} />
    </div>
  );
}
