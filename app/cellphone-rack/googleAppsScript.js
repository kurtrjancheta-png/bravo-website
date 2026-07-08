function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const changesArray = Array.isArray(payload) ? payload : [payload];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    for (const data of changesArray) {
      const { name, cadetClass, status, remarks, numPhones, phone, ig, model, color, dbRemarks, serial, baseUrl } = data;
      
      // 1. Update the Class Sheet
      let classSheetName = cadetClass + 'CL';
      if (classSheetName === '1CL' && !ss.getSheetByName('1CL')) classSheetName = 'Sheet1';
      
      const classSheet = ss.getSheetByName(classSheetName);
      if (classSheet) {
        updateRowByName(classSheet, name, {
          "STATUS": status,
          "REMARKS": remarks, // Authorized Reason
          "NUMBER OF PHONES": numPhones,
          "CP NUMBER": phone,
          "IG": ig
        });
      }
      
      // 2. Update the DATA BASE Sheet
      const dbSheet = ss.getSheetByName('DATA BASE');
      if (dbSheet) {
        const activeBaseUrl = baseUrl || 'https://bravo-website.vercel.app';
        const qrData = activeBaseUrl + '/cellphone-rack/scan?name=' + encodeURIComponent(name);
        const qrFormula = '=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(qrData) + '")';
        
        updateRowByName(dbSheet, name, {
          "PHONE": model, // Phone Model
          "COLOR": color,
          "REMARKS": dbRemarks, // Device identifying features
          "SERIAL": serial,
          "QR CODE": qrFormula
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
  
  let nameColIdx = headers.findIndex(h => h.includes('NAME'));
  if (nameColIdx === -1) nameColIdx = 0; // Default to first column if no 'NAME' header
  
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
