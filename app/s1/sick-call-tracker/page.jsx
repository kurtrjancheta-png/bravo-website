import { getSheetData } from '../../../lib/googleSheets';
import SickCallTrackerClient from './SickCallTrackerClient';

export const revalidate = 10; // revalidate often so it shows fresh data

const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const SICK_CALL_SHEET_ID = '1btCK6FhiAHTTbjEZAQZIm_f4l5-_Ik-3IKZm3f983es';
const SICK_CALL_SHEET_NAME = 'SICK CALL RECORD';

export default async function SickCallTrackerPage() {
  // 1. Fetch SOI Data for cross-referencing
  let soiData = [];
  try {
    soiData = await getSheetData(SOI_SHEET_ID, 'SOI');
  } catch (error) {
    console.error('Failed to fetch SOI Data for Sick Call:', error);
  }

  // 2. Fetch Sick Call Records
  let sickCallData = [];
  try {
    sickCallData = await getSheetData(SICK_CALL_SHEET_ID, SICK_CALL_SHEET_NAME);
  } catch (error) {
    console.error('Failed to fetch Sick Call records:', error);
  }

  // Add the original row index (1-based index including headers if needed)
  // getSheetData returns an array of objects. 
  // Let's assume row index starts at 2 (1 is header). But we will map it accurately.
  // Actually, getSheetData maps the rows to objects and skips the header.
  // So sickCallData[0] is row 2, sickCallData[1] is row 3, etc.
  const mappedSickCalls = sickCallData.map((row, index) => {
    return {
      ...row,
      sheetRowIndex: index + 2 // Google Sheets rows are 1-indexed, +1 for header
    };
  });

  // Filter out completed sick calls (where STATUS is filled)
  // Wait, the user said "status, start date, and end date" needs to be filled to not be displayed.
  // So if any of those 3 are empty, we display it.
  const activeSickCalls = mappedSickCalls.filter(call => {
    // If there's no CLASS or NAME, it might be an empty row in the sheet
    if (!call['NAME'] || !call['CLASS']) return false;
    
    const hasStatus = call['STATUS'] && String(call['STATUS']).trim() !== '';
    const hasStartDate = call['START DATE'] && String(call['START DATE']).trim() !== '';
    const hasEndDate = call['END DATE'] && String(call['END DATE']).trim() !== '';
    
    // It's active if it's missing at least one of these
    return !(hasStatus && hasStartDate && hasEndDate);
  });

  return (
    <div style={{ padding: '2rem 5%' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sick Call Tracker
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          S1 Personnel Module
        </p>
      </header>

      <SickCallTrackerClient 
        activeSickCalls={activeSickCalls} 
        soiData={soiData} 
      />
    </div>
  );
}
