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
  if (r.includes('1CL') || r.includes('CPT') || r.includes('LT') || r.includes('MAJ') || r.includes('COL')) return 88.2;
  if (r.includes('2CL')) return 102.9;
  if (r.includes('3CL')) return 117.6;
  return 100;
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
    <div className="table-container" style={{ marginTop: '2rem', width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>Cadet Profile</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '35%' }}>Active Offenses</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Demerits Health</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Confinement</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '10%' }}>Touring</th>
          </tr>
        </thead>
        <tbody>
          {initialCadets.map((cadet, index) => {
            const maxDemerits = getMaxDemerits(cadet.rank);
            const demeritPercentage = Math.min(100, Math.max(0, (cadet.totalDemerits / maxDemerits) * 100));
            
            let healthColor = '#10b981';
            if (demeritPercentage >= 40 && demeritPercentage < 60) healthColor = '#fbbf24';
            if (demeritPercentage >= 60) healthColor = '#ef4444';
            
            const isFlashing = demeritPercentage >= 60;
            const confStats = getConfinementStats(cadet.confinementStart, cadet.confinementEnd);
            
            const tourPercentage = cadet.totalTour > 0 
              ? Math.min(100, Math.max(0, (cadet.totalTourServed / cadet.totalTour) * 100))
              : 0;

            return (
              <tr key={index} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', verticalAlign: 'top' }}>
                
                {/* 1. CADET PROFILE */}
                <td style={{ padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                        {cadet.offenses.length} Active Offense{cadet.offenses.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. ACTIVE OFFENSES */}
                <td style={{ padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    {cadet.offenses.map((offense, i) => (
                      <div key={i} style={{ background: 'rgba(128,128,128,0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{offense.natureOfOffense || 'UNKNOWN'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: 800 }}>Class {offense.classOfOffense}</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{offense.description}</div>
                      </div>
                    ))}
                  </div>
                </td>

                {/* 3. DEMERITS HEALTH */}
                <td style={{ padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                    <span style={{ fontWeight: 800, color: healthColor }}>{cadet.totalDemerits.toFixed(1)} / {maxDemerits}</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'rgba(128,128,128,0.2)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div 
                      style={{ 
                        height: '100%', width: `${demeritPercentage}%`, background: healthColor, borderRadius: '6px',
                        transition: 'width 0.5s ease',
                        animation: isFlashing ? 'pulse-red 1.5s infinite' : 'none',
                        boxShadow: isFlashing ? '0 0 10px #ef4444' : 'none'
                      }} 
                    />
                  </div>
                </td>

                {/* 4. CONFINEMENT */}
                <td style={{ padding: '1.5rem 1rem' }}>
                  {cadet.isConfined ? (
                    <div>
                      <div style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '0.5rem' }}>
                        🔴 CONFINED
                      </div>
                      {confStats.total > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Days Left</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{confStats.remaining} / {confStats.total}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                            <div style={{ height: '100%', width: `${confStats.percentage}%`, background: '#10b981', borderRadius: '3px' }} />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{confStats.startText}</span>
                            <span>{confStats.endText}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                      🟢 NONE
                    </div>
                  )}
                </td>

                {/* 5. TOURING */}
                <td style={{ padding: '1.5rem 1rem' }}>
                  {cadet.totalTour > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Remaining</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{cadet.totalTourRemaining} / {cadet.totalTour}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(128,128,128,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${tourPercentage}%`, background: '#10b981', borderRadius: '4px' }} />
                      </div>
                    </div>
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
        @keyframes pulse-red {
          0% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
          50% { opacity: 0.6; box-shadow: 0 0 5px #ef4444; }
          100% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
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
