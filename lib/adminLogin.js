export const CREDENTIALS_SHEET_ID = '1swr5eI5C8HUleLD28wr1Ax_VJ26l8DAKE-GfEzzltRc';
export const CREDENTIALS_TAB_NAME = 'CREDENTIALS';

export async function fetchCredentials() {
  const cacheBuster = Math.floor(Date.now() / 10000);
  const url = `https://docs.google.com/spreadsheets/d/${CREDENTIALS_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CREDENTIALS_TAB_NAME}&cb=${cacheBuster}`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' }); 
    const text = await res.text();
    
    // The response is wrapped in a function call, we extract the JSON
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);
    
    // Extract column headers
    let columns = data.table.cols.map(col => col.label);
    
    // Check if all column labels are empty (first row is header)
    const allLabelsEmpty = columns.every(c => !c || c.trim() === '');
    let startRow = 0;

    if (allLabelsEmpty && data.table.rows.length > 0) {
      const headerRow = data.table.rows[0];
      columns = headerRow.c.map((cell, i) => {
        if (cell && cell.v !== null) return String(cell.v).trim();
        return `Column ${i + 1}`;
      });
      startRow = 1;
    }

    const uniqueColumns = [];
    const seenColNames = {};
    columns.forEach((c, i) => {
      let name = (c || `Column ${i + 1}`).trim();
      if (seenColNames[name]) {
        seenColNames[name]++;
        name = `${name} (${seenColNames[name]})`;
      } else {
        seenColNames[name] = 1;
      }
      uniqueColumns.push(name);
    });

    const credentials = data.table.rows.slice(startRow).map(row => {
      const rowData = {};
      row.c.forEach((cell, i) => {
        const columnName = uniqueColumns[i];
        rowData[columnName] = cell ? (cell.v !== null ? cell.v : cell.f) : '';
      });
      return {
        council: String(rowData['COUNCIL'] || rowData['Column 1'] || '').trim(),
        username: String(rowData['Username'] || rowData['Column 2'] || '').trim(),
        password: String(rowData['password'] || rowData['Column 3'] || '').trim()
      };
    }).filter(cred => cred.username && cred.password);
    
    return credentials;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return [];
  }
}

export async function validateLogin(username, password) {
  const credentials = await fetchCredentials();
  
  const user = credentials.find(c => c.username === username && c.password === password);
  
  if (user) {
    return { success: true, council: user.council, username: user.username };
  }
  return { success: false, error: 'Invalid username or password' };
}
