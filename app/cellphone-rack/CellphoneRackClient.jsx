'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function CellphoneRackClient({ initialData }) {
  const [filterClass, setFilterClass] = useState('All');
  const [activeContact, setActiveContact] = useState({});
  const [activeSocial, setActiveSocial] = useState({});

  const classes = ['1', '2', '3', '4'];
  
  // Filter and group
  const filteredData = initialData.filter(c => filterClass === 'All' || c.cadetClass === filterClass);

  const groupedData = {};
  classes.forEach(c => {
    groupedData[c] = filteredData.filter(cadet => cadet.cadetClass === c).sort((a, b) => a.name.localeCompare(b.name));
  });

  const summary = [
    { name: 'Logged In', value: filteredData.filter(c => c.numPhones > 0 && c.status.toLowerCase() === 'logged in').length, fill: '#10b981' },
    { name: 'Logged Out', value: filteredData.filter(c => c.numPhones > 0 && c.status.toLowerCase() === 'logged out').length, fill: '#374151' },
    { name: 'No Smartphone', value: filteredData.filter(c => !c.numPhones || c.numPhones === 0).length, fill: '#9ca3af' }
  ].filter(item => item.value > 0);

  return (
    <div>
      {/* Filter and Chart Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        </div>

        {summary.length > 0 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem 1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <PieChart width={300} height={120}>
              <Pie
                data={summary}
                cx={80}
                cy={55}
                innerRadius={35}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {summary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: 800 }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
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
              gridTemplateColumns: 'repeat(5, 180px)', 
              gap: '2.5rem',
              justifyContent: 'center'
            }}>
              {classCadets.map((cadet, i) => {
                const hasNoPhone = !cadet.numPhones || cadet.numPhones === 0;

                if (hasNoPhone) {
                  return (
                    <div key={i} style={{
                      width: '180px',
                      height: '360px',
                      borderRadius: '36px',
                      border: '2px dashed var(--border-color)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}>
                      <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{cadet.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>NO SMARTPHONE</div>
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
                    width: '180px',
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
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>{cadet.phone}</div>
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
                      <div style={{ flex: 1, padding: '2rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        
                        <div style={{ 
                          width: '64px', height: '64px', 
                          borderRadius: '50%', background: 'rgba(255,255,255,0.2)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', marginBottom: '1rem',
                          backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                          📱
                        </div>
                        
                        <h4 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem', color: '#fff', letterSpacing: '1px' }}>{cadet.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, marginBottom: '1.5rem' }}>{cadet.status.toUpperCase()}</div>

                        {/* App Icon grid styling for info */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: 'auto', width: '100%', justifyContent: 'center' }}>
                          {cadet.phone && cadet.phone !== 'null' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div 
                                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', backdropFilter: 'blur(5px)', cursor: 'pointer' }} 
                                title="Click to view contact"
                                onClick={() => setActiveContact(prev => ({ ...prev, [cadet.name]: true }))}
                              >📞</div>
                              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Phone</span>
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

                        {/* Swipe Indicator */}
                        <div style={{ width: '35%', height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px', marginTop: '1.5rem' }} />

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Global Styles for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
