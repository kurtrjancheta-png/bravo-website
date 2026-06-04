import { getSheetData } from '../../lib/googleSheets';

// User provided this specific sheet ID for the Task Org
const TASK_ORG_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
// User can override the tab name in Vercel if needed, defaults to 'TASK ORGANIZATION'
const SHEET_NAME = process.env.TASK_ORG_SHEET_NAME || 'TASK ORGANIZATION';

export default async function TaskOrganization() {
  const allRows = await getSheetData(TASK_ORG_SHEET_ID, SHEET_NAME);
  
  // Logic to only include down to the "First Sergeant"
  let filteredRows = [];
  let foundFirstSergeant = false;

  for (const row of allRows) {
    if (foundFirstSergeant) break;
    
    // Add the row
    filteredRows.push(row);
    
    // Check if any column in this row contains "First Sergeant"
    const isFirstSergeant = Object.values(row).some(val => 
      typeof val === 'string' && val.toLowerCase().includes('first sergeant')
    );
    
    if (isFirstSergeant) {
      foundFirstSergeant = true; // This will trigger the break on the NEXT loop iteration
    }
  }

  const headers = filteredRows.length > 0 ? Object.keys(filteredRows[0]) : [];

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">TASK ORGANIZATION</h1>
        <div className="section-subtitle">S1 Personnel Roster (Command to First Sergeant)</div>
      </div>

      {filteredRows.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex}>
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="info-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#d97706' }}>No Data Found</h3>
          <p>We couldn't find the Task Organization data. Please ensure the tab in your Google Sheet is named exactly <code>{SHEET_NAME}</code>, or set the <code>TASK_ORG_SHEET_NAME</code> environment variable in Vercel to the correct tab name.</p>
        </div>
      )}
    </div>
  );
}
