'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

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
  
  if (!start || !end) return { total: 0, remaining: 0, percentage: 0, startText: '-', endText: '-', urgency: 'NONE', urgencyText: '' };
  
  const today = new Date();
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  
  let remainingMs = end.getTime() - today.getTime();
  let remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
  if (remainingDays < 0) remainingDays = 0;
  if (remainingDays > totalDays) remainingDays = totalDays;
  
  let percentage = ((totalDays - remainingDays) / totalDays) * 100;

  let urgency = 'NONE';
  let urgencyText = '';
  if (remainingDays === 0) {
    urgency = 'COMPLETED';
    urgencyText = 'Served';
  } else if (remainingDays === 1) {
    urgency = 'CRITICAL';
    urgencyText = 'Ends in 24h';
  } else if (remainingDays <= 3) {
    urgency = 'SOON';
    urgencyText = `${remainingDays}d left`;
  } else {
    urgency = 'ACTIVE';
    urgencyText = `${remainingDays}d left`;
  }
  
  return {
    total: totalDays,
    remaining: remainingDays,
    percentage: percentage,
    startText: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    endText: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    urgency,
    urgencyText
  };
}

const getMaxDemerits = (rank) => {
  const r = (rank || '').toUpperCase();
  if (r.includes('1CL') || r.includes('CPT') || r.includes('LT') || r.includes('MAJ') || r.includes('COL')) return 61.8;
  if (r.includes('2CL')) return 72.1;
  if (r.includes('3CL')) return 82.4;
  if (r.includes('4CL')) return 92.7;
  return 82.4;
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter(item => Number(item.value) > 0);
    
    if (filteredPayload.length === 0) return null;

    return (
      <div style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '8px',
        padding: '0.75rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          {formatDateTick(label)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filteredPayload.map((item, idx) => {
            const itemColor = String(item.color || '').startsWith('url') ? '#f43f5e' : (item.color || 'var(--text-primary)');
            return (
              <div key={idx} style={{ fontSize: '0.8rem', color: itemColor, fontWeight: 600, display: 'flex', gap: '4px' }}>
                <span>{item.name}:</span>
                <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const getOffenseColor = (name) => {
  const normalized = String(name || '').trim().toUpperCase();
  if (normalized.includes('UNACCOUNTED') || normalized.includes('ABSENT')) return '#de3c4b'; // Crimson Rose
  if (normalized.includes('LATE')) return '#d97706'; // Burnt copper amber
  if (normalized.includes('NEGLIGENCE') || normalized.includes('NEGLEGENCE') || normalized.includes('DUTY')) return '#d4af37'; // Military brass gold
  if (normalized.includes('POSSESSING') || normalized.includes('UNAUTHORIZED ITEMS')) return '#8a5cf6'; // Amethyst violet
  if (normalized.includes('DOING') || normalized.includes('UNAUTHORIZED THINGS')) return '#be185d'; // Deep raspberry red
  if (normalized.includes('MALTREATMENT') || normalized.includes('NTP') || normalized.includes('CTP')) return '#1d4ed8'; // Royal cadet blue
  if (normalized.includes('HONOR')) return '#0d9488'; // Sleek teal green
  if (normalized.includes('CLEANLINESS') || normalized.includes('ROOM')) return '#0284c7'; // Cool deep sky blue
  if (normalized.includes('UNIFORM') || normalized.includes('RIFLE')) return '#4f46e5'; // Deep navy indigo
  return '#64748b'; // Integrated slate gray
};

const getOffenseEmoji = (name) => {
  const normalized = String(name || '').trim().toUpperCase();
  if (normalized.includes('UNACCOUNTED') || normalized.includes('ABSENT')) return '🚨';
  if (normalized.includes('LATE')) return '⏰';
  if (normalized.includes('NEGLIGENCE') || normalized.includes('NEGLEGENCE') || normalized.includes('DUTY')) return '⚠️';
  if (normalized.includes('POSSESSING') || normalized.includes('UNAUTHORIZED ITEMS')) return '📦';
  if (normalized.includes('DOING') || normalized.includes('UNAUTHORIZED THINGS')) return '🚫';
  if (normalized.includes('MALTREATMENT') || normalized.includes('NTP') || normalized.includes('CTP')) return '🚷';
  if (normalized.includes('HONOR')) return '🎖️';
  if (normalized.includes('CLEANLINESS') || normalized.includes('ROOM')) return '🧹';
  if (normalized.includes('UNIFORM') || normalized.includes('RIFLE')) return '💂';
  return '📝';
};

const CustomRadarDot = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const count = payload.count || 0;
  if (count === 0) return null;
  
  const color = getOffenseColor(payload.name);
  return (
    <g>
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--bg-primary)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={8} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
    </g>
  );
};

const OffensesPizzaChart = ({ data, hoveredItem, setHoveredItem }) => {
  const [enlargedIndex, setEnlargedIndex] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  const numCategories = data.length;

  useEffect(() => {
    let start = null;
    const growDuration = 500; // 500ms growth duration per slice
    const staggerDelay = 100; // 100ms staggered clockwise delay between slices
    const totalDuration = (numCategories - 1) * staggerDelay + growDuration;
    let animFrameId = null;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      setElapsedTime(Math.min(elapsed, totalDuration));

      if (elapsed < totalDuration) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [numCategories]);

  if (!data || data.length === 0) return null;

  const cx = 200;
  const cy = 130;
  const maxRadius = 125;
  const innerRadius = 22;
  const angleStep = 360 / numCategories;

  const maxVal = Math.max(1, ...data.map(d => d.count || 0));

  const getCoords = (radius, angle) => {
    const rad = (angle - 90) * Math.PI / 180.0;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    };
  };

  const getSectorPath = (innerR, outerR, startA, endA) => {
    const startOuter = getCoords(outerR, endA);
    const endOuter = getCoords(outerR, startA);
    const startInner = getCoords(innerR, endA);
    const endInner = getCoords(innerR, startA);

    const largeArcFlag = endA - startA <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  const handleMouseEnter = (item, idx) => {
    setHoveredItem(item);
    setEnlargedIndex(idx);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setEnlargedIndex(null);
    }, 2000);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setEnlargedIndex(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <svg 
        width="100%" 
        height={260} 
        viewBox="0 0 400 260" 
        style={{ overflow: 'visible' }}
      >
        {/* Render each slice */}
        {data.map((item, idx) => {
          const startAngle = idx * angleStep;
          const endAngle = startAngle + angleStep;
          const catColor = getOffenseColor(item.name);
          const hasCount = item.count > 0;

          const isHovered = hoveredItem && hoveredItem.name === item.name;
          const isEnlarged = enlargedIndex === idx;

          // Calculate individual stagger timing for this slice
          const sliceStartTime = idx * 100; // 100ms delay per slice clockwise
          const sliceElapsed = Math.max(0, elapsedTime - sliceStartTime);
          const sliceProgress = Math.min(sliceElapsed / 500, 1); // 500ms duration per slice
          const easeProgress = 1 - Math.pow(1 - sliceProgress, 3); // easeOutCubic

          // Calculate radii
          const activeRadius = innerRadius + (maxRadius - innerRadius) * (item.count / maxVal);
          const currentRadius = isEnlarged 
            ? innerRadius + (maxRadius - innerRadius) * (item.count / maxVal) * 1.15
            : innerRadius + (activeRadius - innerRadius) * easeProgress;

          return (
            <g 
              key={idx}
              onMouseEnter={() => handleMouseEnter(item, idx)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              {/* Background slice track (faint fill, no stroke) */}
              <path 
                d={getSectorPath(innerRadius, maxRadius, startAngle, endAngle)} 
                fill="rgba(0, 0, 0, 0.015)" 
                stroke="none" 
              />

              {/* Active colored slice */}
              {hasCount && (
                <path 
                  d={getSectorPath(innerRadius, currentRadius, startAngle, endAngle)} 
                  fill={isHovered ? catColor : `${catColor}cc`} 
                  stroke={catColor} 
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ 
                    transition: 'd 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.2s ease, filter 0.2s ease',
                    filter: isHovered ? `drop-shadow(0 0 8px ${catColor})` : 'none'
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={10} 
          fill="var(--bg-primary)" 
          stroke="rgba(0, 0, 0, 0.15)" 
          strokeWidth={1.5} 
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  );
};

export function isOffenseServed(off) {
  if (!off) return false;
  const offConfStats = getConfinementStats(off.confStart, off.confEnd);
  const offConfCompleted = !off.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
  const offTourProgress = (off.tourServed || 0) + (off.tourConverted || 0);
  const offTourCompleted = (off.tourTotal || 0) === 0 || offTourProgress >= (off.tourTotal || 0);
  return offConfCompleted && offTourCompleted;
}

export function isOffenseArchived(off) {
  if (!off) return false;
  const isFirstTerm = !off.isAwardedAfterSep11 || off.term === '1st Term';
  return isFirstTerm && isOffenseServed(off);
}

export default function ExoPunishmentClient({ initialCadets, violationsOverTime, breakdownData }) {
  const [viewModes, setViewModes] = useState({});
  const [showClassLines, setShowClassLines] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('active');
  const [copiedRollCall, setCopiedRollCall] = useState(false);
  const [selectedOffenseModal, setSelectedOffenseModal] = useState(null);
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
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
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

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const dateStr = state.activePayload[0].payload.date;
      setSelectedDate(prev => prev === dateStr ? null : dateStr);
    }
  };

  const totalArchivedCount = (initialCadets || []).reduce((acc, cadet) => {
    return acc + (cadet.offenses || []).filter(isOffenseArchived).length;
  }, 0);

  // Executive KPI stats aggregated across all company cadets
  const kpiStats = useMemo(() => {
    let activeCadetsCount = 0;
    let confinedCadetsCount = 0;
    let totalTouringRemaining = 0;
    let criticalDemeritsCount = 0;

    (initialCadets || []).forEach(cadet => {
      let isCadetActive = false;
      let isCadetConfined = false;
      let cadetTourRemaining = 0;

      const maxDem = getMaxDemerits(cadet.rank);
      const accDem = Math.max(0, (cadet.totalDemerits || 0) - (cadet.totalMerits || 0));
      if (maxDem > 0 && (accDem / maxDem) >= 0.8) {
        criticalDemeritsCount++;
      }

      (cadet.offenses || []).forEach(off => {
        if (off.isConfined && off.confStart && off.confEnd) {
          const stats = getConfinementStats(off.confStart, off.confEnd);
          if (stats.remaining > 0) {
            isCadetConfined = true;
          }
        }
        const progress = (off.tourServed || 0) + (off.tourConverted || 0);
        const rem = Math.max(0, (off.tourTotal || 0) - progress);
        cadetTourRemaining += rem;

        const stats = getConfinementStats(off.confStart, off.confEnd);
        const confDone = !off.isConfined || (stats.total > 0 && stats.remaining === 0);
        const tourDone = (off.tourTotal || 0) === 0 || progress >= (off.tourTotal || 0);
        if (!confDone || !tourDone) {
          isCadetActive = true;
        }
      });

      if (isCadetActive) activeCadetsCount++;
      if (isCadetConfined) confinedCadetsCount++;
      totalTouringRemaining += cadetTourRemaining;
    });

    return {
      activeCadetsCount,
      confinedCadetsCount,
      totalTouringRemaining,
      criticalDemeritsCount
    };
  }, [initialCadets]);

  // One-click CCQ / Touring roll-call clipboard generator
  const handleCopyRollCall = () => {
    const todayStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let text = `========================================\n`;
    text += `🎖️ BRAVO CO. PUNISHMENT MONITORING ROSTER\n`;
    text += `📅 As of: ${todayStr} ${nowTimeStr}\n`;
    text += `========================================\n\n`;

    // Confined Cadets
    const confinedList = [];
    (initialCadets || []).forEach(c => {
      const activeConf = (c.offenses || []).find(o => {
        if (!o.isConfined || !o.confStart || !o.confEnd) return false;
        const st = getConfinementStats(o.confStart, o.confEnd);
        return st.remaining > 0;
      });
      if (activeConf) {
        const st = getConfinementStats(activeConf.confStart, activeConf.confEnd);
        confinedList.push({ rank: c.rank, name: c.name, remaining: st.remaining, endText: st.endText });
      }
    });

    text += `🔒 CURRENTLY CONFINED CADETS (${confinedList.length}):\n`;
    if (confinedList.length === 0) {
      text += `   (None - Confinement list is clear)\n`;
    } else {
      confinedList.forEach((c, idx) => {
        text += `   ${idx + 1}. CDT ${c.rank} ${c.name} - ${c.remaining} days left (until ${c.endText})\n`;
      });
    }

    // Touring Cadets
    const touringList = [];
    (initialCadets || []).forEach(c => {
      let rem = 0;
      let tot = 0;
      let srv = 0;
      (c.offenses || []).forEach(o => {
        const p = (o.tourServed || 0) + (o.tourConverted || 0);
        rem += Math.max(0, (o.tourTotal || 0) - p);
        tot += (o.tourTotal || 0);
        srv += p;
      });
      if (rem > 0) {
        touringList.push({ rank: c.rank, name: c.name, rem, tot, srv });
      }
    });
    touringList.sort((a, b) => b.rem - a.rem);

    text += `\n🏃 ACTIVE TOURING CADETS (${touringList.length}):\n`;
    if (touringList.length === 0) {
      text += `   (None - Touring list is clear)\n`;
    } else {
      touringList.forEach((c, idx) => {
        text += `   ${idx + 1}. CDT ${c.rank} ${c.name} - ${c.rem} hrs rem (Served: ${c.srv}/${c.tot} hrs)\n`;
      });
    }

    // High Risk Demerits
    const criticalList = [];
    (initialCadets || []).forEach(c => {
      const maxDem = getMaxDemerits(c.rank);
      const acc = Math.max(0, (c.totalDemerits || 0) - (c.totalMerits || 0));
      if (maxDem > 0 && (acc / maxDem) >= 0.8) {
        criticalList.push({ rank: c.rank, name: c.name, acc, maxDem, pct: ((acc / maxDem) * 100).toFixed(0) });
      }
    });
    criticalList.sort((a, b) => (b.acc / b.maxDem) - (a.acc / a.maxDem));

    text += `\n⚠️ HIGH-RISK DEMERITS (≥80% Limit) (${criticalList.length}):\n`;
    if (criticalList.length === 0) {
      text += `   (None - No cadets in critical demerit zone)\n`;
    } else {
      criticalList.forEach((c, idx) => {
        text += `   ${idx + 1}. CDT ${c.rank} ${c.name} - ${c.acc.toFixed(1)}/${c.maxDem} dem (${c.pct}% used)\n`;
      });
    }

    text += `\n========================================\n`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedRollCall(true);
        setTimeout(() => setCopiedRollCall(false), 2500);
      });
    }
  };

  // 1. Archive filter
  const cadetsWithArchiveFilter = (initialCadets || []).map(cadet => {
    const visibleOffenses = showArchived
      ? cadet.offenses
      : (cadet.offenses || []).filter(off => !isOffenseArchived(off));
    
    if (visibleOffenses.length === 0) return null;
    return {
      ...cadet,
      offenses: visibleOffenses
    };
  }).filter(Boolean);

  // 2. Date filter (from chart click)
  const dateFilteredCadets = selectedDate
    ? cadetsWithArchiveFilter.map(cadet => {
        const matchingOffenses = cadet.offenses.filter(off => off.date === selectedDate);
        if (matchingOffenses.length === 0) return null;
        return {
          ...cadet,
          offenses: matchingOffenses
        };
      }).filter(Boolean)
    : cadetsWithArchiveFilter;

  // 3. Class filter
  const classFilteredCadets = classFilter === 'ALL'
    ? dateFilteredCadets
    : dateFilteredCadets.filter(cadet => {
        const r = (cadet.rank || '').toUpperCase();
        return r.includes(classFilter);
      });

  // 4. Status filter
  const statusFilteredCadets = statusFilter === 'ALL'
    ? classFilteredCadets
    : classFilteredCadets.filter(cadet => {
        if (statusFilter === 'CONFINED') {
          return (cadet.offenses || []).some(off => {
            if (!off.isConfined || !off.confStart || !off.confEnd) return false;
            const stats = getConfinementStats(off.confStart, off.confEnd);
            return stats.remaining > 0;
          });
        }
        if (statusFilter === 'TOURING') {
          return (cadet.offenses || []).some(off => {
            const progress = (off.tourServed || 0) + (off.tourConverted || 0);
            return (off.tourTotal || 0) > progress;
          });
        }
        if (statusFilter === 'CRITICAL') {
          const maxDem = getMaxDemerits(cadet.rank);
          const accDem = Math.max(0, (cadet.totalDemerits || 0) - (cadet.totalMerits || 0));
          return maxDem > 0 && (accDem / maxDem) >= 0.8;
        }
        return true;
      });

  // 5. Free-text search filter
  const searchedCadets = searchQuery.trim() !== ''
    ? statusFilteredCadets.filter(cadet => 
        (cadet.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cadet.rank || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : statusFilteredCadets;

  const matchingArchivedCount = searchQuery.trim() !== '' && !showArchived
    ? (initialCadets || []).filter(cadet => {
        const matchesSearch = (cadet.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cadet.rank || '').toLowerCase().includes(searchQuery.toLowerCase());
        const hasArchived = (cadet.offenses || []).some(isOffenseArchived);
        return matchesSearch && hasArchived;
      }).length
    : 0;

  // 6. Chain Sorting
  const sortedCadets = [...searchedCadets].map(cadet => {
    let activeOffenseCount = 0;
    let totalRemainingTour = 0;
    let maxConfinementDaysLeft = 0;

    (cadet.offenses || []).forEach(off => {
      const offConfStats = getConfinementStats(off.confStart, off.confEnd);
      const offConfCompleted = !off.isConfined || (offConfStats.total > 0 && offConfStats.remaining === 0);
      const offTourProgress = (off.tourServed || 0) + (off.tourConverted || 0);
      const offTourCompleted = off.tourTotal === 0 || offTourProgress >= off.tourTotal;
      if (!(offConfCompleted && offTourCompleted)) {
        activeOffenseCount++;
      }
      totalRemainingTour += Math.max(0, (off.tourTotal || 0) - offTourProgress);
      if (off.isConfined && offConfStats.remaining > maxConfinementDaysLeft) {
        maxConfinementDaysLeft = offConfStats.remaining;
      }
    });

    const maxDem = getMaxDemerits(cadet.rank);
    const accDem = Math.max(0, (cadet.totalDemerits || 0) - (cadet.totalMerits || 0));
    const demeritPct = maxDem > 0 ? (accDem / maxDem) : 0;

    return { 
      ...cadet, 
      activeOffenseCount,
      totalRemainingTour,
      maxConfinementDaysLeft,
      demeritPct,
      accDem
    };
  }).sort((a, b) => {
    if (sortBy === 'tourRemaining') {
      return b.totalRemainingTour - a.totalRemainingTour;
    }
    if (sortBy === 'demerits') {
      return b.demeritPct - a.demeritPct || b.accDem - a.accDem;
    }
    if (sortBy === 'confinement') {
      return b.maxConfinementDaysLeft - a.maxConfinementDaysLeft;
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    // Default: active offenses first
    const aActive = a.activeOffenseCount > 0;
    const bActive = b.activeOffenseCount > 0;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0; // maintain original order for ties
  });

  return (
    <div style={{ width: '100%', zoom: isMobile ? '0.8' : '1', transformOrigin: 'top center' }}>
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

      {/* Executive KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
        width: '100%'
      }}>
        {/* Card 1: Active Cadets */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'ALL' ? 'ALL' : 'ALL')}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Cadets</span>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {kpiStats.activeCadetsCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Serving Tour / Confinement</div>
        </div>

        {/* Card 2: Currently Confined */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'CONFINED' ? 'ALL' : 'CONFINED')}
          style={{
            background: statusFilter === 'CONFINED' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
            border: statusFilter === 'CONFINED' ? '1px solid #ef4444' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#ef4444' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Confined</span>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444' }}>
            {kpiStats.confinedCadetsCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Under Room / Post Confinement</div>
        </div>

        {/* Card 3: Touring Remaining */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'TOURING' ? 'ALL' : 'TOURING')}
          style={{
            background: statusFilter === 'TOURING' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
            border: statusFilter === 'TOURING' ? '1px solid #f59e0b' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#f59e0b' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Touring Left</span>
            <span style={{ fontSize: '1.25rem' }}>🏃</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b' }}>
            {kpiStats.totalTouringRemaining} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pending Touring Duty</div>
        </div>

        {/* Card 4: Critical Demerits */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            background: statusFilter === 'CRITICAL' ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-secondary)',
            border: statusFilter === 'CRITICAL' ? '1px solid #dc2626' : '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#dc2626' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Critical (≥80%)</span>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626' }}>
            {kpiStats.criticalDemeritsCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Close to Turnback Threshold</div>
        </div>
      </div>

      {((chartData && chartData.length > 0) || (breakdownData && breakdownData.length > 0)) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
          alignItems: 'stretch'
        }}>
          {/* Card 1: Violations Over Time */}
          {chartData && chartData.length > 0 && (
            <div className="card" style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: isMobile ? '380px' : '580px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>Violations Over Time</h2>
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
              <div className="graph-container" style={{ width: '100%', flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
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
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="url(#violationsGradient)" 
                      strokeWidth={3.5}
                      dot={{ r: 4, style: { cursor: 'pointer' } }}
                      activeDot={{ r: 8, fill: '#f43f5e', stroke: 'var(--bg-primary)', style: { cursor: 'pointer' } }} 
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
          {/* Card 2: Offenses Breakdown (Pizza Chart) */}
          {breakdownData && breakdownData.length > 0 && (
            <div className="card" style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: isMobile ? '380px' : '580px'
            }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 1rem 0', fontWeight: 700 }}>Offense Breakdown</h2>
              <div className="graph-container" style={{ width: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <OffensesPizzaChart data={breakdownData} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />
              </div>

              {/* Compact Interactive Legend Grid */}
              <div style={{ 
                marginTop: '0.75rem', 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.75rem',
                fontSize: '0.7rem'
              }}>
                {breakdownData.map((item, idx) => {
                  const catColor = getOffenseColor(item.name);
                  const isHovered = hoveredItem && hoveredItem.name === item.name;
                  return (
                    <div 
                      key={idx} 
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: isHovered ? 700 : 400,
                        transition: 'all 0.15s ease',
                        opacity: hoveredItem && !isHovered ? 0.4 : 1
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{getOffenseEmoji(item.name)}</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Infobox displaying progress bar on hover */}
              <div style={{
                marginTop: '1rem',
                minHeight: '62px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.25s ease',
                boxShadow: hoveredItem && hoveredItem.count > 0 ? `0 2px 10px ${getOffenseColor(hoveredItem.name)}15` : 'none',
                textAlign: 'center'
              }}>
                {hoveredItem ? (() => {
                  const totalCount = breakdownData.reduce((sum, d) => sum + (d.count || 0), 0);
                  const percentage = totalCount > 0 ? ((hoveredItem.count / totalCount) * 100).toFixed(1) : 0;
                  const catColor = getOffenseColor(hoveredItem.name);
                  return (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.15s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.8rem', 
                          color: 'var(--text-primary)', 
                          textAlign: 'left', 
                          textOverflow: 'ellipsis', 
                          overflow: 'hidden', 
                          whiteSpace: 'nowrap', 
                          maxWidth: '240px' 
                        }}>
                          {getOffenseEmoji(hoveredItem.name)} {hoveredItem.name}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: catColor, flexShrink: 0 }}>
                          {hoveredItem.count} <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({percentage}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: catColor, 
                          borderRadius: '3px', 
                          boxShadow: hoveredItem.count > 0 ? `0 0 6px ${catColor}` : 'none' 
                        }}></div>
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Hover chart or legend to inspect data</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedDate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing offenses on <strong style={{ color: 'var(--text-primary)' }}>{formatDateTick(selectedDate)}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          >
            CLEAR FILTER
          </button>
        </div>
      )}
      {/* Search Input Bar & Controls */}
      <div style={{ 
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        marginTop: '0.5rem',
        animation: 'fadeIn 0.4s ease'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search cadet by name or rank (e.g. kurtr, 1CL, Cdt)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.25s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem',
                borderRadius: '50%'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Copy CCQ Roster Button */}
        <button
          onClick={handleCopyRollCall}
          style={{
            padding: '0.85rem 1.25rem',
            background: copiedRollCall ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)',
            border: copiedRollCall ? '1px solid #10b981' : '1px solid var(--border-color)',
            color: copiedRollCall ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
          onMouseOver={(e) => {
            if (!copiedRollCall) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseOut={(e) => {
            if (!copiedRollCall) e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          title="Copy active touring and confinement muster to clipboard"
        >
          {copiedRollCall ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied Roster!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy CCQ Roster
            </>
          )}
        </button>

        {/* Show / Hide Archived Offenses Button */}
        <button
          onClick={() => setShowArchived(prev => !prev)}
          style={{
            padding: '0.85rem 1.25rem',
            background: showArchived ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
            border: showArchived ? '1px solid #3b82f6' : '1px solid var(--border-color)',
            color: showArchived ? '#3b82f6' : 'var(--text-secondary)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
          onMouseOver={(e) => {
            if (!showArchived) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseOut={(e) => {
            if (!showArchived) e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
          {showArchived ? 'Hide Archived Offenses' : 'Show Archived Offenses'}
          {totalArchivedCount > 0 && (
            <span style={{
              background: showArchived ? '#3b82f6' : 'rgba(128,128,128,0.2)',
              color: showArchived ? '#ffffff' : 'var(--text-primary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {totalArchivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Filters & Sorting Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.75rem 1rem'
      }}>
        {/* Class Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>CLASS:</span>
          {['ALL', '1CL', '2CL', '3CL', '4CL'].map(cls => {
            const isSelected = classFilter === cls;
            return (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#60a5fa' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cls}
              </button>
            );
          })}
        </div>

        {/* Status Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>STATUS:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CONFINED', label: '🔒 Confined' },
            { id: 'TOURING', label: '🏃 Touring' },
            { id: 'CRITICAL', label: '⚠️ Critical' }
          ].map(st => {
            const isSelected = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected 
                    ? (st.id === 'CONFINED' ? '1px solid #ef4444' : st.id === 'TOURING' ? '1px solid #f59e0b' : st.id === 'CRITICAL' ? '1px solid #dc2626' : '1px solid #3b82f6')
                    : '1px solid var(--border-color)',
                  background: isSelected 
                    ? (st.id === 'CONFINED' ? 'rgba(239, 68, 68, 0.2)' : st.id === 'TOURING' ? 'rgba(245, 158, 11, 0.2)' : st.id === 'CRITICAL' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected 
                    ? (st.id === 'CONFINED' ? '#f87171' : st.id === 'TOURING' ? '#fbbf24' : st.id === 'CRITICAL' ? '#f87171' : '#60a5fa')
                    : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SORT:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="active">Active First</option>
            <option value="tourRemaining">Most Touring Left</option>
            <option value="demerits">Highest Demerits</option>
            <option value="confinement">Confinement Left</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {(classFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'active' || searchQuery !== '') && (
            <button
              onClick={() => {
                setClassFilter('ALL');
                setStatusFilter('ALL');
                setSortBy('active');
                setSearchQuery('');
              }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Reset ✕
            </button>
          )}
        </div>
      </div>

      {sortedCadets.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', marginTop: '1rem', width: '100%' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{searchQuery ? '🔍' : '🎉'}</div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
            {searchQuery ? 'No Cadets Match Your Search' : 'No Active Punishments'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {searchQuery
              ? (matchingArchivedCount > 0
                  ? `We found ${matchingArchivedCount} archived record${matchingArchivedCount > 1 ? 's' : ''} matching "${searchQuery}", but archived offenses are currently hidden.`
                  : `We couldn't find any results for "${searchQuery}". Check the spelling or try searching by rank.`)
              : 'All active cadet punishments are currently clear.'}
          </p>
          {((totalArchivedCount > 0 && !showArchived) || (matchingArchivedCount > 0 && !showArchived)) && (
            <button
              onClick={() => setShowArchived(true)}
              style={{
                marginTop: '1rem',
                padding: '0.6rem 1.2rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid #3b82f6',
                color: '#3b82f6',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              Show Archived Offenses ({totalArchivedCount})
            </button>
          )}
        </div>
      ) : isMobile ? (
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

            let stackedTourTotal = 0;
            let stackedTourServed = 0;
            let stackedTourConverted = 0;

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
              if (off.tourTotal > 0) {
                stackedTourTotal += off.tourTotal;
                stackedTourServed += (off.tourServed || 0);
                stackedTourConverted += (off.tourConverted || 0);
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

            const displayTourStats = {
              total: stackedTourTotal,
              progress: stackedTourServed + stackedTourConverted,
              percentage: stackedTourTotal > 0 ? Math.min(100, Math.max(0, ((stackedTourServed + stackedTourConverted) / stackedTourTotal) * 100)) : 0
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
                        const classColor = isOffInactive ? '#6b7280' : (() => {
                          const c = String(offense.classOfOffense || '').trim().toUpperCase();
                          if (c === 'I' || c === '1') return '#ef4444';
                          if (c === 'II' || c === '2') return '#f97316';
                          if (c === 'III' || c === '3') return '#eab308';
                          if (c === 'IV' || c === '4') return '#22c55e';
                          return '#eab308';
                        })();

                        return (
                          <div 
                            key={i} 
                            onClick={() => setSelectedOffenseModal({ cadet, offense })}
                            style={{ 
                              background: 'var(--bg-primary)', 
                              padding: '0.65rem', 
                              borderRadius: '8px', 
                              borderLeft: `3px solid ${classColor}`,
                              border: '1px solid var(--border-color)',
                              opacity: isOffInactive ? 0.6 : 1,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            title="Click to view full offense dossier"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.75rem' }}>{getOffenseEmoji(offense.natureOfOffense)}</span>
                                <span>{offense.natureOfOffense || 'UNKNOWN'}</span>
                                {offense.isAwardedAfterSep11 ? (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                                    2nd Term (-{offense.demerits || 0} dem)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(128, 128, 128, 0.15)', color: 'var(--text-secondary)' }}>
                                    1st Term (exempt)
                                  </span>
                                )}
                                {isOffenseArchived(offense) && (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
                                    📦 ARCHIVED
                                  </span>
                                )}
                                {offense.reference && (
                                  <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
                                    📜 {offense.reference}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.65rem', color: classColor, fontWeight: 800 }}>Class {offense.classOfOffense}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>🔍</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{offense.description}</div>
                            {offense.remarks && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.25rem', borderLeft: '2px solid rgba(212, 175, 55, 0.4)', paddingLeft: '0.4rem' }}>
                                <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>Remarks: </span>{offense.remarks}
                              </div>
                            )}
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
                      <span>DEMERITS (2ND TERM)</span>
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
                    {cadet.term1Demerits > 0 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        1st Term: {cadet.term1Demerits.toFixed(1)} dem (exempt from 2nd term allowance)
                      </div>
                    )}
                  </div>

                  {/* Confinement Progress */}
                  {displayConfStats.total > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>CONFINEMENT ({displayConfStats.remaining === 0 ? 'COMPLETED' : 'CONFINED'})</span>
                          {displayConfStats.remaining > 0 && (
                            <span style={{ 
                              background: displayConfStats.remaining <= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.1)',
                              color: displayConfStats.remaining <= 3 ? '#ff4d4f' : 'var(--text-primary)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 700
                            }}>
                              ⏳ {displayConfStats.remaining === 1 ? 'Ends in 24h' : `${displayConfStats.remaining}d left`}
                            </span>
                          )}
                        </div>
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
                  {displayTourStats.total > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>TOURING ({displayTourStats.progress >= displayTourStats.total ? 'SERVED' : 'ACTIVE'})</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {displayTourStats.progress} / {displayTourStats.total} hrs
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${displayTourStats.percentage}%`, background: '#10b981' }} />
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
          <table className="mobile-card-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>Cadet Profile</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '35%' }}>Offenses</th>
              <th style={{ padding: '1rem', textAlign: 'left', width: '15%' }}>Accumulated Demerits (2nd Term)</th>
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

              let stackedTourTotal = 0;
              let stackedTourServed = 0;
              let stackedTourConverted = 0;

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
                if (off.tourTotal > 0) {
                  stackedTourTotal += off.tourTotal;
                  stackedTourServed += (off.tourServed || 0);
                  stackedTourConverted += (off.tourConverted || 0);
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

              const displayTourStats = {
                total: stackedTourTotal,
                progress: stackedTourServed + stackedTourConverted,
                percentage: stackedTourTotal > 0 ? Math.min(100, Math.max(0, ((stackedTourServed + stackedTourConverted) / stackedTourTotal) * 100)) : 0
              };

              return (
                <tr key={index} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', verticalAlign: 'top' }}>
                  
                  <td data-label="Cadet Profile" style={{ padding: '1.5rem 1rem' }}>
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

                  <td data-label="Offenses" style={{ padding: '1.5rem 1rem' }}>
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
                          const classColor = isOffInactive ? '#6b7280' : (() => {
                            const c = String(offense.classOfOffense || '').trim().toUpperCase();
                            if (c === 'I' || c === '1') return '#ef4444';
                            if (c === 'II' || c === '2') return '#f97316';
                            if (c === 'III' || c === '3') return '#eab308';
                            if (c === 'IV' || c === '4') return '#22c55e';
                            return '#eab308';
                          })();

                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedOffenseModal({ cadet, offense })}
                              style={{ 
                                background: isOffInactive ? 'rgba(128,128,128,0.05)' : 'rgba(128,128,128,0.1)', 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                borderLeft: `3px solid ${classColor}`,
                                opacity: isOffInactive ? 0.6 : 1,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = isOffInactive ? 'rgba(128,128,128,0.05)' : 'rgba(128,128,128,0.1)'; }}
                              title="Click to view full offense dossier"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.8rem' }}>{getOffenseEmoji(offense.natureOfOffense)}</span>
                                  <span>{offense.natureOfOffense || 'UNKNOWN'}</span>
                                  {offense.isAwardedAfterSep11 ? (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                                      2nd Term (-{offense.demerits || 0} dem)
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(128, 128, 128, 0.15)', color: 'var(--text-secondary)' }}>
                                      1st Term (exempt)
                                    </span>
                                  )}
                                  {isOffInactive && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 800 }}>✓ INACTIVE</span>}
                                  {isOffenseArchived(offense) && (
                                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
                                      📦 ARCHIVED
                                    </span>
                                  )}
                                  {offense.reference && (
                                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
                                      📜 {offense.reference}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: classColor, fontWeight: 800 }}>Class {offense.classOfOffense}</span>
                                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>🔍</span>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{offense.description}</div>
                              {offense.remarks && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.35rem', borderLeft: '2px solid rgba(212, 175, 55, 0.4)', paddingLeft: '0.5rem' }}>
                                  <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>Remarks: </span>{offense.remarks}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td data-label="Accumulated Demerits" style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: isGloballyInactive ? 0.6 : 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Accumulated Demerits (2nd Term)</div>
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
                      {cadet.term1Demerits > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                          1st Term: {cadet.term1Demerits.toFixed(1)} dem (exempt)
                        </div>
                      )}
                    </div>
                  </td>

                  <td data-label="Confinement" style={{ padding: '1.5rem 1rem' }}>
                    {displayConfStats.total > 0 ? (
                      <div>
                        {displayConfStats.remaining === 0 ? (
                          <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '0.75rem' }}>
                            🔓 COMPLETED
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '0.75rem' }}>
                            <span>🔒 CONFINED</span>
                            <span style={{ 
                              background: displayConfStats.remaining <= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.1)',
                              color: displayConfStats.remaining <= 3 ? '#ff4d4f' : '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontSize: '0.65rem'
                            }}>
                              ⏳ {displayConfStats.remaining === 1 ? 'Ends in 24h' : `${displayConfStats.remaining}d left`}
                            </span>
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

                  <td data-label="Touring" style={{ padding: '1.5rem 1rem' }}>
                    {displayTourStats.total > 0 ? (
                      <div>
                        {displayTourStats.progress >= displayTourStats.total ? (
                          <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '0.75rem' }}>
                            🟢 SERVED
                          </div>
                        ) : (
                          <div style={{ display: 'inline-block', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', border: '1px solid rgba(234,179,8,0.3)', marginBottom: '0.75rem' }}>
                            🟡 ACTIVE
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: (displayTourStats.progress >= displayTourStats.total) ? 0.6 : 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hours Served</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{displayTourStats.progress}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {displayTourStats.total}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.25rem' }}>
                            <div style={{ height: '100%', width: `${displayTourStats.percentage}%`, background: '#10b981', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.6 }}>No Tours</div>
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

      {/* Offense Detail Dossier Modal */}
      {selectedOffenseModal && (
        <div 
          onClick={() => setSelectedOffenseModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedOffenseModal.cadet.picture ? (
                  <img 
                    src={selectedOffenseModal.cadet.picture} 
                    alt={selectedOffenseModal.cadet.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(128,128,128,0.2)' }}
                  />
                ) : (
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff'
                  }}>
                    {selectedOffenseModal.cadet.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedOffenseModal.cadet.rank} {selectedOffenseModal.cadet.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Cadet Punishment Dossier
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOffenseModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Offense Overview Tags */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--gold-primary)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                Class {selectedOffenseModal.offense.classOfOffense}
              </span>

              <span style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>{getOffenseEmoji(selectedOffenseModal.offense.natureOfOffense)}</span>
                <span>{selectedOffenseModal.offense.natureOfOffense || 'UNKNOWN'}</span>
              </span>

              {selectedOffenseModal.offense.isAwardedAfterSep11 ? (
                <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                  2nd Term (-{selectedOffenseModal.offense.demerits || 0} dem)
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(128, 128, 128, 0.15)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  1st Term (exempt)
                </span>
              )}

              {isOffenseArchived(selectedOffenseModal.offense) && (
                <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
                  📦 ARCHIVED
                </span>
              )}
            </div>

            {/* Special Order / Reference */}
            {selectedOffenseModal.offense.reference && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.1rem' }}>📜</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>Special Order / Authority Reference</div>
                  <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{selectedOffenseModal.offense.reference}</div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Offense Specification
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5
              }}>
                {selectedOffenseModal.offense.description || 'No detailed description provided.'}
              </div>
            </div>

            {/* Remarks */}
            {selectedOffenseModal.offense.remarks && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Official Remarks
                </div>
                <div style={{
                  background: 'rgba(212, 175, 55, 0.06)',
                  borderLeft: '3px solid var(--gold-primary)',
                  borderRadius: '4px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  fontStyle: 'italic'
                }}>
                  {selectedOffenseModal.offense.remarks}
                </div>
              </div>
            )}

            {/* Punishment Balance Breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.75rem'
            }}>
              {/* Confinement Box */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Confinement
                </div>
                {selectedOffenseModal.offense.isConfined && selectedOffenseModal.offense.confStart && selectedOffenseModal.offense.confEnd ? (() => {
                  const st = getConfinementStats(selectedOffenseModal.offense.confStart, selectedOffenseModal.offense.confEnd);
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: st.remaining === 0 ? '#10b981' : '#ef4444' }}>
                          {st.remaining === 0 ? '🔓 COMPLETED' : `🔒 ${st.remaining}d left`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {st.startText} → {st.endText} ({st.served}/{st.total} days)
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None awarded</div>
                )}
              </div>

              {/* Touring Box */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Touring Hours
                </div>
                {selectedOffenseModal.offense.tourTotal > 0 ? (() => {
                  const p = (selectedOffenseModal.offense.tourServed || 0) + (selectedOffenseModal.offense.tourConverted || 0);
                  const rem = Math.max(0, selectedOffenseModal.offense.tourTotal - p);
                  return (
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: rem === 0 ? '#10b981' : '#f59e0b', marginBottom: '0.25rem' }}>
                        {rem === 0 ? '🟢 COMPLETED' : `🏃 ${rem} hrs remaining`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Total: {selectedOffenseModal.offense.tourTotal} | Served: {p} hrs
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None awarded</div>
                )}
              </div>
            </div>

            {/* Modal Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                onClick={() => setSelectedOffenseModal(null)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}