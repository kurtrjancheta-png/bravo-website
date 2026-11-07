import { getSheetData, getSheetCsvData } from '../../lib/googleSheets';
import OrgChart from './OrgChart';
import { getCadetImageUrl } from '../../lib/imageMatcher';
import taskOrgFallback from '../../lib/taskOrgFallback.json';

const TASK_ORG_SHEET_ID = process.env.TASK_ORG_SHEET_ID || process.env.ROSTER_SHEET_ID || '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
// User specified gid=1245223884 for the latest task organization sheet
const TASK_ORG_GID = process.env.TASK_ORG_GID || '1245223884';

// Force Next.js to revalidate this page every 30 seconds
export const revalidate = 30;

function isValidTaskOrgData(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => {
    const text = Object.values(row).join(' ').toLowerCase();
    return (
      text.includes('commander') ||
      text.includes('executive officer') ||
      text.includes('first sergeant') ||
      text.includes('platoon leader') ||
      text.includes('(s1)') ||
      text.includes('(s2)') ||
      text.includes('(s3)') ||
      text.includes('(s4)') ||
      text.includes('personnel officer') ||
      text.includes('regimental') ||
      text.includes('battalion')
    );
  });
}

export default async function TaskOrganization() {
  let allRows = [];

  // Priority 1: Query by exact GID 1245223884 via GViz API (with headers=1)
  try {
    const res = await getSheetData(TASK_ORG_SHEET_ID, null, TASK_ORG_GID);
    if (isValidTaskOrgData(res)) {
      allRows = res;
    }
  } catch (err) {
    console.error('Error fetching Task Org by GID via GViz:', err);
  }

  // Priority 2: Query by CSV export using exact GID 1245223884
  if (!isValidTaskOrgData(allRows)) {
    try {
      const res = await getSheetCsvData(TASK_ORG_SHEET_ID, TASK_ORG_GID);
      if (isValidTaskOrgData(res)) {
        allRows = res;
      }
    } catch (err) {
      console.error('Error fetching Task Org by CSV export:', err);
    }
  }

  // Priority 3: Search candidate tab names
  if (!isValidTaskOrgData(allRows)) {
    const candidateTabNames = [
      ' TASK ORGANIZATION',
      'TASK ORG',
      'TASK ORGANIZATION',
      'Task Organization',
      'Task Org',
      'TASK_ORGANIZATION'
    ];
    for (const tab of candidateTabNames) {
      try {
        const res = await getSheetData(TASK_ORG_SHEET_ID, tab);
        if (isValidTaskOrgData(res)) {
          allRows = res;
          break;
        }
      } catch (e) {
        // Continue to next candidate
      }
    }
  }

  // Priority 4: Fallback dataset with verified gid=1245223884 data
  if (!isValidTaskOrgData(allRows)) {
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
    'values, ethics, and standards',
    'academic officer',
    'academic',
    'honor committee representative',
    'honor committee',
    'mess officer',
    'mess',
    'ccpb representative',
    'ccpb',
    'safety officer',
    'safety',
    'military training officer',
    'military training',
    'responsible supply officer',
    'responsible supply',
    'gender awareness and development',
    'spiritual development',
    'athletic officer',
    'athletic',
    'cadet acquisition officer',
    'cadet acquisition',
  ];

  let currentDesignation = '';

  for (const row of allRows) {
    // Intelligent column extraction
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
      } else if (values.length === 1 && /cdt|1cl|2cl|3cl|4cl|c-\d/i.test(values[0])) {
        nameStr = values[0];
      }
    }

    // Clean whitespace & non-breaking spaces
    designationStr = designationStr.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    nameStr = nameStr.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

    // Carry over previous designation for multi-person roles (e.g. CCPB & Honor Committee reps)
    if (designationStr) {
      currentDesignation = designationStr;
    } else if (nameStr && currentDesignation) {
      designationStr = currentDesignation;
    }

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

    // --- FILTER: Skip underclassmen (2CL, 3CL, 4CL) from the officer hierarchy, except First Sergeant ---
    const isEnlisted = anyMatch(nameLower, ['cdt sgt', 'cdt s/sgt', 'cdt cpl', 'cdt pvt', '2cl', '3cl', '4cl']);

    if (isEnlisted) {
      // First Sergeant is specifically included in Bravo Company command tier
      if (
        (desLower === 'first sergeant' || desLower.includes('first sergeant') || desLower.includes('1st sergeant')) &&
        !isRegiment &&
        !isBattalion
      ) {
        if (!firstSgt) {
          firstSgt = {
            designation: designationStr,
            name: nameStr,
            navTarget: 'nav-fsgt',
            picture: pictureUrl,
          };
        }
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
    } else if (desLower.includes('platoon leader') || desLower.includes('platoon commander')) {
      if (anyMatch(desLower, ['1st', '2nd', '3rd', '4th', 'first', 'second', 'third', 'fourth'])) {
        if (!platoonLeaders.some((p) => p.designation === person.designation)) {
          platoonLeaders.push(person);
        }
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

function anyMatch(str, list) {
  return list.some((k) => str.includes(k));
}
