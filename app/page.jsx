import { getSheetData } from '../lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

export default async function Home() {
  // Fetch data
  const announcements = await getSheetData(SHEET_ID, 'Announcements');
  const trackers = await getSheetData(SHEET_ID, 'Trackers');

  // Today's date formatted
  const today = new Date();
  const options = { month: 'short', day: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);

  // Separate priority bulletins (assume first 2 or anything marked priority)
  // For now, we'll just slice the array for visual structure
  const priorityBulletins = announcements.slice(0, 2);
  const allAnnouncements = announcements.slice(2);

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <h1 className="hero-title">BRAVO COMPANY</h1>
        <div className="hero-subtitle">
          <span style={{ color: 'var(--accent-gold)' }}>&#9656;</span> DIGITAL BULLETIN BOARD SYSTEM
        </div>
        
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">{announcements.length || '-'}</span>
            <span className="stat-label">Announcements</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{trackers.length || '-'}</span>
            <span className="stat-label">Active Trackers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">4</span>
            <span className="stat-label">Councils</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{dateStr}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
      </div>

      {SHEET_ID === '' && (
         <div className="info-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ color: '#ef4444' }}>Configuration Needed</h3>
            <p>Please set the <code>GOOGLE_SHEET_ID</code> in Vercel to see your live data below.</p>
         </div>
      )}

      {/* Priority Bulletins Section */}
      <div className="section-header">
        <h2 className="section-title">PRIORITY BULLETINS</h2>
        <div className="section-subtitle">High-Priority Announcements</div>
      </div>

      {priorityBulletins.length > 0 ? (
        <div className="card-grid">
          {priorityBulletins.map((item, i) => (
            <div className="info-card" key={i}>
              <div className="card-top">
                <div className="card-tags">
                  <span className="tag tag-priority">PRIORITY</span>
                  <span className="tag">INFO</span>
                </div>
                <span className="card-date">{item.Date || dateStr}</span>
              </div>
              <h3 className="card-title">{item.Title || 'Untitled'}</h3>
              <p className="card-desc">{item.Content || 'No details provided.'}</p>
              <div className="card-footer">
                COMMAND COUNCIL
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>No priority bulletins.</p>
      )}

      {/* All Announcements Section */}
      <div className="section-header">
        <h2 className="section-title">ALL ANNOUNCEMENTS</h2>
        <div className="section-subtitle">Company-Wide Bulletins</div>
      </div>

      {allAnnouncements.length > 0 ? (
        <div className="card-grid">
          {allAnnouncements.map((item, i) => (
            <div className="info-card" key={i}>
              <div className="card-top">
                <div className="card-tags">
                  <span className="tag">STANDARD</span>
                </div>
                <span className="card-date">{item.Date || dateStr}</span>
              </div>
              <h3 className="card-title">{item.Title || 'Untitled'}</h3>
              <p className="card-desc">{item.Content || 'No details provided.'}</p>
              <div className="card-footer">
                GENERAL
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No other announcements.</p>
      )}
    </div>
  );
}
