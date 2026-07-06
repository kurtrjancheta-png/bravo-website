// CSV parser that handles quotes and newlines within fields
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',') {
      if (inQuotes) {
        row[row.length - 1] += c;
      } else {
        row.push("");
      }
    } else if (c === '\r' || c === '\n') {
      if (inQuotes) {
        row[row.length - 1] += c;
      } else {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      }
    } else {
      row[row.length - 1] += c;
    }
  }

  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Fetch a single sheet tab as CSV
async function fetchSheetCSV(sheetId, tabName) {
  if (!sheetId) return [];
  const cacheBuster = Math.floor(Date.now() / 10000);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&cb=${cacheBuster}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`HTTP error fetching sheet: ${res.status} for tab ${tabName}`);
      return [];
    }
    const text = await res.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Error fetching sheet ${tabName}:`, error);
    return [];
  }
}

// Fetch and parse current academic deficiencies from the primary sheet
export async function getAcademicDeficiencies() {
  const sheetId = process.env.ACADEMIC_SHEET_ID;
  if (!sheetId) {
    console.error('ACADEMIC_SHEET_ID is not configured in environment variables');
    return {};
  }

  const tabs = ['1CL ACADS', '2CL ACADS', '3CL ACADS', '4CL ACADS'];
  const result = {};

  for (const tab of tabs) {
    const className = tab.split(' ')[0]; // "1CL", "2CL", etc.
    const csvRows = await fetchSheetCSV(sheetId, tab);

    if (csvRows.length < 3) {
      result[className] = { cadets: [], subjects: [], updateDate: 'No data' };
      continue;
    }

    // Find the header row index where Column 0 is "NO" and Column 1 is "NAME"
    let headerRowIdx = -1;
    let updateDate = '';

    for (let r = 0; r < csvRows.length; r++) {
      const row = csvRows[r];
      if (row.length > 1) {
        const col0 = String(row[0]).trim().toUpperCase();
        const col1 = String(row[1]).trim().toUpperCase();
        if (col0 === 'NO' && col1 === 'NAME') {
          headerRowIdx = r;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      result[className] = { cadets: [], subjects: [], updateDate: 'Headers not found' };
      continue;
    }

    // Parse update date by searching preceding rows for "UPDATED AS OF"
    for (let r = 0; r < headerRowIdx; r++) {
      const row = csvRows[r];
      const matchIdx = row.findIndex(val => String(val).toUpperCase().includes('UPDATED AS OF'));
      if (matchIdx !== -1) {
        // Find next non-empty cell in this row
        for (let colIdx = matchIdx + 1; colIdx < row.length; colIdx++) {
          if (row[colIdx] && row[colIdx].trim() !== '') {
            updateDate = row[colIdx].trim();
            break;
          }
        }
      }
      if (updateDate) break;
    }

    const headers = csvRows[headerRowIdx].map(h => h.trim());
    // Subjects are headers from index 2 onwards
    const subjects = headers.slice(2).filter(h => h !== '');

    const dataRows = csvRows.slice(headerRowIdx + 1);
    const cadets = [];

    for (const row of dataRows) {
      if (row.length < 2) continue;
      const no = String(row[0]).trim();
      const name = String(row[1]).trim();
      if (!name || name === '' || name.toUpperCase() === 'NAME') continue;

      const deficiencies = {};
      let isDeficient = false;

      for (let colIdx = 2; colIdx < headers.length; colIdx++) {
        const subject = headers[colIdx];
        if (!subject) continue;

        const valStr = row[colIdx] ? String(row[colIdx]).trim() : '';
        if (valStr !== '') {
          const valNum = parseFloat(valStr);
          if (!isNaN(valNum) && valNum < 0) {
            deficiencies[subject] = valNum;
            isDeficient = true;
          }
        }
      }

      cadets.push({
        no,
        name,
        isDeficient,
        deficiencies,
        deficienciesCount: Object.keys(deficiencies).length,
        totalPoints: Object.values(deficiencies).reduce((sum, val) => sum + val, 0)
      });
    }

    result[className] = {
      cadets,
      subjects,
      updateDate: updateDate || 'Not specified'
    };
  }

  return result;
}

// Fetch and parse historical logs from the log sheet
export async function getAcademicHistoryLogs() {
  const sheetId = process.env.ACADEMIC_LOG_SHEET_ID;
  if (!sheetId) {
    console.error('ACADEMIC_LOG_SHEET_ID is not configured in environment variables');
    return [];
  }

  const csvRows = await fetchSheetCSV(sheetId, 'Logs');
  if (csvRows.length < 2) return [];

  const headers = csvRows[0].map(h => h.trim().toUpperCase());
  const dataRows = csvRows.slice(1);

  const logs = [];

  for (const row of dataRows) {
    if (row.length < 5) continue;
    
    // Header format: Date, Class, Name, Subject, Deficiency
    const date = row[0] ? String(row[0]).trim() : '';
    const className = row[1] ? String(row[1]).trim().toUpperCase() : '';
    const name = row[2] ? String(row[2]).trim() : '';
    const subject = row[3] ? String(row[3]).trim() : '';
    const valNum = parseFloat(row[4]);

    if (date && className && name && subject && !isNaN(valNum)) {
      logs.push({
        date,
        class: className,
        name,
        subject,
        value: valNum
      });
    }
  }

  return logs;
}
