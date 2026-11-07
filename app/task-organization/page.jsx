import { getSheetData, getSheetCsvData } from '../../lib/googleSheets';
import OrgChart from './OrgChart';
import { getCadetImageUrl } from '../../lib/imageMatcher';
import taskOrgFallback from '../../lib/taskOrgFallback.json';

const TASK_ORG_SHEET_ID = process.env.TASK_ORG_SHEET_ID || process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
// User specified gid=582148706 and tab names " TASK ORGANIZATION" / "TASK ORG"
const TASK_ORG_GID = process.env.TASK_ORG_GID || '582148706';
const SHEET_NAME = process.env.TASK_ORG_SHEET_NAME || ' TASK ORGANIZATION';

// Force Next.js to revalidate this page every 30 seconds
export const revalidate = 30;

export default async function TaskOrganization() {
  let allRows = [];

  // 1. Primary Strategy: Fetch by GID 582148706 via Google Visualization API
  try {
    allRows = await getSheetData(TASK_ORG_SHEET_ID, null, TASK_ORG_GID);
  } catch (err) {
    console.error('Error fetching Task Org by GID via GViz:', err);
  }

  // 2. Secondary Strategy: Fetch by GID 582148706 via CSV Export
  if (!allRows || allRows.length === 0) {
    try {
      allRows = await getSheetCsvData(TASK_ORG_SHEET_ID, TASK_ORG_GID);
    } catch (err) {
      console.error('Error fetching Task Org by GID via CSV:', err);
    }
  }

  // 3. Tertiary Strategy: Search by tab names including " TASK ORGANIZATION", "TASK ORG", etc.
  if (!allRows || allRows.length === 0) {
    const candidateTabNames = [
      SHEET_NAME,
      ' TASK ORGANIZATION', // Tab name with leading space
      'TASK ORG',
      'TASK ORGANIZATION',
      'Task Organization',
      'Task Org',
      'TASK_ORGANIZATION'
    ];
    const uniqueCandidates = [...new Set(candidateTabNames)];
    for (const name of uniqueCandidates) {
      try {
        const res = await getSheetData(TASK_ORG_SHEET_ID, name);
        if (res && res.length > 0) {
          allRows = res;
          break;
        }
      } catch (e) {
        // Continue to next candidate
      }
    }
  }

  // 4. Quaternary Strategy: Use verified fallback data if live Google Sheet is unreachable
  if (!allRows || allRows.length === 0) {
    allRows = taskOrgFallback;
  }

  let cmdr = null;
  let firstSgt = null;
  let exo = null;
  const tacticalOfficer = {
    designation: 'Bravo Company Tactical Officer',
    name: 'LCDR JETHRO C. OLAVIDEZ PN',
    picture: '/olavidez.png',
    navTarget: 'nav-taco',
    isTacticalOfficer: true
  };
  const sStaff = [];
  const specialStaff = [];
  const platoonLeaders = [];
  const battalionStaff = [];
  const regimentStaff = [];

  // Map designation keywords to sidebar nav IDs
  function getNavTarget(desLower) {
    if (desLower.includes('tactical officer')) return 'nav-taco';
    if (desLower.includes('company commander')) return 'nav-co';
    if (desLower.includes('executive officer')) return 'nav-exo';
    if (desLower.includes('first sergeant')) return 'nav-fsgt';
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
    'athletic officer',
    'athletic',
  ];

  for (const row of allRows) {
    // Intelligent column extraction: first check named properties, then fallback to key scanning & row values
    let designationStr = (
      row['DESIGNATION'] ||
      row['Designation'] ||
      row['POSITION'] ||
      row['Position'] ||
      row['ROLE'] ||
      row['Role'] ||
      row['DUTY'] ||
      row['Duty'] ||
      ''
    ).toString().trim();

    let nameStr = (
      row['NAME'] ||
      row['Name'] ||
      row['FULL NAME'] ||
      row['Full Name'] ||
      row['CADET'] ||
      row['Cadet'] ||
      ''
    ).toString().trim();

    if (!designationStr || !nameStr) {
      const keys = Object.keys(row).filter((k) => k !== '_sheetRowIndex');
      const desKey = keys.find((k) => /desig|pos|role|duty/i.test(k));
      const nameKey = keys.find((k) => /name|cadet/i.test(k));
      if (desKey && row[desKey]) designationStr = String(row[desKey]).trim();
      if (nameKey && row[nameKey]) nameStr = String(row[nameKey]).trim();
    }

    if (!designationStr || !nameStr) {
      const values = Object.entries(row)
        .filter(([k]) => k !== '_sheetRowIndex')
        .map(([, v]) => (typeof v === 'string' ? v.trim() : String(v || '').trim()))
        .filter(Boolean);

      if (values.length >= 2) {
        if (/cdt|1cl|2cl|3cl|4cl|c-\d/i.test(values[1])) {
          designationStr = values[0];
          nameStr = values[1];
        } else if (/cdt|1cl|2cl|3cl|4cl|c-\d/i.test(values[0])) {
          nameStr = values[0];
          designationStr = values[1];
        } else {
          designationStr = values[0];
          nameStr = values[1];
        }
      }
    }

    // Clean up whitespace & non-breaking spaces
    designationStr = designationStr.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    nameStr = nameStr.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const desLower = designationStr.toLowerCase();
    const nameLower = nameStr.toLowerCase();

    // Skip empty rows and column header echoes
    if (!desLower || !nameStr || desLower === 'designation' || desLower.includes('bravo company task')) continue;

    const isRegiment = desLower.includes('regiment') || desLower.includes('regimental');
    const isBattalion = desLower.includes('battalion');

    // Extract class level (1CL, 2CL, etc.) for high-fidelity cadet portrait matching
    const classMatch = nameStr.match(/\b([1-4]CL)\b/i);
    const cadetClass = classMatch ? classMatch[1].toUpperCase() : '';
    const pictureUrl = getCadetImageUrl(null, null, nameStr, cadetClass) || '';

    // --- FILTER: Skip Sergeants and Corporals from the officer chart (except First Sergeant) ---
    const isEnlistedRank =
      nameLower.includes('cdt sgt') ||
      nameLower.includes('cdt s/sgt') ||
      nameLower.includes('cdt cpl') ||
      nameLower.includes('cdt pvt');

    if (isEnlistedRank) {
      // First Sergeant is specifically included in Bravo Company command tier
      if (
        (desLower === 'first sergeant' || desLower.includes('first sergeant') || desLower.includes('1st sergeant')) &&
        !isRegiment &&
        !isBattalion
      ) {
        firstSgt = {
          designation: designationStr,
          name: nameStr,
          navTarget: 'nav-fsgt',
          picture: pictureUrl,
        };
      }
      continue;
    }

    const person = {
      designation: designationStr,
      name: nameStr,
      navTarget: getNavTarget(desLower),
      picture: pictureUrl,
    };

    if (isRegiment) {
      if (!regimentStaff.some((p) => p.name === person.name)) {
        regimentStaff.push(person);
      }
    } else if (isBattalion) {
      if (!battalionStaff.some((p) => p.name === person.name)) {
        battalionStaff.push(person);
      }
    } else if (
      desLower.includes('company commander') ||
      (desLower.includes('commander') && !desLower.includes('platoon'))
    ) {
      if (!cmdr) cmdr = person;
    } else if (
      (desLower.includes('executive officer') || desLower.includes('exo') || desLower.includes('ex-o')) &&
      !isBattalion &&
      !isRegiment &&
      !desLower.includes('sergeant') &&
      !desLower.includes('corporal')
    ) {
      if (!exo) exo = person;
    } else if (
      desLower.match(/\(s[1-9]0?\)/) ||
      desLower.match(/\b(s[1-9]|s10)\b/i) ||
      desLower.includes('personnel officer') ||
      desLower.includes('intelligence officer') ||
      desLower.includes('operations officer') ||
      desLower.includes('logistic officer') ||
      desLower.includes('plans and programs') ||
      desLower.includes('communications') ||
      desLower.includes('civil military') ||
      desLower.includes('education and training') ||
      desLower.includes('finance officer')
    ) {
      if (!sStaff.some((p) => p.designation === person.designation)) {
        sStaff.push(person);
      }
    } else if (
      (desLower.includes('platoon leader') || desLower.includes('platoon commander')) &&
      !desLower.includes('sergeant') &&
      !desLower.includes('corporal') &&
      !desLower.includes('guide')
    ) {
      if (!platoonLeaders.some((p) => p.name === person.name)) {
        platoonLeaders.push(person);
      }
    } else {
      const isSpecial = allowedSpecialStaff.some((s) => desLower.includes(s));
      if (isSpecial) {
        if (!specialStaff.some((p) => p.name === person.name && p.designation === person.designation)) {
          specialStaff.push(person);
        }
      }
    }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '3rem' }}>
        <h1 className="section-title">TASK ORGANIZATION</h1>
        <div className="section-subtitle">Bravo Company Hierarchy & Staffs</div>
      </div>

      <OrgChart
        tacticalOfficer={tacticalOfficer}
        cmdr={cmdr}
        firstSgt={firstSgt}
        exo={exo}
        sStaff={sStaff}
        specialStaff={specialStaff}
        platoonLeaders={platoonLeaders}
        battalionStaff={battalionStaff}
        regimentStaff={regimentStaff}
      />
    </div>
  );
}
