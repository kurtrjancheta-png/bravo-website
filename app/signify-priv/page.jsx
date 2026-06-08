import { getSheetData } from '../../lib/googleSheets';
import PrivilegesClient from './PrivilegesClient';

export const revalidate = 15; // 15 second cache to ensure fast updates

const PRIVILEGES_SHEET_ID = '16i_7nny1QbFkFvhqnTX9ebgCOT7WeUmq8Uz_r5Vaj5w';

export default async function SignifyPrivilegePage() {
  let activePrivileges = [];
  
  try {
    const data = await getSheetData(PRIVILEGES_SHEET_ID, 'ACTIVE PRIV SIGNIFY SHEETS');
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
             const month = parseInt(match[2], 10);
             const day = parseInt(match[3], 10);
             const hours = parseInt(match[4], 10);
             const mins = parseInt(match[5], 10);
             const secs = parseInt(match[6], 10);
             const dateObj = new Date(year, month, day, hours, mins, secs);
             rawDeadline = dateObj.toISOString();
           } else {
             // Try simpler date match
             const match2 = String(rawDeadline).match(/Date\((\d+),(\d+),(\d+)\)/);
             if (match2) {
               const year = parseInt(match2[1], 10);
               const month = parseInt(match2[2], 10);
               const day = parseInt(match2[3], 10);
               const dateObj = new Date(year, month, day);
               rawDeadline = dateObj.toISOString();
             }
           }
         }

         return {
           ...row,
           'DATE': rawDate,
           'DEADLINE': rawDeadline
         };
       });
       
       // Reverse so newest are at the top
       activePrivileges.reverse();
    }
  } catch (error) {
    console.error('Failed to fetch active privileges:', error);
  }

  return (
    <div className="dashboard-container">
      <PrivilegesClient activePrivileges={activePrivileges} />
    </div>
  );
}
