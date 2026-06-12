import { getSheetData } from '../../lib/googleSheets';
import TabletDirectoryClient from './TabletDirectoryClient';
import { getCadetImageUrl } from '../../lib/imageMatcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TABLET_SHEET_ID = '1LbsJwJ7nMyh9SOb-SX0MOHwmLq85UVz4BaPxtHPesqA';

export default async function TabletDirectoryPage() {
  let sheet1Data = [];
  let cl2Data = [];
  let cl3Data = [];
  let cl4Data = [];

  try {
    const [d1, d2, d3, d4] = await Promise.all([
      getSheetData(TABLET_SHEET_ID, 'Sheet1').catch(() => []),
      getSheetData(TABLET_SHEET_ID, '2CL').catch(() => []),
      getSheetData(TABLET_SHEET_ID, '3CL').catch(() => []),
      getSheetData(TABLET_SHEET_ID, '4CL').catch(() => [])
    ]);
    sheet1Data = d1 || [];
    cl2Data = d2 || [];
    cl3Data = d3 || [];
    
    // Google Sheets API returns Sheet1 if 4CL doesn't exist. Check for duplicates.
    const isD4Duplicate = d4 && d4.length > 0 && d1 && d1.length > 0 && JSON.stringify(d4[0]) === JSON.stringify(d1[0]);
    cl4Data = isD4Duplicate ? [] : (d4 || []);
  } catch (err) {
    console.error('Failed to fetch tablet sheets:', err);
  }

  const parsedData = [];
  let dbData = [];

  try {
    const dbRes = await getSheetData(TABLET_SHEET_ID, 'DATA BASE').catch(() => []);
    dbData = dbRes || [];
  } catch (err) {
    console.error('Failed to fetch DATA BASE:', err);
  }

  const parseSheet = (dataArray, assignedClass) => {
    if (!dataArray || dataArray.length === 0) return;
    const keys = Object.keys(dataArray[0]);
    const kName = keys[0];
    const kStatus = keys[1];
    const kRemarks = keys[2];
    const kDateStarted = keys.find(k => k.toUpperCase().includes('STARTED')) || keys[4];
    const kAuthUntil = keys.find(k => k.toUpperCase().includes('UNTIL')) || keys[5];

    dataArray.forEach(row => {
      const name = String(row[kName] || '').trim();
      if (!name || name === '') return;
      
      const picture = getCadetImageUrl(name, '', name);

      // Find db entry
      // Assuming 'DATA BASE' has columns like 'NAME', 'MODEL', 'COLOR'
      let model = 'Not Specified';
      let color = 'Not Specified';
      let dbRemarks = 'None';
      if (dbData && dbData.length > 0) {
        const dbRow = dbData.find(r => {
          return Object.values(r).some(val => 
            val && typeof val === 'string' && val.toUpperCase().includes(name.toUpperCase())
          );
        });
        if (dbRow) {
          const modelKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('TABLET') || k.toUpperCase().includes('MODEL'));
          const colorKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('COLOR'));
          const dbRemarksKey = Object.keys(dbRow).find(k => k.toUpperCase() === 'REMARKS');
          if (modelKey && dbRow[modelKey]) model = String(dbRow[modelKey]);
          if (colorKey && dbRow[colorKey]) color = String(dbRow[colorKey]);
          if (dbRemarksKey && dbRow[dbRemarksKey]) dbRemarks = String(dbRow[dbRemarksKey]);
        }
      }

      parsedData.push({
        name,
        remarks: String(row[kRemarks] || '').trim(),
        cadetClass: assignedClass,
        dateStarted: String(row[kDateStarted] || '').trim(),
        authorizedUntil: String(row[kAuthUntil] || '').trim(),
        model,
        color,
        dbRemarks,
        picture
      });
    });
  };

  parseSheet(sheet1Data, '1');
  parseSheet(cl2Data, '2');
  parseSheet(cl3Data, '3');
  parseSheet(cl4Data, '4');

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">TABLET DIRECTORY</h2>
        <div className="section-subtitle">Real-time device tracking and authorization log</div>
      </div>
      
      {parsedData.length > 0 ? (
        <TabletDirectoryClient initialData={parsedData} />
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>No Data Available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Check the Google Sheet configuration or data format.</p>
        </div>
      )}
    </div>
  );
}
