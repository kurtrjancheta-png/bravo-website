'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InfiniteSlider from '../components/InfiniteSlider';
import { 
  ComposedChart,
  Area,
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

const COLORS = {
  passed:  '#1a7a3a',
  failed:  '#c0392b',
  smc:     '#374151',
  fad:     '#2d6b5e',
};

const LABELS = {
  passed: 'PASSED',
  failed: 'FAILED',
  smc:    'SMC',
  fad:    'FAD/GUARD/SIQ',
};

// Pure SVG pie chart — no external libraries
function PieChart({ data, title, onSegmentClick }) {
  const passedCount = data.passed.length;
  const failedCount = data.failed.length;
  const smcCount = data.smc.length;
  const fadCount = data.fad.length;
  const total = passedCount + failedCount + smcCount + fadCount;

  if (total === 0) {
    return (
      <div className="pft-chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 className="pft-chart-title">{title}</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          No data available
        </div>
      </div>
    );
  }

  const segments = [
    { key: 'passed', value: passedCount, cadets: data.passed },
    { key: 'failed', value: failedCount, cadets: data.failed },
    { key: 'smc',    value: smcCount, cadets: data.smc },
    { key: 'fad',    value: fadCount, cadets: data.fad },
  ].filter(s => s.value > 0);

  // Calculate SVG arc paths
  let cumulativeAngle = 0;
  const cx = 100, cy = 100, r = 80;

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad   = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // If this is the only segment (100%), draw a full circle
    if (segments.length === 1) {
      return {
        key: seg.key,
        path: `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.01},${cy - r} Z`,
        color: COLORS[seg.key],
        value: seg.value,
        pct: 100,
        cadets: seg.cadets
      };
    }

    return {
      key: seg.key,
      path: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`,
      color: COLORS[seg.key],
      value: seg.value,
      pct: Math.round((seg.value / total) * 100),
      cadets: seg.cadets
    };
  });

  return (
    <div className="pft-chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 className="pft-chart-title">{title}</h3>
      <div className="pft-chart-body" style={{ flex: 1 }}>
        <svg viewBox="0 0 200 200" className="pft-pie-svg">
          {arcs.map((arc) => (
            <path 
              key={arc.key} 
              d={arc.path} 
              fill={arc.color}
              className="pft-pie-path"
              onClick={() => onSegmentClick(arc.key, arc.cadets, title)}
            >
              <title>{LABELS[arc.key]}: {arc.value} ({arc.pct}%) - Click to view list</title>
            </path>
          ))}
          {/* Center white circle for donut look */}
          <circle cx={cx} cy={cy} r={40} fill="var(--card-bg)" style={{ pointerEvents: 'none' }} />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-primary)" style={{ pointerEvents: 'none' }}>{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="600" style={{ pointerEvents: 'none' }}>TOTAL</text>
        </svg>

        <div className="pft-legend">
          {segments.map((seg) => (
            <div 
              key={seg.key} 
              className="pft-legend-item" 
              onClick={() => onSegmentClick(seg.key, seg.cadets, title)}
              style={{ cursor: 'pointer' }}
              title="Click to view list"
            >
              <span className="pft-legend-dot" style={{ backgroundColor: COLORS[seg.key] }}></span>
              <span className="pft-legend-label">{LABELS[seg.key]}</span>
              <span className="pft-legend-value">{seg.value} ({Math.round((seg.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Calculate detailed insights from PFT data
function getPFTInsights(pftData, classKey) {
  if (!pftData || !pftData[classKey]) {
    return { totalActive: 0 };
  }
  
  const cData = pftData[classKey];
  const passedList = cData.passed || [];
  const failedList = cData.failed || [];
  const smcList = cData.smc || [];
  
  const activeCadets = [...passedList, ...failedList, ...smcList];
  const totalActive = activeCadets.length;
  
  if (totalActive === 0) {
    return { totalActive: 0 };
  }
  
  const overallPassRate = (passedList.length / totalActive) * 100;
  
  // Gender breakdowns
  const males = activeCadets.filter(c => c.gender === 'M');
  const females = activeCadets.filter(c => c.gender === 'F');
  
  const malePassed = males.filter(c => c.remarks.includes('PASSED') || c.remarks === 'P');
  const femalePassed = females.filter(c => c.remarks.includes('PASSED') || c.remarks === 'P');
  
  const malePassRate = males.length > 0 ? (malePassed.length / males.length) * 100 : null;
  const femalePassRate = females.length > 0 ? (femalePassed.length / females.length) * 100 : null;
  
  // Event breakdowns (pass means score >= 7.0)
  const pushupsPassed = activeCadets.filter(c => c.scores && c.scores.pushups >= 7.0);
  const situpsPassed = activeCadets.filter(c => c.scores && c.scores.situps >= 7.0);
  const pullupsPassed = activeCadets.filter(c => c.scores && c.scores.pullups >= 7.0);
  const runPassed = activeCadets.filter(c => c.scores && c.scores.run >= 7.0);
  
  const pushupsPassRate = (pushupsPassed.length / totalActive) * 100;
  const situpsPassRate = (situpsPassed.length / totalActive) * 100;
  const pullupsPassRate = (pullupsPassed.length / totalActive) * 100;
  const runPassRate = (runPassed.length / totalActive) * 100;
  
  // Class breakdown (only relevant if classKey === 'all')
  const classBreakdown = {};
  ['1cl', '2cl', '3cl'].forEach(ck => {
    const clsActive = [...(pftData[ck]?.passed || []), ...(pftData[ck]?.failed || []), ...(pftData[ck]?.smc || [])];
    const clsPassed = pftData[ck]?.passed || [];
    
    let classWeakestEvent = null;
    if (clsActive.length > 0) {
      const clsPushupsPassRate = (clsActive.filter(c => c.scores && c.scores.pushups >= 7.0).length / clsActive.length) * 100;
      const clsSitupsPassRate = (clsActive.filter(c => c.scores && c.scores.situps >= 7.0).length / clsActive.length) * 100;
      const clsPullupsPassRate = (clsActive.filter(c => c.scores && c.scores.pullups >= 7.0).length / clsActive.length) * 100;
      const clsRunPassRate = (clsActive.filter(c => c.scores && c.scores.run >= 7.0).length / clsActive.length) * 100;
      
      const clsEvents = [
        { name: 'Push-ups', rate: clsPushupsPassRate, key: 'pushups' },
        { name: 'Sit-ups', rate: clsSitupsPassRate, key: 'situps' },
        { name: 'Pull-ups', rate: clsPullupsPassRate, key: 'pullups' },
        { name: '3.2KM Run', rate: clsRunPassRate, key: 'run' }
      ].sort((a, b) => a.rate - b.rate);
      classWeakestEvent = clsEvents[0];
    }

    classBreakdown[ck] = {
      total: clsActive.length,
      passRate: clsActive.length > 0 ? (clsPassed.length / clsActive.length) * 100 : null,
      weakestEvent: classWeakestEvent
    };
  });
  
  // Actionable plans selection based on the lowest pass rate event
  const events = [
    { name: 'Push-ups', rate: pushupsPassRate, key: 'pushups' },
    { name: 'Sit-ups', rate: situpsPassRate, key: 'situps' },
    { name: 'Pull-ups', rate: pullupsPassRate, key: 'pullups' },
    { name: '3.2KM Run', rate: runPassRate, key: 'run' }
  ];
  
  // Sort events by pass rate to find the lowest
  const sortedEvents = [...events].sort((a, b) => a.rate - b.rate);
  const weakestEvent = sortedEvents[0];
  
  return {
    totalActive,
    passedCount: passedList.length,
    failedCount: failedList.length,
    smcCount: smcList.length,
    overallPassRate,
    malesCount: males.length,
    femalesCount: females.length,
    malePassRate,
    femalePassRate,
    pushupsPassRate,
    situpsPassRate,
    pullupsPassRate,
    runPassRate,
    classBreakdown,
    weakestEvent
  };
}

export default function PFTDashboard({ mockData, pft1Data, pft2Data }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedPFT, setSelectedPFT] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [activeList, setActiveList] = useState(null);
  
  // Toggle switcher state: 'class' for Class PFT Data, 'event' for PFT Event Data
  const [activeChartTab, setActiveChartTab] = useState('event');

  // Insight Modal State
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [insightPftTab, setInsightPftTab] = useState(
    pft2Data && [...pft2Data.all.passed, ...pft2Data.all.failed, ...pft2Data.all.smc].length > 0 ? 'pft2' :
    pft1Data && [...pft1Data.all.passed, ...pft1Data.all.failed, ...pft1Data.all.smc].length > 0 ? 'pft1' : 'mock'
  );

  // Individual Cadet Modal State
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const handleCadetClick = (cadetName) => {
    try {
      const getCadetRecord = (pftData) => {
        if (!pftData) return null;
        for (const cls of ['1cl', '2cl', '3cl']) {
          if (!pftData[cls]) continue;
          
          const allCadets = [
            ...(pftData[cls].passed || []),
            ...(pftData[cls].failed || []),
            ...(pftData[cls].smc || []),
            ...(pftData[cls].fad || [])
          ];
          const cadet = allCadets.find(c => c.name === cadetName);
          if (cadet) return cadet;
        }
        return null;
      };
      
      setSelectedCadet({
        name: cadetName,
        mock: getCadetRecord(mockData),
        pft1: getCadetRecord(pft1Data),
        pft2: getCadetRecord(pft2Data)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const pftTypes = {
    mock: { label: 'Mock PFT', data: mockData },
    pft1: { label: 'PFT 1', data: pft1Data },
    pft2: { label: 'PFT 2', data: pft2Data },
  };

  const handleSegmentClick = (statusKey, cadets, pftTitle) => {
    setActiveList({ statusKey, cadets, pftTitle });
    setTimeout(() => {
      document.getElementById('cadet-list-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const getTotal = (dataObj) => {
    return dataObj.passed.length + dataObj.failed.length + dataObj.smc.length + dataObj.fad.length;
  };

  // Helper to calculate passing rate for a specific class or all
  const getPassRateForPFT = (pftData, classKey) => {
    if (!pftData) return null;
    const cData = pftData[classKey];
    if (!cData) return null;
    const passed = cData.passed.length;
    const failed = cData.failed.length;
    const smc = cData.smc.length;
    const total = passed + failed + smc;
    return total > 0 ? parseFloat(((passed / total) * 100).toFixed(1)) : null;
  };

  // Construct chart data for the Line Chart progress tracking
  const progressChartData = [
    {
      name: 'Mock PFT',
      'Company Average': getPassRateForPFT(mockData, 'all'),
      '1CL': getPassRateForPFT(mockData, '1cl'),
      '2CL': getPassRateForPFT(mockData, '2cl'),
      '3CL': getPassRateForPFT(mockData, '3cl'),
    },
    {
      name: 'PFT 1',
      'Company Average': getPassRateForPFT(pft1Data, 'all'),
      '1CL': getPassRateForPFT(pft1Data, '1cl'),
      '2CL': getPassRateForPFT(pft1Data, '2cl'),
      '3CL': getPassRateForPFT(pft1Data, '3cl'),
    },
    {
      name: 'PFT 2',
      'Company Average': getPassRateForPFT(pft2Data, 'all'),
      '1CL': getPassRateForPFT(pft2Data, '1cl'),
      '2CL': getPassRateForPFT(pft2Data, '2cl'),
      '3CL': getPassRateForPFT(pft2Data, '3cl'),
    }
  ].filter(item => item['Company Average'] !== null);

  // Calculate dynamic Y-axis domain based on the min/max values in data to highlight small variations
  const getYDomain = () => {
    if (progressChartData.length === 0) return [0, 100];
    
    let minVal = 100;
    let maxVal = 0;
    
    progressChartData.forEach(item => {
      ['Company Average', '1CL', '2CL', '3CL'].forEach(key => {
        const val = item[key];
        if (val !== null && val !== undefined) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      });
    });
    
    // Add margin (e.g., 5% padding) and round to nearest 10
    const roundedMin = Math.max(0, Math.floor((minVal - 5) / 10) * 10);
    const roundedMax = Math.min(100, Math.ceil((maxVal + 5) / 10) * 10);
    
    if (roundedMin >= roundedMax) return [0, 100];
    return [roundedMin, roundedMax];
  };

  const yDomain = getYDomain();

  const getEventAverage = (pftKey, classKey, eventKey) => {
    let datasets = [];
    if (pftKey === 'all') {
      datasets = [mockData, pft1Data, pft2Data].filter(d => d !== null);
    } else {
      datasets = [pftTypes[pftKey]?.data].filter(d => d !== null && d !== undefined);
    }

    let allScores = [];
    datasets.forEach(data => {
      const classesToCheck = classKey === 'all' ? ['1cl', '2cl', '3cl'] : [classKey];
      classesToCheck.forEach(cls => {
        const cData = data[cls];
        if (cData) {
          const active = [...(cData.passed || []), ...(cData.failed || []), ...(cData.smc || [])];
          active.forEach(c => {
            const val = c.scores?.[eventKey];
            if (val !== undefined && val !== null) {
              allScores.push(val);
            }
          });
        }
      });
    });

    if (allScores.length === 0) return null;
    const sum = allScores.reduce((a, b) => a + b, 0);
    return parseFloat((sum / allScores.length).toFixed(2));
  };

  // Construct BarChart data for event point averages
  const averageGradesData = [
    { event: 'Push-ups', key: 'pushups' },
    { event: 'Sit-ups', key: 'situps' },
    { event: 'Pullups/Flexarm', key: 'pullups' }, // Displays Pullups/Flexarm as requested
    { event: '3.2KM Run', key: 'run' }
  ].map(evt => {
    const overall = getEventAverage(selectedPFT, 'all', evt.key);
    const c1 = getEventAverage(selectedPFT, '1cl', evt.key);
    const c2 = getEventAverage(selectedPFT, '2cl', evt.key);
    const c3 = getEventAverage(selectedPFT, '3cl', evt.key);
    
    let activeClassVal = null;
    if (selectedClass === '1cl') activeClassVal = c1;
    else if (selectedClass === '2cl') activeClassVal = c2;
    else if (selectedClass === '3cl') activeClassVal = c3;

    let diffRange = null;
    if (activeClassVal !== null && overall !== null) {
      diffRange = [overall, activeClassVal];
    }

    return {
      event: evt.event,
      'Company Average': overall,
      '1CL': c1,
      '2CL': c2,
      '3CL': c3,
      diffRange
    };
  });

  // Dynamic Y-axis scale for Grades LineChart (zoomed in to accentuate variance)
  const getGradeYDomain = () => {
    let minVal = 10;
    let maxVal = 0;
    averageGradesData.forEach(item => {
      ['Company Average', '1CL', '2CL', '3CL'].forEach(key => {
        const val = item[key];
        if (val !== null && val !== undefined && val > 0) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      });
    });
    
    // Tight margin of 0.15 points to accentuate variance, rounded to nearest 0.1
    const paddedMin = Math.max(0, Math.floor((minVal - 0.15) * 10) / 10);
    const paddedMax = Math.min(10.0, Math.ceil((maxVal + 0.15) * 10) / 10);
    
    // Force lower bound to be at most 6.8 to guarantee the 7.0 Passing Reference Line is always visible
    const forcedMin = Math.min(6.8, paddedMin);
    
    if (forcedMin >= paddedMax) return [0, 10.0];
    return [forcedMin, paddedMax];
  };

  const gradeYDomain = getGradeYDomain();

  const getAverageChartTitle = () => {
    if (selectedPFT === 'all') {
      return 'Average Event Grades (All PFTs)';
    }
    return `Average Event Grades (${pftTypes[selectedPFT].label})`;
  };

  // Bar opacity styling based on selectedClass dropdown filter
  const isBarActive = (classKey) => {
    if (selectedClass === 'all') return true;
    return selectedClass.toUpperCase() === classKey.toUpperCase() || classKey === 'Company Average';
  };

  // Line styling highlighting based on selectedClass dropdown filter
  const isLineActive = (classKey) => {
    if (selectedClass === 'all') return true;
    return selectedClass.toLowerCase() === classKey.toLowerCase() || classKey === 'Company Average';
  };

  // Get active insights for the modal
  const activeInsights = getPFTInsights(pftTypes[insightPftTab].data, selectedClass);

  // Recommendations text based on weakest event
  const getRemediationRecommendation = (eventKey) => {
    switch (eventKey) {
      case 'pushups':
        return {
          title: "Push-ups Improvement Strategy",
          text: "The lowest scoring category is Push-ups. Upper body endurance is critical for overall scores.",
          tips: [
            "Conduct structured 4-week push-up pyramid progressions during morning PT.",
            "Establish strict form correction workshops to minimize locked-out forearm fatigue.",
            "Implement eccentric push-ups (slow 3-second descents) to target dynamic stability."
          ]
        };
      case 'situps':
        return {
          title: "Sit-ups Improvement Strategy",
          text: "The lowest scoring category is Sit-ups. Core endurance is the weakest link in cadet scores.",
          tips: [
            "Incorporate front-plank and side-plank series into regular fitness routines.",
            "Perform progressive abdominal flutter kicks and leg raises twice weekly.",
            "Train cadets in pairs to ensure heels remain anchored without lower-back strain."
          ]
        };
      case 'pullups':
        return {
          title: "Pull-ups / Flexed-Arm Hang Strategy",
          text: "The lowest scoring category is Pull-ups. Grip strength and lats recruitment need attention.",
          tips: [
            "Introduce daily dead hangs (30 to 60 seconds) to build forearm and grip endurance.",
            "Integrate pull-up negatives (jumping to the top, then lowering over 5 seconds).",
            "Provide assisted resistance bands at gym bars to aid cadets struggling with full pull-ups."
          ]
        };
      case 'run':
        return {
          title: "3.2 KM Run Pacing & Cardio Strategy",
          text: "The lowest scoring category is the 3.2 KM Run. Cardiovascular capacity is the primary constraint.",
          tips: [
            "Perform aerobic interval runs (400m and 800m repeats) at target passing speeds.",
            "Conduct a weekly 5 KM slow recovery run to increase baseline aerobic endurance.",
            "Instruct cadets on pacing strategies, focusing on split times rather than sprinting early."
          ]
        };
      default:
        return {
          title: "General Performance Strategy",
          text: "Focus on maintaining baseline physical conditioning across all test categories.",
          tips: [
            "Schedule balanced physical training sessions covering both strength and cardio.",
            "Monitor hydration levels, sleep schedules, and warm-up habits prior to test events.",
            "Perform regular mock testing to build confidence and track personal fitness scores."
          ]
        };
    }
  };

  const remediation = activeInsights.weakestEvent ? getRemediationRecommendation(activeInsights.weakestEvent.key) : getRemediationRecommendation('general');

  // Calculate precise horizontal gradient stops to color the difference area
  const getGradientStops = () => {
    if (selectedClass === 'all' || averageGradesData.length === 0) return null;
    
    const stops = [];
    const classKey = selectedClass.toUpperCase();
    
    // Safety check
    if (averageGradesData[0][classKey] === undefined || averageGradesData[0]['Company Average'] === undefined) return null;

    let currentIsAbove = averageGradesData[0][classKey] >= averageGradesData[0]['Company Average'];
    stops.push(<stop key="start" offset="0%" stopColor={currentIsAbove ? "#10b981" : "#ef4444"} stopOpacity={0.2} />);

    for (let i = 0; i < averageGradesData.length - 1; i++) {
      const d1 = averageGradesData[i];
      const d2 = averageGradesData[i + 1];
      
      const val1 = d1[classKey];
      const ov1 = d1['Company Average'];
      const val2 = d2[classKey];
      const ov2 = d2['Company Average'];
      
      if (val1 === null || ov1 === null || val2 === null || ov2 === null) continue;

      const diff1 = val1 - ov1;
      const diff2 = val2 - ov2;

      // If they cross paths
      if ((diff1 > 0 && diff2 < 0) || (diff1 < 0 && diff2 > 0)) {
        // Calculate exact horizontal percentage of intersection
        const t = Math.abs(diff1) / (Math.abs(diff1) + Math.abs(diff2));
        const offsetPercent = ((i + t) / (averageGradesData.length - 1)) * 100;
        
        // Add double stop for sharp color transition
        stops.push(<stop key={`stop1-${i}`} offset={`${offsetPercent}%`} stopColor={diff1 >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.2} />);
        stops.push(<stop key={`stop2-${i}`} offset={`${offsetPercent}%`} stopColor={diff2 >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.2} />);
        
        currentIsAbove = diff2 >= 0;
      }
    }
    
    stops.push(<stop key="end" offset="100%" stopColor={currentIsAbove ? "#10b981" : "#ef4444"} stopOpacity={0.2} />);
    return stops;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Controls: Dropdowns + Generate Insights Button */}
      <div className="pft-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PFT TYPE</span>
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <InfiniteSlider itemWidth="auto" gap="0.5rem">
              {[
                { value: 'all', label: 'ALL PFTs' },
                { value: 'mock', label: 'MOCK PFT' },
                { value: 'pft1', label: 'PFT 1' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSelectedPFT(opt.value); setActiveList(null); }}
                  style={{
                    position: 'relative',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '20px',
                    border: selectedPFT === opt.value ? 'none' : '1px solid var(--border-color)',
                    background: selectedPFT === opt.value ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: selectedPFT === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPFT === opt.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {selectedPFT === opt.value && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '5px solid var(--text-primary)',
                      animation: 'dropIn 0.2s ease-out'
                    }} />
                  )}
                  {opt.label}
                </button>
              ))}
            </InfiniteSlider>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLASS</span>
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <InfiniteSlider itemWidth="auto" gap="0.5rem">
              {[
                { value: 'all', label: 'ALL CLASSES' },
                { value: '1cl', label: '1ST CLASS' },
                { value: '2cl', label: '2ND CLASS' },
                { value: '3cl', label: '3RD CLASS' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSelectedClass(opt.value); setActiveList(null); }}
                  style={{
                    position: 'relative',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '20px',
                    border: selectedClass === opt.value ? 'none' : '1px solid var(--border-color)',
                    background: selectedClass === opt.value ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: selectedClass === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedClass === opt.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {selectedClass === opt.value && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '5px solid var(--text-primary)',
                      animation: 'dropIn 0.2s ease-out'
                    }} />
                  )}
                  {opt.label}
                </button>
              ))}
            </InfiniteSlider>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInsightModal(true)}
          className="pft-insight-btn"
          style={{
            margin: '0 auto',
            padding: '0.5rem 1.25rem',
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 5px rgba(217, 119, 6, 0.3)',
            outline: 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Generate Insights
        </motion.button>
      </div>

      {/* Chart View Toggle Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '2px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveChartTab('class')}
            style={{
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '18px',
              background: activeChartTab === 'class' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'none',
              color: activeChartTab === 'class' ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Class PFT Data
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveChartTab('event')}
            style={{
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '18px',
              background: activeChartTab === 'event' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'none',
              color: activeChartTab === 'event' ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            PFT Event Data
          </motion.button>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '2rem' }}>
        {activeChartTab === 'class' ? (
          /* Chart 1: PFT Progress Tracking (Bar Chart) */
          progressChartData.length > 0 && (
            <div className="pft-chart-card">
              <div className="chart-header-container">
                <h3 className="pft-chart-title">PFT Progress Tracking</h3>
                <div className="info-tooltip-container">
                  <div className="info-icon">i</div>
                  <div className="tooltip-text">
                    <strong>Passing Rate Progress</strong><br/>
                    Tracks the percentage of active cadets who passed the PFT over time (Mock PFT &rarr; PFT 1 &rarr; PFT 2).<br/><br/>
                    * Excused cadets (FAD/GUARD/SIQ) are excluded.<br/>
                    * Active pool includes PASSED, FAILED, and SMC.
                  </div>
                </div>
              </div>
              <div className="graph-container" style={{ width: '100%', height: 350, marginTop: '0.5rem' }}>
                <ResponsiveContainer>
                  <BarChart data={progressChartData} margin={{ top: 15, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                    <YAxis stroke="var(--text-secondary)" unit="%" domain={yDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip itemSorter={(item) => -item.value} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 10 }} />
                    <Bar 
                      dataKey="Company Average" 
                      fill="#FFD700" 
                      fillOpacity={isBarActive('Company Average') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="Company Average" 
                      style={{ filter: isBarActive('Company Average') ? 'drop-shadow(0px 0px 8px rgba(255,215,0,0.8))' : 'none' }}
                    />
                    <Bar 
                      dataKey="1CL" 
                      fill="#3b82f6" 
                      fillOpacity={isBarActive('1cl') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="1CL" 
                    />
                    <Bar 
                      dataKey="2CL" 
                      fill="#ef4444" 
                      fillOpacity={isBarActive('2cl') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="2CL" 
                    />
                    <Bar 
                      dataKey="3CL" 
                      fill="#FFFF00" 
                      fillOpacity={isBarActive('3cl') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="3CL" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        ) : (
          /* Chart 2: Average Event Grades (Line Chart) */
          <div className="pft-chart-card">
            <div className="chart-header-container">
              <h3 className="pft-chart-title">{getAverageChartTitle()}</h3>
              <div className="info-tooltip-container">
                <div className="info-icon">i</div>
                <div className="tooltip-text">
                  <strong>Average Event Grades</strong><br/>
                  Displays average points (0.0 to 10.0) scored by each class in the 4 events.<br/><br/>
                  * Passing standard: <strong>7.00</strong><br/>
                  * Sweet spot target: <strong>8.00 - 8.50</strong><br/>
                  * Maximum grade: <strong>10.00</strong>
                </div>
              </div>
            </div>
            <div className="graph-container" style={{ width: '100%', height: 350, marginTop: '0.5rem' }}>
              <ResponsiveContainer>
                <ComposedChart data={averageGradesData} margin={{ top: 15, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="event" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                  <YAxis stroke="var(--text-secondary)" domain={gradeYDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip itemSorter={(item) => -item.value} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 10 }} />
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="0">
                      {getGradientStops()}
                    </linearGradient>
                  </defs>
                  
                  {/* Reference Area for sweet spot 8.0 - 8.5 */}
                  {selectedClass === 'all' ? (
                    <ReferenceArea y1={8.0} y2={8.5} fill="#10b981" fillOpacity={0.12} />
                  ) : (
                    <>
                      <ReferenceLine y={8.0} stroke="#FFD700" strokeOpacity={0.5} strokeDasharray="4 4" />
                      <ReferenceLine y={8.5} stroke="#FFD700" strokeOpacity={0.5} strokeDasharray="4 4" />
                    </>
                  )}
                  {/* Reference Line for passing threshold 7.0 */}
                  <ReferenceLine y={7.0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Pass: 7.0', fill: '#ef4444', fontSize: 10, position: 'top', fontWeight: 600 }} />

                  {/* Soft green/red Area for difference region */}
                  {selectedClass !== 'all' && (
                    <Area 
                      type="monotone" 
                      dataKey="diffRange" 
                      fill="url(#splitColor)" 
                      stroke="none" 
                      isAnimationActive={false}
                      activeDot={false}
                      tooltipType="none"
                    />
                  )}

                  <Line 
                    type="monotone" 
                    dataKey="Company Average" 
                    stroke="#FFD700" 
                    strokeWidth={selectedClass === 'all' ? 4 : 2} 
                    strokeOpacity={isLineActive('Company Average') ? 1.0 : 0.25}
                    activeDot={{ r: 8, fill: '#FFD700', stroke: '#fff' }} 
                    dot={{ r: 5, fill: '#FFD700' }} 
                    name="Company Average" 
                    style={{ filter: isLineActive('Company Average') ? 'drop-shadow(0px 0px 8px rgba(255,215,0,0.8))' : 'none' }}
                  />
                  { (selectedClass === 'all' || selectedClass === '1cl') && (
                    <Line 
                      type="monotone" 
                      dataKey="1CL" 
                      stroke="#3b82f6" 
                      strokeWidth={selectedClass === '1cl' ? 4 : 2} 
                      strokeOpacity={isLineActive('1cl') ? 1.0 : 0.25}
                      dot={{ r: 4 }} 
                      name="1CL" 
                    />
                  )}
                  { (selectedClass === 'all' || selectedClass === '2cl') && (
                    <Line 
                      type="monotone" 
                      dataKey="2CL" 
                      stroke="#ef4444" 
                      strokeWidth={selectedClass === '2cl' ? 4 : 2} 
                      strokeOpacity={isLineActive('2cl') ? 1.0 : 0.25}
                      dot={{ r: 4 }} 
                      name="2CL" 
                    />
                  )}
                  { (selectedClass === 'all' || selectedClass === '3cl') && (
                    <Line 
                      type="monotone" 
                      dataKey="3CL" 
                      stroke="#FFFF00" 
                      strokeWidth={selectedClass === '3cl' ? 4 : 2} 
                      strokeOpacity={isLineActive('3cl') ? 1.0 : 0.25}
                      dot={{ r: 4 }} 
                      name="3CL" 
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className={`pft-charts-grid ${selectedPFT !== 'all' ? 'single-chart' : ''}`}>
        {selectedPFT === 'all' ? (
          <>
            <PieChart data={mockData[selectedClass]} title="Mock PFT" onSegmentClick={handleSegmentClick} />
            <PieChart data={pft1Data[selectedClass]} title="PFT 1" onSegmentClick={handleSegmentClick} />
          </>
        ) : (
          <PieChart 
            data={pftTypes[selectedPFT].data[selectedClass]} 
            title={pftTypes[selectedPFT].label} 
            onSegmentClick={handleSegmentClick} 
          />
        )}
      </div>


      {/* Drill-down Cadet List View */}
      <AnimatePresence>
        {activeList && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            id="cadet-list-view" 
            className="cadet-list-container"
          >
            <div className="cadet-list-header">
              <h3>
                {activeList.pftTitle} - <span style={{ color: COLORS[activeList.statusKey] }}>{LABELS[activeList.statusKey]}</span>
              </h3>
              <span className="cadet-list-badge">{activeList.cadets.length} Cadets</span>
            </div>
            
            <motion.div 
              className="cadet-list-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
            {activeList.cadets.length > 0 ? (
              activeList.cadets.map((cadet, idx) => (
                <motion.button 
                  key={idx} 
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02, backgroundColor: "var(--bg-secondary)" }}
                  whileTap={{ scale: 0.98 }}
                  className="cadet-list-item clickable" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleCadetClick(cadet.name);
                  }}
                  style={{ 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    fontFamily: 'inherit'
                  }}
                >
                  <span className="cadet-name">{cadet.name}</span>
                </motion.button>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>
                No cadets found in this category.
              </div>
            )}
            </motion.div>
          
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cadet-list-close" 
              onClick={() => setActiveList(null)}
            >
              Close List
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Insights Modal */}
      <AnimatePresence>
        {showInsightModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="pft-modal-overlay" 
            onClick={() => setShowInsightModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pft-modal-content" 
              onClick={(e) => e.stopPropagation()}
            >
            <div className="pft-modal-header">
              <h2 className="pft-modal-title">PFT Cohort Insights ({selectedClass === 'all' ? 'All Classes' : selectedClass.toUpperCase()})</h2>
              <button className="pft-modal-close-icon" onClick={() => setShowInsightModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="pft-modal-body">
              {/* PFT Tab Selector in Modal */}
              <div className="pft-modal-tabs">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`pft-modal-tab-btn ${insightPftTab === 'mock' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('mock')}
                >
                  Mock PFT
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`pft-modal-tab-btn ${insightPftTab === 'pft1' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('pft1')}
                >
                  PFT 1
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`pft-modal-tab-btn ${insightPftTab === 'pft2' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('pft2')}
                >
                  PFT 2
                </motion.button>
              </div>

              {activeInsights.totalActive === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No active participant data available for this PFT type or Class.
                </div>
              ) : (
                <div>
                  {/* Summary Stats Grid */}
                  <motion.div 
                    className="pft-insight-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                  >
                    <motion.div 
                      className="pft-insight-card"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <span className="pft-insight-label">Overall Pass Rate</span>
                      <span className="pft-insight-val" style={{ color: '#1a7a3a' }}>
                        {activeInsights.overallPassRate.toFixed(1)}%
                      </span>
                      <span className="pft-insight-desc">
                        {activeInsights.passedCount} out of {activeInsights.totalActive} active cadets passed
                      </span>
                    </motion.div>

                    <motion.div 
                      className="pft-insight-card"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <span className="pft-insight-label">Gender Passing Rates</span>
                      <span className="pft-insight-val" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                        M: {activeInsights.malePassRate !== null ? `${activeInsights.malePassRate.toFixed(1)}%` : 'N/A'}
                      </span>
                      <span className="pft-insight-val" style={{ fontSize: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                        F: {activeInsights.femalePassRate !== null ? `${activeInsights.femalePassRate.toFixed(1)}%` : 'N/A'}
                      </span>
                      <span className="pft-insight-desc" style={{ marginTop: '0.5rem' }}>
                        Pool: {activeInsights.malesCount} males, {activeInsights.femalesCount} females
                      </span>
                    </motion.div>

                    <motion.div 
                      className="pft-insight-card"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <span className="pft-insight-label">Active Cohort Split</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 600 }}>PASSED:</span>
                          <span style={{ fontWeight: 700, color: '#1a7a3a' }}>{activeInsights.passedCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 600 }}>FAILED:</span>
                          <span style={{ fontWeight: 700, color: '#c0392b' }}>{activeInsights.failedCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 600 }}>SMC:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{activeInsights.smcCount}</span>
                        </div>
                      </div>
                      <span className="pft-insight-desc" style={{ marginTop: 'auto' }}>
                        Excludes FAD/excused cadets
                      </span>
                    </motion.div>
                  </motion.div>

                  {/* Class breakdown detail (only if showing all classes) */}
                  {selectedClass === 'all' && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 700 }}>
                        Class Level Passing Rates
                      </h4>
                      <div className="pft-insight-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                        {['1cl', '2cl', '3cl'].map(ck => {
                          const data = activeInsights.classBreakdown[ck];
                          return (
                            <div key={ck} className="pft-insight-card" style={{ padding: '1rem', alignItems: 'center' }}>
                              <span className="pft-insight-label">{ck.toUpperCase()}</span>
                              <span className="pft-insight-val" style={{ fontSize: '1.6rem', color: data.passRate !== null && data.passRate >= 70 ? '#1a7a3a' : '#c0392b' }}>
                                {data.passRate !== null ? `${data.passRate.toFixed(1)}%` : 'N/A'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {data.total} active cadets
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Event passing rates */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 700 }}>
                      Event-by-Event Pass Rates (Score &ge; 7.0)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                      {[
                        { label: 'Pushups', val: activeInsights.pushupsPassRate },
                        { label: 'Situps', val: activeInsights.situpsPassRate },
                        { label: 'Pullups', val: activeInsights.pullupsPassRate },
                        { label: '3.2KM Run', val: activeInsights.runPassRate },
                      ].map(ev => (
                        <div key={ev.label} className="pft-insight-card" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span className="pft-insight-label" style={{ fontSize: '0.7rem' }}>{ev.label}</span>
                          <span className="pft-insight-val" style={{ fontSize: '1.5rem', color: ev.val >= 70 ? '#1a7a3a' : '#c0392b', margin: '0.2rem 0' }}>
                            {ev.val.toFixed(1)}%
                          </span>
                          <div style={{ height: '4px', width: '100%', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${ev.val}%`, background: ev.val >= 70 ? '#1a7a3a' : '#c0392b' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actionable remediation plan */}
                  {selectedClass === 'all' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Class-Specific Strategies</h3>
                      {['1cl', '2cl', '3cl'].map(ck => {
                        const cb = activeInsights.classBreakdown[ck];
                        if (!cb || cb.total === 0 || !cb.weakestEvent) return null;
                        const classRemediation = getRemediationRecommendation(cb.weakestEvent.key);
                        return (
                          <div key={ck} className="pft-remediation-box" style={{ marginTop: 0 }}>
                            <div className="pft-remediation-title">
                              <span style={{ 
                                backgroundColor: ck === '1cl' ? '#3b82f6' : ck === '2cl' ? '#ef4444' : '#FFFF00', 
                                color: ck === '3cl' ? '#000' : '#fff',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '0.75rem', fontWeight: 800
                              }}>{ck.toUpperCase()}</span>
                              {classRemediation.title}
                            </div>
                            <p className="pft-remediation-text">
                              {classRemediation.text}
                            </p>
                            <ul className="pft-remediation-list">
                              {classRemediation.tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pft-remediation-box">
                      <div className="pft-remediation-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        {remediation.title}
                      </div>
                      <p className="pft-remediation-text">
                        {remediation.text}
                      </p>
                      <ul className="pft-remediation-list">
                        {remediation.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Cadet Modal */}
      <AnimatePresence>
        {selectedCadet && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="pft-modal-overlay" 
            onClick={() => setSelectedCadet(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pft-modal-content cadet-profile-modal" 
              onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: '800px', width: '95%' }}
            >
            <div className="pft-modal-header">
              <h2 className="pft-modal-title">Cadet PFT Profile: {selectedCadet.name}</h2>
              <button className="pft-modal-close-icon" onClick={() => setSelectedCadet(null)}>
                &times;
              </button>
            </div>
            
            <div className="pft-modal-body">
              {/* Cadet Progression Line Chart */}
              <div className="pft-chart-card" style={{ marginBottom: '2rem' }}>
                <h3 className="pft-chart-title">Event Progression</h3>
                <div className="graph-container" style={{ width: '100%', height: 400, marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <LineChart 
                      data={[
                        { 
                          event: 'Push-ups', 
                          'Mock PFT': selectedCadet.mock?.scores?.pushups, 
                          'PFT 1': selectedCadet.pft1?.scores?.pushups, 
                          'PFT 2': selectedCadet.pft2?.scores?.pushups,
                          'Personal Average': [selectedCadet.mock?.scores?.pushups, selectedCadet.pft1?.scores?.pushups, selectedCadet.pft2?.scores?.pushups].filter(v => v !== undefined && v !== null).reduce((a, b, _, arr) => a + b / arr.length, 0)
                        },
                        { 
                          event: 'Sit-ups', 
                          'Mock PFT': selectedCadet.mock?.scores?.situps, 
                          'PFT 1': selectedCadet.pft1?.scores?.situps, 
                          'PFT 2': selectedCadet.pft2?.scores?.situps,
                          'Personal Average': [selectedCadet.mock?.scores?.situps, selectedCadet.pft1?.scores?.situps, selectedCadet.pft2?.scores?.situps].filter(v => v !== undefined && v !== null).reduce((a, b, _, arr) => a + b / arr.length, 0)
                        },
                        { 
                          event: 'Pull-ups', 
                          'Mock PFT': selectedCadet.mock?.scores?.pullups, 
                          'PFT 1': selectedCadet.pft1?.scores?.pullups, 
                          'PFT 2': selectedCadet.pft2?.scores?.pullups,
                          'Personal Average': [selectedCadet.mock?.scores?.pullups, selectedCadet.pft1?.scores?.pullups, selectedCadet.pft2?.scores?.pullups].filter(v => v !== undefined && v !== null).reduce((a, b, _, arr) => a + b / arr.length, 0)
                        },
                        { 
                          event: '3.2KM Run', 
                          'Mock PFT': selectedCadet.mock?.scores?.run, 
                          'PFT 1': selectedCadet.pft1?.scores?.run, 
                          'PFT 2': selectedCadet.pft2?.scores?.run,
                          'Personal Average': [selectedCadet.mock?.scores?.run, selectedCadet.pft1?.scores?.run, selectedCadet.pft2?.scores?.run].filter(v => v !== undefined && v !== null).reduce((a, b, _, arr) => a + b / arr.length, 0)
                        }
                      ]} 
                      margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="event" stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <YAxis stroke="var(--text-secondary)" domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <Tooltip itemSorter={(item) => -item.value} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 10 }} />
                      
                      <ReferenceArea y1={8.0} y2={8.5} fill="#10b981" fillOpacity={0.12} />
                      <ReferenceLine y={7.0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} />
                      
                      <Line type="monotone" dataKey="Mock PFT" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="PFT 1" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="PFT 2" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="Personal Average" stroke="#d97706" strokeWidth={3} strokeDasharray="5 5" activeDot={{ r: 8 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Enhanced Individual Insight Generator */}
              {(() => {
                const extractScores = (evtKey) => {
                  return {
                    mock: selectedCadet.mock?.scores?.[evtKey],
                    pft1: selectedCadet.pft1?.scores?.[evtKey],
                    pft2: selectedCadet.pft2?.scores?.[evtKey]
                  };
                };

                const analyzeEvent = (evtKey, name) => {
                  const s = extractScores(evtKey);
                  const valid = [s.mock, s.pft1, s.pft2].filter(v => v !== undefined && v !== null);
                  if (valid.length === 0) return { key: evtKey, name, avg: 0, latest: 0, previous: null, trend: 'No Data' };
                  
                  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
                  const latest = valid[valid.length - 1];
                  const previous = valid.length > 1 ? valid[valid.length - 2] : null;
                  
                  let trend = 'Maintained';
                  if (previous !== null) {
                    if (latest > previous + 0.2) trend = 'Improving';
                    else if (latest < previous - 0.2) trend = 'Declining';
                  }

                  return { key: evtKey, name, avg, latest, previous, trend };
                };

                const events = [
                  analyzeEvent('pushups', 'Push-ups'),
                  analyzeEvent('situps', 'Sit-ups'),
                  analyzeEvent('pullups', selectedCadet.gender === 'F' || selectedCadet.gender === 'Female' ? 'Flex Arm Hang' : 'Pull-ups'),
                  analyzeEvent('run', '3.2KM Run')
                ].filter(e => e.trend !== 'No Data');

                if (events.length === 0) {
                  return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No performance data to analyze yet.</div>;
                }

                // Overall rating based on latest average
                const grandLatestAvg = events.reduce((acc, ev) => acc + ev.latest, 0) / events.length;
                const prevValidEvents = events.filter(ev => ev.previous !== null);
                const grandPrevAvg = prevValidEvents.length > 0 
                  ? prevValidEvents.reduce((acc, ev) => acc + ev.previous, 0) / prevValidEvents.length 
                  : null;

                let overallTrend = 'No Data';
                let trendColor = 'var(--text-secondary)';
                if (grandPrevAvg !== null) {
                  if (grandLatestAvg > grandPrevAvg + 0.2) {
                    overallTrend = 'Improved';
                    trendColor = '#10b981'; // Green
                  } else if (grandLatestAvg < grandPrevAvg - 0.2) {
                    overallTrend = 'Declined';
                    trendColor = '#ef4444'; // Red
                  } else {
                    overallTrend = 'Maintained';
                    trendColor = '#3b82f6'; // Blue
                  }
                } else if (events.length > 0) {
                   overallTrend = 'First PFT Recorded';
                   trendColor = 'var(--text-primary)';
                }

                let rating = 'Needs Strict Training';
                let ratingColor = '#ef4444'; // red
                
                if (grandLatestAvg >= 8.5) {
                  rating = 'Excellent';
                  ratingColor = '#10b981'; // green
                } else if (grandLatestAvg >= 8.0) {
                  rating = 'Satisfactory';
                  ratingColor = '#3b82f6'; // blue
                } else if (grandLatestAvg >= 7.0) {
                  rating = 'Needs Improvement';
                  ratingColor = '#f59e0b'; // yellow/orange
                }

                const strengths = events.filter(e => e.latest >= 8.0).sort((a, b) => b.latest - a.latest);
                const weaknesses = events.filter(e => e.latest < 8.0).sort((a, b) => a.latest - b.latest);

                const getAdvice = (evtKey, isStrength) => {
                  if (isStrength) {
                    switch(evtKey) {
                      case 'pushups': return "Maintain chest endurance with periodic high-volume sets. Avoid overtraining to protect joints.";
                      case 'situps': return "Core endurance is solid. Integrate weighted ab exercises (planks, Russian twists) to maintain power.";
                      case 'pullups': return "Excellent lat and grip strength. Use weighted pull-ups occasionally to maintain peak force output.";
                      case 'run': return "Cardio base is strong. Stick to the 80/20 rule (80% easy, 20% interval) to sustain VO2 max without burnout.";
                      default: return "Maintain current training regimen.";
                    }
                  } else {
                    switch(evtKey) {
                      case 'pushups': return "Requires progressive overload. Use timed sets (e.g., max reps in 1 min) and mix in diamond/wide-grip variations.";
                      case 'situps': return "Pacing is likely an issue. Practice 30-second sprint sets and strengthen hip flexors with leg raises.";
                      case 'pullups': return "Focus on grip and lat recruitment. Implement daily dead hangs (30-60s) and slow eccentric (negative) pull-ups.";
                      case 'run': return "Aerobic capacity needs work. Incorporate 400m/800m intervals once a week to build speed and anaerobic threshold.";
                      default: return "Requires focused remediation training.";
                    }
                  }
                };

                return (
                  <div className="pft-insight-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="pft-insight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${ratingColor}` }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: ratingColor }}>{rating} ({grandLatestAvg.toFixed(2)})</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Status</div>
                        <div style={{ fontWeight: 600, color: trendColor }}>
                          {overallTrend}
                          {grandPrevAvg !== null && ` (from ${grandPrevAvg.toFixed(2)})`}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: strengths.length > 0 && weaknesses.length > 0 ? (isMobile ? '1fr' : '1fr 1fr') : '1fr', 
                      gap: '1rem',
                      alignItems: 'start'
                    }}>
                      {weaknesses.length > 0 && (
                        <div className="pft-remediation-box" style={{ margin: 0, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                          <div className="pft-remediation-title" style={{ color: '#ef4444' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Priority Focus Areas
                          </div>
                          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {weaknesses.map(w => (
                              <div key={w.key} style={{ paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.35rem' }}>
                                  <span>{w.name} ({w.latest.toFixed(2)})</span>
                                  <span style={{ fontSize: '0.85em', color: w.trend === 'Improving' ? '#10b981' : w.trend === 'Declining' ? '#ef4444' : 'var(--text-secondary)' }}>{w.trend}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{getAdvice(w.key, false)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {strengths.length > 0 && (
                        <div className="pft-remediation-box" style={{ margin: 0, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                          <div className="pft-remediation-title" style={{ color: '#10b981' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            Strengths & Maintenance
                          </div>
                          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {strengths.map(s => (
                              <div key={s.key} style={{ paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.35rem' }}>
                                  <span>{s.name} ({s.latest.toFixed(2)})</span>
                                  <span style={{ fontSize: '0.85em', color: s.trend === 'Declining' ? '#ef4444' : '#10b981' }}>{s.trend}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{getAdvice(s.key, true)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Scorecard Toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowScorecard(!showScorecard)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '20px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {showScorecard ? 'Hide Scorecard' : 'View Scorecard'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showScorecard ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </motion.button>
              </div>

              {/* Cadet Data Table */}
              {showScorecard && (
                <div className="table-container" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <table className="mobile-card-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Event</th>
                        <th>Mock PFT</th>
                        <th>PFT 1</th>
                        <th>PFT 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Push-ups', 'Sit-ups', selectedCadet.gender === 'F' || selectedCadet.gender === 'Female' ? 'Flex Arm Hang' : 'Pull-ups', '3.2KM Run', 'Average'].map(ev => {
                        const keys = { 'Push-ups': 'pushups', 'Sit-ups': 'situps', 'Pull-ups': 'pullups', 'Flex Arm Hang': 'pullups', '3.2KM Run': 'run', 'Average': 'average' };
                        const k = keys[ev];
                        return (
                          <tr key={ev}>
                            <td data-label="Event" style={{ fontWeight: ev === 'Average' ? 700 : 600, textAlign: 'left' }}>{ev}</td>
                            <td data-label="Mock PFT" style={{ fontWeight: ev === 'Average' ? 700 : 400, textAlign: 'center' }}>{selectedCadet.mock?.scores?.[k] !== undefined ? selectedCadet.mock.scores[k].toFixed(2) : '-'}</td>
                            <td data-label="PFT 1" style={{ fontWeight: ev === 'Average' ? 700 : 400, textAlign: 'center' }}>{selectedCadet.pft1?.scores?.[k] !== undefined ? selectedCadet.pft1.scores[k].toFixed(2) : '-'}</td>
                            <td data-label="PFT 2" style={{ fontWeight: ev === 'Average' ? 700 : 400, textAlign: 'center' }}>{selectedCadet.pft2?.scores?.[k] !== undefined ? selectedCadet.pft2.scores[k].toFixed(2) : '-'}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td data-label="Event" style={{ fontWeight: 600, textAlign: 'left' }}>Remarks</td>
                        <td data-label="Mock PFT" style={{ color: selectedCadet.mock?.remarks?.includes('PASSED') || selectedCadet.mock?.remarks === 'P' ? '#1a7a3a' : selectedCadet.mock?.remarks ? '#c0392b' : 'inherit', fontWeight: 700, textAlign: 'center' }}>
                          {selectedCadet.mock?.remarks || '-'}
                        </td>
                        <td data-label="PFT 1" style={{ color: selectedCadet.pft1?.remarks?.includes('PASSED') || selectedCadet.pft1?.remarks === 'P' ? '#1a7a3a' : selectedCadet.pft1?.remarks ? '#c0392b' : 'inherit', fontWeight: 700, textAlign: 'center' }}>
                          {selectedCadet.pft1?.remarks || '-'}
                        </td>
                        <td data-label="PFT 2" style={{ color: selectedCadet.pft2?.remarks?.includes('PASSED') || selectedCadet.pft2?.remarks === 'P' ? '#1a7a3a' : selectedCadet.pft2?.remarks ? '#c0392b' : 'inherit', fontWeight: 700, textAlign: 'center' }}>
                          {selectedCadet.pft2?.remarks || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
