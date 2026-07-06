import { getAcademicDeficiencies, getAcademicHistoryLogs } from '../../lib/academicParser';
import AcademicDashboardClient from './AcademicDashboardClient';

export const revalidate = 30;

export default async function AcademicTrackerPage() {
  const academicSheetId = process.env.ACADEMIC_SHEET_ID;
  const logSheetId = process.env.ACADEMIC_LOG_SHEET_ID;

  let deficienciesData = null;
  let historyLogs = [];

  if (academicSheetId) {
    try {
      const [parsedDeficiencies, parsedLogs] = await Promise.all([
        getAcademicDeficiencies(),
        getAcademicHistoryLogs()
      ]);
      console.log("SERVER SIDE 3CL CADETS COUNT:", parsedDeficiencies["3CL"]?.cadets?.length);
      console.log("SERVER SIDE 3CL CADETS NAMES:", parsedDeficiencies["3CL"]?.cadets?.map(c => c.name));
      deficienciesData = parsedDeficiencies;
      historyLogs = parsedLogs;
    } catch (e) {
      console.error('Error fetching academic data:', e);
    }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">ACADEMIC DEFICIENCY TRACKER</h1>
        <div className="section-subtitle">Academic Council monitoring & grade deficiency analytics</div>
      </div>

      {!academicSheetId ? (
        <div className="info-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#d97706' }}>Spreadsheet Not Configured</h3>
          <p>Please set the <code>ACADEMIC_SHEET_ID</code> environment variable in your local environment file or server config.</p>
        </div>
      ) : (
        <AcademicDashboardClient
          initialDeficienciesData={deficienciesData}
          initialHistoryLogs={historyLogs}
        />
      )}
    </div>
  );
}
