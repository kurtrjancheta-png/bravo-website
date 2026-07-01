'use client';

import React, { useState, useEffect } from 'react';

const formatMilitaryTime = (timeStr) => {
  if (!timeStr) return '—';
  const clean = String(timeStr).trim().toUpperCase();
  if (clean.endsWith('H')) return clean;
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length === 3) {
    return '0' + digits + 'H';
  }
  if (digits.length === 4) {
    return digits + 'H';
  }
  return clean + 'H';
};

export default function CCQBulletinClient({
  ocName,
  aocName,
  ocStale,
  guards,
  guardsStale,
  socRows,
  socStale,
  bestBest,
  bestBestStale,
}) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const dateOptions = { timeZone: 'Asia/Manila', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      setTime(now.toLocaleTimeString('en-US', options) + ' H');
      setDateStr(now.toLocaleDateString('en-US', dateOptions));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getValue = (classPrefix, categorySuffix) => {
    const match = (bestBest || []).find(b => b.category === `${classPrefix} ${categorySuffix}`);
    return match ? match.winner || match.value : '';
  };

  const getRoom = (classPrefix, categorySuffix) => {
    const match = (bestBest || []).find(b => b.category === `${classPrefix} ${categorySuffix}`);
    return match ? match.room : '';
  };

  // Get most recent date from payload
  const mostRecentDate = bestBest && bestBest.length > 0 ? (bestBest[0].date || '') : '';

  return (
    <div className="ccq-bulletin-container">
      <style dangerouslySetInnerHTML={{__html: `
        .ccq-bulletin-container {
          color: var(--text-primary);
          max-width: 1600px;
          margin: 0 auto;
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Compact Header Styles */
        .ccq-header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.85rem;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .ccq-title-area h1 {
          font-size: 1.75rem;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ccq-title-area p {
          margin: 0.15rem 0 0 0;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .ccq-time-card {
          text-align: right;
          background: rgba(212, 175, 55, 0.03);
          border: 1px solid var(--accent-gold);
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.1);
          padding: 0.4rem 1rem;
          border-radius: 8px;
          min-width: 170px;
        }

        .ccq-time-val {
          font-family: monospace;
          font-size: 1.4rem;
          font-weight: 900;
          color: var(--accent-gold);
          letter-spacing: 0.05em;
        }

        .ccq-date-val {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Duty Officers Bar */
        .ccq-officers-bar {
          display: flex;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          margin-bottom: 1.25rem;
          gap: 1.5rem;
          align-items: center;
        }

        .ccq-officer-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
        }

        .ccq-officer-label {
          color: var(--text-secondary);
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
        }

        .ccq-officer-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .ccq-officer-name.oc-name {
          color: var(--accent-gold);
        }

        .stale-badge {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        /* Main Grid */
        .ccq-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 1024px) {
          .ccq-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        .command-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.6rem;
          margin-bottom: 1rem;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .card-meta-text {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* Google Calendar Style Timeline */
        .soc-timeline {
          position: relative;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .soc-timeline::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 2px;
          background: var(--border-color);
        }

        .soc-timeline-item {
          position: relative;
          margin-bottom: 1rem;
        }

        .soc-timeline-item:last-child {
          margin-bottom: 0;
        }

        .soc-timeline-dot {
          position: absolute;
          left: -1.5rem;
          top: 0.55rem;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--border-color);
          border: 2px solid var(--bg-secondary);
          z-index: 2;
        }

        .soc-timeline-item:hover .soc-timeline-dot {
          background: var(--accent-gold);
          border-color: var(--bg-secondary);
          box-shadow: 0 0 6px rgba(212, 175, 55, 0.5);
        }

        .soc-timeline-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: relative;
        }

        .soc-timeline-card:hover {
          border-color: var(--accent-gold);
          transform: translateX(4px);
        }

        .soc-time-display {
          font-family: monospace;
          font-weight: 800;
          color: var(--accent-gold);
          font-size: 0.9rem;
          letter-spacing: 0.02em;
        }

        .soc-activity-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .soc-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.1rem;
        }

        .soc-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          border: 1px solid transparent;
        }

        .soc-badge-uniform {
          background: rgba(212, 175, 55, 0.07);
          border-color: rgba(212, 175, 55, 0.15);
          color: var(--accent-gold);
        }

        .soc-badge-formation {
          background: rgba(66, 133, 244, 0.07);
          border-color: rgba(66, 133, 244, 0.15);
          color: #4285f4;
        }

        /* Guards List */
        .guards-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .guard-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
        }

        .guard-info {
          flex: 1;
          min-width: 0;
          padding-right: 0.5rem;
        }

        .guard-position {
          font-size: 0.6rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 700;
        }

        .guard-name {
          font-weight: 700;
          color: var(--text-primary);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          margin-top: 0.05rem;
        }

        .duty-badge {
          background: rgba(212, 175, 55, 0.08);
          color: var(--accent-gold);
          padding: 0.15rem 0.5rem;
          border-radius: 5px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .bestbest-btn {
          background: var(--accent-gold);
          color: #000;
          font-weight: 700;
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 0.75rem;
          width: 100%;
          transition: all 0.2s;
        }
        .bestbest-btn:hover {
          background: #e5c158;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
        }

        /* Responsive optimizations for cellphone */
        @media (max-width: 768px) {
          .ccq-bulletin-container {
            padding: 0.5rem;
          }

          /* Collapse Header into minimalist layout */
          .ccq-header-section {
            flex-direction: row;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.4rem;
            margin-bottom: 0.5rem;
            gap: 0.5rem;
          }

          .ccq-title-area h1 {
            font-size: 1.15rem;
            letter-spacing: -0.01em;
          }

          .ccq-title-area p {
            display: none; /* Hide subtitle completely on small phones */
          }

          .ccq-time-card {
            padding: 0.2rem 0.5rem;
            min-width: 0;
            border: 1px solid var(--accent-gold);
            background: transparent;
            box-shadow: none;
          }

          .ccq-time-val {
            font-size: 0.9rem;
          }

          .ccq-date-val {
            font-size: 0.55rem;
          }

          /* Compact status bar layout for duty officers */
          .ccq-officers-bar {
            padding: 0.4rem 0.6rem;
            margin-bottom: 0.65rem;
            gap: 0.4rem;
            flex-direction: row;
            justify-content: space-between;
            border-radius: 6px;
          }

          .ccq-officer-item {
            font-size: 0.7rem;
            flex: 1 1 auto;
            gap: 0.25rem;
          }

          .ccq-officer-label {
            font-size: 0.55rem;
          }

          /* Minimise command cards padding and font sizes */
          .command-card {
            padding: 0.75rem !important;
            border-radius: 8px !important;
          }

          .card-header-row {
            padding-bottom: 0.4rem;
            margin-bottom: 0.65rem;
          }

          .card-title {
            font-size: 0.85rem;
          }

          /* Google Calendar Timeline layout */
          .soc-timeline {
            padding-left: 1rem;
          }

          .soc-timeline::before {
            left: 2px;
          }

          .soc-timeline-dot {
            left: -1.2rem;
            top: 0.5rem;
            width: 8px;
            height: 8px;
          }

          .soc-timeline-card {
            padding: 0.5rem 0.65rem;
          }

          .soc-time-display {
            font-size: 0.8rem;
          }

          .soc-activity-title {
            font-size: 0.8rem;
          }

          .soc-badge {
            font-size: 0.6rem;
            padding: 0.1rem 0.3rem;
          }
        }
      `}} />

      {/* HEADER SECTION - ULTRA COMPACT */}
      <div className="ccq-header-section">
        <div className="ccq-title-area">
          <h1>🔔 CCQ Duty Board</h1>
          <p>Bravo Company Integrated Online Bulletin</p>
        </div>

        <div className="ccq-time-card">
          <div className="ccq-time-val">{time || '00:00:00 H'}</div>
          <div className="ccq-date-val">{dateStr || 'LOADING DATE...'}</div>
        </div>
      </div>

      {/* COMPACT DUTY OFFICERS STATUS BAR */}
      <div className="ccq-officers-bar">
        <div className="ccq-officer-item">
          <span className="ccq-officer-label">OC:</span>
          <span className="ccq-officer-name oc-name">
            {ocStale || !ocName ? 'TBA' : ocName}
          </span>
          {ocStale && <span className="stale-badge" style={{ padding: '0.05rem 0.25rem', fontSize: '0.55rem' }}>STALE</span>}
        </div>
        <div style={{ width: '1px', height: '12px', background: 'var(--border-color)' }}></div>
        <div className="ccq-officer-item">
          <span className="ccq-officer-label">AOC:</span>
          <span className="ccq-officer-name">
            {ocStale || !aocName ? 'TBA' : aocName}
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="ccq-grid">
        
        {/* SCHEDULE OF CONDUCT - GOOGLE CALENDAR STYLE TIMELINE */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div className="card-header-row">
            <h2 className="card-title">📅 Schedule of Conduct</h2>
            <span className="card-meta-text">Resets at Midnight</span>
          </div>

          {socStale || !socRows || socRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              📭 No Schedule Posted for Today
            </div>
          ) : (
            <div className="soc-timeline">
              {socRows.map((r, i) => (
                <div key={i} className="soc-timeline-item">
                  <div className="soc-timeline-dot"></div>
                  <div className="soc-timeline-card">
                    <div className="soc-time-header">
                      <span className="soc-time-display">{formatMilitaryTime(r.time)}</span>
                    </div>
                    <div className="soc-activity-title">{r.activity}</div>
                    
                    {(r.uniform || r.formation) && (
                      <div className="soc-badge-row">
                        {r.uniform && (
                          <span className="soc-badge soc-badge-uniform">
                            👔 {r.uniform}
                          </span>
                        )}
                        {r.formation && (
                          <span className="soc-badge soc-badge-formation">
                            📢 {r.formation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: GUARDS DETAIL */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div className="card-header-row">
            <h2 className="card-title">🛡️ Guard Postings</h2>
            <span className="card-meta-text">Resets at 1900H</span>
          </div>

          {guardsStale || !guards.some(g => g.name) ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ⚠️ Awaiting Guard Posting
            </div>
          ) : (
            <div className="guards-list">
              {guards.map((g, idx) => (
                <div key={idx} className="guard-row">
                  <div className="guard-info">
                    <div className="guard-position">{g.position}</div>
                    <div className="guard-name">{g.name || 'UNPOSTED'}</div>
                  </div>
                  <span className="duty-badge">{g.code}</span>
                </div>
              ))}
            </div>
          )}

          <button className="bestbest-btn" onClick={() => setIsModalOpen(true)}>
            🏆 View Best-Best Awards
          </button>
        </div>

      </div>

      {/* BEST BEST MODAL OVERLAY */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '0.5rem',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-gold)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
            borderRadius: '12px',
            padding: '1.25rem',
            maxWidth: '600px',
            width: '100%',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button 
              style={{ position: 'absolute', top: '0.75rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer' }}
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                🏆 Best-Best Awards
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Results for: {mostRecentDate || '—'} {bestBestStale && ' (AWAITING UPDATE)'}
              </p>
            </div>

            {/* List View for cellphones, clean layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: '🔒 Best Locker', suffix: 'Best Locker' },
                { label: '👟 Best Shoe Display', suffix: 'Best Shoe Display' },
                { label: '🛏️ Best Bunks', suffix: 'Best Bunks' },
                { label: '📚 Best Study Table', suffix: 'Best Study Table Display' },
                { label: '🏠 Best Room', suffix: 'Best Room' }
              ].map((cat, idx) => {
                const c1 = getValue('1CL', cat.suffix);
                const c1r = getRoom('1CL', cat.suffix);
                const c2 = getValue('2CL', cat.suffix);
                const c2r = getRoom('2CL', cat.suffix);
                const c3 = getValue('3CL', cat.suffix);
                const c3r = getRoom('3CL', cat.suffix);

                return (
                  <div key={idx} style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      {cat.label}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>1CL:</span>
                        <span style={{ fontWeight: 700 }}>{c1 || '—'}{c1r ? ` (Rm ${c1r})` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>2CL:</span>
                        <span style={{ fontWeight: 700 }}>{c2 || '—'}{c2r ? ` (Rm ${c2r})` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>3CL:</span>
                        <span style={{ fontWeight: 700 }}>{c3 || '—'}{c3r ? ` (Rm ${c3r})` : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
