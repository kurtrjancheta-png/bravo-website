import { getSheetData } from '../../lib/googleSheets';
import FinanceDashboard from './FinanceDashboard';

// Finance Google Sheet ID
const FINANCE_SHEET_ID = '1lbg6Kj31YHIgxizY7-hmvEWVMuTgYF9N3qmUri6ri7Q';

export const revalidate = 30;

export default async function FinanceTrackerPage() {
  let trackers = {};
  let monthlySheets = {};

  try {
    // 2027 has a leading space in the Google Sheet name: " 2027"
    const trackerTabs = [' 2027', '2028', '2029', '2030'];
    const monthTabs = [
      'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'
    ];

    // Fetch all sheets in parallel
    const trackerPromises = trackerTabs.map(tab => getSheetData(FINANCE_SHEET_ID, tab).catch(() => []));
    const monthPromises = monthTabs.map(tab => getSheetData(FINANCE_SHEET_ID, tab).catch(() => []));

    const results = await Promise.all([...trackerPromises, ...monthPromises]);

    trackerTabs.forEach((tab, index) => {
      // Clean tab name for keys in component: '2027', '2028', '2029', '2030'
      const key = tab.trim();
      trackers[key] = results[index];
    });

    monthTabs.forEach((tab, index) => {
      monthlySheets[tab] = results[trackerTabs.length + index];
    });
  } catch (error) {
    console.error('Error fetching Finance Sheet data:', error);
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">FINANCE TRACKER</h1>
        <div className="section-subtitle">Finance Council Collections & Expense Management</div>
      </div>

      <FinanceDashboard 
        trackers={trackers}
        monthlySheets={monthlySheets}
      />
    </div>
  );
}
