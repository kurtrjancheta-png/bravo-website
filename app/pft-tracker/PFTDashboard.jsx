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
function PieChart({ data, title }) {
  const total = data.passed + data.failed + data.smc + data.fad;
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
    { key: 'passed', value: data.passed },
    { key: 'failed', value: data.failed },
    { key: 'smc',    value: data.smc },
    { key: 'fad',    value: data.fad },
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
      };
    }

    return {
      key: seg.key,
      path: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`,
      color: COLORS[seg.key],
      value: seg.value,
      pct: Math.round((seg.value / total) * 100),
    };
  });

  return (
    <div className="pft-chart-card">
      <h3 className="pft-chart-title">{title}</h3>
      <div className="pft-chart-body">
        <svg viewBox="0 0 200 200" className="pft-pie-svg">
          {arcs.map((arc) => (
            <path key={arc.key} d={arc.path} fill={arc.color}>
              <title>{LABELS[arc.key]}: {arc.value} ({arc.pct}%)</title>
            </path>
          ))}
          {/* Center white circle for donut look */}
          <circle cx={cx} cy={cy} r={40} fill="white" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-primary)">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="600">TOTAL</text>
        </svg>

        <div className="pft-legend">
          {segments.map((seg) => (
            <div key={seg.key} className="pft-legend-item">
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
  const [selected, setSelected] = useState('all');

  const pftTypes = {
    mock: { label: 'Mock PFT', data: mockData },
    pft1: { label: 'PFT 1', data: pft1Data },
    pft2: { label: 'PFT 2', data: pft2Data },
  };

  return (
    <div>
      {/* Dropdown Selector */}
      <div className="pft-controls">
        <label htmlFor="pft-select" className="pft-select-label">View PFT Type:</label>
        <select
          id="pft-select"
          className="pft-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="all">All PFTs</option>
          <option value="mock">Mock PFT</option>
          <option value="pft1">PFT 1</option>
          <option value="pft2">PFT 2</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="pft-charts-grid">
        {selected === 'all' ? (
          <>
            <PieChart data={mockData} title="Mock PFT" />
            <PieChart data={pft1Data} title="PFT 1" />
            <PieChart data={pft2Data} title="PFT 2" />
          </>
        ) : (
          <PieChart data={pftTypes[selected].data} title={pftTypes[selected].label} />
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
            {Object.entries(pftTypes).map(([key, { label, data }]) => (
              <tr key={key}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td>{data.passed}</td>
                <td>{data.failed}</td>
                <td>{data.smc}</td>
                <td>{data.fad}</td>
                <td style={{ fontWeight: 700 }}>{data.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
