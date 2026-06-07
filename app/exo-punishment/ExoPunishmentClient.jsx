'use client';

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
  // 1st classmen hold officer ranks or "1CL"
  if (r.includes('1CL') || r.includes('CPT') || r.includes('LT') || r.includes('MAJ') || r.includes('COL')) return 88.2;
  if (r.includes('2CL')) return 102.9;
  if (r.includes('3CL')) return 117.6;
  return 100; // Fallback
};

export default function ExoPunishmentClient({ initialCadets }) {
  if (!initialCadets || initialCadets.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2>No Active Punishments</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The EXO Punishment list is currently clear.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
      {initialCadets.map((cadet, index) => {
        const maxDemerits = getMaxDemerits(cadet.rank);
        const demeritPercentage = Math.min(100, Math.max(0, (cadet.totalDemerits / maxDemerits) * 100));
        
        let healthColor = '#10b981'; // Green
        if (demeritPercentage >= 40 && demeritPercentage < 60) healthColor = '#fbbf24'; // Yellow
        if (demeritPercentage >= 60) healthColor = '#ef4444'; // Red
        
        const isFlashing = demeritPercentage >= 60;
        
        // Confinement Calculations
        const confStats = getConfinementStats(cadet.confinementStart, cadet.confinementEnd);
        
        // Touring Calculations
        const tourPercentage = cadet.totalTour > 0 
          ? Math.min(100, Math.max(0, (cadet.totalTourServed / cadet.totalTour) * 100))
          : 0;

        return (
          <div key={index} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            
            {/* Header: Avatar, Name, Rank, and Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white',
                  flexShrink: 0
                }}>
                  {cadet.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                    {cadet.rank} {cadet.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                    {cadet.offenses.length} Active Offense{cadet.offenses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {cadet.isConfined ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.3)' }}>
                    🔴 CONFINED
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                    🟢 NOT CONFINED
                  </div>
                )}
              </div>
            </div>

            {/* Offenses List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
              {cadet.offenses.map((offense, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nature of Offense</div>
                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>Class {offense.classOfOffense}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{offense.natureOfOffense || 'UNKNOWN'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{offense.description}</div>
                </div>
              ))}
            </div>

            {/* Punishment Tracking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              
              {/* Confinement Progress */}
              {cadet.isConfined && confStats.total > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Confinement Status</span>
                    <span style={{ fontWeight: 700 }}>{confStats.remaining} / {confStats.total} Days Left</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${confStats.percentage}%`, background: '#10b981', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Start: <strong style={{color: 'white'}}>{confStats.startText}</strong></span>
                    <span>End: <strong style={{color: 'white'}}>{confStats.endText}</strong></span>
                  </div>
                </div>
              )}

              {/* Touring Progress */}
              {cadet.totalTour > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Touring Hours Remaining</span>
                    <span style={{ fontWeight: 700 }}>{cadet.totalTourRemaining} / {cadet.totalTour}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tourPercentage}%`, background: '#10b981', borderRadius: '4px' }} />
                  </div>
                </div>
              )}

              {/* Demerit Health Bar */}
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Compounding Demerits Health</span>
                  <span style={{ fontWeight: 700, color: healthColor }}>{cadet.totalDemerits.toFixed(1)} / {maxDemerits}</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${demeritPercentage}%`, 
                      background: healthColor,
                      borderRadius: '6px',
                      transition: 'width 0.5s ease',
                      animation: isFlashing ? 'pulse-red 1.5s infinite' : 'none',
                      boxShadow: isFlashing ? '0 0 10px #ef4444' : 'none'
                    }} 
                  />
                </div>
              </div>

            </div>
          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-red {
          0% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
          50% { opacity: 0.6; box-shadow: 0 0 5px #ef4444; }
          100% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
