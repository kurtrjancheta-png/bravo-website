"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { driveUrlToImage } from '../../lib/googleSheets';

const BLACKLIST = ['INTERIOR', 'SENTINEL', 'NON POSTING', 'NON-POSTING', 'FI', 'CCQ', 'ACCQ', 'MHC', 'AFI'];

function parseDateHeader(header) {
  if (!header) return null;
  const parts = header.split(' | ');
  try {
    const d = new Date(parts[0]);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (e) {
    return null;
  }
}

const getField = (row, fieldName) => {
  const key = Object.keys(row).find(k => k.toLowerCase().includes(fieldName.toLowerCase()));
  return key && row[key] ? String(row[key]) : 'N/A';
};

const normalize = (str) => {
  if (!str || str === 'N/A') return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, '');
};

const getSoiPicture = (name, soiData) => {
  if (!soiData || soiData.length === 0) return null;
  const target = normalize(name.replace(' AS', '').trim());
  if (!target) return null;
  
  const found = soiData.find(row => {
    const first = normalize(getField(row, 'FIRST NAME'));
    const last = normalize(getField(row, 'SURNAME'));
    
    if (last.length > 2 && target.includes(last)) return true;
    if (last.length > 2 && last.includes(target)) return true;
    if (first.length > 3 && target.includes(first)) return true;
    
    // Custom manual fixes
    if (target === 'auncionmh' && last === 'asuncion') return true;
    if (target === 'penaredondo' && last === 'penaredondo') return true;
    
    return false;
  });
  
  if (found) {
    const pic = getField(found, 'PICTURE');
    if (pic && pic !== 'N/A') return driveUrlToImage(pic);
  }
  return null;
};

function getStatusFromColor1CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  
  if (hex === '#ff0000' || hex === '#ea4335') {
    return { label: 'INTERIOR', color: '#f87171' };
  } else if (hex === '#ffc000' || hex === '#ffa500' || hex === '#fbbc04' || hex === '#ff9900') {
    return { label: 'FLOOR INSPECTOR', color: '#fb923c' };
  } else if (hex === '#00ff00' || hex === '#34a853') {
    return { label: 'SENTINEL', color: '#4ade80' };
  } else if (hex === '#0000ff' || hex === '#4285f4' || hex === '#00b0f0' || hex === '#a4c2f4') {
    return { label: 'NON-POSTING', color: '#60a5fa' };
  }
  
  return { label: 'POSTED', color: '#cbd5e1' };
}

function getStatusFromColor3CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  
  switch (hex) {
    case '#000000': 
    case '#111111': return { label: 'SENTINEL', color: '#1f2937' }; // Black
    case '#ff0000': 
    case '#ea4335': return { label: 'CCQ', color: '#ef4444' }; // Red
    case '#4a86e8': 
    case '#4285f4': 
    case '#2b78e4': return { label: 'ACCQ', color: '#3b82f6' }; // Blue
    case '#00ff00': 
    case '#34a853': return { label: 'MHC', color: '#22c55e' }; // Green
    case '#ff9900': 
    case '#ffa500': 
    case '#ffc000': return { label: 'INTERIOR', color: '#f59e0b' }; // Orange
    case '#00ffff': 
    case '#00b0f0': return { label: 'AFI', color: '#06b6d4' }; // Cyan
    default: return { label: 'POSTED', color: '#cbd5e1' };
  }
}

function getStatusFromColor2CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  
  if (hex === '#ffff00' || hex === '#ffff01') {
    return { label: 'PLEBE DETAIL', color: '#eab308' }; // Yellow
  } else if (hex === '#00ffff' || hex === '#00ffff') {
    return { label: 'SENTINEL (TOC)', color: '#06b6d4' }; // Cyan
  } else if (hex === '#ff00ff' || hex === '#ff00fe') {
    return { label: 'INTERIOR', color: '#d946ef' }; // Magenta
  } else if (hex === '#b45f06' || hex === '#b87333' || hex === '#a67c00' || hex === '#bf9000') {
    return { label: 'AFI', color: '#b45309' }; // Brown
  }
  
  return { label: 'POSTED', color: '#cbd5e1' };
}

export default function EXOGuardsClient({ data1CL = [], data2CL = [], data3CL = [], soiData = [] }) {
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState('1CL');
  const router = useRouter();
  const { adminUser } = useAuth() || {};

  useEffect(() => {
    // Keep time updated slightly
    setNow(new Date());
  }, []);

  const processGuards = (data, getStatusFn, postedDate, incomingDate, sortOrder) => {
    const todayList = [];
    const tomorrowList = [];

    (data || []).forEach(item => {
      // Filter out legend rows
      const cleanName = (item.name || '').replace(' AS', '').trim();
      if (BLACKLIST.includes(cleanName.toUpperCase())) return;

      const d = parseDateHeader(item.dateHeader);
      if (!d) return;

      const itemDateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
      const itemObj = new Date(itemDateStr);
      itemObj.setHours(0,0,0,0);

      const status = getStatusFn(item.color);
      
      // Try SOI picture first, then fallback to local image matcher
      const soiPic = getSoiPicture(cleanName, soiData);
      const imageUrl = soiPic || item.localImageUrl || null;

      const guardEntry = {
        name: cleanName,
        status: status.label,
        statusColor: status.color,
        imageUrl
      };

      if (itemObj.getTime() === postedDate.getTime()) {
        todayList.push(guardEntry);
      } else if (itemObj.getTime() === incomingDate.getTime()) {
        tomorrowList.push(guardEntry);
      }
    });

    const sortByPriority = (a, b) => {
      const priorityA = sortOrder[a.status] || 99;
      const priorityB = sortOrder[b.status] || 99;
      return priorityA - priorityB;
    };

    todayList.sort(sortByPriority);
    tomorrowList.sort(sortByPriority);

    return { todayList, tomorrowList };
  };

  const { today1CL, tomorrow1CL, today2CL, tomorrow2CL, today3CL, tomorrow3CL, postedDateStr, incomingDateStr } = useMemo(() => {
    // Current time in Manila
    const nowStr = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const manilaNow = new Date(nowStr);
    
    // Check if it's before 18:30 (6:30 PM)
    const isBeforeGuardMount = (manilaNow.getHours() < 18) || (manilaNow.getHours() === 18 && manilaNow.getMinutes() < 30);
    
    const postedDate = new Date(manilaNow);
    postedDate.setHours(0, 0, 0, 0);
    if (isBeforeGuardMount) {
      postedDate.setDate(postedDate.getDate() - 1);
    }
    
    const incomingDate = new Date(postedDate);
    incomingDate.setDate(incomingDate.getDate() + 1);

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

    const order1CL = {
      'FLOOR INSPECTOR': 1,
      'INTERIOR': 2,
      'NON-POSTING': 3,
      'SENTINEL': 4
    };

    const order3CL = {
      'CCQ': 1,
      'ACCQ': 2,
      'AFI': 3,
      'INTERIOR': 4,
      'MHC': 5,
      'SENTINEL': 6
    };

    const order2CL = {
      'PLEBE DETAIL': 1,
      'AFI': 2,
      'INTERIOR': 3,
      'SENTINEL (TOC)': 4
    };

    const result1CL = processGuards(data1CL, getStatusFromColor1CL, postedDate, incomingDate, order1CL);
    const result2CL = processGuards(data2CL, getStatusFromColor2CL, postedDate, incomingDate, order2CL);
    const result3CL = processGuards(data3CL, getStatusFromColor3CL, postedDate, incomingDate, order3CL);

    return { 
      today1CL: result1CL.todayList, 
      tomorrow1CL: result1CL.tomorrowList,
      today2CL: result2CL.todayList, 
      tomorrow2CL: result2CL.tomorrowList,
      today3CL: result3CL.todayList, 
      tomorrow3CL: result3CL.tomorrowList,
      postedDateStr: formatDate(postedDate),
      incomingDateStr: formatDate(incomingDate)
    };
  }, [data1CL, data2CL, data3CL, now]);

  const renderGuardCard = (guard, idx) => (
    <div key={idx} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      backgroundColor: 'var(--card-bg)',
      border: `2px solid ${guard.statusColor}60`,
      borderTop: `10px solid ${guard.statusColor}`,
      borderRadius: '12px',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'relative', width: '55px', height: '55px' }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: '50%',
          border: `3px solid ${guard.statusColor}`,
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          zIndex: 1
        }}>
          👤
        </div>
        {guard.imageUrl && (
          <img 
            src={guard.imageUrl} 
            alt={guard.name} 
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${guard.statusColor}`,
              backgroundColor: '#fff',
              zIndex: 2
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
          {guard.name}
        </h3>
        <span style={{
          backgroundColor: `${guard.statusColor}15`,
          color: guard.statusColor,
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.65rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          display: 'inline-block',
          width: 'fit-content',
          border: `1px solid ${guard.statusColor}`
        }}>
          {guard.status}
        </span>
      </div>
    </div>
  );

  const renderGuardCardRow = (title, leftGuards, rightGuards, isSentinel = false) => {
    if ((!leftGuards || leftGuards.length === 0) && (!rightGuards || rightGuards.length === 0)) return null;

    const renderBlock = (guards) => {
      if (!guards || guards.length === 0) return <div style={{ flex: 1 }}></div>;
      
      if (isSentinel) {
        return (
          <div style={{
            flex: 1,
            backgroundColor: 'var(--card-bg)',
            border: `2px solid #1f293760`,
            borderTop: `10px solid #1f2937`,
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            marginTop: '0.5rem',
            alignSelf: 'stretch'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
                SENTINELS
              </h3>
              <span style={{
                backgroundColor: `#1f293715`,
                color: '#1f2937',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                border: `1px solid #1f2937`
              }}>
                {guards.length} POSTED
              </span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {guards.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      zIndex: 1
                    }}>
                      👤
                    </div>
                    {s.imageUrl && (
                      <img 
                        src={s.imageUrl} 
                        alt={s.name} 
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          backgroundColor: '#fff',
                          zIndex: 2
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {guards.map((guard, idx) => renderGuardCard(guard, idx))}
          </div>
        );
      }
    };

    return (
      <div style={{ marginBottom: '2rem' }}>
        {!isSentinel && (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            fontSize: '0.9rem', 
            fontWeight: 800, 
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '0.5rem'
          }}>
            <div>{title} GUARDS (POSTED)</div>
            <div>{title} GUARDS (INCOMING)</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'stretch' }}>
          {renderBlock(leftGuards)}
          {renderBlock(rightGuards)}
        </div>
      </div>
    );
  };

  const getRegularGuards = (guards) => guards.filter(g => !g.status.includes('SENTINEL'));
  const getSentinels = (guards) => guards.filter(g => g.status.includes('SENTINEL'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['1CL', '2CL', '3CL'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--text-primary)' : 'var(--card-bg)',
                color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab} POSTINGS
            </button>
          ))}
        </div>
        
        {adminUser && (
          <button 
            onClick={() => router.push('/exo-guards/manage')}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            MANAGE POSTINGS
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            POSTED GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            ON DUTY ({postedDateStr})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            INCOMING GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            POSTING AT 18:30 ({incomingDateStr})
          </span>
        </div>
      </div>
      
      {((activeTab === '1CL' && today1CL.length === 0 && tomorrow1CL.length === 0) ||
        (activeTab === '2CL' && today2CL.length === 0 && tomorrow2CL.length === 0) ||
        (activeTab === '3CL' && today3CL.length === 0 && tomorrow3CL.length === 0)) ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
          No {activeTab} guards found for {postedDateStr} or {incomingDateStr}.
        </div>
      ) : (
        <>
          {activeTab === '1CL' && (
            <>
              {renderGuardCardRow('First Class', getRegularGuards(today1CL), getRegularGuards(tomorrow1CL), false)}
              {renderGuardCardRow('First Class Sentinels', getSentinels(today1CL), getSentinels(tomorrow1CL), true)}
            </>
          )}
          {activeTab === '2CL' && (
            <>
              {renderGuardCardRow('Second Class', getRegularGuards(today2CL), getRegularGuards(tomorrow2CL), false)}
              {renderGuardCardRow('Second Class Sentinels', getSentinels(today2CL), getSentinels(tomorrow2CL), true)}
            </>
          )}
          {activeTab === '3CL' && (
            <>
              {renderGuardCardRow('Third Class', getRegularGuards(today3CL), getRegularGuards(tomorrow3CL), false)}
              {renderGuardCardRow('Third Class Sentinels', getSentinels(today3CL), getSentinels(tomorrow3CL), true)}
            </>
          )}
        </>
      )}
    </div>
  );
}
