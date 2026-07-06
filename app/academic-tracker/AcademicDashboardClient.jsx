'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'recharts';

export default function AcademicDashboardClient({ initialDeficienciesData, initialHistoryLogs }) {
  const [activeClass, setActiveClass] = useState('1CL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('deficient'); // 'all' or 'deficient'
  const [expandedCadet, setExpandedCadet] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage({ type: 'info', text: 'Syncing deficiency records...' });
    try {
      const res = await fetch('/api/academic-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({ type: 'success', text: 'Academic data synced successfully! Refreshing page...' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSyncMessage({ type: 'error', text: `Sync failed: ${data.error || 'Unknown error'}` });
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: `Network error triggering sync: ${err.message}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const classesList = ['1CL', '2CL', '3CL', '4CL'];

  // 1. Get current active class data
  const classData = useMemo(() => {
    if (!initialDeficienciesData || !initialDeficienciesData[activeClass]) {
      return { cadets: [], subjects: [], updateDate: 'No data' };
    }
    return initialDeficienciesData[activeClass];
  }, [initialDeficienciesData, activeClass]);

  const cadetsList = classData.cadets;
  const subjectsList = classData.subjects;
  const updateDate = classData.updateDate;

  // 2. Compute current metrics
  const metrics = useMemo(() => {
    const total = cadetsList.length;
    if (total === 0) return { total: 0, deficient: 0, pct: 0, multiSubject: 0, highRisk: 0, topSubject: 'None' };

    const deficientCadets = cadetsList.filter(c => c.isDeficient);
    const deficientCount = deficientCadets.length;
    const pct = Math.round((deficientCount / total) * 100);

    const multiSubject = cadetsList.filter(c => c.deficienciesCount >= 2).length;
    const highRisk = cadetsList.filter(c => Math.abs(c.totalPoints) > 10.0).length;

    // Calculate subject-wise count
    const subjectCounts = {};
    subjectsList.forEach(s => { subjectCounts[s] = 0; });

    cadetsList.forEach(c => {
      if (c.isDeficient) {
        Object.keys(c.deficiencies).forEach(sub => {
          if (subjectCounts[sub] !== undefined) {
            subjectCounts[sub]++;
          }
        });
      }
    });

    let topSubject = 'None';
    let maxCount = 0;
    Object.entries(subjectCounts).forEach(([sub, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSubject = `${sub} (${count})`;
      }
    });

    return {
      total,
      deficient: deficientCount,
      pct,
      multiSubject,
      highRisk,
      topSubject
    };
  }, [cadetsList, subjectsList]);

  // 3. Subject-wise chart data
  const subjectChartData = useMemo(() => {
    const subjectCounts = {};
    subjectsList.forEach(s => { subjectCounts[s] = 0; });

    cadetsList.forEach(c => {
      if (c.isDeficient) {
        Object.keys(c.deficiencies).forEach(sub => {
          if (subjectCounts[sub] !== undefined) {
            subjectCounts[sub]++;
          }
        });
      }
    });

    return Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .filter(item => item.count > 0);
  }, [cadetsList, subjectsList]);

  // 4. Class-level historical trend data
  const trendChartData = useMemo(() => {
    const logs = initialHistoryLogs || [];
    const classLogs = logs.filter(log => log.class === activeClass);

    // Group logs by Date
    const grouped = {};
    classLogs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = new Set();
      }
      grouped[log.date].add(log.name);
    });

    const historicalPoints = Object.entries(grouped).map(([date, nameSet]) => {
      const count = nameSet.size;
      const rate = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
      return {
        date,
        deficientCount: count,
        deficiencyRate: rate
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Append the current data point if it exists and is newer
    if (updateDate && updateDate !== 'Not specified' && updateDate !== 'No data') {
      // Try parsing human date e.g. "1, July 2026" to YYYY-MM-DD
      let formattedCurrentDate = '';
      try {
        const d = new Date(updateDate);
        if (!isNaN(d.getTime())) {
          formattedCurrentDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}

      if (formattedCurrentDate) {
        const exists = historicalPoints.some(pt => pt.date === formattedCurrentDate);
        if (!exists) {
          historicalPoints.push({
            date: formattedCurrentDate,
            deficientCount: metrics.deficient,
            deficiencyRate: metrics.pct
          });
        }
      }
    }

    return historicalPoints;
  }, [initialHistoryLogs, activeClass, metrics, updateDate]);

  // 5. Filtered Cadets list
  const filteredCadets = useMemo(() => {
    return cadetsList.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterMode === 'all' ? true : c.isDeficient;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const pointsA = Math.abs(a.totalPoints);
      const pointsB = Math.abs(b.totalPoints);
      if (pointsA !== pointsB) {
        return pointsB - pointsA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [cadetsList, searchQuery, filterMode]);

  // 6. Expanded Cadet individual trajectory data
  const cadetHistoryData = useMemo(() => {
    if (!expandedCadet) return [];
    const logs = initialHistoryLogs || [];
    const cadetLogs = logs.filter(log => log.class === activeClass && log.name.toLowerCase() === expandedCadet.name.toLowerCase());

    const dates = [...new Set(cadetLogs.map(log => log.date))].sort();
    
    // Convert to points array
    const points = dates.map(dateStr => {
      const dateLogs = cadetLogs.filter(log => log.date === dateStr);
      const pt = { date: dateStr };
      let sum = 0;
      dateLogs.forEach(l => {
        pt[l.subject] = Math.abs(l.value); // Convert negative deficiency to positive magnitude for graphing
        sum += Math.abs(l.value);
      });
      pt.Total = sum;
      return pt;
    });

    // Append current snapshot to trajectory
    if (expandedCadet.isDeficient && updateDate) {
      let formattedCurrentDate = '';
      try {
        const d = new Date(updateDate);
        if (!isNaN(d.getTime())) {
          formattedCurrentDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}

      if (formattedCurrentDate) {
        const exists = points.some(p => p.date === formattedCurrentDate);
        if (!exists) {
          const pt = { date: formattedCurrentDate };
          let sum = 0;
          Object.entries(expandedCadet.deficiencies).forEach(([sub, val]) => {
            pt[sub] = Math.abs(val);
            sum += Math.abs(val);
          });
          pt.Total = sum;
          points.push(pt);
        }
      }
    }

    return points;
  }, [expandedCadet, initialHistoryLogs, activeClass, updateDate]);

  return (
    <div className="academic-tracker-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header Control Panel */}
      <div className="academic-header-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {classesList.map(cls => (
            <button
              key={cls}
              className={`pft-modal-tab-btn ${activeClass === cls ? 'active' : ''}`}
              onClick={() => {
                setActiveClass(cls);
                setExpandedCadet(null);
              }}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '6px' }}
            >
              {cls}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            📅 UPDATE AS OF: <strong style={{ color: 'var(--text-primary)' }}>{updateDate}</strong>
          </span>
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="badge-outline"
            style={{ cursor: isSyncing ? 'not-allowed' : 'pointer', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: isSyncing ? 0.7 : 1 }}
          >
            {isSyncing ? '🔄 SYNCING...' : '🔄 SYNC NOW'}
          </button>

        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 500,
          background: syncMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          color: syncMessage.type === 'error' ? '#ef4444' : syncMessage.type === 'success' ? '#10b981' : '#3b82f6',
          border: `1px solid ${syncMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{syncMessage.type === 'error' ? '❌' : syncMessage.type === 'success' ? '✅' : '🔄'}</span>
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* 2. Metrics Cards Grid */}
      <div className="academic-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* Metric 1 */}
        <div className="pft-insight-card academic-metric-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: '#3b82f6' }}></div>
          <div className="pft-insight-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DEFICIENT CADETS</span>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
          </div>
          <div className="pft-insight-val" style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700 }}>{metrics.deficient}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>/ {metrics.total}</span>
          </div>
          <div className="pft-insight-desc" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: metrics.pct > 30 ? '#ef4444' : 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600 }}>{metrics.pct}%</span>
            <span>of class currently deficient</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="pft-insight-card academic-metric-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: '#f59e0b' }}></div>
          <div className="pft-insight-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>MULTI-SUBJECT DEFICIENT</span>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <div className="pft-insight-val" style={{ margin: '0.5rem 0' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: metrics.multiSubject > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{metrics.multiSubject}</span>
          </div>
          <div className="pft-insight-desc">
            <span>Deficient in 2 or more subjects</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="pft-insight-card academic-metric-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: '#ef4444' }}></div>
          <div className="pft-insight-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>HIGH / CRITICAL RISK</span>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
          </div>
          <div className="pft-insight-val" style={{ margin: '0.5rem 0' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: metrics.highRisk > 0 ? '#ef4444' : 'var(--text-primary)' }}>{metrics.highRisk}</span>
          </div>
          <div className="pft-insight-desc">
            <span>Deficient in 10+ points</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="pft-insight-card academic-metric-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: '#10b981' }}></div>
          <div className="pft-insight-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>MOST DEFICIENT SUBJ</span>
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
          </div>
          <div className="pft-insight-val" style={{ margin: '0.5rem 0' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, wordBreak: 'break-all', display: 'block', minHeight: '2.7rem', display: 'flex', alignItems: 'center' }}>
              {metrics.topSubject}
            </span>
          </div>
          <div className="pft-insight-desc">
            <span>Subject with highest failed counts</span>
          </div>
        </div>

      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="academic-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem' }}>
        
        {/* Trend line graph */}
        <div className="pft-chart-card academic-chart-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h3 className="pft-chart-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📈 Class Deficiency Trend Over Time
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Deficiency Rate"
                    dataKey="deficiencyRate"
                    stroke="#ef4444"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    name="Deficient Count"
                    dataKey="deficientCount"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</span>
                <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
                  No historical trend logged. Add the daily logger script (via SETUP LOGGER) to start tracking.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise count bar chart */}
        <div className="pft-chart-card academic-chart-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h3 className="pft-chart-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📊 Deficiencies Count by Subject
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {subjectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="count" name="Deficient Cadets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</span>
                <p style={{ fontSize: '0.9rem' }}>No academic deficiencies found in this class!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Interactive Cadets Table and search */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Table Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterMode('deficient')}
              className={`pft-modal-tab-btn ${filterMode === 'deficient' ? 'active' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              Deficient Only ({metrics.deficient})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`pft-modal-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              Show All ({metrics.total})
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="🔍 Search cadet by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.2rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--body-bg, #0f172a)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', left: '0.8rem', top: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.9rem', pointerEvents: 'none' }}></span>
          </div>
        </div>

        {/* The List of Cadets */}
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
          {filteredCadets.length > 0 ? (
            <table className="mobile-card-table academic-cadet-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NO</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NAME</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DEFICIENCIES BY SUBJECT</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredCadets.map((cadet) => {
                  const isExpanded = expandedCadet && expandedCadet.name === cadet.name;

                  return (
                    <React.Fragment key={cadet.name}>
                      <tr
                        onClick={() => setExpandedCadet(isExpanded ? null : cadet)}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(218, 165, 32, 0.03)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                        className="hover-row-effect"
                      >
                        <td data-label="NO" style={{ padding: '14px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{cadet.no}</td>
                        <td data-label="NAME" style={{ padding: '14px 16px', fontWeight: 600, color: cadet.isDeficient ? '#f43f5e' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {cadet.name}
                        </td>
                        <td data-label="STATUS" style={{ padding: '14px 16px' }}>
                          {cadet.isDeficient ? (() => {
                            const absPoints = Math.abs(cadet.totalPoints);
                            if (absPoints > 20) {
                              return (
                                <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  💀 CRITICAL
                                </span>
                              );
                            }
                            if (absPoints > 10) {
                              return (
                                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  🚨 HIGH RISK
                                </span>
                              );
                            }
                            if (absPoints > 5) {
                              return (
                                <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  ⚠️ MODERATE
                                </span>
                              );
                            }
                            return (
                              <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                📚 DEFICIENT
                              </span>
                            );
                          })() : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              ✅ PROFICIENT
                            </span>
                          )}
                        </td>
                        <td data-label="DEFICIENCIES" style={{ padding: '14px 16px' }}>
                          {cadet.isDeficient ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {Object.entries(cadet.deficiencies).map(([subj, val]) => (
                                <span
                                  key={subj}
                                  style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>{subj}</span>
                                  <strong style={{ color: val <= -5 ? '#ef4444' : '#f59e0b' }}>({val})</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No deficiency points recorded</span>
                          )}
                        </td>
                        <td data-label="ACTION" style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {isExpanded ? 'CLOSE DETAIL ▲' : 'VIEW DETAILS ▼'}
                        </td>
                      </tr>

                      {/* Expandable historical panel for this cadet */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr className="expanded-detail-row">
                            <td className="expanded-detail-cell" colSpan={5} style={{ padding: 0 }}>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                  overflow: 'hidden',
                                  background: 'rgba(15, 23, 42, 0.2)',
                                  borderBottom: '1px solid var(--border-color)',
                                  padding: '1.5rem'
                                }}
                              >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                  
                                  {/* Info summary */}
                                  <div>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: 600 }}>
                                      👤 {cadet.name}'s Academic Summary
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      <div>Class Status: <strong>{activeClass} Cadet</strong></div>
                                      <div>Total Deficiencies Count: <strong style={{ color: cadet.isDeficient ? '#f59e0b' : 'var(--text-primary)' }}>{cadet.deficienciesCount}</strong></div>
                                      <div>Total Deficit Points: <strong style={{ color: cadet.isDeficient ? '#ef4444' : 'var(--text-primary)' }}>{cadet.totalPoints.toFixed(2)} pts</strong></div>
                                      {cadet.isDeficient && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                                          <strong>⚠️ Remediation Advice:</strong> Cadet requires focused tutoring in {Object.keys(cadet.deficiencies).join(', ')}. Target grade improvements of {Math.abs(cadet.totalPoints).toFixed(2)} overall points to restore proficiency.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Trajectory chart */}
                                  <div className="academic-cadet-trajectory-container" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                      📈 Deficiency Trajectory (Points Magnitude)
                                    </h5>
                                    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                                      {cadetHistoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={cadetHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={9} />
                                            <YAxis stroke="var(--text-secondary)" fontSize={9} label={{ value: 'Points', angle: -90, position: 'insideLeft', offset: -5 }} />
                                            <Tooltip
                                              contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                            {/* Line for each unique subject key logged in history */}
                                            {Object.keys(cadetHistoryData[0] || {})
                                              .filter(k => k !== 'date' && k !== 'Total')
                                              .map((subj, idx) => {
                                                const colors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4'];
                                                const col = colors[idx % colors.length];
                                                return (
                                                  <Line
                                                    key={subj}
                                                    type="monotone"
                                                    dataKey={subj}
                                                    name={subj}
                                                    stroke={col}
                                                    strokeWidth={1.5}
                                                  />
                                                );
                                              })}
                                            {/* Bold Total Line */}
                                            <Line
                                              type="monotone"
                                              dataKey="Total"
                                              name="Total Deficit"
                                              stroke="#ef4444"
                                              strokeWidth={2.5}
                                              strokeDasharray="4 4"
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      ) : (
                                        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                                          No historical points logged for this cadet.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔍</span>
              <p>No cadets found matching search criteria or filters.</p>
            </div>
          )}
        </div>

      </div>



    </div>
  );
}


