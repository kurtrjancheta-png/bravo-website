import { getSheetData } from '../../lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

export default async function Announcements() {
  const announcements = await getSheetData(SHEET_ID, 'Announcements');

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">ALL ANNOUNCEMENTS</h1>
        <div className="section-subtitle">Company-Wide Bulletins</div>
      </div>

      <div className="card-grid">
        {announcements.map((item, i) => (
          <div className="info-card" key={i}>
            <div className="card-top">
              <div className="card-tags">
                <span className="tag">INFO</span>
              </div>
              <span className="card-date">{item.Date || ''}</span>
            </div>
            <h3 className="card-title">{item.Title || 'Untitled'}</h3>
            <p className="card-desc">{item.Content || 'No details provided.'}</p>
            <div className="card-footer">
              BRAVO COMMAND
            </div>
          </div>
        ))}
      </div>
      
      {announcements.length === 0 && (
         <p style={{ color: 'var(--text-secondary)' }}>No announcements found.</p>
      )}
    </div>
  );
}
