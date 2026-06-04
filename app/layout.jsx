import './globals.css';
import Link from 'next/link';
import AutoRefresh from './AutoRefresh';

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
              <div className="nav-item"><span style={{ marginRight: '10px' }}>⭐</span> Company Staff</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📅</span> Event Calendar</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📱</span> Smartphone Rack</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📇</span> Company Roster</div>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📋</span> EXO Punishment List</div>
            </div>

            <div className="nav-section">
              <div className="nav-label">Councils</div>
              
              <details className="nav-item-group" style={{ cursor: 'pointer' }}>
                <summary id="nav-s1" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>👥</span> S1 Personnel
                  <span className="dropdown-arrow">▼</span>
                </summary>
                <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  <Link href="/task-organization">
                    <div className="nav-item" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>Task Organization</div>
                  </Link>
                </div>
              </details>

              <div id="nav-s2" className="nav-item"><span style={{ marginRight: '10px' }}>🛡️</span> S2 Security</div>
              <div id="nav-s3" className="nav-item"><span style={{ marginRight: '10px' }}>⌖</span> S3 Operations</div>
              <div id="nav-s4" className="nav-item"><span style={{ marginRight: '10px' }}>📦</span> S4 Logistics</div>
              <div id="nav-s5" className="nav-item"><span style={{ marginRight: '10px' }}>📊</span> S5 Plans &amp; Programs</div>
              <div id="nav-s6" className="nav-item"><span style={{ marginRight: '10px' }}>📡</span> S6 Signal</div>
              <div id="nav-s7" className="nav-item"><span style={{ marginRight: '10px' }}>🤝</span> S7 Civil-Military</div>
              <div id="nav-s8" className="nav-item"><span style={{ marginRight: '10px' }}>📚</span> S8 Education &amp; Training</div>
              <div id="nav-s10" className="nav-item"><span style={{ marginRight: '10px' }}>💰</span> S10 Finance</div>
              <div id="nav-athletic" className="nav-item"><span style={{ marginRight: '10px' }}>🏃</span> Athletic Council</div>
              <div id="nav-academic" className="nav-item"><span style={{ marginRight: '10px' }}>🎓</span> Academic Council</div>
            </div>
            
            <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
               <div className="nav-label" style={{ padding: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="live-indicator"></div> SYSTEM LIVE
               </div>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="badge-outline" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                     ⚙️ DARK MODE
                  </div>
                  <div className="badge-outline" style={{ cursor: 'pointer', padding: '0.35rem 1rem' }}>
                     🔒
                  </div>
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
              <AutoRefresh intervalMs={30000} />
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}
