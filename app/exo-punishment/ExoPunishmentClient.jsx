'use client';

const getMaxDemerits = (cadetClass) => {
  const upperClass = String(cadetClass).toUpperCase();
  if (upperClass === '1CL' || ['MAJ', 'CAPT', 'CPT', '1LT', '2LT', 'ENS'].includes(upperClass)) return 88.2;
  if (upperClass === '2CL') return 102.9;
  if (upperClass === '3CL') return 117.6;
  return null; // 4CL has no max yet
};

function getConfinementProgress(startStr, endStr) {
  if (!startStr || !endStr) return null;
  // Try parsing. Assume current year if missing
  const currentYear = new Date().getFullYear();
  
  let start = new Date(`${startStr} ${currentYear}`);
  let end = new Date(`${endStr} ${currentYear}`);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  // If end is before start, it probably crosses the new year
  if (end < start) {
    end.setFullYear(currentYear + 1);
  }
  
  // If the start is way in the future (e.g. next Nov but we are in Jan), 
  // maybe it was last year
  const today = new Date();
  if (start > today && (start - today) > 180 * 24 * 60 * 60 * 1000) {
      start.setFullYear(currentYear - 1);
      if (end < start) end.setFullYear(currentYear);
  }
  
  const totalDuration = end - start;
  const elapsed = today - start;
  
  if (totalDuration <= 0) return null;
  
  let percentage = (elapsed / totalDuration) * 100;
  percentage = Math.max(0, Math.min(percentage, 100));
  
  const remainingDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, remainingDays);
  
  return { percentage, remaining };
}

export default function ExoPunishmentClient({ cadets }) {
  if (!cadets || cadets.length === 0) {
    return (
      <div className="dashboard-panel" style={{ padding: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>EXO PUNISHMENT MONITORING</h1>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>No punishment records found for Bravo Company.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>EXO PUNISHMENT MONITORING</h1>
        <div className="badge-outline" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
          <div className="live-indicator" style={{ background: 'var(--accent-red)' }}></div> LIVE UPDATES
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {cadets.map((cadet, i) => {
           const maxDemerits = getMaxDemerits(cadet.class);
           const demeritPercentage = maxDemerits ? Math.min((cadet.demerits / maxDemerits) * 100, 100) : 0;
           
           // Tour calculations
           const toursCompleted = cadet.servedTours + cadet.convertedTours;
           const tourPercentage = cadet.totalTours > 0 ? Math.min((toursCompleted / cadet.totalTours) * 100, 100) : 100;

           // Determine demerit health bar color
           let healthColor = '#4ade80'; // Green
           let isFlashing = false;
           if (maxDemerits) {
             if (demeritPercentage >= 60) {
               healthColor = '#ef4444'; // Red
               isFlashing = true; // User requested flashing red at 60% threshold
             } else if (demeritPercentage >= 40) {
               healthColor = '#fbbf24'; // Yellow
             }
           }

           const confinement = cadet.isConfined ? getConfinementProgress(cadet.dateStarted, cadet.dateEnded) : null;

           return (
             <div key={i} className="card-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               
               {/* Header Row */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                     {cadet.class} {cadet.name}
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                     Status: <strong style={{ color: cadet.status === 'SERVED' ? '#4ade80' : '#fbbf24' }}>{cadet.status || 'ONGOING'}</strong> | Class {cadet.classOfOffense}
                   </div>
                 </div>
                 
                 <div style={{ textAlign: 'right', maxWidth: '400px' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nature of Offense</div>
                   <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cadet.nature}</div>
                 </div>
               </div>

               {/* Offense Description */}
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-red)' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Offense Description</div>
                 <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{cadet.offense}</div>
               </div>

               {/* Progress Bars Container */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '0.5rem' }}>
                 
                 {/* Left: Demerits */}
                 {maxDemerits ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demerit Health</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cadet.demerits} / {maxDemerits}</div>
                     </div>
                     <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                       <div 
                         style={{ 
                           height: '100%', 
                           width: \`\${demeritPercentage}%\`, 
                           background: healthColor,
                           borderRadius: '6px',
                           transition: 'width 0.5s ease',
                           animation: isFlashing ? 'pulse-red 1.5s infinite' : 'none',
                           boxShadow: isFlashing ? '0 0 10px #ef4444' : 'none'
                         }} 
                       />
                     </div>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demerit Health</div>
                     <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No limit defined for 4CL. Total Demerits: {cadet.demerits}</div>
                   </div>
                 )}

                 {/* Right: Tours */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Touring Hours</div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cadet.remainingTours} Remaining</div>
                   </div>
                   <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                     <div 
                       style={{ 
                         height: '100%', 
                         width: \`\${tourPercentage}%\`, 
                         background: 'linear-gradient(90deg, #10b981, #34d399)',
                         borderRadius: '6px',
                         transition: 'width 0.5s ease'
                       }} 
                     />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                     <span>Total: {cadet.totalTours}</span>
                     <span>Served: {cadet.servedTours}</span>
                     <span>Converted: {cadet.convertedTours}</span>
                   </div>
                 </div>

                 {/* Confinement (if applicable, takes up full width or half) */}
                 {cadet.isConfined && (
                   <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <span style={{ fontSize: '0.85rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>CONFINEMENT PERIOD</span>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({cadet.dateStarted} to {cadet.dateEnded})</span>
                       </div>
                       {confinement && (
                         <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{confinement.remaining} Days Remaining</div>
                       )}
                     </div>
                     {confinement && (
                       <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                         <div 
                           style={{ 
                             height: '100%', 
                             width: \`\${confinement.percentage}%\`, 
                             background: 'linear-gradient(90deg, #10b981, #34d399)',
                             borderRadius: '6px',
                             transition: 'width 0.5s ease'
                           }} 
                         />
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes pulse-red {
          0% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
          50% { opacity: 0.6; box-shadow: 0 0 5px #ef4444; }
          100% { opacity: 1; box-shadow: 0 0 15px #ef4444; }
        }
      \`}} />
    </div>
  );
}
