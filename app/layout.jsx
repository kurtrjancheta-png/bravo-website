import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Bravo Company Board',
  description: 'Digital Bulletin Board System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          
          {/* Left Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="logo-circle">B</div>
              <div>
                <div className="company-title">BRAVO CO.</div>
                <div className="company-subtitle">DIGITAL BULLETIN BOARD</div>
              </div>
            </div>

            <div className="nav-section">
              <div className="nav-label">Main Navigation</div>
              <Link href="/">
                <div className="nav-item">
                  <span style={{ marginRight: '10px' }}>🏠</span> Home Overview
                </div>
              </Link>
              <Link href="/announcements">
                <div className="nav-item">
                  <span style={{ marginRight: '10px' }}>📢</span> Announcements
                </div>
              </Link>
              <Link href="/trackers">
                <div className="nav-item">
                  <span style={{ marginRight: '10px' }}>📊</span> Trackers
                </div>
              </Link>
            </div>

            <div className="nav-section">
              <div className="nav-label">Councils</div>
              
              <div className="nav-item-group">
                <div className="nav-item"><span style={{ marginRight: '10px' }}>👥</span> S1 Personnel</div>
                <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <Link href="/task-organization">
                    <div className="nav-item" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>↳ Task Organization</div>
                  </Link>
                </div>
              </div>

              <div className="nav-item"><span style={{ marginRight: '10px' }}>🛡️</span> S2 Security</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>⚙️</span> S3 Operations</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📦</span> S4 Logistics</div>
            </div>
            
            <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
               <div className="nav-label" style={{ padding: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="live-indicator"></div> SYSTEM LIVE
               </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-wrapper">
            {/* Top Bar */}
            <header className="topbar">
              <div className="breadcrumbs">
                BRAVO CO. BULLETIN BOARD / HOME
              </div>
              <div className="topbar-actions">
                <div className="badge-outline">
                  <div className="live-indicator"></div> LIVE FEED
                </div>
                <div className="badge-outline">
                  ⚙️ SETTINGS
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="main-content">
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}
