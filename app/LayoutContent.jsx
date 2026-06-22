'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AutoRefresh from './AutoRefresh';
import LoginModal from './LoginModal';
import { useAuth } from './AuthContext';

export default function LayoutContent({ children }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { adminUser, logout, isLoaded } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const savedMode = localStorage.getItem('bravo_dark_mode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('bravo_dark_mode', newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return (
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
          <Link href="/event-calendar" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>📅</span> Event Calendar
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-label">Councils</div>
          
          <Link href="/disseminations/taco" id="nav-taco" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🌟</span> Tac O's Corner</Link>
          <Link href="/disseminations/co" id="nav-co" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>⭐</span> CO's Corner</Link>
          <details className="nav-item-group" style={{ cursor: 'pointer' }}>
            <summary id="nav-exo" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>⚡</span> EX-O's Corner
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/exo-guards" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Guard Posting Dashboard
              </Link>
              {adminUser && adminUser.council === 'EXO' && (
                <Link href="/exo-guards/manage" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                  Guard Posting Manager
                </Link>
              )}
              <Link href="/disseminations/exo" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <details className="nav-item-group" style={{ cursor: 'pointer' }}>
            <summary id="nav-fsgt" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>📋</span> FSGT's Corner
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/exo-punishment" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Punishment Monitoring
              </Link>
              <Link href="/disseminations/fsgt" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          
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
              <Link href="/signify-priv" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Privilege Signify
              </Link>
              <Link href="/disseminations/s1" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>

          <details className="nav-item-group" style={{ cursor: 'pointer' }}>
            <summary id="nav-s2" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>🛡️</span> S2 Security
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/s2/rifle-directory" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Rifle Directory
              </Link>
              <Link href="/disseminations/s2" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <details className="nav-item-group" style={{ cursor: 'pointer' }}>
            <summary id="nav-s3" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>⌖</span> S3 Operations
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              {adminUser && adminUser.council === 'S3' && (
                <Link href="/calendar-manager" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                  Calendar Manager
                </Link>
              )}
              <Link href="/disseminations/s3" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <Link href="/disseminations/s4" id="nav-s4" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📦</span> S4 Logistics</Link>
          <Link href="/disseminations/s5" id="nav-s5" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📊</span> S5 Plans & Programs</Link>
          
          <details className="nav-item-group" style={{ cursor: 'pointer' }}>
            <summary id="nav-s6" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>📡</span> S6 Signal
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/cellphone-rack" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Smartphone Rack
              </Link>
              <Link href="/tablet-directory" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Tablet Directory
              </Link>
              <Link href="/disseminations/s6" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>

          <Link href="/disseminations/s7" id="nav-s7" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🤝</span> S7 Civil-Military</Link>
          <Link href="/disseminations/s8" id="nav-s8" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📚</span> S8 Education & Training / Academic Council</Link>
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
           <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div 
                className="badge-outline" 
                onClick={toggleDarkMode}
                style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}
              >
                 {isDarkMode ? '☀️ LIGHT MODE' : '⚙️ DARK MODE'}
              </div>
              {isLoaded && (
                adminUser ? (
                  <div 
                    className="badge-outline" 
                    onClick={logout}
                    style={{ cursor: 'pointer', padding: '0.35rem 1rem', background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca', whiteSpace: 'nowrap' }}
                    title={`Logged in as ${adminUser.username} (${adminUser.council})`}
                  >
                    LOG OUT ({adminUser.council})
                  </div>
                ) : (
                  <div 
                    className="badge-outline" 
                    onClick={() => setIsLoginModalOpen(true)}
                    style={{ cursor: 'pointer', padding: '0.35rem 1rem' }}
                    title="Log in as Administrator"
                  >
                    Log in as Administrator
                  </div>
                )
              )}
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Bar (Only visible on Home Overview) */}
        {pathname === '/' && (
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
        )}

        {/* Page Content */}
        <main className="main-content">
          <AutoRefresh intervalMs={30000} />
          {children}
        </main>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
