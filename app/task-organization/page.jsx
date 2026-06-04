import { getSheetData, driveUrlToImage } from '../../lib/googleSheets';
import OrgChart from './OrgChart';

const TASK_ORG_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const SHEET_NAME = process.env.TASK_ORG_SHEET_NAME || 'TASK ORGANIZATION';

// Force Next.js to revalidate this page every 30 seconds
export const revalidate = 30;

export default async function TaskOrganization() {
  const allRows = await getSheetData(TASK_ORG_SHEET_ID, SHEET_NAME);

  let cmdr = null;
  let firstSgt = null;
  let exo = null;
  const sStaff = [];
  const specialStaff = [];
  const platoonLeaders = [];

  // Map designation keywords to sidebar nav IDs
  // IMPORTANT: Check the most specific matches FIRST to avoid false positives
  // e.g. "Civil Military Operations Officer" must NOT match "Operations Officer" (S3)
  function getNavTarget(desLower) {
    if (desLower.includes('(s1)') || desLower.includes('personnel officer')) return 'nav-s1';
    if (desLower.includes('(s2)') || desLower.includes('intelligence officer')) return 'nav-s2';
    if (desLower.includes('(s7)') || desLower.includes('civil military')) return 'nav-s7';
    if (desLower.includes('(s3)') || (desLower.includes('operations officer') && !desLower.includes('civil'))) return 'nav-s3';
    if (desLower.includes('(s4)') || desLower.includes('logistic officer')) return 'nav-s4';
    if (desLower.includes('(s5)') || desLower.includes('plans and programs')) return 'nav-s5';
    if (desLower.includes('(s6)') || desLower.includes('communications')) return 'nav-s6';
    if (desLower.includes('(s8)') || desLower.includes('education and training')) return 'nav-s8';
    if (desLower.includes('(s10)') || desLower.includes('finance officer')) return 'nav-s10';
    if (desLower.includes('athletic')) return 'nav-athletic';
    if (desLower.includes('academic')) return 'nav-academic';
    return null;
  }

  const allowedSpecialStaff = [
    'values, ethics, and standards officer',
    'academic officer',
    'honor committee representative',
    'mess officer',
    'ccpb representative',
    'safety officer',
    'military training officer',
    'responsible supply officer',
    'gender awareness and development',
    'spiritual development',
  ];

  // Only accept these specific platoon leader designations
  const allowedPlatoonLeaders = [
    '1st platoon leader',
    '2nd platoon leader',
    '3rd platoon leader',
    '4th platoon leader',
  ];

  for (const row of allRows) {
    const values = Object.values(row);
    const designationStr = (typeof values[0] === 'string' ? values[0] : '').trim();
    const nameStr = (typeof values[1] === 'string' ? values[1] : '').trim();
    const pictureKey = Object.keys(row).find(k => k.toLowerCase().includes('picture'));
    const rawPictureUrl = pictureKey ? (typeof row[pictureKey] === 'string' ? row[pictureKey].trim() : '') : '';
    const pictureUrl = driveUrlToImage(rawPictureUrl);
    const desLower = designationStr.toLowerCase();

    if (!desLower || !nameStr) continue;

    // --- FILTER: Skip Sergeants and Corporals ---
    const nameLower = nameStr.toLowerCase();
    if (
      nameLower.includes('cdt sgt') ||
      nameLower.includes('cdt s/sgt') ||
      nameLower.includes('cdt cpl') ||
      nameLower.includes('cdt pvt')
    ) {
      // Exception: First Sergeant is specifically requested
      if (desLower === 'first sergeant') {
        firstSgt = { designation: designationStr, name: nameStr, navTarget: null, picture: pictureUrl };
      }
      continue;
    }

    const person = {
      designation: designationStr,
      name: nameStr,
      navTarget: getNavTarget(desLower),
      picture: pictureUrl,
    };

    if (desLower.includes('company commander')) {
      cmdr = person;
    } else if (desLower.includes('company executive officer')) {
      exo = person;
    } else if (desLower.match(/\(s[1-9]0?\)/)) {
      sStaff.push(person);
    } else if (allowedPlatoonLeaders.includes(desLower)) {
      // Only match exact "1st Platoon Leader", "2nd Platoon Leader", etc.
      platoonLeaders.push(person);
    } else {
      const isSpecial = allowedSpecialStaff.some((s) => desLower.includes(s));
      if (isSpecial) {
        specialStaff.push(person);
      }
    }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '3rem' }}>
        <h1 className="section-title">TASK ORGANIZATION</h1>
        <div className="section-subtitle">Bravo Company Hierarchy</div>
      </div>

      <OrgChart
        cmdr={cmdr}
        firstSgt={firstSgt}
        exo={exo}
        sStaff={sStaff}
        specialStaff={specialStaff}
        platoonLeaders={platoonLeaders}
      />
    </div>
  );
}
