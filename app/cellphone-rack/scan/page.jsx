import { getSheetData } from '../../../lib/googleSheets';
import ScanClient from './ScanClient';
import { getCadetImageUrl } from '../../../lib/imageMatcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CELLPHONE_SHEET_ID = '13xZEcuuedRTppVj479aYhUqpgbvqOq3VMMvBJn_IH5Q';

export default async function ScanLandingPage({ searchParams }) {
  const cadetName = searchParams.name || '';
  
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
    const kName = keys.find(k => k.toUpperCase().includes('NAME')) || keys[0];
    const kStatus = keys.find(k => k.toUpperCase().includes('STATUS')) || keys[1];
    const kRemarks = keys.find(k => k.toUpperCase().includes('REMARKS') || k.toUpperCase().includes('AUTHORIZ')) || keys[2];
    const kNumPhones = keys.find(k => k.toUpperCase().includes('PHONE') && (k.toUpperCase().includes('NUMBER') || k.toUpperCase().includes('COUNT'))) || keys[3];
    const kPhone = keys.find(k => k.toUpperCase().includes('CP') || k.toUpperCase().includes('PHONE') || k.toUpperCase().includes('CONTACT')) || keys[4];
    const kIG = keys.find(k => k.toUpperCase().includes('IG') || k.toUpperCase().includes('SIGNAL')) || keys[5];
    const kTelegram = keys.find(k => k.toUpperCase().includes('TELEGRAM'));

    dataArray.forEach(row => {
      const name = String(row[kName] || '').trim();
      if (!name || name === '') return;
      
      const picture = getCadetImageUrl(name, '', name);

      let model = 'Not Specified';
      let color = 'Not Specified';
      let dbRemarks = 'None';
      let serial = 'Not Specified';
      let qrCode = '';

      if (dbData && dbData.length > 0) {
        const dbRow = dbData.find(r => {
          return Object.values(r).some(val => 
            val && typeof val === 'string' && val.toUpperCase().includes(name.toUpperCase())
          );
        });
        if (dbRow) {
          const modelKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('PHONE') || k.toUpperCase().includes('MODEL'));
          const colorKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('COLOR'));
          const dbRemarksKey = Object.keys(dbRow).find(k => k.toUpperCase() === 'REMARKS');
          const serialKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('SERIAL') || k.toUpperCase().includes('S/N') || k.toUpperCase() === 'SN');
          const qrKey = Object.keys(dbRow).find(k => k.toUpperCase().includes('QR'));

          if (modelKey && dbRow[modelKey]) model = String(dbRow[modelKey]);
          if (colorKey && dbRow[colorKey]) color = String(dbRow[colorKey]);
          if (dbRemarksKey && dbRow[dbRemarksKey]) dbRemarks = String(dbRow[dbRemarksKey]);
          if (serialKey && dbRow[serialKey]) serial = String(dbRow[serialKey]);
          if (qrKey && dbRow[qrKey]) qrCode = String(dbRow[qrKey]);
        }
      }

      let status = String(row[kStatus] || '').trim();
      const numPhones = parseInt(row[kNumPhones] || '0', 10);
      
      if (!status && numPhones === 0) {
        status = 'No Smartphone';
      }

      parsedData.push({
        name,
        status,
        remarks: String(row[kRemarks] || '').trim(),
        cadetClass: assignedClass,
        numPhones,
        phone: String(row[kPhone] || '').trim(),
        ig: String(row[kIG] || '').trim(),
        telegram: kTelegram ? String(row[kTelegram] || '').trim() : '',
        model,
        color,
        dbRemarks,
        serial,
        qrCode,
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
        <h2 className="section-title">DEVICE AUTHENTICATION</h2>
        <div className="section-subtitle">Real-time smartphone validation node</div>
      </div>
      
      <ScanClient initialData={parsedData} targetName={cadetName} />
    </div>
  );
}
