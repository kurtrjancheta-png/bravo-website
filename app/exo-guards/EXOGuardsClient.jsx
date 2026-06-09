"use client";

import { useState, useEffect, useMemo } from 'react';
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

export default function EXOGuardsClient({ data1CL = [], data3CL = [], soiData = [] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Keep time updated slightly
    setNow(new Date());
  }, []);

  const processGuards = (data, getStatusFn, postedDate, incomingDate) => {
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
    return { todayList, tomorrowList };
  };

  const { today1CL, tomorrow1CL, today3CL, tomorrow3CL, postedDateStr, incomingDateStr } = useMemo(() => {
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

    const result1CL = processGuards(data1CL, getStatusFromColor1CL, postedDate, incomingDate);
    const result3CL = processGuards(data3CL, getStatusFromColor3CL, postedDate, incomingDate);

    return { 
      today1CL: result1CL.todayList, 
      tomorrow1CL: result1CL.tomorrowList,
      today3CL: result3CL.todayList, 
      tomorrow3CL: result3CL.tomorrowList,
      postedDateStr: formatDate(postedDate),
      incomingDateStr: formatDate(incomingDate)
    };
  }, [data1CL, data3CL, now]);

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

  const renderGuardGroup = (title, guards) => {
    if (!guards || guards.length === 0) return null;
    
    // Separate Sentinels from the rest of the guards
    const sentinels = guards.filter(g => g.status === 'SENTINEL');
    const regularGuards = guards.filter(g => g.status !== 'SENTINEL');

    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: 800, 
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '0.5rem'
        }}>
          {title} Guards
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {regularGuards.map((guard, idx) => renderGuardCard(guard, idx))}
          
          {sentinels.length > 0 && (
            <div style={{
              backgroundColor: 'var(--card-bg)',
              border: `2px solid #1f293760`,
              borderTop: `10px solid #1f2937`,
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              marginTop: '0.5rem'
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
                  {sentinels.length} POSTED
                </span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sentinels.map((s, i) => (
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
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '3rem',
      alignItems: 'start'
    }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            POSTED GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            ON DUTY ({postedDateStr})
          </span>
        </div>
        
        {today1CL.length === 0 && today3CL.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            No guards found for {postedDateStr}.
          </div>
        ) : (
          <div>
            {renderGuardGroup('First Class', today1CL)}
            {renderGuardGroup('Third Class', today3CL)}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            INCOMING GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            AT 1830H ({incomingDateStr})
          </span>
        </div>

        {tomorrow1CL.length === 0 && tomorrow3CL.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            No incoming guards assigned for {incomingDateStr} yet.
          </div>
        ) : (
          <div>
            {renderGuardGroup('First Class', tomorrow1CL)}
            {renderGuardGroup('Third Class', tomorrow3CL)}
          </div>
        )}
      </section>
    </div>
  );
}
