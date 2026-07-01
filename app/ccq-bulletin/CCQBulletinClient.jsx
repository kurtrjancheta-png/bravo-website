"use client";

import { useState } from 'react';
import Link from 'next/link';

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
  const [activeTab, setActiveTab] = useState('guards'); // 'guards' | 'soc' | 'best'

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1" style={{ fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            🔔 CCQ Duty Bulletin
          </h1>
          <p className="text-secondary small mb-0">
            Daily Duty Detail, Schedule of Calls, and Inspection Winners
          </p>
        </div>
        
        {/* OC / AOC Quick View Card */}
        <div 
          className="d-flex align-items-center gap-3 p-3" 
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Duty Officer of the Day (OC)
            </div>
            <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
              {ocName || 'TBA'}
            </div>
            {ocStale && (
              <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.65rem' }}>
                ⚠️ Outdated
              </span>
            )}
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }}></div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assistant OC (AOC)
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {aocName || 'TBA'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="taskorg-tabs mb-4">
        <button 
          className={`taskorg-tab-btn ${activeTab === 'guards' ? 'active' : ''}`}
          onClick={() => setActiveTab('guards')}
        >
          🛡️ Guards Detail
        </button>
        <button 
          className={`taskorg-tab-btn ${activeTab === 'soc' ? 'active' : ''}`}
          onClick={() => setActiveTab('soc')}
        >
          📅 Schedule of Calls
        </button>
        <button 
          className={`taskorg-tab-btn ${activeTab === 'best' ? 'active' : ''}`}
          onClick={() => setActiveTab('best')}
        >
          🏆 Best of the Best
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'guards' && (
        <div className="pft-chart-card mb-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="h5 mb-0" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daily Guard Detail
            </h2>
            {guardsStale && (
              <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                ⚠️ Stale Data
              </span>
            )}
          </div>
          
          <div className="row g-3">
            {guards.map((g, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={i}>
                <div 
                  className="p-3 d-flex align-items-center justify-content-between"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {g.position}
                    </div>
                    <div className="h6 mb-0 mt-1" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {g.name || 'TBD'}
                    </div>
                  </div>
                  <div 
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      color: 'var(--accent-gold)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    {g.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'soc' && (
        <div className="pft-chart-card mb-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="h5 mb-0" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Schedule of Calls (SOC)
            </h2>
            {socStale && (
              <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                ⚠️ Stale Data
              </span>
            )}
          </div>

          {socRows.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              No schedule entries posted for today.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mobile-card-table" style={{ color: 'inherit' }}>
                <thead>
                  <tr style={{ borderColor: 'var(--border-color)' }}>
                    <th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>Time</th>
                    <th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>Activity</th>
                    <th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>Uniform</th>
                    <th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>Formation</th>
                  </tr>
                </thead>
                <tbody>
                  {socRows.map((r, i) => (
                    <tr key={i} style={{ borderColor: 'var(--border-color)' }}>
                      <td data-label="Time" style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{r.time}</td>
                      <td data-label="Activity" style={{ fontWeight: 600 }}>{r.activity}</td>
                      <td data-label="Uniform">
                        <span className="badge bg-secondary text-light px-2.5 py-1.5" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {r.uniform || 'N/A'}
                        </span>
                      </td>
                      <td data-label="Formation">{r.formation || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'best' && (
        <div className="pft-chart-card mb-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="h5 mb-0" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Best of the Best Winners
            </h2>
            {bestBestStale && (
              <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                ⚠️ Stale Data
              </span>
            )}
          </div>

          <div className="row g-3">
            {bestBest.map((b, i) => (
              <div className="col-12 col-md-6" key={i}>
                <div 
                  className="p-4" 
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Decorative gold gradient border-left */}
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, var(--accent-gold), transparent)' }}></div>
                  
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🏆 {b.category}
                      </div>
                      <h3 className="h5 mb-1 mt-2" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {b.winner || 'TBD'}
                      </h3>
                      {b.room && (
                        <div style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                          📍 Room {b.room}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
