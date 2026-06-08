import { getSheetData } from '../../lib/googleSheets';
import PrivilegesClient from './PrivilegesClient';

export const revalidate = 15; // 15 second cache to ensure fast updates

const PRIVILEGES_SHEET_ID = '16i_7nny1QbFkFvhqnTX9ebgCOT7WeUmq8Uz_r5Vaj5w';

export default async function SignifyPrivilegePage() {
  let activePrivileges = [];
  
  try {
    const data = await getSheetData(PRIVILEGES_SHEET_ID, 'ACTIVE PRIV SIGNIFY SHEETS');
    // Ensure we filter out empty rows
    if (data && Array.isArray(data)) {
       activePrivileges = data.filter(row => row['TYPE'] && row['DATE']);
       
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
