'use client';

import { useState, useEffect, useRef } from 'react';

// Green gradients for Effective
const EFFECTIVE_COLORS = [
  '#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'
];

// Red gradients for Ineffective
const INEFFECTIVE_COLORS = [
  '#b71c1c', '#c62828', '#d32f2f', '#e53935', '#f44336', '#ef5350', '#e57373', '#ff8a80'
];

export default function DispositionDashboard({ dispositionData, attachmentData, rosterData = [] }) {
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!dispositionData || dispositionData.length === 0) return null;

  const classes = {
    '1CL': { data: [], total: 0 },
    '2CL': { data: [], total: 0 },
    '3CL': { data: [], total: 0 },
    '4CL': { data: [], total: 0 },
  };

  let currentCategory = 'EFFECTIVE'; 
  let ignoreRest = false;

  const keys = Object.keys(dispositionData[0]);
  const categoryKey = keys[0]; 
  const statusKey = keys[1]; 

  let effColorIdx = 0;
  let ineffColorIdx = 0;

  dispositionData.forEach((row) => {
    if (ignoreRest) return;

    const rawCategory = row[categoryKey] ? String(row[categoryKey]).trim().toUpperCase() : '';
    const rawStatus = row[statusKey] ? String(row[statusKey]).trim().toUpperCase() : '';

    if (rawCategory === 'EFFECTIVE') currentCategory = 'EFFECTIVE';
    if (rawCategory === 'INEFFECTIVE') currentCategory = 'INEFFECTIVE';

    if (!rawStatus || rawStatus === 'TOTAL') {
      return;
    }

    // Combine Male/Female for each class based on our updated unique keys
    // 1CL: 'BRAVO 1CL M', 'F'
    // 2CL: '2CL M', 'F (2)'
    // 3CL: '3CL M', 'F (3)'
    // 4CL: '4CL M', 'F (4)'
    const c1M = parseFloat(row['BRAVO 1CL M']) || 0;
    const c1F = parseFloat(row['F']) || 0;
    
    const c2M = parseFloat(row['2CL M']) || 0;
    const c2F = parseFloat(row['F (2)']) || 0;
    
    const c3M = parseFloat(row['3CL M']) || 0;
    const c3F = parseFloat(row['F (3)']) || 0;
    
    const c4M = parseFloat(row['4CL M']) || 0;
    const c4F = parseFloat(row['F (4)']) || 0;

    const classData = {
      '1CL': c1M + c1F,
      '2CL': c2M + c2F,
      '3CL': c3M + c3F,
      '4CL': c4M + c4F
    };

    let color = '';
    if (currentCategory === 'EFFECTIVE') {
       color = EFFECTIVE_COLORS[effColorIdx % EFFECTIVE_COLORS.length];
       effColorIdx++;
    } else {
       color = INEFFECTIVE_COLORS[ineffColorIdx % INEFFECTIVE_COLORS.length];
       ineffColorIdx++;
    }

    Object.keys(classes).forEach(cls => {
      const val = classData[cls];
      if (val > 0) {
        classes[cls].data.push({
          label: rawStatus,
          value: val,
          color: color,
          category: currentCategory
        });
        classes[cls].total += val;
      }
    });

    if (rawStatus === 'AWOL') {
      ignoreRest = true;
    }
  });

  const handleSliceClick = (slice, className) => {
    if (selectedDetails && selectedDetails.className === className && selectedDetails.label === slice.label) {
      setSelectedDetails(null);
    } else {
      setSelectedDetails({ className, ...slice });
    }
  };

  return (
    <div className="disposition-dashboard" style={{ marginBottom: '3rem' }}>
      <h2 style={{ 
        borderBottom: `2px solid var(--border-color)`, 
        paddingBottom: '0.5rem', 
        marginBottom: '1.5rem',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        textTransform: 'uppercase'
      }}>
        DISPOSITION OF TROOPS
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {Object.entries(classes).map(([className, classInfo]) => (
          <ClassPieChart 
            key={className} 
            title={`${className} CADETS`} 
            className={className}
            data={classInfo.data} 
            total={classInfo.total} 
            onSliceClick={handleSliceClick}
            selectedDetails={selectedDetails}
          />
        ))}
      </div>

      {selectedDetails && (
        <AttachmentDetailsView 
          details={selectedDetails} 
          attachmentData={attachmentData}
          rosterData={rosterData}
          onClose={() => setSelectedDetails(null)} 
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function ClassPieChart({ title, className, data, total, onSliceClick, selectedDetails }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const selectedSlice = selectedDetails && selectedDetails.className === className ? selectedDetails : null;

  if (total === 0) {
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>No data available.</p>
      </div>
    );
  }

  let cumulativePercent = 0;
  
  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  const handleInteraction = (slice, isHover) => {
    if (isHover) {
       setHoveredSlice(slice);
    } else {
       onSliceClick(slice, className);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', textAlign: 'center' }}>{title}</h3>
      
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
          {data.map((slice, i) => {
            if (slice.value === 0) return null;
            
            const percent = slice.value / total;
            const startX = getCoordinatesForPercent(cumulativePercent)[0];
            const startY = getCoordinatesForPercent(cumulativePercent)[1];
            
            cumulativePercent += percent;
            
            const endX = getCoordinatesForPercent(cumulativePercent)[0];
            const endY = getCoordinatesForPercent(cumulativePercent)[1];
            
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const isHovered = hoveredSlice?.label === slice.label || selectedSlice?.label === slice.label;
            
            // Adjust radius and stroke based on interaction
            const radius = isHovered ? 1.05 : 1;
            const strokeWidth = isHovered ? 0.35 : 0.3;
            
            const pathData = [
              `M ${startX * radius} ${startY * radius}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX * radius} ${endY * radius}`
            ].join(' ');
            
            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  filter: isHovered ? 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' : 'none'
                }}
                onMouseEnter={() => handleInteraction(slice, true)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => handleInteraction(slice, false)}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL</span>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', minHeight: '80px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {(hoveredSlice || selectedSlice) ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontWeight: 'bold', color: (hoveredSlice || selectedSlice).color, fontSize: '1.1rem' }}>
              {(hoveredSlice || selectedSlice).label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {(hoveredSlice || selectedSlice).value} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Cadets</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {(hoveredSlice || selectedSlice).category}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hover or click a slice for details
          </div>
        )}
      </div>

    </div>
  );
}

function AttachmentDetailsView({ details, attachmentData, rosterData, onClose, isMobile }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Small timeout ensures the DOM has fully rendered the expanded section before scrolling
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [details]);

  if (!attachmentData) return null;

  let filtered = [];

  // If viewing FULL DUTY, we find cadets in rosterData NOT present in attachmentData
  if (details.label === 'FULL DUTY') {
    const classRoster = rosterData.filter(c => c.class === details.className);
    const attachedCadets = attachmentData
      .filter(a => a.class === details.className)
      .map(a => a.name.toUpperCase());
    
    // Find cadets NOT attached
    const fullDutyCadets = classRoster.filter(c => {
       const ln = (c.lastName || '').toUpperCase();
       if (!ln) return false;
       return !attachedCadets.some(ac => ac.includes(ln) || ln.includes(ac));
     });

    filtered = fullDutyCadets.map(c => ({
       name: c.lastName ? c.lastName : 'UNKNOWN',
       class: c.class,
       disposition: 'FULL DUTY',
       reason: 'Effective Status',
       picture: c.picture
    }));
  } else {
    // Filter attachmentData by the clicked class and disposition
    filtered = attachmentData.filter(a => a.class === details.className && a.disposition === details.label);
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
      marginTop: '3rem', 
      padding: isMobile ? '1rem' : '2rem', 
      background: 'var(--card-bg)', 
      borderRadius: '16px', 
      border: `1px solid var(--border-color, #e2e8f0)`, 
      animation: 'fadeIn 0.3s ease-out', 
      position: 'relative',
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.08)`
    }}>
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-secondary, #f4f5f7)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.background='var(--border-color, #e2e8f0)'}
        onMouseLeave={(e) => e.currentTarget.style.background='var(--bg-secondary, #f4f5f7)'}
      >
        &times;
      </button>
      
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-gold, #d4af37)', margin: 0, fontSize: '1.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {details.className} - {details.label}
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
          {filtered.length} Cadet{filtered.length !== 1 ? 's' : ''} Found
        </p>
      </div>

      {filtered.length === 0 ? (
         <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
           No individual personnel records found for this disposition.
         </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {filtered.map((cadet, i) => (
            <div 
              key={i} 
              style={{ 
                background: 'var(--bg-secondary, #f4f5f7)', 
                border: '1px solid var(--border-color, #e2e8f0)', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'center', 
                transition: 'transform 0.2s, background 0.2s, border-color 0.2s', 
                cursor: 'default' 
              }} 
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'var(--card-bg)';
                e.currentTarget.style.borderColor = details.color;
              }} 
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'var(--bg-secondary, #f4f5f7)';
                e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
              }}
            >
               
               <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#2d3748', flexShrink: 0, border: `2px solid ${details.color}`, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                 {cadet.picture ? (
                    <img src={cadet.picture} alt={cadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#a0aec0', fontWeight: 'bold' }}>{cadet.name.charAt(0)}</div>
                 )}
               </div>

               <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>{cadet.name.split(',')[0].trim()}</div>
                 <div style={{ fontSize: '0.75rem', color: cadet.reason === 'Effective Status' ? '#4ade80' : details.color, fontWeight: 700, marginTop: '0.15rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cadet.reason || 'No Reason Specified'}</div>
                 
                 {(cadet.dateStarted || cadet.dateEnd || cadet.pltn) && (
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '0.5rem' }}>
                     {cadet.pltn && <span><strong>PLTN:</strong> {cadet.pltn}</span>}
                     {cadet.dateStarted && <span><strong>Start:</strong> {cadet.dateStarted}</span>}
                     {cadet.dateEnd && <span><strong>End:</strong> {cadet.dateEnd}</span>}
                   </div>
                 )}
               </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
