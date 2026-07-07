import { getSheetData, parseDateValue } from '../../lib/googleSheets';
import RosterClient from './RosterClient';
import { getCadetImageUrl } from '../../lib/imageMatcher';

const SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export const revalidate = 30;

function calculateAge(birthdateStr) {
  if (!birthdateStr) return '';
  const s = String(birthdateStr).trim();
  let birthdate = null;
  
  if (s.includes('Date(')) {
    const match = s.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      // Month parameter in Google Sheets/JSON is 0-based
      birthdate = new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
    }
  } else {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      birthdate = parsed;
    }
  }

  if (!birthdate) return '';

  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

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

  // Merge Roster with SOI
  const allCadets = [];
  rosterRows.forEach((row, i) => {
    const values = Object.values(row);
    if (!values[1]) return; // Skip empty rows

    const cadetClass = (typeof values[1] === 'string' ? values[1] : '').trim().toUpperCase();
    const name = (typeof values[8] === 'string' ? values[8] : '').trim(); // FULL NAME or similar

    const rosterCadet = {
      no: values[0] || i + 1,
      class: cadetClass,
      firstName: (values[2] || '').trim(),
      middleName: (values[3] || '').trim(),
      lastName: (values[4] || '').trim(),
      serialNo: (values[5] || '').trim(),
      gender: (values[6] || '').trim(),
      coy: (values[7] || '').trim(),
      bos: (values[8] || '').trim(),
      fullName: (values[9] || name).trim(),
      picture: getCadetImageUrl(values[4] || '', values[2] || '', values[9] || name) || ''
    };

    // Find matching SOI row
    const matchingSoi = soiRows.find(soiRow => {
      const soiSerial = String(soiRow['SERIAL NR'] || soiRow['SERIAL NUMBER'] || '').trim();
      if (soiSerial && rosterCadet.serialNo && soiSerial.toLowerCase() === rosterCadet.serialNo.toLowerCase()) {
        return true;
      }
      
      const soiSurname = String(soiRow['SURNAME'] || soiRow['LAST NAME'] || '').trim().toLowerCase();
      const soiFirst = String(soiRow['FIRST NAME'] || '').trim().toLowerCase();
      if (soiSurname && rosterCadet.lastName && soiSurname === rosterCadet.lastName.toLowerCase() &&
          soiFirst && rosterCadet.firstName && soiFirst === rosterCadet.firstName.toLowerCase()) {
        return true;
      }
      return false;
    });

    const merged = { ...rosterCadet };
    if (matchingSoi) {
      // Copy all keys from SOI
      Object.keys(matchingSoi).forEach(key => {
        if (!(key in merged)) {
          merged[key] = matchingSoi[key];
        }
      });
      merged['AGE'] = calculateAge(matchingSoi['BIRTHDATE']);
      merged.soiMatched = true;
    } else {
      merged.soiMatched = false;
      merged['AGE'] = '';
    }

    allCadets.push(merged);
  });

  // Group by class for the default view
  const class1 = allCadets.filter(c => c.class === '1CL');
  const class2 = allCadets.filter(c => c.class === '2CL');
  const class3 = allCadets.filter(c => c.class === '3CL');

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">COMPANY ROSTER</h1>
        <div className="section-subtitle">Bravo Company Personnel Directory</div>
      </div>

      <RosterClient
        allCadets={allCadets}
        class1={class1}
        class2={class2}
        class3={class3}
        soiRows={soiRows}
      />
    </div>
  );
}
