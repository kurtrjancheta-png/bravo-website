export async function getSheetData(sheetId, sheetName) {
  if (!sheetId) return [];

  // This endpoint works for any Google Sheet that is set to "Anyone with the link can view"
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  
  try {
    // Revalidate every 30 seconds so updates on the sheet show up quickly
    const res = await fetch(url, { next: { revalidate: 30 } }); 
    const text = await res.text();
    
    // The response is wrapped in a function call, we extract the JSON
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);
    
    // Extract column headers from the API
    let columns = data.table.cols.map(col => col.label);
    
    // Check if all column labels are empty — if so, the first row IS the header row
    const allLabelsEmpty = columns.every(c => !c || c.trim() === '');
    let startRow = 0;

    if (allLabelsEmpty && data.table.rows.length > 0) {
      // Use the first data row as column headers
      const headerRow = data.table.rows[0];
      columns = headerRow.c.map((cell, i) => {
        if (cell && cell.v !== null) return String(cell.v).trim();
        return `Column ${i + 1}`;
      });
      startRow = 1; // Skip the header row in the data
    }

    // Ensure all column names are unique and trimmed
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

    // Map remaining rows into an array of objects
    const rows = data.table.rows.slice(startRow).map(row => {
      const rowData = {};
      row.c.forEach((cell, i) => {
        const columnName = uniqueColumns[i];
        rowData[columnName] = cell ? (cell.v !== null ? cell.v : cell.f) : '';
      });
      return rowData;
    });
    
    return rows;
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return [];
  }
}

// Convert Google Drive share/view links to direct embeddable image URLs
export function driveUrlToImage(url) {
  if (!url || typeof url !== 'string') return '';
  
  // Extract file ID from various Google Drive URL formats
  // Format 1: https://drive.google.com/file/d/FILE_ID/view...
  // Format 2: https://drive.google.com/open?id=FILE_ID
  let fileId = '';
  
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  if (match1) fileId = match1[1];
  else if (match2) fileId = match2[1];
  else return url; // Return as-is if it's already a direct URL
  
  // Use Google Drive thumbnail endpoint for reliable image serving
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
}
