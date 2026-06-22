'use client';

import { useState } from 'react';
import { 
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
      <div className="pft-chart-card">
        <h3 className="pft-chart-title">{title}</h3>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
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
    <div className="pft-chart-card">
      <h3 className="pft-chart-title">{title}</h3>
      <div className="pft-chart-body">
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
    classBreakdown[ck] = {
      total: clsActive.length,
      passRate: clsActive.length > 0 ? (clsPassed.length / clsActive.length) * 100 : null
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
  const [selectedPFT, setSelectedPFT] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [activeList, setActiveList] = useState(null);
  
  // Toggle switcher state: 'class' for Class PFT Data, 'event' for PFT Event Data
  const [activeChartTab, setActiveChartTab] = useState('class');

  // Insight Modal State
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [insightPftTab, setInsightPftTab] = useState(
    pft2Data && [...pft2Data.all.passed, ...pft2Data.all.failed, ...pft2Data.all.smc].length > 0 ? 'pft2' :
    pft1Data && [...pft1Data.all.passed, ...pft1Data.all.failed, ...pft1Data.all.smc].length > 0 ? 'pft1' : 'mock'
  );

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
      'Overall': getPassRateForPFT(mockData, 'all'),
      '1CL': getPassRateForPFT(mockData, '1cl'),
      '2CL': getPassRateForPFT(mockData, '2cl'),
      '3CL': getPassRateForPFT(mockData, '3cl'),
    },
    {
      name: 'PFT 1',
      'Overall': getPassRateForPFT(pft1Data, 'all'),
      '1CL': getPassRateForPFT(pft1Data, '1cl'),
      '2CL': getPassRateForPFT(pft1Data, '2cl'),
      '3CL': getPassRateForPFT(pft1Data, '3cl'),
    },
    {
      name: 'PFT 2',
      'Overall': getPassRateForPFT(pft2Data, 'all'),
      '1CL': getPassRateForPFT(pft2Data, '1cl'),
      '2CL': getPassRateForPFT(pft2Data, '2cl'),
      '3CL': getPassRateForPFT(pft2Data, '3cl'),
    }
  ].filter(item => item.Overall !== null);

  // Calculate dynamic Y-axis domain based on the min/max values in data to highlight small variations
  const getYDomain = () => {
    if (progressChartData.length === 0) return [0, 100];
    
    let minVal = 100;
    let maxVal = 0;
    
    progressChartData.forEach(item => {
      ['Overall', '1CL', '2CL', '3CL'].forEach(key => {
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

  // Helper to calculate averages of a PFT score component
  const getEventAverage = (pftKey, classKey, eventKey) => {
    let datasets = [];
    if (pftKey === 'all') {
      datasets = [mockData, pft1Data, pft2Data].filter(d => d !== null);
    } else {
      datasets = [pftTypes[pftKey]?.data].filter(d => d !== null && d !== undefined);
    }

    let allScores = [];
    datasets.forEach(data => {
      const cData = data[classKey];
      if (cData) {
        const active = [...cData.passed, ...cData.failed, ...cData.smc];
        active.forEach(c => {
          const val = c.scores?.[eventKey];
          if (val !== undefined && val !== null) {
            allScores.push(val);
          }
        });
      }
    });

    if (allScores.length === 0) return 0;
    const sum = allScores.reduce((a, b) => a + b, 0);
    return parseFloat((sum / allScores.length).toFixed(2));
  };

  // Construct BarChart data for event point averages
  const averageGradesData = [
    {
      event: 'Push-ups',
      'Overall': getEventAverage(selectedPFT, 'all', 'pushups'),
      '1CL': getEventAverage(selectedPFT, '1cl', 'pushups'),
      '2CL': getEventAverage(selectedPFT, '2cl', 'pushups'),
      '3CL': getEventAverage(selectedPFT, '3cl', 'pushups'),
    },
    {
      event: 'Sit-ups',
      'Overall': getEventAverage(selectedPFT, 'all', 'situps'),
      '1CL': getEventAverage(selectedPFT, '1cl', 'situps'),
      '2CL': getEventAverage(selectedPFT, '2cl', 'situps'),
      '3CL': getEventAverage(selectedPFT, '3cl', 'situps'),
    },
    {
      event: 'Pullups/Flexarm', // Displays Pullups/Flexarm as requested
      'Overall': getEventAverage(selectedPFT, 'all', 'pullups'),
      '1CL': getEventAverage(selectedPFT, '1cl', 'pullups'),
      '2CL': getEventAverage(selectedPFT, '2cl', 'pullups'),
      '3CL': getEventAverage(selectedPFT, '3cl', 'pullups'),
    },
    {
      event: '3.2KM Run',
      'Overall': getEventAverage(selectedPFT, 'all', 'run'),
      '1CL': getEventAverage(selectedPFT, '1cl', 'run'),
      '2CL': getEventAverage(selectedPFT, '2cl', 'run'),
      '3CL': getEventAverage(selectedPFT, '3cl', 'run'),
    }
  ];

  // Dynamic Y-axis scale for Grades LineChart (zoomed in to accentuate variance)
  const getGradeYDomain = () => {
    let minVal = 10;
    let maxVal = 0;
    averageGradesData.forEach(item => {
      ['Overall', '1CL', '2CL', '3CL'].forEach(key => {
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

  // Line styling highlighting based on selectedClass dropdown filter
  const isLineActive = (classKey) => {
    if (selectedClass === 'all') return true;
    return selectedClass.toUpperCase() === classKey.toUpperCase() || classKey === 'Overall';
  };

  // Bar opacity styling based on selectedClass dropdown filter
  const isBarActive = (classKey) => {
    if (selectedClass === 'all') return true;
    return selectedClass.toLowerCase() === classKey.toLowerCase() || classKey === 'Overall';
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

  return (
    <div>
      {/* Controls: Dropdowns + Generate Insights Button */}
      <div className="pft-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="pft-select" className="pft-select-label">PFT Type:</label>
          <select
            id="pft-select"
            className="pft-select"
            value={selectedPFT}
            onChange={(e) => { setSelectedPFT(e.target.value); setActiveList(null); }}
          >
            <option value="all">All PFTs</option>
            <option value="mock">Mock PFT</option>
            <option value="pft1">PFT 1</option>
            <option value="pft2">PFT 2</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="class-select" className="pft-select-label">Class:</label>
          <select
            id="class-select"
            className="pft-select"
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setActiveList(null); }}
          >
            <option value="all">All Classes</option>
            <option value="1cl">1st Class (1CL)</option>
            <option value="2cl">2nd Class (2CL)</option>
            <option value="3cl">3rd Class (3CL)</option>
          </select>
        </div>

        <button 
          onClick={() => setShowInsightModal(true)}
          className="pft-insight-btn"
          style={{
            marginLeft: 'auto',
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
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Generate Insights
        </button>
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
          <button
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
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            Class PFT Data
          </button>
          <button
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
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            PFT Event Data
          </button>
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
              <div style={{ width: '100%', height: 350, marginTop: '0.5rem' }}>
                <ResponsiveContainer>
                  <BarChart data={progressChartData} margin={{ top: 15, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                    <YAxis stroke="var(--text-secondary)" unit="%" domain={yDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 10 }} />
                    <Bar 
                      dataKey="Overall" 
                      fill="#d97706" 
                      fillOpacity={isBarActive('Overall') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="Overall" 
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
                      fill="#10b981" 
                      fillOpacity={isBarActive('2cl') ? 1.0 : 0.25} 
                      radius={[4, 4, 0, 0]} 
                      name="2CL" 
                    />
                    <Bar 
                      dataKey="3CL" 
                      fill="#8b5cf6" 
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
            <div style={{ width: '100%', height: 350, marginTop: '0.5rem' }}>
              <ResponsiveContainer>
                <LineChart data={averageGradesData} margin={{ top: 15, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="event" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                  <YAxis stroke="var(--text-secondary)" domain={gradeYDomain} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 10 }} />
                  
                  {/* Reference Area for sweet spot 8.0 - 8.5 */}
                  <ReferenceArea y1={8.0} y2={8.5} fill="#10b981" fillOpacity={0.12} />
                  {/* Reference Line for passing threshold 7.0 */}
                  <ReferenceLine y={7.0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Pass: 7.0', fill: '#ef4444', fontSize: 10, position: 'top', fontWeight: 600 }} />

                  <Line 
                    type="monotone" 
                    dataKey="Overall" 
                    stroke="#d97706" 
                    strokeWidth={selectedClass === 'all' ? 4 : 2} 
                    strokeOpacity={isLineActive('Overall') ? 1.0 : 0.25}
                    activeDot={{ r: 8 }} 
                    dot={{ r: 5 }} 
                    name="Overall" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="1CL" 
                    stroke="#3b82f6" 
                    strokeWidth={selectedClass === '1cl' ? 4 : 2} 
                    strokeOpacity={isLineActive('1cl') ? 1.0 : 0.25}
                    dot={{ r: 4 }} 
                    name="1CL" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="2CL" 
                    stroke="#10b981" 
                    strokeWidth={selectedClass === '2cl' ? 4 : 2} 
                    strokeOpacity={isLineActive('2cl') ? 1.0 : 0.25}
                    dot={{ r: 4 }} 
                    name="2CL" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="3CL" 
                    stroke="#8b5cf6" 
                    strokeWidth={selectedClass === '3cl' ? 4 : 2} 
                    strokeOpacity={isLineActive('3cl') ? 1.0 : 0.25}
                    dot={{ r: 4 }} 
                    name="3CL" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="pft-charts-grid">
        {selectedPFT === 'all' ? (
          <>
            <PieChart data={mockData[selectedClass]} title="Mock PFT" onSegmentClick={handleSegmentClick} />
            <PieChart data={pft1Data[selectedClass]} title="PFT 1" onSegmentClick={handleSegmentClick} />
            <PieChart data={pft2Data[selectedClass]} title="PFT 2" onSegmentClick={handleSegmentClick} />
          </>
        ) : (
          <PieChart 
            data={pftTypes[selectedPFT].data[selectedClass]} 
            title={pftTypes[selectedPFT].label} 
            onSegmentClick={handleSegmentClick} 
          />
        )}
      </div>

      {/* Summary Table */}
      <div className="table-container" style={{ marginTop: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>PFT Type</th>
              <th style={{ color: COLORS.passed }}>Passed</th>
              <th style={{ color: COLORS.failed }}>Failed</th>
              <th style={{ color: COLORS.smc }}>SMC</th>
              <th style={{ color: COLORS.fad }}>FAD/Guard/SIQ</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pftTypes).map(([key, { label, data }]) => {
              const cData = data[selectedClass];
              return (
                <tr key={key}>
                  <td style={{ fontWeight: 600 }}>{label}</td>
                  <td>{cData.passed.length}</td>
                  <td>{cData.failed.length}</td>
                  <td>{cData.smc.length}</td>
                  <td>{cData.fad.length}</td>
                  <td style={{ fontWeight: 700 }}>{getTotal(cData)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drill-down Cadet List View */}
      {activeList && (
        <div id="cadet-list-view" className="cadet-list-container">
          <div className="cadet-list-header">
            <h3>
              {activeList.pftTitle} - <span style={{ color: COLORS[activeList.statusKey] }}>{LABELS[activeList.statusKey]}</span>
            </h3>
            <span className="cadet-list-badge">{activeList.cadets.length} Cadets</span>
          </div>
          
          <div className="cadet-list-grid">
            {activeList.cadets.length > 0 ? (
              activeList.cadets.map((cadet, idx) => (
                <div key={idx} className="cadet-list-item">
                  <span className="cadet-name">{cadet.name}</span>
                </div>
              ))
            ) : (
              <div className="cadet-list-empty">No cadets in this category.</div>
            )}
          </div>
          
          <button className="cadet-list-close" onClick={() => setActiveList(null)}>
            Close List
          </button>
        </div>
      )}

      {/* Generate Insights Modal */}
      {showInsightModal && (
        <div className="pft-modal-overlay" onClick={() => setShowInsightModal(false)}>
          <div className="pft-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pft-modal-header">
              <h2 className="pft-modal-title">PFT Cohort Insights ({selectedClass === 'all' ? 'All Classes' : selectedClass.toUpperCase()})</h2>
              <button className="pft-modal-close-icon" onClick={() => setShowInsightModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="pft-modal-body">
              {/* PFT Tab Selector in Modal */}
              <div className="pft-modal-tabs">
                <button 
                  className={`pft-modal-tab-btn ${insightPftTab === 'mock' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('mock')}
                >
                  Mock PFT
                </button>
                <button 
                  className={`pft-modal-tab-btn ${insightPftTab === 'pft1' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('pft1')}
                >
                  PFT 1
                </button>
                <button 
                  className={`pft-modal-tab-btn ${insightPftTab === 'pft2' ? 'active' : ''}`}
                  onClick={() => setInsightPftTab('pft2')}
                >
                  PFT 2
                </button>
              </div>

              {activeInsights.totalActive === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No active participant data available for this PFT type or Class.
                </div>
              ) : (
                <div>
                  {/* Summary Stats Grid */}
                  <div className="pft-insight-grid">
                    <div className="pft-insight-card">
                      <span className="pft-insight-label">Overall Pass Rate</span>
                      <span className="pft-insight-val" style={{ color: '#1a7a3a' }}>
                        {activeInsights.overallPassRate.toFixed(1)}%
                      </span>
                      <span className="pft-insight-desc">
                        {activeInsights.passedCount} out of {activeInsights.totalActive} active cadets passed
                      </span>
                    </div>

                    <div className="pft-insight-card">
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
                    </div>

                    <div className="pft-insight-card">
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
                    </div>
                  </div>

                  {/* Class breakdown detail (only if showing all classes) */}
                  {selectedClass === 'all' && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 700 }}>
                        Class Level Passing Rates
                      </h4>
                      <div className="pft-insight-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
