import { getSheetData } from '../../../lib/googleSheets';
import { NextResponse } from 'next/server';

const CAMP_SHEET_ID = '1YfrsGwikWtcLLsXFodHL47Yy8JoYRpp54Dt3mrAVA14';
const ROSTER_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export async function GET(request) {
  try {
    const [rosterRows, statusRows, characterRows] = await Promise.all([
      getSheetData(ROSTER_SHEET_ID, 'SOI'),
      getSheetData(CAMP_SHEET_ID, 'ACADS/PFT STATUS'),
      getSheetData(CAMP_SHEET_ID, 'CHARACTER (REPORTS)')
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
          const fullName = mi ? `${first} ${mi} ${row['SURNAME '] || row['SURNAME']}` : `${first} ${row['SURNAME '] || row['SURNAME']}`;
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

    // Helper to get or create cadet by surname
    function findOrCreateCadet(surname) {
      const clean = String(surname).trim().toUpperCase();
      if (!clean || clean === 'NAME' || clean === 'LAST NAME') return null;
      if (!cadets[clean]) {
        cadets[clean] = {
          surname: clean,
          firstName: '',
          middleInitial: '',
          fullName: clean,
          class: 'UNKNOWN',
          gender: 'M',
          serialNumber: '',
          academics: { status: 'FULL DUTY', remarks: 'PROFICIENT', subjects: [] },
          physical: { status: 'FULL DUTY', remarks: 'PASSED', category: '' },
          character: { active: false, status: 'DUTY', demerits: 0, confined: false, touring: false, remainingTour: 0, offenses: [] },
          military: { status: 'PROFICIENT' }
        };
      }
      return cadets[clean];
    }

    // 2. Process Academics and PFT Status
    if (statusRows && statusRows.length > 0) {
      const keys = Object.keys(statusRows[0]);
      statusRows.forEach(row => {
        // Academic side (cols 1-4)
        const acadName = row[keys[1]] ? String(row[keys[1]]).trim().toUpperCase() : '';
        if (acadName && acadName !== 'NAME') {
          const cadet = findOrCreateCadet(acadName);
          if (cadet) {
            cadet.academics.status = row[keys[2]] ? String(row[keys[2]]).trim().toUpperCase() : 'FULL DUTY';
            cadet.academics.remarks = row[keys[3]] ? String(row[keys[3]]).trim().toUpperCase() : 'PROFICIENT';
            
            const subjectVal = row[keys[4]] ? String(row[keys[4]]).trim() : '';
            if (subjectVal) {
              cadet.academics.subjects = subjectVal.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        }

        // Physical side (cols 9-12)
        const physName = row[keys[9]] ? String(row[keys[9]]).trim().toUpperCase() : '';
        if (physName && physName !== 'NAME') {
          const cadet = findOrCreateCadet(physName);
          if (cadet) {
            cadet.physical.status = row[keys[10]] ? String(row[keys[10]]).trim().toUpperCase() : 'FULL DUTY';
            cadet.physical.remarks = row[keys[11]] ? String(row[keys[11]]).trim().toUpperCase() : 'PASSED';
            cadet.physical.category = row[keys[12]] ? String(row[keys[12]]).trim() : '';
          }
        }
      });
    }

    // 3. Process Character Reports
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
          const cadet = findOrCreateCadet(surname);
          if (cadet) {
            cadet.character.active = true;
            
            const rawStatus = row[statusKey] ? String(row[statusKey]).trim().toUpperCase() : 'TOURING';
            cadet.character.status = rawStatus;

            const demerits = parseFloat(row[demeritsKey]) || 0;
            const remainingTour = parseFloat(row[remainingKey]) || 0;
            const confinedVal = row[confinedKey] ? String(row[confinedKey]).trim().toUpperCase() : 'NO';

            cadet.character.demerits += demerits;
            cadet.character.remainingTour += remainingTour;

            if (confinedVal === 'YES' || rawStatus.includes('CONFINED')) {
              cadet.character.confined = true;
            }
            if (rawStatus.includes('TOURING') || remainingTour > 0) {
              cadet.character.touring = true;
            }

            cadet.character.offenses.push({
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

    // Convert to array and calculate overall eligibility
    const cadetList = Object.values(cadets);

    // Filter out mock/invalid entries if any (ensure class is populated)
    const validCadets = cadetList.filter(c => c.class !== 'UNKNOWN');

    validCadets.forEach(c => {
      const hasAcademicDeficiency = c.academics.remarks === 'DEFICIENT';
      const hasFailedPFT = c.physical.remarks === 'FAILED';
      const hasSMCPFT = c.physical.remarks === 'SMC';
      const hasActivePunishments = c.character.active; // On the active list, status is not SERVED (only ACTIVE rows are added)
      
      c.eligibleForPrivilege = !hasAcademicDeficiency && !hasFailedPFT && !hasSMCPFT && !hasActivePunishments;
      
      // Detailed check results
      c.eligibilityChecks = {
        academics: !hasAcademicDeficiency,
        pft: !hasFailedPFT,
        smc: !hasSMCPFT,
        character: !hasActivePunishments,
        reasons: [
          hasAcademicDeficiency ? `Academic Deficiency (${c.academics.subjects.join(', ')})` : null,
          hasFailedPFT ? 'Failed PFT Event' : null,
          hasSMCPFT ? 'Physical SMC Status' : null,
          hasActivePunishments ? `Active Punishment (${c.character.status})` : null
        ].filter(Boolean)
      };
    });

    // Compute Summaries
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
