'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

export default function TabletDirectoryClient({ initialData }) {
  const { adminUser } = useAuth();
  const router = useRouter();
  // Make the check robust against case and spaces
  const userCouncil = String(adminUser?.council || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCEIS = userCouncil === 'S6' || userCouncil.includes('CEIS');
  const [filterClass, setFilterClass] = useState('All');
  const [activeContact, setActiveContact] = useState({});
  const [activeSocial, setActiveSocial] = useState({});
  const [expandedTablet, setExpandedTablet] = useState(null);
  
  const [pendingChanges, setPendingChanges] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const classes = ['1', '2', '3', '4'];
  
  const handleFieldChange = (cadetName, field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [cadetName]: {
        ...(prev[cadetName] || {}),
        [field]: value
      }
    }));
  };

  const uploadChanges = async () => {
    setIsUploading(true);
    try {
      const changesArray = Object.entries(pendingChanges).map(([name, changes]) => {
        const cadet = initialData.find(c => c.name === name);
        return { ...cadet, ...changes };
      });
      
      const res = await fetch('/api/tablet-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changesArray)
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        setPendingChanges({});
        setIsLaunching(true);
        setTimeout(() => {
          setIsLaunching(false);
          setIsUploading(false);
          setShowSuccessToast(true);
          router.refresh();
          setTimeout(() => setShowSuccessToast(false), 3000);
        }, 800);
      } else {
        alert(`Failed to upload changes: ${result.error || result.details || 'Unknown error'}`);
        setIsUploading(false);
      }
    } catch (e) {
      alert('Error uploading changes');
      setIsUploading(false);
    }
  };

  // Merge pending changes with initialData
  const activeData = initialData.map(cadet => {
    if (pendingChanges[cadet.name]) {
      return { ...cadet, ...pendingChanges[cadet.name] };
    }
    return cadet;
  });

  // Filter and group
  const filteredData = activeData.filter(c => filterClass === 'All' || c.cadetClass === filterClass);

  const groupedData = {};
  classes.forEach(c => {
    groupedData[c] = filteredData.filter(cadet => cadet.cadetClass === c).sort((a, b) => a.name.localeCompare(b.name));
  });

  const summary = [
    { name: 'Logged In', value: filteredData.filter(c => c.numTablets > 0 && c.status.toLowerCase() === 'logged in').length, fill: '#10b981' },
    { name: 'Logged Out', value: filteredData.filter(c => c.numTablets > 0 && c.status.toLowerCase() === 'logged out').length, fill: '#374151' },
    { name: 'Confiscated', value: filteredData.filter(c => c.status.toLowerCase() === 'confiscated').length, fill: '#ef4444' },
    { name: 'No Tablet', value: filteredData.filter(c => !c.numTablets || c.numTablets === 0 || String(c.status).toUpperCase() === 'NO Tablet').length, fill: '#9ca3af' }
  ].filter(item => item.value > 0);

  return (
    <div>
      {/* Temporary Debug Info for CEIS Check */}
      <div style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '10px', zIndex: 10000, borderRadius: '8px', border: '1px solid red', fontSize: '12px' }}>
        DEBUG: 
        <br/> adminUser: {adminUser ? 'Present' : 'Null'}
        <br/> username: {adminUser?.username || 'N/A'}
        <br/> council: {adminUser?.council || 'N/A'}
        <br/> userCouncil (parsed): {userCouncil || 'N/A'}
        <br/> isCEIS: {isCEIS ? 'TRUE' : 'FALSE'}
      </div>
      {/* Filter and Chart Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>FILTER BY CLASS:</span>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '4px', 
              background: 'var(--card-bg)', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <option value="All">ALL CLASSES</option>
            <option value="1">1ST CLASS</option>
            <option value="2">2ND CLASS</option>
            <option value="3">3RD CLASS</option>
            <option value="4">4TH CLASS</option>
          </select>

          <a 
            href="https://docs.google.com/spreadsheets/d/1LbsJwJ7nMyh9SOb-SX0MOHwmLq85UVz4BaPxtHPesqA/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: isCEIS ? 'flex' : 'none', alignItems: 'center', gap: '8px',
              padding: '0.5rem 1rem', borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
              textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem',
              transition: 'all 0.2s ease', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
            </svg>
            OPEN DIRECTORY SHEET
          </a>
        </div>

        {summary.length > 0 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
            <PieChart width={340} height={140}>
              <text x={90} y={65} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1.5rem', fontWeight: 800, fill: 'var(--text-primary)' }}>
                {filteredData.length}
              </text>
              <text x={90} y={85} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '0.65rem', fontWeight: 800, fill: 'var(--text-secondary)', letterSpacing: '1px' }}>
                TOTAL
              </text>
              <Pie
                data={summary}
                cx={90}
                cy={70}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={6}
                cornerRadius={8}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {summary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))', outline: 'none' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: '10px 15px' }}
                itemStyle={{ fontWeight: 800, fontSize: '0.9rem' }}
                cursor={{ fill: 'transparent' }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)' }} iconType="circle" />
            </PieChart>
          </div>
        )}
      </div>

      {/* Render Groups */}
      {classes.map(c => {
        const classCadets = groupedData[c];
        if (!classCadets || classCadets.length === 0) return null;

        return (
          <div key={c} style={{ marginBottom: '4rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '2rem', color: 'var(--accent-gold)' }}>
              {c === '1' ? '1ST CLASS' : c === '2' ? '2ND CLASS' : c === '3' ? '3RD CLASS' : '4TH CLASS'}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 260px)', 
              gap: '2.5rem',
              justifyContent: 'center'
            }}>
              {classCadets.map((cadet, i) => {
                const hasNoTablet = !cadet.numTablets || cadet.numTablets === 0 || cadet.status.toUpperCase() === 'NO TABLET';

                if (hasNoTablet) {
                  return (
                    <div key={i} style={{
                      width: '260px',
                      height: '360px',
                      borderRadius: '36px',
                      border: '2px dashed var(--border-color)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{cadet.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>NO Tablet</div>
                      
                      {/* Swipe Indicator (Home Bar) */}
                      <div 
                        style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }} 
                        onClick={() => setExpandedTablet(cadet)}
                        title="Click to edit"
                        onMouseOver={(e) => { e.target.style.background = '#fbbf24'; e.target.style.boxShadow = '0 0 12px #fbbf24'; e.target.style.transform = 'translateX(-50%) scaleY(1.3)'; }}
                        onMouseOut={(e) => { e.target.style.background = 'var(--border-color)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateX(-50%) scaleY(1)'; }}
                      />
                    </div>
                  );
                }

                const isLoggedOut = cadet.status.toLowerCase() === 'logged out';
                
                // Colors and themes
                const bezelColor = isLoggedOut ? '#1f2937' : '#052e16'; // Dark gray vs Dark green
                const screenGradient = isLoggedOut 
                  ? 'linear-gradient(135deg, #111827 0%, #374151 100%)' // Dark gray gradient
                  : 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'; // Emerald gradient
                const statusIcon = isLoggedOut ? '🔴' : '🟢';

                return (
                  <div key={i} style={{
                    width: '260px',
                    height: '360px',
                    borderRadius: '36px',
                    background: bezelColor,
                    padding: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Hardware Buttons (Simulated) */}
                    <div style={{ position: 'absolute', left: '-3px', top: '100px', width: '3px', height: '25px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', left: '-3px', top: '140px', width: '3px', height: '40px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', left: '-3px', top: '190px', width: '3px', height: '40px', background: bezelColor, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', right: '-3px', top: '140px', width: '3px', height: '60px', background: bezelColor, borderRadius: '0 3px 3px 0' }} />

                    {/* The Screen */}
                    <div style={{
                      flex: 1,
                      background: screenGradient,
                      borderRadius: '28px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      
                      {/* Dynamic Island (Notch) */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60px',
                        height: '18px',
                        background: '#000',
                        borderRadius: '10px',
                        zIndex: 10
                      }} />

                      {/* Contact Notification Popup */}
                      {activeContact[cadet.name] && (
                        <div style={{
                          position: 'absolute',
                          top: '32px',
                          left: '8px',
                          right: '8px',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: '12px',
                          padding: '8px',
                          zIndex: 20,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          animation: 'slide-down 0.3s ease-out'
                        }}>
                          <div style={{ fontSize: '1rem' }}>📞</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Contact Number</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>{cadet.Tablet}</div>
                          </div>
                          <div 
                            style={{ fontSize: '0.7rem', cursor: 'pointer', padding: '4px', color: '#666', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setActiveContact(prev => ({ ...prev, [cadet.name]: false }))}
                          >✕</div>
                        </div>
                      )}

                      {/* Social Notification Popup */}
                      {activeSocial[cadet.name] && (
                        <div style={{
                          position: 'absolute',
                          top: '32px',
                          left: '8px',
                          right: '8px',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: '12px',
                          padding: '8px',
                          zIndex: 20,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          animation: 'slide-down 0.3s ease-out'
                        }}>
                          <div style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.477 2 2 6.03 2 11c0 2.82 1.45 5.34 3.75 6.94L4.5 22l4.2-2.1c1.05.32 2.16.5 3.3.5 5.523 0 10-4.03 10-9s-4.477-9-10-9z" fill="#3a76f0"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Signal Account</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>{cadet.ig}</div>
                          </div>
                          <div 
                            style={{ fontSize: '0.7rem', cursor: 'pointer', padding: '4px', color: '#666', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setActiveSocial(prev => ({ ...prev, [cadet.name]: false }))}
                          >✕</div>
                        </div>
                      )}

                      {/* Top Status Bar (Time/Battery) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px 0', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                        <span>9:41</span>
                        <span>{statusIcon}</span>
                      </div>

                      {/* Main Content Area */}
                      <div style={{ flex: 1, padding: '2rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflowY: 'auto' }} className="hide-scrollbar">
                        
                        <div style={{ 
                          width: '64px', height: '64px', minHeight: '64px', minWidth: '64px', flexShrink: 0,
                          borderRadius: '50%', background: 'rgba(255,255,255,0.2)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', marginBottom: '1rem',
                          backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)',
                          overflow: 'hidden'
                        }}>
                          {cadet.picture ? (
                            <img src={cadet.picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '📱'
                          )}
                        </div>
                        
                        <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem', color: '#fff', letterSpacing: '1px' }}>{cadet.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, marginBottom: '1.5rem' }}>{cadet.status.toUpperCase()}</div>

                        {/* App Icon grid styling for info */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: 'auto', width: '100%', justifyContent: 'center' }}>
                          {cadet.Tablet && cadet.Tablet !== 'null' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div 
                                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', backdropFilter: 'blur(5px)', cursor: 'pointer' }} 
                                title="Click to view contact"
                                onClick={() => setActiveContact(prev => ({ ...prev, [cadet.name]: true }))}
                              >📞</div>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Tablet</span>
                            </div>
                          )}
                          {cadet.ig && cadet.ig !== 'null' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div 
                                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer' }} 
                                title="Click to view Signal"
                                onClick={() => setActiveSocial(prev => ({ ...prev, [cadet.name]: true }))}
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 2C6.477 2 2 6.03 2 11c0 2.82 1.45 5.34 3.75 6.94L4.5 22l4.2-2.1c1.05.32 2.16.5 3.3.5 5.523 0 10-4.03 10-9s-4.477-9-10-9z" fill="#3a76f0"/>
                                </svg>
                              </div>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Signal</span>
                            </div>
                          )}
                        </div>

                        {/* Remarks Widget */}
                        {isLoggedOut && cadet.remarks && cadet.remarks !== 'null' && (
                          <div style={{ 
                            background: 'rgba(0,0,0,0.4)', 
                            borderRadius: '12px', 
                            padding: '0.75rem', 
                            width: '100%',
                            marginTop: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)'
                          }}>
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem', textAlign: 'left' }}>Authorized Reason</div>
                            <div style={{ fontSize: '0.75rem', color: '#fff', textAlign: 'left', lineHeight: 1.3 }}>{cadet.remarks}</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Swipe Indicator (Home Bar) */}
                      <div 
                        style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '5px', background: 'rgba(255,255,255,0.6)', borderRadius: '3px', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }} 
                        onClick={() => setExpandedTablet(cadet)}
                        title="Click to expand"
                        onMouseOver={(e) => { e.target.style.background = '#fbbf24'; e.target.style.boxShadow = '0 0 12px #fbbf24'; e.target.style.transform = 'translateX(-50%) scaleY(1.3)'; }}
                        onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.6)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateX(-50%) scaleY(1)'; }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Expanded Tablet Modal */}
      {expandedTablet && (() => {
        const currentExpandedTablet = activeData.find(c => c.name === expandedTablet.name) || expandedTablet;
        const isOut = currentExpandedTablet.status.toLowerCase() === 'logged out' || currentExpandedTablet.status.toLowerCase() === 'confiscated';
        return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fade-in 0.3s ease-out'
        }} onClick={() => setExpandedTablet(null)}>
          <div style={{
            width: '320px', height: '580px', borderRadius: '48px', background: isOut ? '#1f2937' : '#052e16',
            padding: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative', display: 'flex', flexDirection: 'column',
            animation: 'scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 1, background: isOut ? 'linear-gradient(135deg, #111827 0%, #374151 100%)' : 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', borderRadius: '36px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              {/* Hardware Buttons (Simulated) */}
              <div style={{ position: 'absolute', left: '-12px', top: '150px', width: '12px', height: '35px', background: isOut ? '#1f2937' : '#052e16', borderRadius: '3px 0 0 3px' }} />
              <div style={{ position: 'absolute', left: '-12px', top: '210px', width: '12px', height: '60px', background: isOut ? '#1f2937' : '#052e16', borderRadius: '3px 0 0 3px' }} />
              <div style={{ position: 'absolute', left: '-12px', top: '280px', width: '12px', height: '60px', background: isOut ? '#1f2937' : '#052e16', borderRadius: '3px 0 0 3px' }} />
              <div style={{ position: 'absolute', right: '-12px', top: '210px', width: '12px', height: '90px', background: isOut ? '#1f2937' : '#052e16', borderRadius: '0 3px 3px 0' }} />

              {/* Notch */}
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '26px', background: '#000', borderRadius: '14px', zIndex: 10 }} />
              
              {/* Top Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px 0', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                <span>9:41</span>
                {(() => {
                  const hasEdits = pendingChanges && Object.keys(pendingChanges[currentExpandedTablet.name] || {}).length > 0;
                  return (
                    <span 
                      onClick={() => setExpandedTablet(null)}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%',
                        background: hasEdits ? '#10b981' : 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: hasEdits ? '0.9rem' : '0.8rem',
                        transition: 'all 0.2s ease',
                        boxShadow: hasEdits ? '0 0 12px rgba(16, 185, 129, 0.8)' : 'none'
                      }}
                      title={hasEdits ? 'Done editing (Go back)' : 'Close'}
                    >
                      {hasEdits ? '✔' : '✖'}
                    </span>
                  );
                })()}
              </div>
              
              <div style={{ flex: 1, padding: '1rem 1.5rem 1.5rem', overflowY: 'auto' }} className="hide-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '80px', height: '80px', minHeight: '80px', minWidth: '80px', flexShrink: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '0.5rem', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(5px)' }}>
                    {currentExpandedTablet.picture ? <img src={currentExpandedTablet.picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📱'}
                  </div>
                  <h2 style={{ color: '#fff', margin: '0 0 0.25rem', fontSize: '1.5rem', letterSpacing: '1px' }}>{currentExpandedTablet.name}</h2>
                  {isCEIS ? (
                    <select 
                      value={String(currentExpandedTablet.status || '').toUpperCase()} 
                      onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'status', e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '0.2rem 0.5rem', outline: 'none', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                      <option value="LOGGED IN" style={{ color: '#000' }}>LOGGED IN</option>
                      <option value="LOGGED OUT" style={{ color: '#000' }}>LOGGED OUT</option>
                      <option value="CONFISCATED" style={{ color: '#000' }}>CONFISCATED</option>
                      <option value="NO Tablet" style={{ color: '#000' }}>NO Tablet</option>
                    </select>
                  ) : (
                    <span style={{ padding: '0.25rem 1rem', background: isOut ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: isOut ? '#fca5a5' : '#6ee7b7', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800 }}>{currentExpandedTablet.status.toUpperCase()}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Personal Info</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Class</span>
                      <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.cadetClass}CL</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Tablet No.</span>
                      {isCEIS ? (
                        <input type="text" value={currentExpandedTablet.Tablet !== 'null' ? currentExpandedTablet.Tablet : ''} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'Tablet', e.target.value)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '100px', fontWeight: 800, fontSize: '0.85rem' }} placeholder="N/A" />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.Tablet && currentExpandedTablet.Tablet !== 'null' ? currentExpandedTablet.Tablet : 'N/A'}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Signal/IG</span>
                      {isCEIS ? (
                        <input type="text" value={currentExpandedTablet.ig !== 'null' ? currentExpandedTablet.ig : ''} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'ig', e.target.value)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '120px', fontWeight: 800, fontSize: '0.85rem' }} placeholder="N/A" />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.ig && currentExpandedTablet.ig !== 'null' ? currentExpandedTablet.ig : 'N/A'}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Device Info</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Devices Logged</span>
                      {isCEIS ? (
                        <input type="number" value={currentExpandedTablet.numTablets || 0} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'numTablets', parseInt(e.target.value) || 0)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '50px', fontWeight: 800, fontSize: '0.85rem' }} />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.numTablets}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Model</span>
                      {isCEIS ? (
                        <input type="text" value={currentExpandedTablet.model !== 'Not Specified' && currentExpandedTablet.model !== 'null' ? currentExpandedTablet.model : ''} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'model', e.target.value)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '120px', fontWeight: 800, fontSize: '0.85rem' }} placeholder="Not Specified" />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.model && currentExpandedTablet.model !== 'Not Specified' && currentExpandedTablet.model !== 'null' ? currentExpandedTablet.model : <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Not Specified</span>}</span>
                      )}
                    </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Color</span>
                        {isCEIS ? (
                          <input type="text" value={currentExpandedTablet.color !== 'Not Specified' && currentExpandedTablet.color !== 'null' ? currentExpandedTablet.color : ''} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'color', e.target.value)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '100px', fontWeight: 800, fontSize: '0.85rem' }} placeholder="Not Specified" />
                        ) : (
                          <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.color && currentExpandedTablet.color !== 'Not Specified' && currentExpandedTablet.color !== 'null' ? currentExpandedTablet.color : <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Not Specified</span>}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Features/Case</span>
                        {isCEIS ? (
                          <input type="text" value={currentExpandedTablet.dbRemarks !== 'None' && currentExpandedTablet.dbRemarks !== 'null' ? currentExpandedTablet.dbRemarks : ''} onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'dbRemarks', e.target.value)} style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)', outline: 'none', textAlign: 'right', width: '120px', fontWeight: 800, fontSize: '0.85rem' }} placeholder="None" />
                        ) : (
                          <span style={{ color: '#fff', fontWeight: 800 }}>{currentExpandedTablet.dbRemarks && currentExpandedTablet.dbRemarks !== 'None' && currentExpandedTablet.dbRemarks !== 'null' ? currentExpandedTablet.dbRemarks : <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>None</span>}</span>
                        )}
                      </div>
                    </div>

                  {(isOut || isCEIS) && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <div style={{ color: '#fca5a5', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Authorized Reason</div>
                      {isCEIS ? (
                        <textarea 
                          value={currentExpandedTablet.remarks !== 'null' ? currentExpandedTablet.remarks : ''} 
                          onChange={(e) => handleFieldChange(currentExpandedTablet.name, 'remarks', e.target.value)}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem', outline: 'none', minHeight: '60px', fontSize: '0.85rem', resize: 'vertical' }}
                          placeholder="Enter reason..."
                        />
                      ) : (
                        <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.4 }}>{currentExpandedTablet.remarks && currentExpandedTablet.remarks !== 'null' ? currentExpandedTablet.remarks : 'None provided'}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Swipe down indicator */}
              <div 
                style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '3px', cursor: 'pointer' }} 
                onClick={() => setExpandedTablet(null)}
              />
            </div>
          </div>
        </div>
        );
      })()}

      {/* Success Notification */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          animation: 'slide-down 0.3s ease-out forwards'
        }}>
          <span>✅</span> CHANGES APPLIED SUCCESSFULLY
        </div>
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff'
        }}>
          <div style={{ position: 'relative', marginBottom: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              fontSize: '8rem',
              animation: isLaunching ? 'rocketBlastOff 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'rocketShake 0.1s infinite',
              filter: isLaunching ? 'drop-shadow(0 50px 40px rgba(239, 68, 68, 0.9))' : 'drop-shadow(0 30px 25px rgba(239, 68, 68, 0.6))',
              position: 'relative',
              zIndex: 2,
              display: 'inline-block'
            }}>
              <div style={{ transform: 'rotate(-45deg)' }}>🚀</div>
            </div>
            {/* Fake smoke particles disappear when launching */}
            {!isLaunching && (
              <>
                <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px', background: '#cbd5e1', borderRadius: '50%', animation: 'smokeParticles 0.8s infinite ease-out', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-10px', left: '30%', transform: 'translateX(-50%)', width: '15px', height: '15px', background: '#94a3b8', borderRadius: '50%', animation: 'smokeParticles 0.9s infinite ease-out 0.2s', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-15px', left: '70%', transform: 'translateX(-50%)', width: '25px', height: '25px', background: '#e2e8f0', borderRadius: '50%', animation: 'smokeParticles 1s infinite ease-out 0.4s', zIndex: 1 }}></div>
              </>
            )}
          </div>
          <h2 style={{ margin: 0, fontWeight: 900, letterSpacing: '0.15em', fontSize: '2rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>UPLOADING...</h2>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '1rem', marginBottom: '0.2rem', fontSize: '1.1rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>Transmitting your directives to the mainframe, sir.</p>
          <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0, fontSize: '0.9rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>Please stand by while I establish a secure uplink...</p>
        </div>
      )}

      {/* Upload Changes Button */}
      {Object.keys(pendingChanges).length > 0 && !isUploading && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '100px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          zIndex: 9000, backdropFilter: 'blur(10px)', animation: 'slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{Object.keys(pendingChanges).length} Unsaved Edit{Object.keys(pendingChanges).length > 1 ? 's' : ''}</span>
          </div>
          <button 
            onClick={uploadChanges}
            disabled={isUploading}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '100px',
              padding: '8px 24px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '12px',
            }}
          >
            UPLOAD CHANGES
          </button>
        </div>
      )}

      {/* Global Styles for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-down {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translate(-50%, 50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes rocketShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, 2px) rotate(-2deg); }
          50% { transform: translate(2px, -2px) rotate(2deg); }
          75% { transform: translate(-2px, -2px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes smokeParticles {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(100px) scale(3); opacity: 0; }
        }
        @keyframes rocketBlastOff {
          0% { transform: translateY(0) scale(1); }
          15% { transform: translateY(20px) scale(0.9); }
          100% { transform: translateY(-1500px) scale(0.5); opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
