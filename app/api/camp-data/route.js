import { getSheetData } from '../../../lib/googleSheets';
import { getAcademicDeficiencies } from '../../../lib/academicParser';
import { parsePFTData } from '../../../lib/pftParser';
import { NextResponse } from 'next/server';

const CAMP_SHEET_ID = '1YfrsGwikWtcLLsXFodHL47Yy8JoYRpp54Dt3mrAVA14';
const ROSTER_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';

function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ñ/g, "N")
    .replace(/\b(JR|SR|I{1,3}|IV|V)\b/g, '')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesCadetName(rosterSurname, targetName) {
  const normRoster = normalizeName(rosterSurname);
  const normTarget = normalizeName(targetName);
  
  if (!normRoster || !normTarget) return false;
  if (normRoster === normTarget) return true;
  if (normTarget.startsWith(normRoster) || normRoster.startsWith(normTarget)) return true;
  if (normTarget.includes(normRoster) || normRoster.includes(normTarget)) return true;
  return false;
}

export async function GET(request) {
  try {
    const [rosterRows, characterRows, acadData, pftRows] = await Promise.all([
      getSheetData(ROSTER_SHEET_ID, 'SOI'),
      getSheetData(CAMP_SHEET_ID, 'CHARACTER (REPORTS)'),
      getAcademicDeficiencies(),
      getSheetData(PFT_SHEET_ID, PFT1_TAB)
    ]);

    const cadets = {};

    // 1. Process Roster (SOI)
    if (rosterRows && rosterRows.length > 0) {
      rosterRows.forEach(row => {
        const first = String(row['FIRST NAME '] || row['FIRST NAME'] || '').trim();
        const last = String(row['SURNAME '] || row['SURNAME'] || '').trim().toUpperCase();
        
        let miRaw = String(row['MI '] || row['MI'] || row['M.I. '] || row['M.I.'] || row['MIDDLE INITIAL'] || '').trim();
        let mi = miRaw.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();

        const className = String(row['CLASS '] || row['CLASS'] || '').trim().toUpperCase();
        const gender = String(row['GENDER '] || row['GENDER'] || 'M').trim().toUpperCase();
        const afpsn = String(
          row['AFPSN '] || row['AFPSN'] || 
          row['SERIAL NO.'] || row['SERIAL NO '] || row['SERIAL NO'] || ''
        ).trim().toUpperCase();

        if (last) {
          const fullName = mi ? `${first} ${mi} ${last}` : `${first} ${last}`;
          cadets[last] = {
            surname: last,
            firstName: first,
            middleInitial: mi,
            fullName: fullName,
            class: className,
            gender: gender,
            serialNumber: afpsn,
            academics: { status: 'FULL DUTY', remarks: 'PROFICIENT', subjects: [] },
            physical: { status: 'FULL DUTY', remarks: 'PASSED', category: '' },
            character: { active: false, status: 'DUTY', demerits: 0, confined: false, touring: false, remainingTour: 0, offenses: [] },
            military: { status: 'PROFICIENT' }
          };
        }
      });
    }

    // 2. Process Academics from getAcademicDeficiencies
    if (acadData) {
      Object.entries(acadData).forEach(([className, classData]) => {
        const classCadets = classData.cadets || [];
        classCadets.forEach(acadCadet => {
          const rosterCadet = Object.values(cadets).find(c => matchesCadetName(c.surname, acadCadet.name));
          if (rosterCadet) {
            if (acadCadet.isDeficient) {
              rosterCadet.academics.status = 'NOT FULL DUTY';
              rosterCadet.academics.remarks = 'DEFICIENT';
              rosterCadet.academics.subjects = Object.entries(acadCadet.deficiencies).map(([subj, val]) => `${subj} (${val})`);
            } else {
              rosterCadet.academics.status = 'FULL DUTY';
              rosterCadet.academics.remarks = 'PROFICIENT';
              rosterCadet.academics.subjects = [];
            }
          }
        });
      });
    }

    // Build gender map for PFT parser
    const genderMap = {};
    Object.values(cadets).forEach(c => {
      genderMap[c.surname] = c.gender;
    });

    const { data: pftParsedData } = parsePFTData(pftRows, genderMap);

    // 3. Process Physical/PFT from parsePFTData
    if (pftParsedData) {
      const classes = ['1cl', '2cl', '3cl'];
      classes.forEach(cl => {
        const classPft = pftParsedData[cl] || { passed: [], failed: [], smc: [], fad: [] };
        
        classPft.failed.forEach(pftCadet => {
          const rosterCadet = Object.values(cadets).find(c => matchesCadetName(c.surname, pftCadet.surname));
          if (rosterCadet) {
            rosterCadet.physical.status = 'NOT FULL DUTY';
            rosterCadet.physical.remarks = 'FAILED';
            rosterCadet.physical.category = pftCadet.scores?.category || '';
          }
        });

        classPft.smc.forEach(pftCadet => {
          const rosterCadet = Object.values(cadets).find(c => matchesCadetName(c.surname, pftCadet.surname));
          if (rosterCadet) {
            rosterCadet.physical.status = 'NOT FULL DUTY';
            rosterCadet.physical.remarks = 'SMC';
            rosterCadet.physical.category = pftCadet.scores?.category || '';
          }
        });

        classPft.passed.forEach(pftCadet => {
          const rosterCadet = Object.values(cadets).find(c => matchesCadetName(c.surname, pftCadet.surname));
          if (rosterCadet) {
            rosterCadet.physical.status = 'FULL DUTY';
            rosterCadet.physical.remarks = 'PASSED';
            rosterCadet.physical.category = pftCadet.scores?.category || '';
          }
        });
      });
    }

    // 4. Process Character Reports
    if (characterRows && characterRows.length > 0) {
      const keys = Object.keys(characterRows[0]);
      const nameKey = keys.find(k => k.trim().toUpperCase() === 'NAME') || keys[1];
      const statusKey = keys.find(k => k.trim().toUpperCase() === 'STATUS') || keys[2];
      const offenseKey = keys.find(k => k.trim().toUpperCase().includes('OFFENSE')) || keys[3];
      const classKey = keys.find(k => k.trim().toUpperCase().startsWith('CLASS')) || keys[4];
      const natureKey = keys.find(k => k.trim().toUpperCase().includes('NATURE')) || keys[5];
      const demeritsKey = keys.find(k => k.trim().toUpperCase().includes('DEMERIT')) || keys[6];
      const confinedKey = keys.find(k => k.trim().toUpperCase().includes('CONFINED')) || keys[7];
      const startKey = keys.find(k => k.trim().toUpperCase() === 'START') || keys[8];
      const endKey = keys.find(k => k.trim().toUpperCase() === 'END') || keys[9];
      const remainingKey = keys.find(k => k.trim().toUpperCase() === 'REMAINING') || keys[13];
      const refKey = keys.find(k => k.trim().toUpperCase().startsWith('REF')) || keys[14];
      const remarksKey = keys.find(k => k.trim().toUpperCase().startsWith('REMARK')) || keys[15];

      characterRows.forEach(row => {
        const activeVal = String(row[keys[0]] || '').trim().toUpperCase();
        const surname = String(row[nameKey] || '').trim().toUpperCase();

        if (surname && surname !== 'NAME' && activeVal === 'ACTIVE') {
          const rosterCadet = Object.values(cadets).find(c => matchesCadetName(c.surname, surname));
          if (rosterCadet) {
            const rawStatus = row[statusKey] ? String(row[statusKey]).trim().toUpperCase() : 'TOURING';
            const isServed = rawStatus === 'SERVED';
            
            if (!isServed) {
              rosterCadet.character.active = true;
              rosterCadet.character.status = rawStatus;
            } else if (rosterCadet.character.status === 'DUTY') {
              rosterCadet.character.status = 'SERVED';
            }

            const demerits = parseFloat(row[demeritsKey]) || 0;
            const remainingTour = parseFloat(row[remainingKey]) || 0;
            const confinedVal = row[confinedKey] ? String(row[confinedKey]).trim().toUpperCase() : 'NO';

            rosterCadet.character.demerits += demerits;
            if (!isServed) {
              rosterCadet.character.remainingTour += remainingTour;

              if (confinedVal === 'YES' || rawStatus.includes('CONFINED')) {
                rosterCadet.character.confined = true;
              }
              if (rawStatus.includes('TOURING') || remainingTour > 0) {
                rosterCadet.character.touring = true;
              }
            }

            rosterCadet.character.offenses.push({
              offense: row[offenseKey] ? String(row[offenseKey]).trim() : '',
              class: row[classKey] ? String(row[classKey]).trim() : '',
              nature: row[natureKey] ? String(row[natureKey]).trim() : '',
              demerits,
              remainingTour,
              confined: confinedVal === 'YES',
              start: row[startKey] ? String(row[startKey]).trim() : '',
              end: row[endKey] ? String(row[endKey]).trim() : '',
              reference: row[refKey] ? String(row[refKey]).trim() : '',
              remarks: row[remarksKey] ? String(row[remarksKey]).trim() : ''
            });
          }
        }
      });
    }

    const validCadets = Object.values(cadets);

    validCadets.forEach(c => {
      const hasAcademicDeficiency = c.academics.remarks === 'DEFICIENT';
      const hasFailedPFT = c.physical.remarks === 'FAILED';
      const hasSMCPFT = c.physical.remarks === 'SMC';
      const hasActivePunishments = c.character.active;
      
      c.eligibleForPrivilege = !hasAcademicDeficiency && !hasFailedPFT && !hasSMCPFT && !hasActivePunishments;
      
      c.eligibilityChecks = {
        academics: !hasAcademicDeficiency,
        pft: !hasFailedPFT,
        smc: !hasSMCPFT,
        character: !hasActivePunishments,
        reasons: [
          hasAcademicDeficiency ? `Academic Deficiency (${c.academics.subjects.join(', ')})` : null,
          hasFailedPFT ? 'Failed PFT Event' : null,
          hasSMCPFT ? "SMC (Strongman's Club - under 8.5 PFT average requirement)" : null,
          hasActivePunishments ? `Active Punishment (${c.character.status})` : null
        ].filter(Boolean)
      };
    });

    const totalCadets = validCadets.length;
    const eligibleCount = validCadets.filter(c => c.eligibleForPrivilege).length;
    const academicsDeficient = validCadets.filter(c => c.academics.remarks === 'DEFICIENT').length;
    const pftFailed = validCadets.filter(c => c.physical.remarks === 'FAILED').length;
    const pftSMC = validCadets.filter(c => c.physical.remarks === 'SMC').length;
    const touringOrConfined = validCadets.filter(c => c.character.active).length;

    const summary = {
      totalCadets,
      eligibleCount,
      ineligibleCount: totalCadets - eligibleCount,
      academicsDeficientCount: academicsDeficient,
      pftFailedCount: pftFailed,
      pftSMCCount: pftSMC,
      touringOrConfinedCount: touringOrConfined
    };

    return NextResponse.json({ cadets: validCadets, summary });
  } catch (error) {
    console.error("Error in camp-data API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
