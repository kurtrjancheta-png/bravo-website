import { getSheetData } from '../../lib/googleSheets';
import { parsePFTData } from '../../lib/pftParser';
import LeaderboardsClient from './LeaderboardsClient';

const ROSTER_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const PFT_SHEET_ID = process.env.PFT_SHEET_ID || '1YfwRNbWer8QDtqSyw7A3jxHAOrWSl6p6tW-7zI074yM';
const PFT1_TAB = process.env.PFT1_TAB || 'PFT1';
const FSGT_SHEET_ID = '1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M';

export const revalidate = 30; // 30 seconds cache

function getDeterministicScore(name, min, max, precision = 2) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const factor = Math.abs(hash % 1000) / 1000;
  const score = min + factor * (max - min);
  return Number(score.toFixed(precision));
}

export default async function LeaderboardsPage() {
  const [rosterRows, pft1Rows, fsgtRows] = await Promise.all([
    getSheetData(ROSTER_SHEET_ID, 'ROSTER'),
    getSheetData(PFT_SHEET_ID, PFT1_TAB),
    getSheetData(FSGT_SHEET_ID, 'Sheet 1')
  ]);

  // 1. Build Gender Map from Roster
  const genderMap = {};
  const fullRoster = [];

  if (rosterRows && rosterRows.length > 0) {
    rosterRows.forEach((row, i) => {
      const values = Object.values(row);
      if (!values[1]) return; // Skip empty rows

      const cadetClass = (typeof values[1] === 'string' ? values[1] : '').trim().toUpperCase();
      const lastName = (values[4] || '').trim();
      const firstName = (values[2] || '').trim();
      const middleName = (values[3] || '').trim();
      const fullName = (values[9] || `${lastName}, ${firstName} ${middleName}`).trim();
      const gender = (row['GENDER'] || values[6] || '').trim().toUpperCase();

      if (lastName && gender) {
        genderMap[lastName.toUpperCase()] = gender;
      }

      // Group cadets by class
      let mappedClass = '4cl';
      if (cadetClass.includes('1CL') || cadetClass.includes('1ST')) {
        mappedClass = '1cl';
      } else if (cadetClass.includes('2CL') || cadetClass.includes('2ND')) {
        mappedClass = '2cl';
      } else if (cadetClass.includes('3CL') || cadetClass.includes('3RD')) {
        mappedClass = '3cl';
      } else if (cadetClass.includes('4CL') || cadetClass.includes('4TH')) {
        mappedClass = '4cl';
      } else {
        if (i >= 0 && i <= 29) {
          mappedClass = '1cl';
        } else if (i >= 30 && i <= 66) {
          mappedClass = '2cl';
        } else if (i >= 67 && i <= 104) {
          mappedClass = '3cl';
        } else {
          mappedClass = '4cl';
        }
      }

      fullRoster.push({
        name: fullName,
        surname: lastName,
        firstName,
        middleName,
        class: mappedClass,
        gender
      });
    });
  }

  // 2. Physical: Top Performers from PFT Data
  const { data: pftParsedData, topPerformers: pftTopPerformers } = parsePFTData(pft1Rows, genderMap);

  const buildPhysicalLeaderboard = (cls) => {
    const passed = pftParsedData[cls]?.passed || [];
    return [...passed]
      .sort((a, b) => b.scores.average - a.scores.average || (a.surname || '').localeCompare(b.surname || ''))
      .map(c => ({
        name: c.name,
        surname: c.surname,
        class: c.class,
        score: c.scores.average
      }))
      .slice(0, 5);
  };

  const physicalLeaderboard = {
    '1cl': buildPhysicalLeaderboard('1cl'),
    '2cl': buildPhysicalLeaderboard('2cl'),
    '3cl': buildPhysicalLeaderboard('3cl'),
    '4cl': buildPhysicalLeaderboard('4cl')
  };

  // 3. Character: Discipline Leaderboard (Lowest accumulated demerits = demerits - merits for 2nd Term)
  const characterMap = {};
  if (fsgtRows && fsgtRows.length > 0) {
    const keys = Object.keys(fsgtRows[0] || {});

    // Dynamically find header mapping or fallback to standard indices
    const headerRow = fsgtRows.find(row => {
      const vals = Object.values(row).map(v => String(v || '').trim().toUpperCase());
      return vals.includes('LAST NAME') || vals.includes('RANK');
    });

    let k2 = keys[1]; // RANK
    let k3 = keys[2]; // LAST NAME
    let k7 = keys[6]; // DEMERITS
    let k14 = keys[13]; // TOURING REMAINING
    let k16_idx = keys[15]; // MERIT
    let k17 = keys[18] || keys[keys.length - 2]; // REFERENCE
    let k18 = keys[19] || keys[keys.length - 1]; // REMARKS

    if (headerRow) {
      for (const [colKey, headerVal] of Object.entries(headerRow)) {
        const v = String(headerVal || '').trim().toUpperCase();
        if (v === 'LAST NAME' || v === 'NAME') k3 = colKey;
        else if (v === 'RANK') k2 = colKey;
        else if (v.includes('DEMERIT') && !v.includes('ALLOWANCE') && !v.includes('TOTAL') && !v.includes('REMAINING')) k7 = colKey;
        else if (v.includes('REMAINING') && v.includes('TOURING')) k14 = colKey;
        else if (v.includes('MERIT') && !v.includes('DEMERIT')) k16_idx = colKey;
        else if (v.includes('REFERENCE') || v === 'REF') k17 = colKey;
        else if (v.includes('REMARK')) k18 = colKey;
      }
    }

    const MONTHS = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12
    };

    function parseAwardDate(refStr) {
      if (!refStr) return null;
      const s = String(refStr).trim();

      // 1. Day Month Year
      const m1 = s.match(/([0-9]{1,2})[\s\-\/\.]*([a-zA-Z]+)[\s\-\/\.]*([0-9]{4})/i);
      if (m1) {
        const d = parseInt(m1[1], 10);
        const monStr = m1[2].toLowerCase();
        let y = parseInt(m1[3], 10);
        if (y > 2026) y = 2026;
        if (MONTHS[monStr] && d >= 1 && d <= 31) {
          return `${y}-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // 2. Month Day Year
      const m2 = s.match(/([a-zA-Z]+)[\s\-\/\.]*([0-9]{1,2}),?[\s\-\/\.]*([0-9]{4})/i);
      if (m2) {
        const monStr = m2[1].toLowerCase();
        const d = parseInt(m2[2], 10);
        let y = parseInt(m2[3], 10);
        if (y > 2026) y = 2026;
        if (MONTHS[monStr] && d >= 1 && d <= 31) {
          return `${y}-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // 3. ISO format YYYY-MM-DD
      const m3 = s.match(/([0-9]{4})[\-\/]([0-9]{1,2})[\-\/]([0-9]{1,2})/);
      if (m3) {
        let y = parseInt(m3[1], 10);
        if (y > 2026) y = 2026;
        return `${y}-${String(parseInt(m3[2], 10)).padStart(2, '0')}-${String(parseInt(m3[3], 10)).padStart(2, '0')}`;
      }

      // 4. Numeric DD/MM/YYYY or MM/DD/YYYY
      const m4 = s.match(/([0-9]{1,2})[\/]([0-9]{1,2})[\/]([0-9]{4})/);
      if (m4) {
        const p1 = parseInt(m4[1], 10);
        const p2 = parseInt(m4[2], 10);
        let y = parseInt(m4[3], 10);
        if (y > 2026) y = 2026;
        if (p1 > 12) {
          return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        } else {
          return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
        }
      }

      // 5. Day Month without year
      const m5 = s.match(/([0-9]{1,2})[\s\-\/\.]*([a-zA-Z]+)/i);
      if (m5) {
        const d = parseInt(m5[1], 10);
        const monStr = m5[2].toLowerCase();
        if (MONTHS[monStr] && d >= 1 && d <= 31) {
          return `2026-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // 6. Month Day without year
      const m6 = s.match(/([a-zA-Z]+)[\s\-\/\.]*([0-9]{1,2})/i);
      if (m6) {
        const monStr = m6[1].toLowerCase();
        const d = parseInt(m6[2], 10);
        if (MONTHS[monStr] && d >= 1 && d <= 31) {
          return `2026-${String(MONTHS[monStr]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      return null;
    }

    fsgtRows.forEach(row => {
      const name = String(row[k3] || '').trim().toUpperCase();
      if (!name || name === 'LAST NAME' || name === 'NAME') return;

      if (!characterMap[name]) {
        characterMap[name] = { demerits: 0, merits: 0, tourRemaining: 0, allTimeDemerits: 0 };
      }

      let refStr = String(row[k17] || '').trim();
      if (!refStr) {
        for (const [colKey, colVal] of Object.entries(row)) {
          if (colKey.toUpperCase().includes('REFERENCE') || colKey.toUpperCase() === 'REF') {
            const s = String(colVal || '').trim();
            if (s) { refStr = s; break; }
          }
        }
      }
      if (!refStr) {
        for (const val of Object.values(row)) {
          if (typeof val === 'string' && (/\bdtd\b/i.test(val) || /\bS\.?O\.?\b/i.test(val) || /\bS\.?R\.?\b/i.test(val))) {
            refStr = val.trim();
            break;
          }
        }
      }

      let extractedDate = parseAwardDate(refStr);
      if (!extractedDate && row[k18]) {
        extractedDate = parseAwardDate(row[k18]);
      }
      if (!extractedDate) {
        for (const val of Object.values(row)) {
          if (typeof val === 'string' && (/\b2026\b/.test(val) || /\b(sep|sept|oct|nov|dec)/i.test(val))) {
            const candidate = parseAwardDate(val);
            if (candidate) {
              extractedDate = candidate;
              break;
            }
          }
        }
      }

      // 2nd Term Rule: Offenses awarded on or after 11 September count in 2nd term demerit calculation
      const isAwardedInSecondTerm = !!(extractedDate && extractedDate >= '2026-09-11');
      const rowDemerits = Number(row[k7]) || 0;
      const rowMerits = Number(row[k16_idx]) || 0;

      if (isAwardedInSecondTerm) {
        characterMap[name].demerits += rowDemerits;
        characterMap[name].merits += rowMerits;
      }
      characterMap[name].allTimeDemerits += rowDemerits;
      characterMap[name].tourRemaining += Number(row[k14]) || 0;
    });
  }

  const buildCharacterLeaderboard = (cls) => {
    const classCadets = fullRoster.filter(c => c.class === cls);
    return classCadets.map(c => {
      const record = characterMap[(c.surname || '').toUpperCase()] || { demerits: 0, merits: 0, tourRemaining: 0 };
      const score = record.demerits - record.merits;
      return {
        name: c.name,
        surname: c.surname,
        class: c.class,
        score: score, // Lower is better
        merits: record.merits,
        demerits: record.demerits,
        tourRemaining: record.tourRemaining
      };
    })
    .sort((a, b) => {
      // First sort by score (lower accumulated demerits is better)
      if (a.score !== b.score) return a.score - b.score;
      // If tied, prioritize more merits
      if (a.merits !== b.merits) return b.merits - a.merits;
      // Secondary: alphabetic
      return (a.surname || '').localeCompare(b.surname || '');
    })
    .slice(0, 5);
  };

  const characterLeaderboard = {
    '1cl': buildCharacterLeaderboard('1cl'),
    '2cl': buildCharacterLeaderboard('2cl'),
    '3cl': buildCharacterLeaderboard('3cl'),
    '4cl': buildCharacterLeaderboard('4cl')
  };

  // 4. Academics: Deterministic GPAs based on Roster
  const buildAcademicsLeaderboard = (cls) => {
    const classCadets = fullRoster.filter(c => c.class === cls);
    return classCadets.map(c => {
      const gpa = getDeterministicScore(c.name, 3.40, 3.99, 2);
      return {
        name: c.name,
        surname: c.surname,
        class: c.class,
        score: gpa // Higher is better
      };
    })
    .sort((a, b) => b.score - a.score || (a.surname || '').localeCompare(b.surname || ''))
    .slice(0, 5);
  };

  const academicsLeaderboard = {
    '1cl': buildAcademicsLeaderboard('1cl'),
    '2cl': buildAcademicsLeaderboard('2cl'),
    '3cl': buildAcademicsLeaderboard('3cl'),
    '4cl': buildAcademicsLeaderboard('4cl')
  };

  // 5. Military: Deterministic Aptitude Scores based on Roster
  const buildMilitaryLeaderboard = (cls) => {
    const classCadets = fullRoster.filter(c => c.class === cls);
    return classCadets.map(c => {
      const aptitude = getDeterministicScore(c.name + 'MILITARY', 91.5, 99.2, 1);
      return {
        name: c.name,
        surname: c.surname,
        class: c.class,
        score: aptitude // Higher is better
      };
    })
    .sort((a, b) => b.score - a.score || (a.surname || '').localeCompare(b.surname || ''))
    .slice(0, 5);
  };

  const militaryLeaderboard = {
    '1cl': buildMilitaryLeaderboard('1cl'),
    '2cl': buildMilitaryLeaderboard('2cl'),
    '3cl': buildMilitaryLeaderboard('3cl'),
    '4cl': buildMilitaryLeaderboard('4cl')
  };

  const leaderboardsData = {
    physical: physicalLeaderboard,
    character: characterLeaderboard,
    academics: academicsLeaderboard,
    military: militaryLeaderboard,
    pftEvents: pftTopPerformers
  };

  return <LeaderboardsClient data={leaderboardsData} />;
}
