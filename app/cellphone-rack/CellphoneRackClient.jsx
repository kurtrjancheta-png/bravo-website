'use client';

import React, { useState } from 'react';

export default function CellphoneRackClient({ initialData }) {
  const [filterClass, setFilterClass] = useState('All');

  const classes = ['1', '2', '3', '4'];
  
  // Filter and group
  const filteredData = initialData.filter(c => filterClass === 'All' || c.cadetClass === filterClass);

  const groupedData = {};
  classes.forEach(c => {
    groupedData[c] = filteredData.filter(cadet => cadet.cadetClass === c).sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <div>
      {/* Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>FILTER BY CLASS:</span>
        <select 
          value={filterClass} 
          onChange={(e) => setFilterClass(e.target.value)}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'inherit',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <option value="All">ALL CLASSES</option>
          <option value="1">1ST CLASS</option>
          <option value="2">2ND CLASS</option>
          <option value="3">3RD CLASS</option>
          <option value="4">4TH CLASS</option>
        </select>
      </div>

      {/* Render Groups */}
      {classes.map(c => {
        const classCadets = groupedData[c];
        if (!classCadets || classCadets.length === 0) return null;

        return (
          <div key={c} style={{ marginBottom: '4rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '2rem', color: 'var(--accent-gold)' }}>
              {c === '1' ? '1ST CLASS' : c === '2' ? '2ND CLASS' : c === '3' ? '3RD CLASS' : '4TH CLASS'}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '2.5rem',
              justifyItems: 'center'
            }}>
              {classCadets.map((cadet, i) => {
                const isLoggedOut = cadet.status.toLowerCase() === 'logged out';
                
                // Colors and themes
                const bezelColor = isLoggedOut ? '#1f2937' : '#052e16'; // Dark gray vs Dark green
                const screenGradient = isLoggedOut 
                  ? 'linear-gradient(135deg, #111827 0%, #374151 100%)' // Dark gray gradient
                  : 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'; // Emerald gradient
                const statusIcon = isLoggedOut ? '🔴' : '🟢';

                return (
                  <div key={i} style={{
                    width: '220px',
                    height: '440px',
                    borderRadius: '36px',
                    background: bezelColor,
                    padding: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Hardware Buttons (Simulated) */}
                    <div style={{ position: 'absolute', left: '-3px', top: '100px', width: '3px', height: '25px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', left: '-3px', top: '140px', width: '3px', height: '40px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', left: '-3px', top: '190px', width: '3px', height: '40px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', right: '-3px', top: '140px', width: '3px', height: '60px', background: bezelColor, borderRadius: '0 3px 3px 0' }} />

                    {/* The Screen */}
                    <div style={{
                      flex: 1,
                      background: screenGradient,
                      borderRadius: '28px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      
                      {/* Dynamic Island (Notch) */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '70px',
                        height: '20px',
                        background: '#000',
                        borderRadius: '10px',
                        zIndex: 10
                      }} />

                      {/* Top Status Bar (Time/Battery) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px 0', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                        <span>9:41</span>
                        <span>{statusIcon}</span>
                      </div>

                      {/* Main Content Area */}
                      <div style={{ flex: 1, padding: '2rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        
                        <div style={{ 
                          width: '64px', height: '64px', 
                          borderRadius: '50%', background: 'rgba(255,255,255,0.2)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', marginBottom: '1rem',
                          backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                          📱
                        </div>
                        
                        <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem', color: '#fff', letterSpacing: '1px' }}>{cadet.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, marginBottom: '1.5rem' }}>{cadet.status.toUpperCase()}</div>

                        {/* App Icon grid styling for info */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: 'auto', width: '100%', justifyContent: 'center' }}>
                          {cadet.phone && cadet.phone !== 'null' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', backdropFilter: 'blur(5px)', cursor: 'help' }} title={cadet.phone}>📞</div>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Phone</span>
                            </div>
                          )}
                          {cadet.ig && cadet.ig !== 'null' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', backdropFilter: 'blur(5px)', cursor: 'help' }} title={cadet.ig}>📸</div>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Social</span>
                            </div>
                          )}
                        </div>

                        {/* Remarks Widget */}
                        {isLoggedOut && cadet.remarks && cadet.remarks !== 'null' && (
                          <div style={{ 
                            background: 'rgba(0,0,0,0.4)', 
                            borderRadius: '12px', 
                            padding: '0.75rem', 
                            width: '100%',
                            marginTop: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem', textAlign: 'left' }}>Authorized Reason</div>
                            <div style={{ fontSize: '0.75rem', color: '#fff', textAlign: 'left', lineHeight: 1.3 }}>{cadet.remarks}</div>
                          </div>
                        )}

                        {/* Swipe Indicator */}
                        <div style={{ width: '35%', height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px', marginTop: '1.5rem' }} />

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
