'use client';

import { useState } from 'react';

// Green gradients for Effective
const EFFECTIVE_COLORS = [
  '#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'
];

// Red gradients for Ineffective
const INEFFECTIVE_COLORS = [
  '#b71c1c', '#c62828', '#d32f2f', '#e53935', '#f44336', '#ef5350', '#e57373', '#ff8a80'
];

export default function DispositionDashboard({ dispositionData }) {
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {Object.entries(classes).map(([className, classInfo]) => (
          <ClassPieChart key={className} title={`${className} CADETS`} data={classInfo.data} total={classInfo.total} />
        ))}
      </div>
    </div>
  );
}

function ClassPieChart({ title, data, total }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(null);

  if (total === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
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
       if (selectedSlice && selectedSlice.label === slice.label) {
          setSelectedSlice(null);
       } else {
          setSelectedSlice(slice);
       }
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
