import { getSheetData } from '../../lib/googleSheets';
import CCQBulletinClient from './CCQBulletinClient';

export const revalidate = 30;

const CCQ_SHEET_ID = '1HhWc6ZAVjbpJT4EwyX0D6zJ4FBxh7jNPuRxqGLE-YT8';

// Check if data is stale based on PHT reset time
// resetHourPHT: 0 = midnight, 9 = 9am, 12 = noon, 19 = 7pm
function isStalePHT(updatedAtISO, resetHourPHT) {
  if (!updatedAtISO) return true;
  try {
    const updatedAt = new Date(updatedAtISO);
    const now = new Date();
    const phtOffset = 8 * 3600000; // UTC+8
    const nowPHT = new Date(now.getTime() + phtOffset);
    const y = nowPHT.getUTCFullYear();
    const m = nowPHT.getUTCMonth();
    const d = nowPHT.getUTCDate();

    let resetUTC;
    if (resetHourPHT === 0) {
      // Midnight PHT = 16:00 UTC of the previous calendar day
      resetUTC = new Date(Date.UTC(y, m, d - 1, 16, 0, 0, 0));
    } else {
      resetUTC = new Date(Date.UTC(y, m, d, resetHourPHT - 8, 0, 0, 0));
    }
    return now >= resetUTC && updatedAt < resetUTC;
  } catch { return true; }
}

// Safe parse: extract a column value, handling key mismatches
function safeGet(row, ...keys) {
  for (const k of keys) {
    const val = row[k] ?? row[Object.keys(row).find(rk => rk.toUpperCase() === k.toUpperCase())];
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
}

export default async function CCQBulletinPage() {
  // ── Fetch all sheets in parallel ──────────────────────────────
  const [ocAocRaw, guardsRaw, socRaw, bestBestRaw] = await Promise.all([
    getSheetData(CCQ_SHEET_ID, 'OC_AOC').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'GUARDS').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'SOC').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'BEST_BEST').catch(() => null),
  ]);

  // ── Parse OC / AOC ────────────────────────────────────────────
  let ocName = '', aocName = '', ocAocUpdatedAt = null;
  const ocAocRows = (ocAocRaw || []).filter(r => {
    const role = safeGet(r, 'ROLE');
    return role && role !== 'ROLE'; // skip header
  });
  for (const row of ocAocRows) {
    const role = safeGet(row, 'ROLE').toUpperCase();
    const name = safeGet(row, 'NAME');
    const ts   = safeGet(row, 'UPDATED_AT');
    if (role === 'OC')  { ocName = name; ocAocUpdatedAt = ts; }
    if (role === 'AOC') { aocName = name; }
  }
  const ocStale = isStalePHT(ocAocUpdatedAt, 9);

  // ── Parse Guards ──────────────────────────────────────────────
  const GUARD_POSITIONS = [
    { code: 'OD',    position: 'Officer of the Day' },
    { code: 'OG1',   position: 'Officer of the Guard 1' },
    { code: 'OG2',   position: 'Officer of the Guard 2' },
    { code: 'SG1',   position: 'Sergeant of the Guard 1' },
    { code: 'SG2',   position: 'Sergeant of the Guard 2' },
    { code: 'CAMO1', position: 'Cadet Asst. to Mess Officer 1' },
    { code: 'CAMO2', position: 'Cadet Asst. to Mess Officer 2' },
    { code: 'CEMA',  position: 'Cadet Equipment Maintenance Asst.' },
    { code: 'CAMOD', position: 'Cadet Asst. to Medical OD' },
    { code: 'CAL',   position: 'Cadet Asst. to Librarian' },
    { code: 'AS1',   position: 'Area Sergeant 1' },
    { code: 'AS2',   position: 'Area Sergeant 2' },
    { code: 'MOG',   position: 'Messenger of the Guard' },
  ];
  let guardsUpdatedAt = null;
  const guardsMap = {};
  const guardsFiltered = (guardsRaw || []).filter(r => {
    const pos = safeGet(r, 'POSITION');
    return pos && pos !== 'POSITION';
  });
  for (const row of guardsFiltered) {
    const code = safeGet(row, 'CODE').toUpperCase();
    const name = safeGet(row, 'NAME');
    const ts   = safeGet(row, 'UPDATED_AT');
    guardsMap[code] = name;
    if (!guardsUpdatedAt && ts) guardsUpdatedAt = ts;
  }
  const guards = GUARD_POSITIONS.map(g => ({ ...g, name: guardsMap[g.code] || '' }));
  const guardsStale = isStalePHT(guardsUpdatedAt, 19);

  // ── Parse SOC ─────────────────────────────────────────────────
  let socUpdatedAt = null;
  const socRows = (socRaw || []).filter(r => {
    const time = safeGet(r, 'TIME');
    const act  = safeGet(r, 'ACTIVITY');
    return (time || act) && time !== 'TIME';
  }).map(r => {
    if (!socUpdatedAt) socUpdatedAt = safeGet(r, 'UPDATED_AT') || null;
    return {
      time:      safeGet(r, 'TIME'),
      activity:  safeGet(r, 'ACTIVITY'),
      uniform:   safeGet(r, 'UNIFORM'),
      formation: safeGet(r, 'FORMATION'),
    };
  });
  const socStale = isStalePHT(socUpdatedAt, 0); // stale after midnight

  // ── Parse Best-Best ───────────────────────────────────────────
  const BEST_CATEGORIES = [
    'Best Locker', 'Best Shoe Display', 'Best Bunks',
    'Best Study Table Display', 'Best Room',
  ];
  const bestBestFiltered = (bestBestRaw || []).filter(r => {
    const cat = safeGet(r, 'CATEGORY');
    return cat && cat !== 'CATEGORY';
  });
  // Get the most recent date's entries
  let mostRecentDate = '';
  let bestBestPostedAt = null;
  for (const row of bestBestFiltered) {
    const date = safeGet(row, 'DATE');
    if (!mostRecentDate || date > mostRecentDate) mostRecentDate = date;
  }
  const bestBest = BEST_CATEGORIES.map(cat => {
    const match = bestBestFiltered.find(r =>
      safeGet(r, 'CATEGORY') === cat && safeGet(r, 'DATE') === mostRecentDate
    );
    if (match) {
      const ts = safeGet(match, 'POSTED_AT');
      if (!bestBestPostedAt && ts) bestBestPostedAt = ts;
    }
    return {
      category: cat,
      winner:   match ? safeGet(match, 'WINNER') : '',
      room:     match ? safeGet(match, 'ROOM')   : '',
      date:     mostRecentDate,
    };
  });
  const bestBestStale = isStalePHT(bestBestPostedAt, 12); // stale after noon

  return (
    <CCQBulletinClient
      ocName={ocName}
      aocName={aocName}
      ocStale={ocStale}
      guards={guards}
      guardsStale={guardsStale}
      socRows={socRows}
      socStale={socStale}
      bestBest={bestBest}
      bestBestStale={bestBestStale}
    />
  );
}
