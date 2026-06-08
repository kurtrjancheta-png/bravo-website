import { getSheetData } from '../../lib/googleSheets';
import DispositionDashboard from './DispositionDashboard';
import { getCadetImageUrl } from '../../lib/imageMatcher';

const SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export const revalidate = 30;

export default async function DispositionPage() {
  const [rosterRows, dispositionRows, rawAttachmentRows] = await Promise.all([
    getSheetData(SHEET_ID, 'ROSTER'),
    getSheetData(SHEET_ID, 'DISPOSITION'),
    getSheetData(SHEET_ID, 'ATTACHMENT')
  ]);

  // Parse unstructured ATTACHMENT data into mapped profiles
  let currentDisposition = null;
  const parsedAttachments = [];

  rawAttachmentRows.forEach(row => {
    const vals = Object.values(row).map(v => typeof v === 'string' ? v.trim() : String(v || ''));
    
    // Check if the row looks like a category header (e.g. "FAD (3)", "RESTRICTED")
    if (vals[0] && vals[0] !== 'ATTACHMENT' && !vals[0].includes('AS OF') && vals[0] !== 'NO.' && parseInt(vals[0]).toString() !== vals[0]) {
      if (vals[1] === '' || vals[1] === 'null' || !vals[1] || vals[1] === 'undefined') {
        currentDisposition = vals[0].replace(/\s*\(\d+\)$/, '').trim();
      }
    }

    const cadetClass = vals[1];
    const name = vals[2];
    const pltn = vals[3];
    const reason = vals[5];
    const dateStarted = vals[8];
    const dateEnd = vals[11];

    if (name && cadetClass && cadetClass.includes('CL') && name !== 'NAME') {
      parsedAttachments.push({
        disposition: currentDisposition,
        class: cadetClass,
        name: name,
        pltn: pltn,
        reason: reason,
        dateStarted: dateStarted,
        dateEnd: dateEnd,
        picture: getCadetImageUrl(name, '', name) || ''
      });
    }
  });

  const class1 = [];
  const class2 = [];
  const class3 = [];

  rosterRows.forEach((row, i) => {
    const values = Object.values(row);
    if (!values[1]) return; // Skip empty rows

    const cadetClass = (typeof values[1] === 'string' ? values[1] : '').trim().toUpperCase();
    const name = (typeof values[8] === 'string' ? values[8] : '').trim(); // FULL NAME or similar

    const cadet = {
      no: values[0] || i + 1,
      class: cadetClass,
      firstName: values[2] || '',
      middleName: values[3] || '',
      lastName: values[4] || '',
      serialNo: values[5] || '',
      gender: values[6] || '',
      coy: values[7] || '',
      bos: values[8] || '', // Branch of Service
      fullName: values[9] || name,
      picture: getCadetImageUrl(values[4] || '', values[2] || '', values[9] || name) || ''
    };

    if (i >= 0 && i <= 29) {
      class1.push(cadet);
    } else if (i >= 30 && i <= 66) {
      class2.push(cadet);
    } else if (i >= 67 && i <= 104) {
      class3.push(cadet);
    }
  });

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">TROOP DISPOSITION</h1>
        <div className="section-subtitle">Real-Time Morning Report and Attachments</div>
      </div>

      {/* Disposition Dashboard */}
      <DispositionDashboard dispositionData={dispositionRows} attachmentData={parsedAttachments} rosterData={[...class1, ...class2, ...class3]} />
    </div>
  );
}
