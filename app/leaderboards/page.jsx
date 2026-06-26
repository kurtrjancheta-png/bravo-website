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

      // Group cadets by class based on row indices
      let mappedClass = '3cl';
      if (i >= 0 && i <= 29) {
        mappedClass = '1cl';
      } else if (i >= 30 && i <= 66) {
        mappedClass = '2cl';
      } else if (i >= 67 && i <= 104) {
        mappedClass = '3cl';
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
    '3cl': buildPhysicalLeaderboard('3cl')
  };

  // 3. Character: Discipline Leaderboard (Lowest accumulated demerits = demerits - merits)
  const characterMap = {};
  if (fsgtRows && fsgtRows.length > 0) {
    const keys = Object.keys(fsgtRows[0]);
    const k2 = keys[1]; // RANK
    const k3 = keys[2]; // LAST NAME
    const k7 = keys[6]; // DEMERITS
    const k16_idx = keys[15]; // MERIT
    const k14 = keys[13]; // TOURING REMAINING

    fsgtRows.forEach(row => {
      const name = String(row[k3] || '').trim().toUpperCase();
      if (!name) return;

      if (!characterMap[name]) {
        characterMap[name] = { demerits: 0, merits: 0, tourRemaining: 0 };
      }
      characterMap[name].demerits += Number(row[k7]) || 0;
      characterMap[name].merits += Number(row[k16_idx]) || 0;
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
    '3cl': buildCharacterLeaderboard('3cl')
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
    '3cl': buildAcademicsLeaderboard('3cl')
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
    '3cl': buildMilitaryLeaderboard('3cl')
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
