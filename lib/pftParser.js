export function createEmptyData() {
  return {
    passed: [], failed: [], smc: [], fad: []
  };
}

export function parsePFTData(rows, genderMap = {}) {
  const data = {
    'all': createEmptyData(),
    '1cl': createEmptyData(),
    '2cl': createEmptyData(),
    '3cl': createEmptyData()
  };

  const topPerformers = {
    '1cl': {
      average: { value: -1, cadets: [] },
      pushups: { value: -1, cadets: [] },
      situps: { value: -1, cadets: [] },
      pullups: { value: -1, cadets: [] },
      flexarm: { value: -1, cadets: [] },
      run: { value: 999999, cadets: [] } // lower is better
    },
    '2cl': {
      average: { value: -1, cadets: [] },
      pushups: { value: -1, cadets: [] },
      situps: { value: -1, cadets: [] },
      pullups: { value: -1, cadets: [] },
      flexarm: { value: -1, cadets: [] },
      run: { value: 999999, cadets: [] }
    },
    '3cl': {
      average: { value: -1, cadets: [] },
      pushups: { value: -1, cadets: [] },
      situps: { value: -1, cadets: [] },
      pullups: { value: -1, cadets: [] },
      flexarm: { value: -1, cadets: [] },
      run: { value: 999999, cadets: [] }
    }
  };

  if (!rows || rows.length === 0) return { data, topPerformers };

  let allKeys = [];
  for (let r of rows) {
    const rKeys = Object.keys(r);
    if (rKeys.length > allKeys.length) {
      allKeys = rKeys;
    }
  }

  let currentClass = null;
  let nameIdx = -1;

  for (let i = 0; i < allKeys.length; i++) {
    const k = allKeys[i];
    if (k && k.trim().toUpperCase() === 'NAME') {
      nameIdx = i;
      break;
    }
  }

  if (nameIdx === -1) {
    for (let r of rows) {
      for (let i = 0; i < allKeys.length; i++) {
        const val = typeof r[allKeys[i]] === 'string' ? r[allKeys[i]].trim().toUpperCase() : '';
        if (val === 'NAME' || val.includes('1CL')) {
          nameIdx = i;
          break;
        }
      }
      if (nameIdx !== -1) break;
    }
  }

  if (nameIdx === -1) nameIdx = 0;

  const nameKey = allKeys[nameIdx];
  const pushupRawKey = allKeys[nameIdx + 1];
  const pushupKey = allKeys[nameIdx + 2];
  const situpRawKey = allKeys[nameIdx + 3];
  const situpKey = allKeys[nameIdx + 4];
  const pullupRawKey = allKeys[nameIdx + 5];
  const pullupKey = allKeys[nameIdx + 6];
  const runRawKey = allKeys[nameIdx + 7];
  const runKey = allKeys[nameIdx + 8];
  const averageKey = allKeys[nameIdx + 9];
  const remarksKey = allKeys[nameIdx + 10];

  if (nameKey) {
    const upperKey = nameKey.toUpperCase();
    if (upperKey.includes('1CL') || upperKey.includes('1ST CLASS')) currentClass = '1cl';
    else if (upperKey.includes('2CL') || upperKey.includes('2ND CLASS')) currentClass = '2cl';
    else if (upperKey.includes('3CL') || upperKey.includes('3RD CLASS')) currentClass = '3cl';
  }

  rows.forEach((row) => {
    let rowValues = Object.values(row).map(v => typeof v === 'string' ? v.trim().toUpperCase() : '');
    if (rowValues.includes('1CL') || rowValues.includes('1ST CLASS')) { currentClass = '1cl'; return; }
    if (rowValues.includes('2CL') || rowValues.includes('2ND CLASS')) { currentClass = '2cl'; return; }
    if (rowValues.includes('3CL') || rowValues.includes('3RD CLASS')) { currentClass = '3cl'; return; }

    if (!currentClass || !remarksKey || !nameKey) return;

    const val = (typeof row[remarksKey] === 'string' ? row[remarksKey] : '').trim().toUpperCase();
    if (!val || val === 'REMARKS' || val === 'STATUS') return;

    const name = (typeof row[nameKey] === 'string' ? row[nameKey] : '').trim();
    if (!name || name.toUpperCase() === 'NAME') return;

    const cleanName = name.replace(/CDT\s+/, '').trim().toUpperCase();
    const surname = cleanName.split(/\s+/)[0];
    
    let gender = 'M';
    if (genderMap && genderMap[surname]) {
      gender = genderMap[surname];
    } else if (genderMap) {
      for (const [sName, g] of Object.entries(genderMap)) {
        if (cleanName.includes(sName)) {
          gender = g;
          break;
        }
      }
    }

    const pushups = parseFloat(row[pushupKey]) || 0;
    const situps = parseFloat(row[situpKey]) || 0;
    const pullups = parseFloat(row[pullupKey]) || 0;
    const run = parseFloat(row[runKey]) || 0;
    const average = parseFloat(row[averageKey]) || 0;

    const pushupsRaw = parseFloat(row[pushupRawKey]) || 0;
    const situpsRaw = parseFloat(row[situpRawKey]) || 0;
    const pullupsRaw = parseFloat(row[pullupRawKey]) || 0;
    
    let runRaw = 0;
    const rawStr = row[runRawKey];
    if (rawStr !== undefined && rawStr !== null && rawStr !== '') {
      const strVal = String(rawStr).trim();
      const numVal = parseFloat(strVal);
      
      if (strVal.includes(':')) {
        const parts = strVal.split(':');
        if (parts.length >= 2) {
          runRaw = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
      } else if (!isNaN(numVal) && numVal < 1 && numVal > 0) {
        // Google sheets fraction of a day for hh:mm (e.g., 0.5180555 -> 12:26)
        const totalMinutesInDay = Math.round(numVal * 24 * 60); 
        const m = Math.floor(totalMinutesInDay / 60);
        const s = totalMinutesInDay % 60;
        runRaw = m * 60 + s;
      } else if (!isNaN(numVal) && numVal >= 100) {
        // e.g., 1354 -> 13 mins 54 secs
        const m = Math.floor(numVal / 100);
        const s = numVal % 100;
        runRaw = m * 60 + s;
      }
    }

    const cadet = {
      name,
      surname,
      gender,
      class: currentClass,
      scores: { pushups, situps, pullups, run, average },
      remarks: val
    };

    if (val.includes('PASSED') || val === 'P') {
      data[currentClass].passed.push(cadet);
      data['all'].passed.push(cadet);
    } else if (val.includes('FAILED') || val === 'F') {
      data[currentClass].failed.push(cadet);
      data['all'].failed.push(cadet);
    } else if (val.includes('SMC')) {
      data[currentClass].smc.push(cadet);
      data['all'].smc.push(cadet);
    } else if (val.includes('FAD') || val.includes('GUARD') || val.includes('SIQ')) {
      data[currentClass].fad.push(cadet);
      data['all'].fad.push(cadet);
    }

    // Only consider PASSED cadets for top performers
    if (val.includes('PASSED') || val === 'P') {
      const top = topPerformers[currentClass];
      
      const updateTop = (event, val, isRun = false) => {
        if (val === 0) return; // skip if invalid
        
        const isBetter = isRun ? (val < top[event].value) : (val > top[event].value);
        if (isBetter) {
          top[event].value = val;
          top[event].cadets = [cadet];
        } else if (val === top[event].value) {
          top[event].cadets.push(cadet);
        }
      };

      updateTop('average', average);
      updateTop('pushups', pushupsRaw);
      updateTop('situps', situpsRaw);
      
      if (gender === 'F') {
        updateTop('flexarm', pullupsRaw);
      } else {
        updateTop('pullups', pullupsRaw);
      }
      
      // Some run formats might be weird (e.g. 0.5597 from Date parsing). Let's just track the minimum > 0
      updateTop('run', runRaw, true);
    }
  });

  return { data, topPerformers };
}
