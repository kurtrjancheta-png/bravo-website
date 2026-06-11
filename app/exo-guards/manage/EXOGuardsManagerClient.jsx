"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../AuthContext';
import { driveUrlToImage } from '../../../lib/googleSheets';
import CadetSelectionModal from './CadetSelectionModal';

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

// Colors map to hex values used in Apps Script POST
export const ROLE_COLORS_1CL = {
  'FLOOR INSPECTOR': '#ffc000',
  'INTERIOR': '#ff0000',
  'SENTINEL': '#00ff00',
  'NON-POSTING': '#0000ff'
};

export const ROLE_COLORS_3CL = {
  'CCQ': '#ff0000',
  'ACCQ': '#4a86e8',
  'AFI': '#00ffff',
  'INTERIOR': '#ff9900',
  'MHC': '#00ff00',
  'SENTINEL': '#000000'
};

function getStatusFromColor1CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  if (hex === '#ff0000' || hex === '#ea4335') return { label: 'INTERIOR', color: '#f87171' };
  if (hex === '#ffc000' || hex === '#ffa500' || hex === '#fbbc04' || hex === '#ff9900') return { label: 'FLOOR INSPECTOR', color: '#fb923c' };
  if (hex === '#00ff00' || hex === '#34a853') return { label: 'SENTINEL', color: '#4ade80' };
  if (hex === '#0000ff' || hex === '#4285f4' || hex === '#00b0f0' || hex === '#a4c2f4') return { label: 'NON-POSTING', color: '#60a5fa' };
  return { label: 'POSTED', color: '#cbd5e1' };
}

function getStatusFromColor3CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  switch (hex) {
    case '#000000': 
    case '#111111': return { label: 'SENTINEL', color: '#1f2937' };
    case '#ff0000': 
    case '#ea4335': return { label: 'CCQ', color: '#ef4444' };
    case '#4a86e8': 
    case '#4285f4': 
    case '#2b78e4': return { label: 'ACCQ', color: '#3b82f6' };
    case '#00ff00': 
    case '#34a853': return { label: 'MHC', color: '#22c55e' };
    case '#ff9900': 
    case '#ffa500': 
    case '#ffc000': return { label: 'INTERIOR', color: '#f59e0b' };
    case '#00ffff': 
    case '#00b0f0': return { label: 'AFI', color: '#06b6d4' };
    default: return { label: 'POSTED', color: '#cbd5e1' };
  }
}

export default function EXOGuardsManagerClient({ data1CL = [], data3CL = [], soiData = [], apiUrl1CL, apiUrl3CL }) {
  const router = useRouter();
  const { adminUser, isLoaded } = useAuth();
  
  // UI States
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'tomorrow'
  const [num3CLSentinels, setNum3CLSentinels] = useState(6); // 6 or 12
  const [extraInteriors1CL, setExtraInteriors1CL] = useState(0);
  const [extraInteriors3CL, setExtraInteriors3CL] = useState(0);
  const [extraSentinels1CL, setExtraSentinels1CL] = useState(0);

  // Modal State
  const [modalConfig, setModalConfig] = useState(null); // { isOpen, role, dateStr, currentCadetName, classLevel }

  const [now] = useState(new Date());

  const { today1CL, tomorrow1CL, today3CL, tomorrow3CL, postedDateStr, incomingDateStr, postedDateObj, incomingDateObj } = useMemo(() => {
    const nowStr = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const manilaNow = new Date(nowStr);
    const isBeforeGuardMount = (manilaNow.getHours() < 18) || (manilaNow.getHours() === 18 && manilaNow.getMinutes() < 30);
    
    const postedDate = new Date(manilaNow);
    postedDate.setHours(0, 0, 0, 0);
    if (isBeforeGuardMount) postedDate.setDate(postedDate.getDate() - 1);
    
    const incomingDate = new Date(postedDate);
    incomingDate.setDate(incomingDate.getDate() + 1);

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const processGuards = (data, getStatusFn) => {
      const todayList = [];
      const tomorrowList = [];
      (data || []).forEach(item => {
        const cleanName = (item.name || '').replace(' AS', '').trim();
        if (BLACKLIST.includes(cleanName.toUpperCase())) return;
        const d = parseDateHeader(item.dateHeader);
        if (!d) return;
        const itemObj = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        itemObj.setHours(0,0,0,0);
        
        const status = getStatusFn(item.color);
        const imageUrl = getSoiPicture(cleanName, soiData) || item.localImageUrl || null;
        const entry = { name: cleanName, status: status.label, statusColor: status.color, imageUrl, originalItem: item };

        if (itemObj.getTime() === postedDate.getTime()) todayList.push(entry);
        else if (itemObj.getTime() === incomingDate.getTime()) tomorrowList.push(entry);
      });
      return { todayList, tomorrowList };
    };

    const res1 = processGuards(data1CL, getStatusFromColor1CL);
    const res3 = processGuards(data3CL, getStatusFromColor3CL);

    return { 
      today1CL: res1.todayList, tomorrow1CL: res1.tomorrowList,
      today3CL: res3.todayList, tomorrow3CL: res3.tomorrowList,
      postedDateStr: formatDate(postedDate), incomingDateStr: formatDate(incomingDate),
      postedDateObj: postedDate, incomingDateObj: incomingDate
    };
  }, [data1CL, data3CL, now, soiData]);

  if (!isLoaded) return null;
  
  if (!adminUser || adminUser.council !== 'EXO') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔒</span>
        <h2>Access Denied</h2>
        <p>This page is restricted to the EXO only.</p>
        <button 
          onClick={() => router.push('/exo-guards')}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Helper to find guards by role
  const getGuardsByRole = (list, role) => list.filter(g => g.status === role);

  const activeDateStr = activeTab === 'today' ? postedDateStr : incomingDateStr;
  const handleAssign = async (cadetName) => {
    if (!modalConfig) return;
    const { role, dateStr, currentCadetName, classLevel } = modalConfig;
    const apiUrl = classLevel === '1CL' ? apiUrl1CL : apiUrl3CL;
    const colorMap = classLevel === '1CL' ? ROLE_COLORS_1CL : ROLE_COLORS_3CL;
    const roleColor = colorMap[role] || '#000000'; 

    setModalConfig(null);

    // Provide immediate visual feedback or trust router.refresh
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'assignGuard',
          cadetName: cadetName,
          date: dateStr,
          color: roleColor,
          previousCadetName: currentCadetName
        })
      });
      const result = await res.json();
      if (result.success) {
        router.refresh(); // Tells Next.js to re-fetch the server component
      } else {
        alert('Failed to assign guard: ' + (result.message || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Network error while assigning guard.');
    }
  };

  const renderSlot = (title, guard, role, classLevel) => {
    const isAssigned = !!guard;
    const color = isAssigned ? guard.statusColor : '#94a3b8';

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        backgroundColor: isAssigned ? 'var(--card-bg)' : 'transparent',
        border: isAssigned ? `2px solid ${color}60` : `2px dashed ${color}60`,
        borderTop: isAssigned ? `10px solid ${color}` : `10px solid ${color}60`,
        borderRadius: '12px', padding: '0.75rem 1rem', position: 'relative',
        boxShadow: isAssigned ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
        cursor: 'pointer', transition: 'transform 0.2s',
        opacity: isAssigned ? 1 : 0.7
      }}
      onClick={() => setModalConfig({ 
        isOpen: true, role, dateStr: activeDateStr, currentCadetName: isAssigned ? guard.name : null, classLevel 
      })}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
        
        {/* Swap Button for Assigned */}
        {isAssigned && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setModalConfig({ isOpen: true, role, dateStr: activeDateStr, currentCadetName: guard.name, classLevel });
            }}
            style={{
              position: 'absolute', top: '4px', right: '4px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '1rem', opacity: 0.6
            }}
            title="Swap Guard"
          >
            🔄
          </button>
        )}

        <div style={{ position: 'relative', width: '55px', height: '55px' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%', border: `3px solid ${color}`,
            backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', zIndex: 1
          }}>
            {isAssigned ? '👤' : '?'}
          </div>
          {isAssigned && guard.imageUrl && (
            <img src={guard.imageUrl} alt={guard.name} style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
              border: `3px solid ${color}`, zIndex: 2
            }} onError={(e) => { e.target.style.display = 'none'; }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
            {isAssigned ? guard.name : 'UNASSIGNED'}
          </h3>
          <span style={{
            backgroundColor: `${color}15`, color: color, padding: '0.2rem 0.6rem',
            borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800,
            textTransform: 'uppercase', display: 'inline-block', width: 'fit-content',
            border: `1px solid ${color}`
          }}>
            {title}
          </span>
        </div>
      </div>
    );
  };

  const renderSentinelsCard = (guards, role, classLevel, dropdownSetter) => {
    const is3CL = classLevel === '3CL';
    const totalSlots = is3CL ? num3CLSentinels : Math.min(6, guards.length + extraSentinels1CL);
    
    // Create array of exactly totalSlots
    const slots = [];
    for (let i = 0; i < totalSlots; i++) {
      slots.push(guards[i] || null); // null if empty
    }

    return (
      <div style={{
        backgroundColor: 'var(--card-bg)', border: `2px solid #1f293760`,
        borderTop: `10px solid #1f2937`, borderRadius: '12px', padding: '1.25rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
              SENTINELS
            </h3>
            <span style={{
              backgroundColor: `#1f293715`, color: '#1f2937', padding: '0.2rem 0.6rem',
              borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800,
              textTransform: 'uppercase', border: `1px solid #1f2937`
            }}>
              {guards.length} POSTED
            </span>
          </div>

          {is3CL ? (
            <select 
              value={num3CLSentinels} 
              onChange={e => setNum3CLSentinels(Number(e.target.value))}
              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
            >
              <option value={6}>Single Posting (6)</option>
              <option value={12}>Double Posting (12)</option>
            </select>
          ) : (
            <button 
              onClick={() => setExtraSentinels1CL(prev => Math.min(6 - guards.length, prev + 1))}
              disabled={guards.length + extraSentinels1CL >= 6}
              style={{
                padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px',
                border: 'none', background: 'var(--btn-bg)', color: '#fff', cursor: 'pointer'
              }}
            >
              + Add Sentinel
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {slots.map((s, i) => {
            const isAssigned = !!s;
            return (
              <div key={i} 
                onClick={() => setModalConfig({ isOpen: true, role, dateStr: activeDateStr, currentCadetName: isAssigned ? s.name : null, classLevel })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  backgroundColor: isAssigned ? 'var(--bg-secondary)' : 'transparent',
                  padding: '0.3rem 0.75rem 0.3rem 0.3rem', borderRadius: '999px',
                  border: isAssigned ? '1px solid var(--border-color)' : '1px dashed var(--border-color)',
                  cursor: 'pointer', opacity: isAssigned ? 1 : 0.6, position: 'relative'
                }}
                title={isAssigned ? `Click to swap ${s.name}` : "Click to assign"}
              >
                <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', zIndex: 1
                  }}>
                    {isAssigned ? '👤' : '?'}
                  </div>
                  {isAssigned && s.imageUrl && (
                    <img src={s.imageUrl} alt={s.name} style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                      backgroundColor: '#fff', zIndex: 2
                    }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAssigned ? s.name : 'EMPTY'}
                </span>
                
                {isAssigned && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalConfig({ isOpen: true, role, dateStr: activeDateStr, currentCadetName: s.name, classLevel });
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginLeft: '0.2rem' }}
                    title="Swap"
                  >🔄</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const active1CL = activeTab === 'today' ? today1CL : tomorrow1CL;
  const active3CL = activeTab === 'today' ? today3CL : tomorrow3CL;

  const guards1FI = getGuardsByRole(active1CL, 'FLOOR INSPECTOR');
  const guards1Int = getGuardsByRole(active1CL, 'INTERIOR');
  const guards1Sent = getGuardsByRole(active1CL, 'SENTINEL');

  const guards3CCQ = getGuardsByRole(active3CL, 'CCQ');
  const guards3ACCQ = getGuardsByRole(active3CL, 'ACCQ');
  const guards3AFI = getGuardsByRole(active3CL, 'AFI');
  const guards3Int = getGuardsByRole(active3CL, 'INTERIOR');
  const guards3Sent = getGuardsByRole(active3CL, 'SENTINEL');

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('today')}
          style={{ padding: '0.75rem 1.5rem', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'today' ? 'var(--btn-bg)' : 'var(--bg-secondary)', color: activeTab === 'today' ? '#fff' : 'var(--text-secondary)' }}
        >
          POSTED (TODAY) - {postedDateStr}
        </button>
        <button 
          onClick={() => setActiveTab('tomorrow')}
          style={{ padding: '0.75rem 1.5rem', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'tomorrow' ? 'var(--btn-bg)' : 'var(--bg-secondary)', color: activeTab === 'tomorrow' ? '#fff' : 'var(--text-secondary)' }}
        >
          INCOMING (TOMORROW) - {incomingDateStr}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* 1CL Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>1CL Guards</h2>
          
          {renderSlot('FLOOR INSPECTOR', guards1FI[0], 'FLOOR INSPECTOR', '1CL')}
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INTERIOR GUARDS</span>
              <button 
                onClick={() => setExtraInteriors1CL(prev => Math.min(5 - guards1Int.length, prev + 1))}
                disabled={guards1Int.length + extraInteriors1CL >= 5}
                style={{ background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
              >+ Add Interior</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Array.from({ length: guards1Int.length + extraInteriors1CL }).map((_, i) => (
                <div key={i}>{renderSlot('INTERIOR', guards1Int[i], 'INTERIOR', '1CL')}</div>
              ))}
            </div>
          </div>

          {renderSentinelsCard(guards1Sent, 'SENTINEL', '1CL')}
        </div>
        
        {/* 3CL Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>3CL Guards</h2>
          
          {renderSlot('CCQ', guards3CCQ[0], 'CCQ', '3CL')}
          {renderSlot('ACCQ', guards3ACCQ[0], 'ACCQ', '3CL')}
          {renderSlot('AFI', guards3AFI[0], 'AFI', '3CL')}
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INTERIOR GUARDS</span>
              <button 
                onClick={() => setExtraInteriors3CL(prev => Math.min(10 - guards3Int.length, prev + 1))}
                disabled={guards3Int.length + extraInteriors3CL >= 10}
                style={{ background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
              >+ Add Interior</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Array.from({ length: guards3Int.length + extraInteriors3CL }).map((_, i) => (
                <div key={i}>{renderSlot('INTERIOR', guards3Int[i], 'INTERIOR', '3CL')}</div>
              ))}
            </div>
          </div>

          {renderSentinelsCard(guards3Sent, 'SENTINEL', '3CL')}
        </div>
      </div>
      
      <CadetSelectionModal 
        isOpen={modalConfig?.isOpen}
        onClose={() => setModalConfig(null)}
        role={modalConfig?.role}
        dateStr={modalConfig?.dateStr}
        classLevel={modalConfig?.classLevel}
        currentCadetName={modalConfig?.currentCadetName}
        soiData={soiData}
        onAssign={handleAssign}
      />
    </div>
  );
}
