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
  barracksGuards,
}) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const getTimeDifference = (timeStr) => {
    if (!timeStr) return null;
    const clean = String(timeStr).trim().toUpperCase();
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.length < 3) return null;
    
    let hours = 0;
    let minutes = 0;
    
    if (digits.length === 3) {
      hours = parseInt(digits.substring(0, 1), 10);
      minutes = parseInt(digits.substring(1), 10);
    } else if (digits.length >= 4) {
      hours = parseInt(digits.substring(0, 2), 10);
      minutes = parseInt(digits.substring(2, 4), 10);
    }

    const now = new Date();
    
    // Format to Asia/Manila (PHT) timezone parts
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const getPartVal = (type) => parseInt(parts.find(p => p.type === type).value, 10);
    
    const phtYear = getPartVal('year');
    const phtMonth = getPartVal('month') - 1; // 0-indexed month
    const phtDay = getPartVal('day');
    const phtHour = getPartVal('hour');
    const phtMinute = getPartVal('minute');
    const phtSecond = getPartVal('second');

    const nowPhtMs = Date.UTC(phtYear, phtMonth, phtDay, phtHour, phtMinute, phtSecond);
    const targetPhtMs = Date.UTC(phtYear, phtMonth, phtDay, hours, minutes, 0);

    return targetPhtMs - nowPhtMs;
  };

  const handleDutyClick = (duty) => {
    if (!duty || !duty.time) return;
    const diffMs = getTimeDifference(duty.time);
    if (diffMs === null) return;

    let message = '';
    const cleanTitle = duty.activity;

    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      message = `Starts in ${h > 0 ? `${h}h ` : ''}${m}m (First Call).`;
    } else if (diffMs === 0) {
      message = `It is now First Call!`;
    } else {
      const diffMins = Math.floor(Math.abs(diffMs) / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      message = `Passed ${h > 0 ? `${h}h ` : ''}${m}m ago.`;
    }

    setToastTitle(cleanTitle);
    setToastMsg(message);
    setToastVisible(true);

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    const id = setTimeout(() => {
      setToastVisible(false);
    }, 4000);
    setToastTimeoutId(id);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const dateOptions = { timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .ccq-header-title {
          font-size: 1.8rem;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .ccq-header-sub {
          margin: 0.2rem 0 0 0;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .ccq-clock-box {
          text-align: center;
          background: rgba(212, 175, 55, 0.04);
          border: 2px solid var(--accent-gold);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          min-width: 220px;
        }

        .ccq-time-text {
          font-family: monospace;
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--accent-gold);
          letter-spacing: 0.05em;
          text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
        }

        .ccq-date-text {
          font-size: 0.75rem;
          color: var(--text-primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.15rem;
        }

        /* Top Row Duty Officers */
        .ccq-officers-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-left: 5px solid var(--accent-gold);
          border-radius: 12px;
          padding: 1.25rem 1.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .ccq-officers-row {
          display: flex;
          gap: 2.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .ccq-officer-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ccq-officer-label {
          color: var(--text-secondary);
          font-weight: 850;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ccq-officer-name {
          font-weight: 900;
          color: var(--accent-gold);
          font-size: 1.35rem;
          letter-spacing: 0.02em;
        }

        /* Responsive Grid */
        .ccq-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
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
          display: flex;
          flex-direction: column;
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
          margin-bottom: 0.5rem;
        }

        .soc-timeline-item:last-child {
          margin-bottom: 0;
        }

        .soc-timeline-dot {
          position: absolute;
          left: -1.5rem;
          top: 0.45rem;
          width: 8px;
          height: 8px;
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
          padding: 0.35rem 0.65rem;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
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
          gap: 0.5rem;
          margin-top: 1rem;
          width: 100%;
          transition: all 0.2s;
        }

        .bestbest-btn:hover {
          background: #e5c158;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
        }

        .stale-badge {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }

        /* Desktop vs Mobile Toggles */
        .soc-table-desktop {
          display: block;
        }
        .soc-timeline-mobile {
          display: none;
        }
        .modal-table-desktop {
          display: table;
          width: 100%;
        }
        .modal-list-mobile {
          display: none;
        }

        @media (max-width: 1023px) {
          .soc-table-desktop {
            display: none;
          }
          .soc-timeline-mobile {
            display: block;
          }
        }
        @media (max-width: 767px) {
          .modal-table-desktop {
            display: none;
          }
          .modal-list-mobile {
            display: flex;
            flex-direction: column;
          }
        }
        
        /* Interactive Schedule Hover & Clickable Styles */
        .soc-clickable-row {
          transition: background-color 0.2s ease;
        }
        .soc-clickable-row:hover {
          background-color: rgba(212, 175, 55, 0.06) !important;
        }
        .soc-clickable-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .soc-clickable-card:hover {
          border-color: var(--accent-gold) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(212, 175, 55, 0.08);
        }
        @keyframes toast-slide-up {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />

      {/* HEADER SECTION */}
      <div className="ccq-header-section">
        <div>
          <h1 className="ccq-header-title">🔔 CCQ Duty Bulletin</h1>
          <p className="ccq-header-sub">Daily Duty Detail, Schedule of Calls, and Inspection Winners</p>
        </div>

        <div className="ccq-clock-box">
          <div className="ccq-time-text">{time || '00:00:00 H'}</div>
          <div className="ccq-date-text">{dateStr || 'LOADING DATE...'}</div>
        </div>
      </div>

      {/* TOP ROW: DUTY OFFICERS */}
      <div className="ccq-officers-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💂‍♂️</span>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            Duty Officers:
          </span>
        </div>

        <div className="ccq-officers-row">
          <div className="ccq-officer-item">
            <span className="ccq-officer-label">OC:</span>
            <span className="ccq-officer-name">
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
      </div>

      {/* MAIN GRID */}
      <div className="ccq-grid">
        
        {/* SCHEDULE OF CONDUCT CARD */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div className="card-header-row">
            <h2 className="card-title">📅 Schedule of Calls</h2>
            <span className="card-meta-text">Resets at Midnight</span>
          </div>

          {socStale || !socRows || socRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              📭 No Schedule Posted for Today
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="soc-table-desktop" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', opacity: 0.8 }}>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 800, width: '100px' }}>TIME</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 800 }}>ACTIVITY</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 800, width: '22%' }}>UNIFORM</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 800, width: '18%' }}>FORMATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socRows.map((r, i) => (
                      <tr 
                        key={i} 
                        onClick={() => handleDutyClick(r)}
                        className="soc-clickable-row"
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        <td className="mono-font" style={{ padding: '0.35rem 0.5rem', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                          {formatMilitaryTime(r.time)}
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.activity}</td>
                        <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-secondary)' }}>{r.uniform || '—'}</td>
                        <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>{r.formation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Timeline View */}
              <div className="soc-timeline-mobile">
                <div className="soc-timeline">
                  {socRows.map((r, i) => (
                    <div key={i} className="soc-timeline-item">
                      <div className="soc-timeline-dot"></div>
                      <div 
                        className="soc-timeline-card soc-clickable-card"
                        onClick={() => handleDutyClick(r)}
                        style={{ cursor: 'pointer' }}
                      >
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
              </div>
            </>
          )}
        </div>

        {/* COLUMN 2: GUARDS DETAIL & AWARDS BUTTON */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              <div className="guards-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '0.2rem', opacity: 0.8 }}>
                  Interior Guards Detail
                </div>
                {guards.map((g, idx) => (
                  <div key={idx} className="guard-row">
                    <div className="guard-info">
                      <div className="guard-position">{g.position}</div>
                      <div className="guard-name">{g.name || 'UNPOSTED'}</div>
                    </div>
                    <span className="duty-badge">{g.code}</span>
                  </div>
                ))}

                <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginTop: '0.8rem', marginBottom: '0.2rem', opacity: 0.8 }}>
                  Barracks Guards Detail
                </div>
                {[
                  { position: 'Cadet-in-Charge of Quarters', code: 'CCQ', name: barracksGuards?.ccq },
                  { position: 'Assistant CCQ', code: 'ACCQ', name: barracksGuards?.accq },
                  { position: 'Floor Inspector', code: 'FI', name: barracksGuards?.fi },
                  { position: 'Assistant Floor Inspector', code: 'AFI', name: barracksGuards?.afi }
                ].map((bg, idx) => (
                  <div key={idx} className="guard-row" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
                    <div className="guard-info">
                      <div className="guard-position">{bg.position}</div>
                      <div className="guard-name">{bg.name || 'TBA'}</div>
                    </div>
                    <span className="duty-badge" style={{ background: 'rgba(212, 175, 55, 0.15)' }}>{bg.code}</span>
                  </div>
                ))}

                {barracksGuards?.sentinels && barracksGuards.sentinels.length > 0 && (
                  <>
                    <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginTop: '0.8rem', marginBottom: '0.2rem', opacity: 0.8 }}>
                      Posted Sentinels
                    </div>
                    {barracksGuards.sentinels.map((name, sIdx) => (
                      <div key={sIdx} className="guard-row" style={{ borderLeft: '3px solid #4285f4' }}>
                        <div className="guard-info">
                          <div className="guard-position">Sentinel #{sIdx + 1}</div>
                          <div className="guard-name">{name}</div>
                        </div>
                        <span className="duty-badge" style={{ background: 'rgba(66, 133, 244, 0.15)', color: '#4285f4' }}>SENTINEL</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Standalone Best-Best button card */}
          <div className="command-card" style={{ 
            height: 'fit-content', 
            padding: '1rem', 
            border: '1px solid var(--accent-gold)', 
            background: 'rgba(212, 175, 55, 0.03)',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.08)'
          }}>
            <button className="bestbest-btn" style={{ margin: 0 }} onClick={() => setIsModalOpen(true)}>
              🏆 View Best-Best Awards
            </button>
          </div>
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

            {/* Desktop Table View */}
            <div className="modal-table-desktop" style={{ overflowX: 'auto', marginBottom: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                    <th style={{ padding: '0.5rem', fontWeight: 800 }}>CATEGORY</th>
                    <th style={{ padding: '0.5rem', fontWeight: 800, color: 'var(--accent-gold)', width: '25%' }}>1CL</th>
                    <th style={{ padding: '0.5rem', fontWeight: 800, color: 'var(--accent-gold)', width: '25%' }}>2CL</th>
                    <th style={{ padding: '0.5rem', fontWeight: 800, color: 'var(--accent-gold)', width: '25%' }}>3CL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '🔒 Best Locker', suffix: 'Best Locker' },
                    { label: '👟 Best Shoe Display', suffix: 'Best Shoe Display' },
                    { label: '🛏️ Best Bunks', suffix: 'Best Bunks' },
                    { label: '📚 Best Study Table', suffix: 'Best Study Table Display' },
                    { label: '🏠 Best Room', suffix: 'Best Room' }
                  ].map((cat, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 700 }}>{cat.label}</td>
                      <td style={{ padding: '0.5rem' }}>{getValue('1CL', cat.suffix) || '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{getValue('2CL', cat.suffix) || '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{getValue('3CL', cat.suffix) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="modal-list-mobile" style={{ gap: '0.75rem' }}>
              {[
                { label: '🔒 Best Locker', suffix: 'Best Locker' },
                { label: '👟 Best Shoe Display', suffix: 'Best Shoe Display' },
                { label: '🛏️ Best Bunks', suffix: 'Best Bunks' },
                { label: '📚 Best Study Table', suffix: 'Best Study Table Display' },
                { label: '🏠 Best Room', suffix: 'Best Room' }
              ].map((cat, idx) => {
                const c1 = getValue('1CL', cat.suffix);
                const c2 = getValue('2CL', cat.suffix);
                const c3 = getValue('3CL', cat.suffix);

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
                        <span style={{ fontWeight: 700 }}>{c1 || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>2CL:</span>
                        <span style={{ fontWeight: 700 }}>{c2 || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>3CL:</span>
                        <span style={{ fontWeight: 700 }}>{c3 || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Duty Countdown */}
      {toastVisible && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.93)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '12px',
          padding: '0.85rem 1.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.25)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#fff',
          maxWidth: '90%',
          width: 'max-content',
          animation: 'toast-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span style={{ fontSize: '1.25rem' }}>⏰</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 850, fontSize: '0.8rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {toastTitle}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#f1f5f9', marginTop: '0.15rem', fontWeight: 650 }}>
              {toastMsg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
