import { getSheetData } from '../../lib/googleSheets';
import PrivilegesClient from './PrivilegesClient';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PRIVILEGES_SHEET_ID = '16i_7nny1QbFkFvhqnTX9ebgCOT7WeUmq8Uz_r5Vaj5w';
const SOI_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export default async function SignifyPrivilegePage() {
  let activePrivileges = [];
  let soiData = [];
  
  try {
    // Fetch Privileges
    const data = await getSheetData(PRIVILEGES_SHEET_ID, 'ACTIVE PRIV SIGNIFY SHEETS');
    
    // Load local deleted list if any
    let deletedPrivs = [];
    try {
      const deletedFilePath = path.join(process.cwd(), 'lib', 'deletedPrivileges.json');
      if (fs.existsSync(deletedFilePath)) {
        deletedPrivs = JSON.parse(fs.readFileSync(deletedFilePath, 'utf8'));
      }
    } catch (fsErr) {
      console.error('Failed to read deleted privileges:', fsErr);
    }

    // Ensure we filter out empty rows by checking for any type key
    if (data && Array.isArray(data)) {
       activePrivileges = data.filter(row => {
         const type = row['TYPE'] || row['TYPE OF PRIV'];
         return !!type;
       }).map(row => {
         let rawDate = row['DATE'] || row['DATE OF PRIV'] || '';
         if (String(rawDate).includes('Date(')) {
           const match = String(rawDate).match(/Date\((\d+),(\d+),(\d+)\)/);
           if (match) {
             const year = parseInt(match[1], 10);
             const month = parseInt(match[2], 10) + 1; // 0-indexed in Sheets API
             const day = parseInt(match[3], 10);
             rawDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
           }
         }
         
         // Fix deadline parsing as well
         let rawDeadline = row['DEADLINE'] || row['DEADLINE '] || '';
         if (String(rawDeadline).includes('Date(')) {
           const match = String(rawDeadline).match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
           if (match) {
             const year = parseInt(match[1], 10);
             const month = parseInt(match[2], 10) + 1; // 0-indexed month
             const day = parseInt(match[3], 10);
             const hours = parseInt(match[4], 10);
             const mins = parseInt(match[5], 10);
             const secs = parseInt(match[6], 10);
             
             // Format explicitly with +08:00 offset to lock in Philippine time
             const pad = (n) => n.toString().padStart(2, '0');
             rawDeadline = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(mins)}:${pad(secs)}+08:00`;
           } else {
             // Try simpler date match
             const match2 = String(rawDeadline).match(/Date\((\d+),(\d+),(\d+)\)/);
             if (match2) {
               const year = parseInt(match2[1], 10);
               const month = parseInt(match2[2], 10) + 1;
               const day = parseInt(match2[3], 10);
               const pad = (n) => n.toString().padStart(2, '0');
               rawDeadline = `${year}-${pad(month)}-${pad(day)}T00:00:00+08:00`;
             }
           }
         }

         return {
           ...row,
           'DATE': rawDate,
           'DEADLINE': rawDeadline
         };
       }).filter(row => {
         const rawType = row.TYPE || row['TYPE OF PRIV'] || 'Unknown';
         const rawDate = row.DATE || row['DATE OF PRIV'] || 'No Date';
         const rawSheetName = row['SHEET NAME'] || row[''] || `${rawType} ${rawDate}`;
         return !deletedPrivs.includes(rawSheetName);
       });
       
       // Reverse so newest are at the top
       activePrivileges.reverse();
    }

    // Fetch SOI data for autocomplete
    soiData = await getSheetData(SOI_SHEET_ID, 'SOI');

  } catch (error) {
    console.error('Failed to fetch active privileges or SOI data:', error);
  }

  return (
    <div className="dashboard-container">
      <PrivilegesClient activePrivileges={activePrivileges} soiData={soiData} />
    </div>
  );
}
