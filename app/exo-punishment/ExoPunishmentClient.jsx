'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const formatDateTick = (tick) => {
  if (!tick) return '';
  const date = new Date(tick);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export default function ExoPunishmentClient({ initialCadets, violationsOverTime }) {
  const [viewModes, setViewModes] = useState({});
  const [showClassLines, setShowClassLines] = useState(false);
  const { adminUser } = useAuth();

  const chartData = (violationsOverTime || [])
    .map(item => ({
      ...item,
      timestamp: new Date(item.date).getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Auto-calculated domains for dynamic scales
  const timestamps = chartData.map(d => d.timestamp);
  const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  // Pad X axis dynamically by 5 days (5 * 24 * 60 * 60 * 1000 = 432000000 ms) for nice visual spacing
  const paddingX = 432000000; 
  const domainX = timestamps.length > 0 ? [minTime - paddingX, maxTime + paddingX] : ['auto', 'auto'];

  const counts = chartData.map(d => d.total);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const domainY = [0, maxCount + 1];

  // Helper to generate custom gradient stops based on segment slope
  const generateGradientStops = () => {
    if (!chartData || chartData.length < 2) return [];
    
    const xMin = minTime;
    const xMax = maxTime;
    const xRange = xMax - xMin || 1;
    
    const stops = [];
    
    for (let i = 0; i < chartData.length - 1; i++) {
      const curr = chartData[i];
      const next = chartData[i + 1];
      
      const dy = next.total - curr.total;
      const dxDays = (next.timestamp - curr.timestamp) / (24 * 60 * 60 * 1000) || 1;
      const slope = dy / dxDays;
      
      let color = '#fbbf24'; // default yellow
      if (slope > 0) {
        // Upward
        if (slope >= 0.1) {
          color = '#ef4444'; // steep upward -> Red
        } else {
          color = '#fbbf24'; // less/moderate steep -> Yellow
        }
      } else if (slope < 0) {
        // Downward
        if (slope <= -0.1) {
          color = '#10b981'; // steep downward -> Green
        } else {
          color = '#fbbf24'; // less steep -> Yellow
        }
      }
      
      const pctStart = ((curr.timestamp - xMin) / xRange) * 100;
      const pctEnd = ((next.timestamp - xMin) / xRange) * 100;
      
      stops.push({ offset: `${pctStart}%`, color });
      stops.push({ offset: `${pctEnd}%`, color });
    }
    
    return stops;
  };

  const gradientStops = generateGradientStops();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div style={{ width: '100%' }}>
      {adminUser && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', width: '100%' }}>
          <a
            href="https://docs.google.com/spreadsheets/d/1kdpf8pdHx2ETbfLqyJfyxcOnWGiz08JxI__FvJIRH3M/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
            </svg>
            VIEW SPREADSHEET
          </a>
        </div>
      )}

      {chartData && chartData.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Violations Over Time</h2>
            <button
              onClick={() => setShowClassLines(prev => !prev)}
              style={{
                padding: '0.45rem 1rem',
                background: showClassLines ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: showClassLines ? '#3b82f6' : 'var(--text-secondary)',
                border: showClassLines ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!showClassLines) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseOut={(e) => {
                if (!showClassLines) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              {showClassLines ? 'HIDE CLASS BREAKDOWNS' : 'SHOW CLASS BREAKDOWNS'}
            </button>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="violationsGradient" x1="0" y1="0" x2="1" y2="0">
                    {gradientStops.length > 0 ? (
                      gradientStops.map((stop, idx) => (
                        <stop key={idx} offset={stop.offset} stopColor={stop.color} />
                      ))
                    ) : (
                      <stop offset="0%" stopColor="#f43f5e" />
                    )}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={domainX}
                  tickFormatter={formatDateTick}
                  stroke="var(--text-secondary)" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  domain={domainY}
                  allowDecimals={false}
                />
                <Tooltip 
                  labelFormatter={formatDateTick}
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="url(#violationsGradient)" 
                  strokeWidth={3.5}
                  activeDot={{ r: 8, fill: '#f43f5e', stroke: 'var(--bg-primary)' }} 
                  name="Total Reports"
                />
                {showClassLines && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="class1" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Class 1 (Grave)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="class2" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Class 2 (Major)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="class3" 
                      stroke="#eab308" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Class 3 (Moderate)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="class4" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Class 4 (Minor)"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', width: '100%' }}>
          {sortedCadets.map((cadet, index) => {
            const maxDemerits = getMaxDemerits(cadet.rank);
            const accumulatedDemerits = Math.max(0, cadet.totalDemerits - (cadet.totalMerits || 0));
            const demeritPercentageRaw = (accumulatedDemerits / maxDemerits) * 100;
            const demeritPercentage = Math.min(100, demeritPercentageRaw);
            
            let healthColor = '#fbbf24';
            if (demeritPercentage >= 30 && demeritPercentage < 60) healthColor = '#f97316';
            if (demeritPercentage >= 60 && demeritPercentage < 80) healthColor = '#ef4444';
            if (demeritPercentage >= 80 && demeritPercentage < 95) healthColor = '#b91c1c';
            if (demeritPercentage >= 95 && demeritPercentage < 100) healthColor = '#7f1d1d';
            if (demeritPercentage >= 100) healthColor = '#111827';
            
            const isFlashingDarkRed = demeritPercentage >= 95 && demeritPercentage < 100;
            const isBlackOut = demeritPercentage >= 100;
            const isExcessive = demeritPercentageRaw > 100;

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
              <div 
                key={index} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '16px', 
                  border: '1px solid var(--border-color)', 
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  opacity: isGloballyInactive ? 0.7 : 1
                }}
              >
                {/* Cadet Profile Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {cadet.picture ? (
                    <img 
                      src={cadet.picture} 
                      alt={cadet.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(128,128,128,0.2)' }}
                    />
                  ) : (
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', flexShrink: 0
                    }}>
                      {cadet.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {cadet.rank} {cadet.name}
                    </div>
                  </div>
                  
                  {/* Mode Toggle Buttons */}
                  <div style={{ 
                    display: 'inline-flex', 
                    background: 'rgba(128,128,128,0.15)', 
                    borderRadius: '20px', 
                    padding: '0.2rem',
                    gap: '0.2rem'
                  }}>
                    <button 
                      onClick={() => toggleViewMode(cadet.name, 'active')}
                      style={{ 
                        padding: '0.2rem 0.5rem',
                        borderRadius: '16px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: currentMode === 'active' ? '#ef4444' : 'transparent',
                        color: currentMode === 'active' ? '#ffffff' : 'var(--text-secondary)',
                        boxShadow: currentMode === 'active' ? '0 2px 5px rgba(239,68,68,0.3)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Act ({activeOffenses.length})
                    </button>
                    <button 
                      onClick={() => toggleViewMode(cadet.name, 'inactive')}
                      style={{ 
                        padding: '0.2rem 0.5rem',
                        borderRadius: '16px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: currentMode === 'inactive' ? '#10b981' : 'transparent',
                        color: currentMode === 'inactive' ? '#ffffff' : 'var(--text-secondary)',
                        boxShadow: currentMode === 'inactive' ? '0 2px 5px rgba(16,185,129,0.3)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Inact ({inactiveOffenses.length})
                    </button>
                  </div>
                </div>

                {/* Offenses list */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Offenses Details
                  </div>
                  {displayedOffenses.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      (No {currentMode} punishments)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {displayedOffenses.map((offense, i) => {
                        const offConfStats = getConfinementStats(offense.confStart, offense.confEnd);
                        const offConfCompleted = !offense.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
                        
                        const offTourProgress = (offense.tourServed || 0) + (offense.tourConverted || 0);
                        const offTourCompleted = offense.tourTotal === 0 || offTourProgress >= offense.tourTotal;
                        
                        const isOffInactive = offConfCompleted && offTourCompleted;

                        return (
                          <div key={i} style={{ 
                            background: 'var(--bg-primary)', 
                            padding: '0.6rem', 
                            borderRadius: '8px', 
                            borderLeft: isOffInactive ? '3px solid #6b7280' : '3px solid #fbbf24',
                            border: '1px solid var(--border-color)',
                            opacity: isOffInactive ? 0.6 : 1
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                {offense.natureOfOffense || 'UNKNOWN'}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: isOffInactive ? '#6b7280' : '#eab308', fontWeight: 800 }}>Class {offense.classOfOffense}</div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{offense.description}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Progress bars & stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  {/* Demerits Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span>DEMERITS</span>
                      <span style={{ fontWeight: 800, color: healthColor }}>
                        {accumulatedDemerits.toFixed(1)} / {maxDemerits}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', width: `${demeritPercentage}%`, background: healthColor,
                          animation: isFlashingDarkRed ? 'dramatic-pulse-red 0.6s ease-in-out infinite alternate' : isBlackOut ? 'pulse-black 1.5s infinite' : 'none'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Confinement Progress */}
                  {displayConfStats.total > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>CONFINEMENT ({displayConfStats.remaining === 0 ? 'COMPLETED' : 'CONFINED'})</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {displayConfStats.served} / {displayConfStats.total} days
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${displayConfStats.percentage}%`, background: '#10b981' }} />
                      </div>
                    </div>
                  )}

                  {/* Touring Progress */}
                  {cadet.totalTour > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>TOURING ({tourProgress >= cadet.totalTour ? 'SERVED' : 'ACTIVE'})</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {tourProgress} / {cadet.totalTour} hrs
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${tourPercentage}%`, background: '#10b981' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="table-container" style={{ marginTop: '0rem', width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>Cadet Profile</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '35%' }}>Offenses</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Accumulated Demerits</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Confinement</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '10%' }}>Touring</th>
            </tr>
          </thead>
          <tbody>
            {sortedCadets.map((cadet, index) => {
              const maxDemerits = getMaxDemerits(cadet.rank);
              const accumulatedDemerits = Math.max(0, cadet.totalDemerits - (cadet.totalMerits || 0));
              const demeritPercentageRaw = (accumulatedDemerits / maxDemerits) * 100;
              const demeritPercentage = Math.min(100, demeritPercentageRaw);
              
              let healthColor = '#fbbf24'; // Yellow
              if (demeritPercentage >= 30 && demeritPercentage < 60) healthColor = '#f97316'; // Orange
              if (demeritPercentage >= 60 && demeritPercentage < 80) healthColor = '#ef4444'; // Red
              if (demeritPercentage >= 80 && demeritPercentage < 95) healthColor = '#b91c1c'; // Dark Red
              if (demeritPercentage >= 95 && demeritPercentage < 100) healthColor = '#7f1d1d'; // Flashing Dark Red
              if (demeritPercentage >= 100) healthColor = '#111827'; // Black
              
              const isFlashingDarkRed = demeritPercentage >= 95 && demeritPercentage < 100;
              const isBlackOut = demeritPercentage >= 100;
              const isExcessive = demeritPercentageRaw > 100;

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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accumulated Demerits</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 800, color: healthColor, fontSize: '1.1rem' }}>{accumulatedDemerits.toFixed(1)}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {maxDemerits}</span>
                      </div>
                      {isExcessive && (
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', marginTop: '-0.2rem' }}>
                          Excessive demerits
                        </div>
                      )}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(128,128,128,0.2)', borderRadius: '4px', position: 'relative', marginTop: '0.5rem' }}>
                        <div 
                          style={{ 
                            height: '100%', width: `${demeritPercentage}%`, background: healthColor, borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            animation: isFlashingDarkRed ? 'dramatic-pulse-red 0.6s ease-in-out infinite alternate' : isBlackOut ? 'pulse-black 1.5s infinite' : 'none',
                            boxShadow: isFlashingDarkRed ? '0 0 10px #7f1d1d, 0 0 20px #7f1d1d' : isBlackOut ? '0 0 10px #111827' : 'none',
                            zIndex: isFlashingDarkRed ? 10 : 1
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
      </div>

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
        </>
      )}
    </div>
  );
}