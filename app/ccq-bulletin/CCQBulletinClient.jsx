'use client';

import React, { useState, useEffect } from 'react';

const formatMilitaryTime = (timeStr) => {
  if (!timeStr) return '—';
  const clean = String(timeStr).trim().toUpperCase();
  if (clean.endsWith('H')) return clean;
  // Extract only digits
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

  return (
    <div style={{
      color: 'var(--text-primary)',
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      {/* Dynamic styles to handle responsive 2-column layout (Left: SOC (2/3 width), Right: Guards & Best-Best (1/3 width)) */}
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
      `}} />

      {/* HEADER SECTION WITH EMPHASIZED CLOCK */}
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

        {/* Emphasized military style command clock */}
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

      {/* TOP ROW: DUTY OFFICERS (OC / AOC) */}
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

      {/* REORGANIZED DASHBOARD GRID (SOC on left, Guards + Best-Best on right) */}
      <div className="ccq-grid">
        
        {/* COLUMN 1 & 2: SCHEDULE OF CALLS (2/3 wider layout) */}
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

        {/* COLUMN 3: STACKED RIGHT COLUMN (Guards + Best-Best) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section A: DAILY GUARD DETAIL */}
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
          </div>

          {/* Section B: BEST OF THE BEST */}
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
                🏆 Best of the Best
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Updates at 1200H
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bestBest.map((b, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.9rem 1rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, var(--accent-gold), transparent)' }}></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {b.category}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {bestBestStale || !b.winner ? 'AWAITING SELECTION' : b.winner}
                  </div>
                  {b.room && !bestBestStale && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, marginTop: '0.1rem' }}>
                      📍 Room {b.room}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
