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

function getStatusFromColor(hex) {
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

export default function EXOGuardsClient({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Keep time updated slightly
    setNow(new Date());
  }, []);

  const { todayGuards, tomorrowGuards } = useMemo(() => {
    const todayStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
    const todayObj = new Date(todayStr);
    
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);

    const todayList = [];
    const tomorrowList = [];

    data.forEach(item => {
      // Filter out legend rows
      const cleanName = (item.name || '').replace(' AS', '').trim();
      if (BLACKLIST.includes(cleanName.toUpperCase())) return;

      const d = parseDateHeader(item.dateHeader);
      if (!d) return;

      const itemDateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
      const itemObj = new Date(itemDateStr);

      const status = getStatusFromColor(item.color);
      const imageUrl = getCadetImageUrl('', '', cleanName) || '/placeholder-avatar.png';

      const guardEntry = {
        name: cleanName,
        status: status.label,
        statusColor: status.color,
        imageUrl
      };

      if (itemObj.getTime() === todayObj.getTime()) {
        todayList.push(guardEntry);
      } else if (itemObj.getTime() === tomorrowObj.getTime()) {
        tomorrowList.push(guardEntry);
      }
    });

    return { todayGuards: todayList, tomorrowGuards: tomorrowList };
  }, [data, now]);

  const renderGuardCard = (guard, idx) => (
    <div key={idx} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      backgroundColor: 'var(--card-bg)',
      border: `2px solid ${guard.statusColor}60`,
      borderTop: `12px solid ${guard.statusColor}`,
      borderRadius: '16px',
      padding: '1.25rem',
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
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: `3px solid ${guard.statusColor}`
        }}
        onError={(e) => { e.target.src = '/placeholder-avatar.png' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
          {guard.name}
        </h3>
        <span style={{
          backgroundColor: `${guard.statusColor}15`,
          color: guard.statusColor,
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
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

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '3rem',
      alignItems: 'start'
    }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            POSTED GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
            TODAY
          </span>
        </div>
        
        {todayGuards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {todayGuards.map((guard, idx) => renderGuardCard(guard, idx))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            No guards found for today. Ensure the spreadsheet is updated and colored.
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
            INCOMING GUARDS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
            TOMORROW
          </span>
        </div>

        {tomorrowGuards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tomorrowGuards.map((guard, idx) => renderGuardCard(guard, idx))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            No incoming guards assigned for tomorrow yet.
          </div>
        )}
      </section>
    </div>
  );
}
