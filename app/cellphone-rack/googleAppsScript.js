function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const changesArray = Array.isArray(payload) ? payload : [payload];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    for (const data of changesArray) {
      const { name, cadetClass, status, remarks, numPhones, phone, ig, model, color } = data;
      
      // 1. Update the Class Sheet
      let classSheetName = cadetClass + 'CL';
      if (classSheetName === '1CL' && !ss.getSheetByName('1CL')) classSheetName = 'Sheet1';
      
      const classSheet = ss.getSheetByName(classSheetName);
      if (classSheet) {
        updateRowByName(classSheet, name, {
          "STATUS": status,
          "REMARKS": remarks,
          "NUMBER OF PHONES": numPhones,
          "PHONE": phone,
          "IG": ig
        });
      }
      
      // 2. Update the DATA BASE Sheet
      const dbSheet = ss.getSheetByName('DATA BASE');
      if (dbSheet) {
        updateRowByName(dbSheet, name, {
          "MODEL": model,
          "COLOR": color
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateRowByName(sheet, targetName, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toUpperCase().trim());
  
  const nameColIdx = headers.findIndex(h => h.includes('NAME'));
  if (nameColIdx === -1) return; // No name column found
  
  // Find the row
  for (let r = 1; r < data.length; r++) {
    const rowName = String(data[r][nameColIdx]).toUpperCase().trim();
    if (rowName.includes(targetName.toUpperCase().trim()) && targetName.trim() !== '') {
      // Row found! Update the specified columns
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined) continue; // Skip undefined values
        const colIdx = headers.findIndex(h => h.includes(key));
        if (colIdx !== -1) {
          sheet.getRange(r + 1, colIdx + 1).setValue(val);
        }
      }
      break;
    }
  }
}
