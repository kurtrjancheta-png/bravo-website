import { getSheetData } from '../../lib/googleSheets';
import CellphoneRackClient from './CellphoneRackClient';
import { getCadetImageUrl } from '../../lib/imageMatcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CELLPHONE_SHEET_ID = '13xZEcuuedRTppVj479aYhUqpgbvqOq3VMMvBJn_IH5Q';

export default async function CellphoneRackPage() {
  let sheet1Data = [];
  let cl2Data = [];
  let cl3Data = [];
  let cl4Data = [];

  try {
    const [d1, d2, d3, d4] = await Promise.all([
      getSheetData(CELLPHONE_SHEET_ID, 'Sheet1').catch(() => []),
      getSheetData(CELLPHONE_SHEET_ID, '2CL').catch(() => []),
      getSheetData(CELLPHONE_SHEET_ID, '3CL').catch(() => []),
      getSheetData(CELLPHONE_SHEET_ID, '4CL').catch(() => [])
    ]);
    sheet1Data = d1 || [];
    cl2Data = d2 || [];
    cl3Data = d3 || [];
    
    // Google Sheets API returns Sheet1 if 4CL doesn't exist. Check for duplicates.
    const isD4Duplicate = d4 && d4.length > 0 && d1 && d1.length > 0 && JSON.stringify(d4[0]) === JSON.stringify(d1[0]);
    cl4Data = isD4Duplicate ? [] : (d4 || []);
  } catch (err) {
    console.error('Failed to fetch cellphone sheets:', err);
  }

  const parsedData = [];
  let dbData = [];

  try {
    const dbRes = await getSheetData(CELLPHONE_SHEET_ID, 'DATA BASE').catch(() => []);
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
    const kNumPhones = keys[3]; // 'Number of Phones'
    const kPhone = keys[4];
    const kIG = keys[5];

    dataArray.forEach(row => {
      const name = String(row[kName] || '').trim();
      if (!name || name === '') return;
      
      const picture = getCadetImageUrl(name, '', name);

      // Find db entry
      // Assuming 'DATA BASE' has columns like 'NAME', 'MODEL', 'COLOR'
      let model = 'Not Specified';
      let color = 'Not Specified';
      if (dbData && dbData.length > 0) {
        // We'll guess the keys for name, model, color from dbData later.
        // For now, let's just pass the raw dbData down to see what it is, or look for matching name.
        const dbRow = dbData.find(r => {
          const nKey = Object.keys(r).find(k => k.toUpperCase().includes('NAME'));
          return r[nKey] && String(r[nKey]).toUpperCase().includes(name.toUpperCase());
        });
        if (dbRow) {
          const modelKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('MODEL'));
          const colorKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('COLOR'));
          if (modelKey) model = String(dbRow[modelKey]);
          if (colorKey) color = String(dbRow[colorKey]);
        }
      }

      parsedData.push({
        name,
        status: String(row[kStatus] || '').trim(),
        remarks: String(row[kRemarks] || '').trim(),
        cadetClass: assignedClass,
        numPhones: parseInt(row[kNumPhones] || '0', 10),
        phone: String(row[kPhone] || '').trim(),
        ig: String(row[kIG] || '').trim(),
        model,
        color,
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
        <h2 className="section-title">SMARTPHONE RACK</h2>
        <div className="section-subtitle">Real-time device tracking and authorization log</div>
      </div>
      
      {parsedData.length > 0 ? (
        <CellphoneRackClient initialData={parsedData} />
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>No Data Available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Check the Google Sheet configuration or data format.</p>
        </div>
      )}
    </div>
  );
}
