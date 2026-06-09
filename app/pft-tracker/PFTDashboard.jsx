'use client';

import { useState } from 'react';

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

export default function PFTDashboard({ mockData, pft1Data, pft2Data }) {
  const [selectedPFT, setSelectedPFT] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  
  // State for drill-down list
  const [activeList, setActiveList] = useState(null); // { statusKey, cadets, pftTitle }

  const pftTypes = {
    mock: { label: 'Mock PFT', data: mockData },
    pft1: { label: 'PFT 1', data: pft1Data },
    pft2: { label: 'PFT 2', data: pft2Data },
  };

  const handleSegmentClick = (statusKey, cadets, pftTitle) => {
    setActiveList({ statusKey, cadets, pftTitle });
    // Scroll smoothly to the list container if it exists
    setTimeout(() => {
      document.getElementById('cadet-list-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Helper to calculate total from categorized array data
  const getTotal = (dataObj) => {
    return dataObj.passed.length + dataObj.failed.length + dataObj.smc.length + dataObj.fad.length;
  };

  return (
    <div>
      {/* Dropdown Selectors */}
      <div className="pft-controls">
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
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
    </div>
  );
}
