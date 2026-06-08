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
              <div className="logo-circle" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
                <img src="/logo.png" alt="Bravo Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
              </div>
              <div>
                <div className="company-title">BRAVO CO.</div>
                <div className="company-subtitle">DIGITAL BULLETIN BOARD</div>
              </div>
            </div>

            <div className="nav-section">
              <div className="nav-label">Main Navigation</div>
              <Link href="/" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>🏠</span> Home Overview
              </Link>
              <div className="nav-item"><span style={{ marginRight: '10px' }}>📅</span> Event Calendar</div>
              <Link href="/exo-punishment" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>📋</span> F/SGT's Punishment Monitoring
              </Link>
            </div>

            <div className="nav-section">
              <div className="nav-label">Councils</div>
              
              <details className="nav-item-group" style={{ cursor: 'pointer' }}>
                <summary id="nav-s1" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>👥</span> S1 Personnel
                  <span className="dropdown-arrow">▼</span>
                </summary>
                <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  <Link href="/task-organization" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Task Organization
                  </Link>
                  <Link href="/roster" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Company Roster
                  </Link>
                  <Link href="/disposition" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Troop Disposition
                  </Link>
                  <Link href="/disseminations/s1" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Disseminations
                  </Link>
                </div>
              </details>

              <Link href="/disseminations/s2" id="nav-s2" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🛡️</span> S2 Security</Link>
              <Link href="/disseminations/s3" id="nav-s3" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>⌖</span> S3 Operations</Link>
              <Link href="/disseminations/s4" id="nav-s4" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📦</span> S4 Logistics</Link>
              <Link href="/disseminations/s5" id="nav-s5" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📊</span> S5 Plans &amp; Programs</Link>
              
              <details className="nav-item-group" style={{ cursor: 'pointer' }}>
                <summary id="nav-s6" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>📡</span> S6 Signal
                  <span className="dropdown-arrow">▼</span>
                </summary>
                <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  <Link href="/cellphone-rack" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Smartphone Rack
                  </Link>
                  <Link href="/disseminations/s6" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Disseminations
                  </Link>
                </div>
              </details>

              <Link href="/disseminations/s7" id="nav-s7" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🤝</span> S7 Civil-Military</Link>
              <Link href="/disseminations/s8" id="nav-s8" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📚</span> S8 Education &amp; Training / Academic Council</Link>
              <Link href="/disseminations/s10" id="nav-s10" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>💰</span> S10 Finance</Link>
              
              <details className="nav-item-group" style={{ cursor: 'pointer' }}>
                <summary id="nav-athletic" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🏃</span> Athletic Council
                  <span className="dropdown-arrow">▼</span>
                </summary>
                <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  <Link href="/pft-tracker" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    PFT Tracker
                  </Link>
                  <Link href="/disseminations/athletic" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                    Disseminations
                  </Link>
                </div>
              </details>
              
              <Link href="/disseminations/honor-comm" id="nav-honor" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>⚖️</span> Honor Committee</Link>
              <Link href="/disseminations/ccpb" id="nav-ccpb" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>👮</span> CCPB</Link>
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
