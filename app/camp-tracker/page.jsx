import CampTrackerClient from './CampTrackerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // 30 seconds

export default async function CampTrackerPage() {
  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">CAMP MONITORING TRACKER</h1>
        <div className="section-subtitle">
          S5 Plans & Programs consolidated monitoring for <strong>C</strong>haracter, <strong>A</strong>cademics, <strong>M</strong>ilitary, and <strong>P</strong>hysical performance.
        </div>
      </div>
      <CampTrackerClient />
    </div>
  );
}
