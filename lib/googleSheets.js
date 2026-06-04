export async function getSheetData(sheetId, sheetName) {
  if (!sheetId) return [];

  // This endpoint works for any Google Sheet that is set to "Anyone with the link can view"
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  
  try {
    // We revalidate every 10 seconds so updates on the sheet show up quickly
    const res = await fetch(url, { next: { revalidate: 10 } }); 
    const text = await res.text();
    
    // The response is wrapped in a function call, we extract the JSON
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);
    
    // Extract column headers
    const columns = data.table.cols.map(col => col.label);
    
    // Map rows into an array of objects
    const rows = data.table.rows.map(row => {
      const rowData = {};
      row.c.forEach((cell, i) => {
        const columnName = columns[i] || `Column ${i + 1}`;
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
