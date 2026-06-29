import { getSheetData } from '../../lib/googleSheets';
import SOIGenerator from './SOIGenerator';
import { Suspense } from 'react';
import { getCadetImageUrl } from '../../lib/imageMatcher';

const SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export const revalidate = 30;

export default async function RosterPage() {
  const [rosterRows, rawSoiRows] = await Promise.all([
    getSheetData(SHEET_ID, 'ROSTER'),
    getSheetData(SHEET_ID, 'SOI')
  ]);

  const olavidezSOI = {
    'FIRST NAME': 'JETHRO',
    'MIDDLE NAME': 'CABABAT',
    'SURNAME': 'OLAVIDEZ',
    'SERIAL NR': 'O-16840',
    'CLASS': 'OFFICER',
    'COURSE BEFORE APPOINTMENT': 'BS GENERAL ENGINEERING',
    'HIGHEST EDUCATIONAL ATTAINMENT': 'MASTER IN PUBLIC ADMINISTRATION',
    'NAME OF COLLEGE': 'WESTERN MINDANAO STATE UNIV.',
    'GENDER': 'MALE',
    'BIRTHDATE': '07 June 1990',
    'AGE': '35',
    'HEIGHT': '169.00',
    'WEIGHT': '62.00',
    'BLOOD TYPE': 'O+',
    'HAIR': 'BLACK',
    'EYES': 'BLACK',
    'ADDRESS': 'AE-105, WESTERN BUYAGAN, LA TRINIDAD, BENGUET',
    'ETHNIC GROUP': 'BISAYA',
    'RELIGION': 'CHURCH OF CHRIST',
    'CP NO.': '09565977508',
    'NAME OF NEXT OF KIN': 'PAULINE CLAIRE C OLAVIDEZ',
    'RELATIONSHIP': 'DAUGHTER',
    'EMERGENCY DETAILS NAME': 'JAMEL C OLAVIDEZ (WIFE)',
    'COMPANY': 'BRAVO',
    'PICTURE': '/olavidez.png',
    'SUMMARY': `<strong>Length of Active Service:</strong> 17 Years, 10 Months<br/><strong>Source of Commission:</strong> Philippine Military Academy (Class of 2012)<br/><strong>Field of Specialization:</strong> Primary (Surface Warfare)<br/><br/><strong>CURRENT ASSIGNMENT:</strong><br/>Admin Officer, DNW, HTG (Headquarters Philippine Military Academy) - <em>Assigned Sept 2024</em><br/><br/><strong>PREVIOUS KEY ASSIGNMENTS:</strong><br/>• Deputy AC of S for WCEIS, NF6 (2024)<br/>• Deputy Director, Fleet Warfare School (2022 - 2023)<br/>• Anti-Submarine Warfare Officer, BRP Antonio Luna FF151 (2021 - 2022)<br/>• Damage Control Officer / Comm. Officer / Gunnery Officer (2014 - 2018)<br/><br/><strong>MILITARY SCHOOLING:</strong><br/>• Naval Command Staff Course CL 07 (Grade: 97.60 - Ranked 1/61)<br/>• Naval Command Course CL 07 (Grade: 97.60 - Ranked 1/61)<br/>• Naval Officer Basic Course CL 15 (Grade: 94.93 - Ranked 2/36)<br/>• Basic Surface Warfare Officers Course CL 07<br/><br/><strong>AWARDS & DECORATIONS:</strong><br/>• Meritorious Achievement Medal (Maiden Voyage of BRP Antonio Luna)<br/>• Bronze Cross Medal (Barrier & Negation Patrol, Sulu Sea)<br/>• 20+ Military Merit Medals<br/>• Combat (Kagitingan) Badge<br/>• PN Surface Warfare Officer's Badge`
  };

  const mappedSoiRows = rawSoiRows.map(row => {
    const surnameKey = Object.keys(row).find(k => k.toLowerCase().includes('surname'));
    const firstKey = Object.keys(row).find(k => k.toLowerCase().includes('first name'));
    
    const surname = surnameKey ? row[surnameKey] : '';
    const firstName = firstKey ? row[firstKey] : '';
    
    const matchedUrl = getCadetImageUrl(surname, firstName, null);
    
    if (matchedUrl) {
      const picKey = Object.keys(row).find(k => k.toLowerCase().includes('picture')) || 'PICTURE';
      return { ...row, [picKey]: matchedUrl };
    }
    
    return row;
  });

  const soiRows = [olavidezSOI, ...mappedSoiRows];

  // Parsing ATTACHMENT data removed, handled in disposition page

  // Group by class based on requested row indices.
  // The first data row (row 2 in sheet) is index 0 in the returned array.
  // 1CL: Rows 2-31 (Index 0-29)
  // 2CL: Rows 32-68 (Index 30-66)
  // 3CL: Rows 69-106 (Index 67-104)

  const class1 = [];
  const class2 = [];
  const class3 = [];

  rosterRows.forEach((row, i) => {
    // Basic extraction
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
        <h1 className="section-title">COMPANY ROSTER</h1>
        <div className="section-subtitle">Bravo Company Personnel Directory</div>
      </div>

      {/* SOI Generator at the top */}
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading SOI Generator...</div>}>
        <SOIGenerator soiData={soiRows} />
      </Suspense>

      {/* Roster Sections */}
      <div className="roster-sections hide-on-mobile" style={{ marginTop: '3rem' }}>
        <RosterSection title="1ST CLASS (1CL)" cadets={class1} color="var(--accent-gold)" />
        <RosterSection title="2ND CLASS (2CL)" cadets={class2} color="#1a7a3a" />
        <RosterSection title="3RD CLASS (3CL)" cadets={class3} color="#2d3748" />
      </div>
    </div>
  );
}

function RosterSection({ title, cadets, color }) {
  if (!cadets || cadets.length === 0) return null;

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h2 style={{ 
        borderBottom: `2px solid ${color}`, 
        paddingBottom: '0.5rem', 
        marginBottom: '1rem',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        textTransform: 'uppercase'
      }}>
        {title}
      </h2>
      <div className="table-container">
        <table className="mobile-card-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Serial No.</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>BOS</th>
            </tr>
          </thead>
          <tbody>
            {cadets.map((c, idx) => (
              <tr key={idx}>
                <td data-label="No." style={{ color: 'var(--text-secondary)' }}>{c.no}</td>
                <td data-label="Serial No." style={{ fontWeight: 600 }}>{c.serialNo}</td>
                <td data-label="Full Name" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {c.lastName}, {c.firstName} {c.middleName}
                </td>
                <td data-label="Gender">{c.gender}</td>
                <td data-label="BOS">{c.bos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
