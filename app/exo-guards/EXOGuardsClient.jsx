"use client";

import { useState, useEffect, useMemo } from 'react';
import { getCadetImageUrl } from '../../lib/imageMatcher';

const BLACKLIST = ['INTERIOR', 'SENTINEL', 'NON POSTING', 'FI'];

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
    case '#111111': return { label: 'SENTINEL', color: '#1f2937' };
    case '#ff0000': 
    case '#ea4335': return { label: 'CCQ', color: '#ef4444' };
    case '#cc0000': 
    case '#990000': return { label: 'ACCQ', color: '#991b1b' };
    case '#00ff00': 
    case '#34a853': return { label: 'MHC', color: '#22c55e' };
    case '#ff9900': 
    case '#ffa500': 
    case '#ffc000': 
    case '#fbbc04': return { label: 'INTERIOR', color: '#f59e0b' };
    case '#00ffff': 
    case '#4a86e8': 
    case '#00b0f0': return { label: 'AFI', color: '#0ea5e9' };
    default: return { label: 'POSTED', color: '#cbd5e1' };
  }
}

export default function EXOGuardsClient({ data1CL = [], data3CL = [] }) {
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
      const imageUrl = getCadetImageUrl('', '', cleanName) || '/placeholder-avatar.png';

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
      <img 
        src={guard.imageUrl} 
        alt={guard.name} 
        style={{
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: `3px solid ${guard.statusColor}`
        }}
        onError={(e) => { e.target.src = '/placeholder-avatar.png' }}
      />
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
          {guards.map((guard, idx) => renderGuardCard(guard, idx))}
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
