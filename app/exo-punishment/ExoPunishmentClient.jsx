'use client';

import { useState } from 'react';

function parseGoogleDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.startsWith('Date(')) {
    const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  }
  return new Date(dateStr);
}

function getConfinementStats(startStr, endStr) {
  const start = parseGoogleDate(startStr);
  const end = parseGoogleDate(endStr);
  
  if (!start || !end) return { total: 0, remaining: 0, percentage: 0, startText: '-', endText: '-' };
  
  const today = new Date();
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  
  let remainingMs = end.getTime() - today.getTime();
  let remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
  if (remainingDays < 0) remainingDays = 0;
  if (remainingDays > totalDays) remainingDays = totalDays;
  
  let percentage = ((totalDays - remainingDays) / totalDays) * 100;
  
  return {
    total: totalDays,
    remaining: remainingDays,
    percentage: percentage,
    startText: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    endText: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
}

const getMaxDemerits = (rank) => {
  const r = (rank || '').toUpperCase();
  if (r.includes('1CL') || r.includes('CPT') || r.includes('LT') || r.includes('MAJ') || r.includes('COL')) return 88.2;
  if (r.includes('2CL')) return 102.9;
  if (r.includes('3CL')) return 117.6;
  return 100;
};

export default function ExoPunishmentClient({ initialCadets }) {
  const [viewModes, setViewModes] = useState({});

  if (!initialCadets || initialCadets.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2>No Active Punishments</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The EXO Punishment list is currently clear.</p>
      </div>
    );
  }

  const toggleViewMode = (cadetName, mode) => {
    setViewModes(prev => ({ ...prev, [cadetName]: mode }));
  };

  const sortedCadets = [...initialCadets].map(cadet => {
    let activeOffenseCount = 0;
    cadet.offenses.forEach(off => {
      const offConfStats = getConfinementStats(off.confStart, off.confEnd);
      const offConfCompleted = !off.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
      const offTourProgress = (off.tourServed || 0) + (off.tourConverted || 0);
      const offTourCompleted = off.tourTotal === 0 || offTourProgress >= off.tourTotal;
      if (!(offConfCompleted && offTourCompleted)) {
        activeOffenseCount++;
      }
    });
    return { ...cadet, activeOffenseCount };
  }).sort((a, b) => {
    const aActive = a.activeOffenseCount > 0;
    const bActive = b.activeOffenseCount > 0;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0; // maintain original order for ties
  });

  return (
    <div className="table-container" style={{ marginTop: '2rem', width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>Cadet Profile</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '35%' }}>Offenses</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Demerits Health</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Confinement</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '10%' }}>Touring</th>
          </tr>
        </thead>
        <tbody>
          {sortedCadets.map((cadet, index) => {
            const maxDemerits = getMaxDemerits(cadet.rank);
            const demeritPercentage = Math.min(100, Math.max(0, (cadet.totalDemerits / maxDemerits) * 100));
            
            let healthColor = '#fbbf24'; // Yellow
            if (demeritPercentage >= 40 && demeritPercentage < 75) healthColor = '#ef4444'; // Red
            if (demeritPercentage >= 75 && demeritPercentage < 100) healthColor = '#ff0000'; // Glowing Red
            if (demeritPercentage >= 100) healthColor = '#111827'; // Black
            
            const isDramaticGlowing = demeritPercentage >= 75 && demeritPercentage < 100;
            const isBlackOut = demeritPercentage >= 100;

            const globalConfStats = getConfinementStats(cadet.confinementStart, cadet.confinementEnd);
            
            const tourProgress = cadet.totalTour > 0 ? (cadet.totalTourServed + cadet.totalTourConverted) : 0;
            const tourPercentage = cadet.totalTour > 0 
              ? Math.min(100, Math.max(0, (tourProgress / cadet.totalTour) * 100))
              : 0;

            const isConfinementCompleted = !cadet.isConfined || (globalConfStats.total > 0 && globalConfStats.remaining === 0);
            const isTouringCompleted = cadet.totalTour === 0 || tourProgress >= cadet.totalTour;
            const isGloballyInactive = isConfinementCompleted && isTouringCompleted;

            const activeOffenses = [];
            const inactiveOffenses = [];

            cadet.offenses.forEach(off => {
              const offConfStats = getConfinementStats(off.confStart, off.confEnd);
              const offConfCompleted = !off.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
              
              const offTourProgress = (off.tourServed || 0) + (off.tourConverted || 0);
              const offTourCompleted = off.tourTotal === 0 || offTourProgress >= off.tourTotal;
              
              if (offConfCompleted && offTourCompleted) {
                inactiveOffenses.push(off);
              } else {
                activeOffenses.push(off);
              }
            });

            const currentMode = viewModes[cadet.name] || (activeOffenses.length > 0 ? 'active' : 'inactive');
            const displayedOffenses = currentMode === 'active' ? activeOffenses : inactiveOffenses;

            let stackedConfTotal = 0;
            let stackedConfServed = 0;
            let earliestConfStart = null;
            let latestConfEnd = null;

            displayedOffenses.forEach(off => {
              if (off.isConfined && off.confStart && off.confEnd) {
                const stats = getConfinementStats(off.confStart, off.confEnd);
                if (stats.total > 0) {
                  stackedConfTotal += stats.total;
                  stackedConfServed += (stats.total - stats.remaining);
                  
                  const startObj = parseGoogleDate(off.confStart);
                  const endObj = parseGoogleDate(off.confEnd);
                  
                  if (startObj && (!earliestConfStart || startObj < earliestConfStart)) earliestConfStart = startObj;
                  if (endObj && (!latestConfEnd || endObj > latestConfEnd)) latestConfEnd = endObj;
                }
              }
            });

            const displayConfStats = {
              total: stackedConfTotal,
              remaining: stackedConfTotal - stackedConfServed,
              served: stackedConfServed,
              percentage: stackedConfTotal > 0 ? (stackedConfServed / stackedConfTotal) * 100 : 0,
              startText: earliestConfStart ? earliestConfStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
              endText: latestConfEnd ? latestConfEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
            };

            return (
              <tr key={index} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', verticalAlign: 'top' }}>
                
                <td style={{ padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isGloballyInactive ? 0.7 : 1 }}>
                    {cadet.picture ? (
                      <img 
                        src={cadet.picture} 
                        alt={cadet.name}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(128,128,128,0.2)' }}
                      />
                    ) : (
                      <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', flexShrink: 0
                      }}>
                        {cadet.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                        {cadet.rank} {cadet.name}
                      </div>
                      <div style={{ 
                        display: 'inline-flex', 
                        background: 'rgba(128,128,128,0.15)', 
                        borderRadius: '20px', 
                        padding: '0.2rem', 
                        marginTop: '0.5rem',
                        gap: '0.2rem'
                      }}>
                        <button 
                          onClick={() => toggleViewMode(cadet.name, 'active')}
                          style={{ 
                            padding: '0.25rem 0.75rem',
                            borderRadius: '16px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: currentMode === 'active' ? '#ef4444' : 'transparent',
                            color: currentMode === 'active' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: currentMode === 'active' ? '0 2px 5px rgba(239,68,68,0.3)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          Active 
                          <span style={{ 
                            background: currentMode === 'active' ? 'rgba(255,255,255,0.25)' : 'rgba(128,128,128,0.2)', 
                            padding: '0.1rem 0.35rem', 
                            borderRadius: '10px', 
                            fontSize: '0.65rem' 
                          }}>
                            {activeOffenses.length}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleViewMode(cadet.name, 'inactive')}
                          style={{ 
                            padding: '0.25rem 0.75rem',
                            borderRadius: '16px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: currentMode === 'inactive' ? '#10b981' : 'transparent',
                            color: currentMode === 'inactive' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: currentMode === 'inactive' ? '0 2px 5px rgba(16,185,129,0.3)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          Inactive
                          <span style={{ 
                            background: currentMode === 'inactive' ? 'rgba(255,255,255,0.25)' : 'rgba(128,128,128,0.2)', 
                            padding: '0.1rem 0.35rem', 
                            borderRadius: '10px', 
                            fontSize: '0.65rem' 
                          }}>
                            {inactiveOffenses.length}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '1.5rem 1rem' }}>
                  {displayedOffenses.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', padding: '1rem 0' }}>
                      (No {currentMode} punishments)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                      {displayedOffenses.map((offense, i) => {
                        const offConfStats = getConfinementStats(offense.confStart, offense.confEnd);
                        const offConfCompleted = !offense.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
                        
                        const offTourProgress = (offense.tourServed || 0) + (offense.tourConverted || 0);
                        const offTourCompleted = offense.tourTotal === 0 || offTourProgress >= offense.tourTotal;
                        
                        const isOffInactive = offConfCompleted && offTourCompleted;

                        return (
                          <div key={i} style={{ 
                            background: isOffInactive ? 'rgba(128,128,128,0.05)' : 'rgba(128,128,128,0.1)', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            borderLeft: isOffInactive ? '3px solid #6b7280' : '3px solid #fbbf24',
                            opacity: isOffInactive ? 0.6 : 1
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                {offense.natureOfOffense || 'UNKNOWN'}
                                {isOffInactive && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 800 }}>✓ INACTIVE</span>}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: isOffInactive ? '#6b7280' : '#eab308', fontWeight: 800 }}>Class {offense.classOfOffense}</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{offense.description}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>

                <td style={{ padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: isGloballyInactive ? 0.6 : 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Demerits</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: healthColor, fontSize: '1.1rem' }}>{cadet.totalDemerits.toFixed(1)}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {maxDemerits}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(128,128,128,0.2)', borderRadius: '4px', position: 'relative', marginTop: '0.5rem' }}>
                      <div 
                        style={{ 
                          height: '100%', width: `${demeritPercentage}%`, background: healthColor, borderRadius: '4px',
                          transition: 'width 0.5s ease',
                          animation: isDramaticGlowing ? 'dramatic-pulse-red 0.6s ease-in-out infinite alternate' : isBlackOut ? 'pulse-black 1.5s infinite' : 'none',
                          boxShadow: isDramaticGlowing ? '0 0 10px #ff0000, 0 0 20px #ff0000' : isBlackOut ? '0 0 10px #111827' : 'none',
                          zIndex: isDramaticGlowing ? 10 : 1
                        }} 
                      />
                    </div>
                  </div>
                </td>

                <td style={{ padding: '1.5rem 1rem' }}>
                  {displayConfStats.total > 0 ? (
                    <div>
                      {displayConfStats.remaining === 0 ? (
                        <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '0.75rem' }}>
                          🔓 COMPLETED
                        </div>
                      ) : (
                        <div style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '0.75rem' }}>
                          🔒 CONFINED
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: (displayConfStats.remaining === 0) ? 0.6 : 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days Served</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{displayConfStats.served}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {displayConfStats.total}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden', margin: '0.25rem 0' }}>
                          <div style={{ height: '100%', width: `${displayConfStats.percentage}%`, background: '#10b981', borderRadius: '3px' }} />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{displayConfStats.startText}</span>
                          <span>{displayConfStats.endText}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.6 }}>No Confinement</div>
                  )}
                </td>

                <td style={{ padding: '1.5rem 1rem' }}>
                  {cadet.totalTour > 0 ? (
                    tourProgress >= cadet.totalTour ? (
                      <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.3)' }}>
                        🟢 SERVED
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hours Served</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{tourProgress}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {cadet.totalTour}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.25rem' }}>
                          <div style={{ height: '100%', width: `${tourPercentage}%`, background: '#10b981', borderRadius: '3px' }} />
                        </div>
                      </div>
                    )
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No Tours</span>
                  )}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dramatic-pulse-red {
          0% { opacity: 1; box-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000; transform: scaleY(1); }
          100% { opacity: 0.8; box-shadow: 0 0 5px #ff0000, 0 0 10px #ef4444; transform: scaleY(1.2); }
        }
        @keyframes pulse-black {
          0% { box-shadow: 0 0 15px #111827; }
          50% { box-shadow: 0 0 5px #111827; opacity: 0.8; }
          100% { box-shadow: 0 0 15px #111827; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(128,128,128,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(128,128,128,0.3);
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
