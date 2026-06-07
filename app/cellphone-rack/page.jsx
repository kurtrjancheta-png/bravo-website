import { getSheetData } from '../../lib/googleSheets';
import CellphoneRackClient from './CellphoneRackClient';
import Link from 'next/link';

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
      
      parsedData.push({
        name,
        status: String(row[kStatus] || '').trim(),
        remarks: String(row[kRemarks] || '').trim(),
        cadetClass: assignedClass,
        numPhones: parseInt(row[kNumPhones] || '0', 10),
        phone: String(row[kPhone] || '').trim(),
        ig: String(row[kIG] || '').trim()
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
