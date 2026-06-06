import { getSheetData } from '../../lib/googleSheets';
import ExoPunishmentClient from './ExoPunishmentClient';

export const revalidate = 30; // seconds

export default async function ExoPunishmentPage() {
  const data = await getSheetData('1NuHPJjABd_kkDGCZYyxEucN_JE15_FQyXm18E1bfaBY', 'BRAVO');

  const cadets = data.map(row => {
    const vals = Object.values(row);
    // Looking for valid rows where the name is present
    if (!vals[2] || typeof vals[2] !== 'string' || vals[2].trim() === '') return null;
    
    // We expect the Class to be something like "1CL", "2CL", "3CL", "4CL"
    const cadetClass = String(vals[1]).trim();
    if (!cadetClass.endsWith('CL')) return null;

    const name = String(vals[2]).trim();
    const offense = String(vals[3] || '').trim();
    const classOfOffense = String(vals[4] || '').trim();
    const nature = String(vals[5] || '').trim();
    
    // Demerits is just a number in the BRAVO sheet
    const demeritsRaw = String(vals[6] || '').trim();
    const demerits = parseFloat(demeritsRaw) || 0;

    const isConfined = String(vals[7] || '').toLowerCase() === 'yes';
    const dateStarted = String(vals[8] || '').trim();
    const dateEnded = String(vals[9] || '').trim();
    
    // Touring tracking
    const totalTours = parseFloat(vals[10]) || 0;
    const convertedTours = parseFloat(vals[11]) || 0;
    const servedTours = parseFloat(vals[12]) || 0;
    const remainingTours = parseFloat(vals[13]) || 0;
    
    const reference = String(vals[14] || '').trim();
    const status = String(vals[15] || '').trim();

    return {
      class: cadetClass,
      name,
      offense,
      classOfOffense,
      nature,
      demerits,
      isConfined,
      dateStarted,
      dateEnded,
      totalTours,
      convertedTours,
      servedTours,
      remainingTours,
      reference,
      status
    };
  }).filter(Boolean);

  return <ExoPunishmentClient cadets={cadets} />;
}
