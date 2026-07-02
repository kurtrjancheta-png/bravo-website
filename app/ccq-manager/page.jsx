import CCQManagerClient from './CCQManagerClient';
import { getSheetData } from '../../lib/googleSheets';

export const dynamic = 'force-dynamic';

const SPREADSHEET_ID = '1HhWc6ZAVjbpJT4EwyX0D6zJ4FBxh7jNPuRxqGLE-YT8';

function safeGet(row, ...keys) {
  for (const k of keys) {
    const val = row[k] ?? row[Object.keys(row).find(rk => rk.toUpperCase() === k.toUpperCase())];
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
}

export default async function CCQManagerPage() {
  const [ocAocRaw, guardsRaw, socRaw, bestBestRaw] = await Promise.all([
    getSheetData(SPREADSHEET_ID, 'OC_AOC').catch(() => null),
    getSheetData(SPREADSHEET_ID, 'GUARDS').catch(() => null),
    getSheetData(SPREADSHEET_ID, 'SOC').catch(() => null),
    getSheetData(SPREADSHEET_ID, 'BEST_BEST').catch(() => null),
  ]);

  // Parse OC/AOC
  let initialOcName = '';
  let initialAocName = '';
  const ocAocRows = (ocAocRaw || []).filter(r => {
    const role = safeGet(r, 'ROLE');
    return role && role !== 'ROLE';
  });
  for (const row of ocAocRows) {
    const role = safeGet(row, 'ROLE').toUpperCase();
    const name = safeGet(row, 'NAME');
    if (role === 'OC') initialOcName = name;
    if (role === 'AOC') initialAocName = name;
  }

  // Parse Guards
  const POSITION_CODES = ['OD', 'OG1', 'OG2', 'SG1', 'SG2', 'CAMO1', 'CAMO2', 'CEMA', 'CAMOD', 'CAL', 'AS1', 'AS2', 'MOG'];
  const guardsMap = {};
  const guardsFiltered = (guardsRaw || []).filter(r => {
    const pos = safeGet(r, 'POSITION');
    return pos && pos !== 'POSITION';
  });
  for (const row of guardsFiltered) {
    const code = safeGet(row, 'CODE').toUpperCase();
    const name = safeGet(row, 'NAME');
    guardsMap[code] = name;
  }
  const initialGuards = POSITION_CODES.map(code => guardsMap[code] || '');

  // Parse SOC
  const initialSocRows = (socRaw || []).filter(r => {
    const time = safeGet(r, 'TIME');
    const act  = safeGet(r, 'ACTIVITY');
    return (time || act) && time !== 'TIME';
  }).map(r => ({
    time:              safeGet(r, 'TIME'),
    activity:          safeGet(r, 'ACTIVITY'),
    uniform:           safeGet(r, 'UNIFORM'),
    formation:         safeGet(r, 'FORMATION'),
    isCancelled:       safeGet(r, 'IS_CANCELLED') === 'true',
    isChanged:         safeGet(r, 'IS_CHANGED') === 'true',
    isAdded:           safeGet(r, 'IS_ADDED') === 'true',
    changeTypeTime:    safeGet(r, 'CHANGE_TYPE_TIME') === 'true',
    changeTypePlace:   safeGet(r, 'CHANGE_TYPE_PLACE') === 'true',
    changeTypeUniform: safeGet(r, 'CHANGE_TYPE_UNIFORM') === 'true',
  }));

  // Parse Best-Best (Class-divided)
  const initialBestState = {
    '1CL_Locker': '', '1CL_Shoe': '', '1CL_Bunks': '', '1CL_Table': '', '1CL_Room': '',
    '2CL_Locker': '', '2CL_Shoe': '', '2CL_Bunks': '', '2CL_Table': '', '2CL_Room': '',
    '3CL_Locker': '', '3CL_Shoe': '', '3CL_Bunks': '', '3CL_Table': '', '3CL_Room': ''
  };

  if (bestBestRaw && bestBestRaw.length > 0) {
    const firstRow = bestBestRaw[0];
    const dateKeys = Object.keys(firstRow).filter(k => k !== 'CATEGORY' && k !== '_sheetRowIndex' && !k.startsWith('Column'));
    if (dateKeys.length > 0) {
      const mostRecentDate = dateKeys[dateKeys.length - 1];
      
      const mapping = {
        '1CL Best Locker': '1CL_Locker',
        '1CL Best Shoe Display': '1CL_Shoe',
        '1CL Best Bunks': '1CL_Bunks',
        '1CL Best Study Table Display': '1CL_Table',
        '1CL Best Room': '1CL_Room',
        '2CL Best Locker': '2CL_Locker',
        '2CL Best Shoe Display': '2CL_Shoe',
        '2CL Best Bunks': '2CL_Bunks',
        '2CL Best Study Table Display': '2CL_Table',
        '2CL Best Room': '2CL_Room',
        '3CL Best Locker': '3CL_Locker',
        '3CL Best Shoe Display': '3CL_Shoe',
        '3CL Best Bunks': '3CL_Bunks',
        '3CL Best Study Table Display': '3CL_Table',
        '3CL Best Room': '3CL_Room'
      };

      bestBestRaw.forEach(row => {
        const cat = safeGet(row, 'CATEGORY');
        const val = safeGet(row, mostRecentDate);
        if (mapping[cat]) {
          initialBestState[mapping[cat]] = val;
        }
      });
    }
  }

  return (
    <CCQManagerClient 
      initialOcName={initialOcName}
      initialAocName={initialAocName}
      initialGuards={initialGuards}
      initialSocRows={initialSocRows}
      initialBestState={initialBestState}
    />
  );
}
