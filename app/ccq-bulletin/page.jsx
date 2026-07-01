import { getSheetData } from '../../lib/googleSheets';
import CCQBulletinClient from './CCQBulletinClient';

export const dynamic = 'force-dynamic';

const CCQ_SHEET_ID = '1HhWc6ZAVjbpJT4EwyX0D6zJ4FBxh7jNPuRxqGLE-YT8';

const SCRIPT_URL_1CL = 'https://script.google.com/macros/s/AKfycbwNVo5buoeHliZfJ17yLduSCMEPfoHkuvXNnAT8ed-wIs0lVE6ucpkvItNZN2zv0SbtTw/exec';
const SCRIPT_URL_2CL = 'https://script.google.com/macros/s/AKfycbx9slx3s4GRQCnR98HrUmSfRvJnKfbWoHjLq2avXeoNqYCthhUlOS1iYP1t-ORb_zLL/exec';
const SCRIPT_URL_3CL = 'https://script.google.com/macros/s/AKfycbxs0fmHK3QikUCYBTSnD_xuh7sVoXF5urCISgtQvGz5QJHiRF94e0ajx0XwSoZ09X-3tg/exec';

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
  const now = new Date();
  // ── Fetch all sheets and external API endpoints in parallel ────
  const [ocAocRaw, guardsRaw, socRaw, bestBestRaw, raw1CL, raw2CL, raw3CL] = await Promise.all([
    getSheetData(CCQ_SHEET_ID, 'OC_AOC').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'GUARDS').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'SOC').catch(() => null),
    getSheetData(CCQ_SHEET_ID, 'BEST_BEST').catch(() => null),
    fetch(SCRIPT_URL_1CL, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    fetch(SCRIPT_URL_2CL, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    fetch(SCRIPT_URL_3CL, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
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
  const socStale = false; // Never reset automatically at midnight

  // ── Parse Best-Best (Column-Dated Layout) ────────────────────
  let bestBest = [];
  let mostRecentDate = '';
  let bestBestStale = true;

  if (bestBestRaw && bestBestRaw.length > 0) {
    const firstRow = bestBestRaw[0];
    const dateKeys = Object.keys(firstRow).filter(k => k !== 'CATEGORY' && k !== '_sheetRowIndex' && !k.startsWith('Column'));
    
    if (dateKeys.length > 0) {
      mostRecentDate = dateKeys[dateKeys.length - 1]; // Last column that contains a date
      
      bestBest = bestBestRaw.filter(r => {
        const cat = safeGet(r, 'CATEGORY');
        return cat && cat !== 'CATEGORY';
      }).map(row => ({
        category: safeGet(row, 'CATEGORY'),
        value: safeGet(row, mostRecentDate)
      }));

      // Check if stale (PHT timezone comparison)
      const phtOffset = 8 * 3600000;
      const nowPHT = new Date(Date.now() + phtOffset);
      const hourPHT = nowPHT.getUTCHours();
      
      const dayStr = String(nowPHT.getUTCDate()).padStart(2, '0');
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthStr = monthNames[nowPHT.getUTCMonth()];
      const yearStr = String(nowPHT.getUTCFullYear());
      const todayPHTStr = `${dayStr} ${monthStr} ${yearStr}`;

      const isToday = mostRecentDate.trim().toUpperCase() === todayPHTStr.toUpperCase();
      bestBestStale = !isToday && hourPHT >= 12;
    }
  }

  // ── Parse Barracks Guards (from Manila time guardmount) ───────
  const manilaStr = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const manilaNow = new Date(manilaStr);
  const isBeforeGuardMount = (manilaNow.getHours() < 18) || (manilaNow.getHours() === 18 && manilaNow.getMinutes() < 30);
  
  const postedDate = new Date(manilaNow);
  postedDate.setHours(0, 0, 0, 0);
  if (isBeforeGuardMount) {
    postedDate.setDate(postedDate.getDate() - 1);
  }

  const parseDateHeader = (header) => {
    if (!header) return null;
    const parts = header.split(' | ');
    try {
      const d = new Date(parts[0]);
      if (isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  };

  const getStatusFromColor1CL = (hex) => {
    if (!hex) return 'OTHER';
    if (hex === '#ffc000' || hex === '#ffa500' || hex === '#fbbc04' || hex === '#ff9900') return 'FI';
    if (hex === '#00ff00' || hex === '#34a853') return 'SENTINEL';
    return 'OTHER';
  };

  const getStatusFromColor2CL = (hex) => {
    if (!hex) return 'OTHER';
    if (hex === '#00ffff') return 'SENTINEL';
    if (hex === '#b45f06' || hex === '#b87333' || hex === '#a67c00' || hex === '#bf9000') return 'AFI';
    return 'OTHER';
  };

  const getStatusFromColor3CL = (hex) => {
    if (!hex) return 'OTHER';
    if (hex === '#000000' || hex === '#111111') return 'SENTINEL';
    if (hex === '#ff0000' || hex === '#ea4335') return 'CCQ';
    if (hex === '#4a86e8' || hex === '#4285f4' || hex === '#2b78e4') return 'ACCQ';
    if (hex === '#00ffff' || hex === '#00b0f0') return 'AFI';
    return 'OTHER';
  };

  const getActiveList = (rawList, getStatusFn, cadetClass) => {
    const list = [];
    (rawList || []).forEach(item => {
      const d = parseDateHeader(item.dateHeader);
      if (!d) return;
      
      const itemDateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
      const itemObj = new Date(itemDateStr);
      itemObj.setHours(0,0,0,0);
      
      if (itemObj.getTime() === postedDate.getTime()) {
        const cleanName = (item.name || '').replace(' AS', '').trim();
        const upper = cleanName.toUpperCase();
        if (['FI', 'CCQ', 'ACCQ', 'AFI', 'SENTINEL', 'INTERIOR', 'NON POSTING', 'NON-POSTING', 'MHC', 'PLEBE DETAIL', 'SENTINEL (TOC)'].includes(upper)) return;
        
        const status = getStatusFn(item.color);
        if (status !== 'OTHER') {
          list.push({
            name: cleanName,
            status,
            cadetClass
          });
        }
      }
    });
    return list;
  };

  const list1CL = getActiveList(raw1CL, getStatusFromColor1CL, '1CL');
  const list2CL = getActiveList(raw2CL, getStatusFromColor2CL, '2CL');
  const list3CL = getActiveList(raw3CL, getStatusFromColor3CL, '3CL');

  const allBarracks = [...list1CL, ...list2CL, ...list3CL];
  
  const fiObj = allBarracks.find(g => g.status === 'FI');
  const afiObj = allBarracks.find(g => g.status === 'AFI');
  const ccqObj = allBarracks.find(g => g.status === 'CCQ');
  const accqObj = allBarracks.find(g => g.status === 'ACCQ');
  const sentinelsList = allBarracks.filter(g => g.status === 'SENTINEL');

  const barracksGuards = {
    fi: fiObj ? `${fiObj.cadetClass} ${fiObj.name} 'B' CO` : '',
    afi: afiObj ? `${afiObj.cadetClass} ${afiObj.name} 'B' CO` : '',
    ccq: ccqObj ? `${ccqObj.cadetClass} ${ccqObj.name} 'B' CO` : '',
    accq: accqObj ? `${accqObj.cadetClass} ${accqObj.name} 'B' CO` : '',
    sentinels: sentinelsList.map(g => `${g.cadetClass} ${g.name} 'B' CO`)
  };

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
      barracksGuards={barracksGuards}
    />
  );
}
