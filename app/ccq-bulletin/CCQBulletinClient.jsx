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
    return match ? match.value : '';
  };

  // Get most recent date from payload
  const mostRecentDate = bestBest && bestBest.length > 0 ? (bestBest[0].date || '') : '';

  return (
    <div style={{
      color: 'var(--text-primary)',
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
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
        .duty-badge {
          background: rgba(212, 175, 55, 0.1);
          color: var(--accent-gold);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .stale-badge {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .mono-font {
          font-family: monospace;
        }
        .bestbest-btn {
          background: var(--accent-gold);
          color: #000;
          font-weight: 700;
          border: none;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
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
      `}} />

      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '1.25rem',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            🔔 CCQ Duty Bulletin
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Daily Duty Detail, Schedule of Calls, and Inspection Winners
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          background: 'rgba(212, 175, 55, 0.04)',
          border: '2px solid var(--accent-gold)',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
          padding: '0.75rem 1.75rem',
          borderRadius: '12px',
          minWidth: '245px'
        }}>
          <div className="mono-font" style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900', 
            color: 'var(--accent-gold)',
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(212, 175, 55, 0.35)'
          }}>
            {time || '00:00:00 H'}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-primary)', 
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.25rem'
          }}>
            {dateStr || 'LOADING DATE...'}
          </div>
        </div>
      </div>

      {/* TOP ROW: DUTY OFFICERS */}
      <div className="command-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            💂‍♂️ Duty Officers of the Day
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Resets at 0900H Daily
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* OC Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Officer in Charge (OC)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.25rem' }}>
                {ocStale || !ocName ? 'AWAITING UPDATE' : ocName}
              </div>
            </div>
            {ocStale && <span className="stale-badge">OUTDATED</span>}
          </div>

          {/* AOC Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assistant OC (AOC)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {ocStale || !aocName ? 'AWAITING UPDATE' : aocName}
              </div>
            </div>
            {ocStale && <span className="stale-badge">OUTDATED</span>}
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="ccq-grid">
        
        {/* COLUMN 1 & 2: SCHEDULE OF CALLS */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem',
            marginBottom: '1rem'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              📅 Schedule of Calls (SOC)
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Resets at Midnight
            </span>
          </div>

          {socStale || !socRows || socRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              📭 No Schedule Posted for Today
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 800, width: '100px' }}>TIME</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 800 }}>ACTIVITY</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 800, width: '22%' }}>UNIFORM</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 800, width: '18%' }}>FORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  {socRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="mono-font" style={{ padding: '0.7rem 0.5rem', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        {formatMilitaryTime(r.time)}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.activity}</td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)' }}>{r.uniform || '—'}</td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>{r.formation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* COLUMN 3: STACKED RIGHT COLUMN (Guards + Modal Button) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* DAILY GUARD DETAIL CARD */}
          <div className="command-card" style={{ height: 'fit-content' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                🛡️ Guards Detail
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Resets at 1900H
              </span>
            </div>

            {guardsStale || !guards.some(g => g.name) ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                ⚠️ Awaiting Guard Posting
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {guards.map((g, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {g.position}
                      </div>
                      <div style={{ fontWeight: 700, color: g.name ? 'var(--text-primary)' : 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                        {g.name || 'UNPOSTED'}
                      </div>
                    </div>
                    <span className="duty-badge">{g.code}</span>
                  </div>
                ))}
              </div>
            )}

            {/* View Best-Best Modal Button */}
            <button className="bestbest-btn" onClick={() => setIsModalOpen(true)}>
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
          padding: '1rem',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '700px',
            width: '100%',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Close Button */}
            <button 
              style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                🏆 Daily Best-Best Awards
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Inspection Results for: {mostRecentDate || '—'} {bestBestStale && ' (AWAITING UPDATE)'}
              </p>
            </div>

            {/* Grid Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800 }}>CATEGORY</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>1CL</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>2CL</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>3CL</th>
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
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{cat.label}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{getValue('1CL', cat.suffix) || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{getValue('2CL', cat.suffix) || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{getValue('3CL', cat.suffix) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
