'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function CampTrackerClient() {
  const [cadets, setCadets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClass, setActiveClass] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ELIGIBLE', 'INELIGIBLE', 'DEFICIENT', 'FAILED_PFT', 'SMC_PFT', 'TOURING_CONFINED'

  // Selected Cadet for Modal
  const [selectedCadet, setSelectedCadet] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/camp-data');
        if (!res.ok) {
          throw new Error('Failed to fetch CAMP data');
        }
        const result = await res.json();
        setCadets(result.cadets || []);
        setSummary(result.summary || null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtered Cadets list
  const filteredCadets = useMemo(() => {
    return cadets.filter(c => {
      const matchesSearch = c.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = activeClass === 'ALL' ? true : c.class === activeClass;
      
      let matchesStatus = true;
      if (statusFilter === 'ELIGIBLE') {
        matchesStatus = c.eligibleForPrivilege;
      } else if (statusFilter === 'INELIGIBLE') {
        matchesStatus = !c.eligibleForPrivilege;
      } else if (statusFilter === 'DEFICIENT') {
        matchesStatus = c.academics.remarks === 'DEFICIENT';
      } else if (statusFilter === 'FAILED_PFT') {
        matchesStatus = c.physical.remarks === 'FAILED';
      } else if (statusFilter === 'SMC_PFT') {
        matchesStatus = c.physical.remarks === 'SMC';
      } else if (statusFilter === 'TOURING_CONFINED') {
        matchesStatus = c.character.active;
      }

      return matchesSearch && matchesClass && matchesStatus;
    }).sort((a, b) => a.surname.localeCompare(b.surname));
  }, [cadets, searchQuery, activeClass, statusFilter]);

  // Chart 1: Academic Deficiency by Subject
  const subjectChartData = useMemo(() => {
    const counts = {};
    cadets.forEach(c => {
      if (c.academics.remarks === 'DEFICIENT' && c.academics.subjects) {
        c.academics.subjects.forEach(sub => {
          // Extract subject code from strings like "RES431 (-4.50)"
          const subCode = sub.split(' ')[0].split('(')[0].trim();
          counts[subCode] = (counts[subCode] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);
  }, [cadets]);

  // Chart 2: PFT Status distribution
  const pftChartData = useMemo(() => {
    const passed = cadets.filter(c => c.physical.remarks === 'PASSED').length;
    const failed = cadets.filter(c => c.physical.remarks === 'FAILED').length;
    const smc = cadets.filter(c => c.physical.remarks === 'SMC').length;
    const other = cadets.filter(c => ['FAD/GUARD/SIQ', 'FAD'].includes(c.physical.remarks)).length;

    return [
      { name: 'Passed PFT', value: passed, color: '#10b981' },
      { name: 'Failed PFT', value: failed, color: '#ef4444' },
      { name: 'SMC Status', value: smc, color: '#f59e0b' },
      { name: 'FAD/Guard/SIQ', value: other, color: '#6366f1' }
    ].filter(item => item.value > 0);
  }, [cadets]);

  // Chart 3: Active Punishments by Class
  const classPunishmentsData = useMemo(() => {
    const classes = ['1CL', '2CL', '3CL', '4CL'];
    return classes.map(cl => {
      const count = cadets.filter(c => c.class === cl && c.character.active).length;
      return { class: cl, count };
    });
  }, [cadets]);

  // S5 Insights / Suggestions
  const insights = useMemo(() => {
    if (cadets.length === 0) return [];
    const list = [];
    
    // Check Top Academic Subject
    if (subjectChartData.length > 0) {
      const topSub = subjectChartData[0];
      list.push({
        type: 'academics',
        title: `Academic tutorial needed for ${topSub.subject}`,
        text: `There are currently ${topSub.count} cadets marked deficient in ${topSub.subject}. Consider coordinating peer study sessions with the S8 Academic Council.`,
        priority: topSub.count > 5 ? 'high' : 'medium'
      });
    }

    // Check PFT Failures
    const pftFails = cadets.filter(c => c.physical.remarks === 'FAILED').length;
    if (pftFails > 0) {
      list.push({
        type: 'physical',
        title: `Schedule remedial PFT sessions`,
        text: `There are ${pftFails} cadets who failed their PFT. Arrange special physical training drills under the Athletic Council to help them pass.`,
        priority: pftFails > 8 ? 'high' : 'medium'
      });
    }

    // Check SMC
    const smcCount = cadets.filter(c => c.physical.remarks === 'SMC').length;
    if (smcCount > 0) {
      list.push({
        type: 'physical',
        title: `Strongman's Club (SMC) Monitoring`,
        text: `${smcCount} cadets did not reach the 8.5 PFT average requirement and are in the Strongman's Club (SMC). They are ineligible for privileges until they reach 8.5 average in the next PFT.`,
        priority: 'medium'
      });
    }

    // Check Active Punishments
    const touringCount = cadets.filter(c => c.character.active && c.character.touring).length;
    if (touringCount > 0) {
      list.push({
        type: 'character',
        title: `Conduct supervision for touring cadets`,
        text: `There are ${touringCount} cadets currently serving touring hours. Coordinate with the CCPB and First Sergeant for active monitoring.`,
        priority: touringCount > 10 ? 'high' : 'medium'
      });
    }

    return list;
  }, [cadets, subjectChartData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Aggregating CAMP performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="info-card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
        <h3 style={{ color: '#ef4444' }}>Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Overview Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <motion.div 
          className="metric-card card-gradient-purple"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
          <div className="metric-value">{summary?.academicsDeficientCount || 0}</div>
          <div className="metric-label">Academically Deficient Cadets</div>
          <div className="metric-desc">Marked deficient in 1 or more subjects</div>
        </motion.div>

        <motion.div 
          className="metric-card card-gradient-gold"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💪</div>
          <div className="metric-value">{(summary?.pftFailedCount || 0) + (summary?.pftSMCCount || 0)}</div>
          <div className="metric-label">PFT Failed / SMC Status</div>
          <div className="metric-desc">{summary?.pftFailedCount || 0} Failed | {summary?.pftSMCCount || 0} Strongman's Club (SMC)</div>
        </motion.div>

        <motion.div 
          className="metric-card card-gradient-blue"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚶</div>
          <div className="metric-value">{summary?.touringOrConfinedCount || 0}</div>
          <div className="metric-label">Touring / Confined Cadets</div>
          <div className="metric-desc">Currently serving active demerits / punishments</div>
        </motion.div>
      </div>

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Academic Deficiencies Chart */}
        <div className="info-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>📊</span> Subject Deficiencies Count
          </h3>
          {subjectChartData.length > 0 ? (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="count" fill="var(--accent-gold-light)" radius={[4, 4, 0, 0]}>
                    {subjectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--accent-gold)' : 'var(--border-color)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)' }}>
              No active academic deficiencies recorded.
            </div>
          )}
        </div>

        {/* PFT Status Pie Chart */}
        <div className="info-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>🎯</span> Physical Fitness Test (PFT) Status
          </h3>
          {pftChartData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: '240px' }}>
              <div style={{ width: '55%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pftChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pftChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pftChartData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.color, marginRight: '8px', display: 'inline-block' }}></span>
                    <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>{entry.name}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)' }}>
              No PFT results found.
            </div>
          )}
        </div>

        {/* Punishment Load by Class */}
        <div className="info-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>👮</span> Active Punishments (Touring/Confined) by Class
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPunishmentsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="class" type="category" stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20}>
                  {classPunishmentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#4f46e5', '#3730a3', '#1e1b4b'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* cadet performance details section */}
      <div className="info-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Company CAMP Performance Roster</h2>
          
          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search cadet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Class Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Class:</span>
            {['ALL', '1CL', '2CL', '3CL', '4CL'].map((cl) => (
              <button
                key={cl}
                onClick={() => setActiveClass(cl)}
                className={`tag ${activeClass === cl ? 'active' : ''}`}
                style={{
                  background: activeClass === cl ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                  color: activeClass === cl ? 'black' : 'var(--text-primary)',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '16px',
                  fontWeight: activeClass === cl ? 'bold' : 'normal'
                }}
              >
                {cl}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>CAMP Filter:</span>
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'DEFICIENT', label: 'Academic Deficiencies' },
              { id: 'FAILED_PFT', label: 'Failed PFT' },
              { id: 'SMC_PFT', label: "Strongman's Club (SMC)" },
              { id: 'TOURING_CONFINED', label: 'Active Punishment' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`tag ${statusFilter === f.id ? 'active' : ''}`}
                style={{
                  background: statusFilter === f.id ? 'var(--accent-gold-light)' : 'rgba(255,255,255,0.05)',
                  color: statusFilter === f.id ? 'var(--accent-gold)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.8rem'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cadet Table */}
        <div className="table-container">
          <table className="mobile-card-table">
            <thead>
              <tr>
                <th>Cadet Name</th>
                <th>Class</th>
                <th style={{ textAlign: 'center' }}>C</th>
                <th style={{ textAlign: 'center' }}>A</th>
                <th style={{ textAlign: 'center' }}>M</th>
                <th style={{ textAlign: 'center' }}>P</th>
              </tr>
            </thead>
            <tbody>
              {filteredCadets.length > 0 ? (
                filteredCadets.map((c, i) => (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedCadet(c)} 
                    style={{ cursor: 'pointer' }}
                    className="hover-row-clickable"
                  >
                    <td data-label="Cadet Name">
                      <strong>{c.surname}</strong>
                      {c.firstName && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>{c.firstName}</span>}
                    </td>
                    <td data-label="Class">{c.class}</td>
                    
                    {/* C (Character) */}
                    <td data-label="Character" style={{ textAlign: 'center' }}>
                      {c.character.active ? (
                        <span className="tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          {c.character.status}
                        </span>
                      ) : (
                        <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          N/A
                        </span>
                      )}
                    </td>

                    {/* A (Academics) */}
                    <td data-label="Academics" style={{ textAlign: 'center' }}>
                      {c.academics.remarks === 'DEFICIENT' ? (
                        <span className="tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                          DEFICIENT
                        </span>
                      ) : (
                        <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          PROFICIENT
                        </span>
                      )}
                    </td>

                    {/* M (Military) */}
                    <td data-label="Military" style={{ textAlign: 'center' }}>
                      <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        PROFICIENT
                      </span>
                    </td>

                    {/* P (Physical) */}
                    <td data-label="Physical" style={{ textAlign: 'center' }}>
                      {c.physical.remarks === 'FAILED' ? (
                        <span className="tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          FAILED
                        </span>
                      ) : c.physical.remarks === 'SMC' ? (
                        <span className="tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                          SMC
                        </span>
                      ) : (
                        <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          {c.physical.remarks}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No cadets matched the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* S5 Suggestions & Insights */}
      <div className="info-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0' }}>📋 S5 Plans & Programs Directives</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {insights.length > 0 ? (
            insights.map((insight, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderLeft: `4px solid ${insight.priority === 'high' ? '#ef4444' : '#f59e0b'}` 
                }}
              >
                <div style={{ fontSize: '1.25rem' }}>
                  {insight.type === 'academics' ? '📖' : insight.type === 'physical' ? '🏃' : '👮'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{insight.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{insight.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Company performance is optimal. No action directives needed.</p>
          )}
        </div>
      </div>

      {/* Cadet Detail Modal */}
      <AnimatePresence>
        {selectedCadet && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0' }}>CDT {selectedCadet.class} {selectedCadet.fullName}</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Serial Number: {selectedCadet.serialNumber || 'N/A'} | Gender: {selectedCadet.gender}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCadet(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Privilege Signify Eligibility Notice */}
              <div 
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: selectedCadet.eligibleForPrivilege ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${selectedCadet.eligibleForPrivilege ? '#10b981' : '#ef4444'}`,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ fontSize: '2rem' }}>{selectedCadet.eligibleForPrivilege ? '✅' : '🚫'}</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: selectedCadet.eligibleForPrivilege ? '#10b981' : '#ef4444' }}>
                    {selectedCadet.eligibleForPrivilege ? 'Allowed to Signify for Privilege' : 'Signifying Privilege Blocked'}
                  </h4>
                  {!selectedCadet.eligibleForPrivilege && selectedCadet.eligibilityChecks.reasons.length > 0 && (
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedCadet.eligibilityChecks.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                  {selectedCadet.eligibleForPrivilege && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cadet meets all academic, PFT, and character conduct criteria.</p>
                  )}
                </div>
              </div>

              {/* CAMP Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Character */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', color: '#818cf8' }}>
                    <span style={{ marginRight: '8px' }}>🚶</span> Character (Conduct & Reports)
                  </h4>
                  {selectedCadet.character.active ? (
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                        Active Status: <strong style={{ color: '#ef4444' }}>{selectedCadet.character.status}</strong> | Demerits: <strong>{selectedCadet.character.demerits}</strong>
                      </p>
                      {selectedCadet.character.remainingTour > 0 && (
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
                          Touring Remaining: <strong style={{ color: '#f59e0b' }}>{selectedCadet.character.remainingTour} hrs</strong>
                        </p>
                      )}
                      
                      <div style={{ marginTop: '0.5rem' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0' }}>Offenses List:</h5>
                        {selectedCadet.character.offenses.map((o, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                            <p style={{ margin: '0 0 0.25rem 0' }}><strong>Offense:</strong> {o.offense}</p>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}><strong>Nature:</strong> {o.nature} | <strong>Class:</strong> {o.class}</p>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}><strong>Reference:</strong> {o.reference || 'N/A'}</p>
                            {o.remarks && <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}><strong>Remarks:</strong> {o.remarks}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No active character reports or demerits. Cadet is in good standing.</p>
                  )}
                </div>

                {/* Academics */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', color: '#fb7185' }}>
                    <span style={{ marginRight: '8px' }}>📖</span> Academics (Grade Status)
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                    Status: <strong style={{ color: selectedCadet.academics.remarks === 'DEFICIENT' ? '#f59e0b' : '#10b981' }}>{selectedCadet.academics.remarks}</strong>
                  </p>
                  {selectedCadet.academics.remarks === 'DEFICIENT' && selectedCadet.academics.subjects.length > 0 ? (
                    <div>
                      <h5 style={{ margin: '0 0 0.25rem 0' }}>Deficient Subjects:</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {selectedCadet.academics.subjects.map((sub, idx) => (
                          <span key={idx} className="tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.85rem' }}>
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No academic subject deficiencies found.</p>
                  )}
                </div>

                {/* Military */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', color: '#34d399' }}>
                    <span style={{ marginRight: '8px' }}>⚔️</span> Military (Tactics & Training)
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                    Status: <strong style={{ color: '#10b981' }}>PROFICIENT</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No tactical or military deficiencies recorded (none yet).</p>
                </div>

                {/* Physical */}
                <div style={{ paddingBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', color: '#facc15' }}>
                    <span style={{ marginRight: '8px' }}>🏃</span> Physical (PFT Performance)
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                    Status: <strong style={{ color: selectedCadet.physical.remarks === 'FAILED' ? '#ef4444' : selectedCadet.physical.remarks === 'SMC' ? '#f59e0b' : '#10b981' }}>
                      {selectedCadet.physical.remarks === 'SMC' ? "Strongman's Club (SMC)" : selectedCadet.physical.remarks}
                    </strong>
                  </p>
                  {selectedCadet.physical.remarks === 'SMC' && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Note: Cadet did not fail the PFT but did not reach the 8.5 average requirement. Currently under monitoring and ineligible for privileges.
                    </p>
                  )}
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                    Duty Category: <strong>{selectedCadet.physical.status}</strong>
                  </p>
                  {selectedCadet.physical.category && (
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      PFT Category: <strong>{selectedCadet.physical.category}</strong>
                    </p>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
