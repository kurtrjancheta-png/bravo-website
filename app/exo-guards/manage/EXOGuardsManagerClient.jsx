"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../AuthContext';
import { driveUrlToImage } from '../../../lib/googleSheets';
import CadetSelectionModal from './CadetSelectionModal';

const BLACKLIST = ['INTERIOR', 'SENTINEL', 'NON POSTING', 'NON-POSTING', 'FI', 'CCQ', 'ACCQ', 'MHC', 'AFI'];

function parseDateHeader(header) {
  if (!header) return null;
  if (header === 'PERMANENT') return 'PERMANENT';
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

export const ROLE_COLORS_2CL = {
  'PLEBE DETAIL': '#ffff00',
  'SENTINEL (TOC)': '#00ffff',
  'INTERIOR': '#ff00ff',
  'AFI': '#b45f06',
  'NON-POSTING': '#0000ff'
};

export const ROLE_COLORS_3CL = {
  'CCQ': '#ff0000',
  'ACCQ': '#4a86e8',
  'AFI': '#00ffff',
  'MHC': '#00ff00',
  'INTERIOR': '#ff9900',
  'SENTINEL': '#ff00ff',
  'NON-POSTING': '#0000ff'
};

function getStatusFromColor1CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' }; // slate-500
  if (hex === '#ffc000' || hex === '#ffc001') return { label: 'FLOOR INSPECTOR', color: '#f59e0b' }; // amber-500
  if (hex === '#ff0000' || hex === '#ff0001') return { label: 'INTERIOR', color: '#ef4444' }; // red-500
  if (hex === '#00ff00' || hex === '#00ff01') return { label: 'SENTINEL', color: '#22c55e' }; // green-500
  if (hex === '#0000ff' || hex === '#0000fe' || hex === '#4285f4' || hex === '#a4c2f4' || hex === '#cfe2f3' || hex === '#9fc5e8') return { label: 'NON-POSTING', color: '#60a5fa' }; // blue-400
  return { label: 'SENTINEL', color: '#22c55e' }; // green-500
}

function getStatusFromColor3CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  switch(hex.toLowerCase()) {
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
    case '#ff00ff': return { label: 'SENTINEL', color: '#d946ef' };
    case '#00ffff': 
    case '#00b0f0': return { label: 'AFI', color: '#06b6d4' };
    case '#cfe2f3':
    case '#9fc5e8':
    case '#a4c2f4': return { label: 'NON-POSTING', color: '#60a5fa' };
    case '#ff00ff': 
    default: return { label: 'SENTINEL', color: '#d946ef' };
  }
}

function getStatusFromColor2CL(hex) {
  if (!hex) return { label: 'UNKNOWN', color: '#64748b' };
  if (hex === '#ffff00' || hex === '#ffff01') return { label: 'PLEBE DETAIL', color: '#eab308' }; // Yellow
  if (hex === '#00ffff' || hex === '#00b0f0') return { label: 'SENTINEL (TOC)', color: '#06b6d4' }; // Cyan
  if (hex === '#ff00ff' || hex === '#ff00fe') return { label: 'INTERIOR', color: '#d946ef' }; // Magenta
  if (hex === '#b45f06' || hex === '#b87333' || hex === '#a67c00' || hex === '#bf9000') return { label: 'AFI', color: '#b45309' }; // Brown
  if (hex === '#0000ff' || hex === '#4285f4' || hex === '#00b0f0' || hex === '#a4c2f4' || hex === '#cfe2f3' || hex === '#9fc5e8') return { label: 'NON-POSTING', color: '#60a5fa' };
  return { label: 'SENTINEL (TOC)', color: '#06b6d4' };
}

export default function EXOGuardsManagerClient({ 
  data1CL = [], 
  data2CL = [],
  data3CL = [], 
  soiData = [], 
  apiUrl1CL, 
  apiUrl2CL,
  apiUrl3CL,
  sheetUrl1CL,
  sheetUrl2CL,
  sheetUrl3CL
}) {
  const router = useRouter();
  const { adminUser, isLoaded } = useAuth();
  
  // UI States
  const [activeClassTab, setActiveClassTab] = useState('1CL');
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);
  const [roleModalConfig, setRoleModalConfig] = useState({ isOpen: false });

  const [pendingChanges, setPendingChanges] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [num3CLSentinels, setNum3CLSentinels] = useState(6); // 6 or 12
  const [extraInteriors1CL, setExtraInteriors1CL] = useState(0);
  const [extraInteriors3CL, setExtraInteriors3CL] = useState(0);
  const [extraSentinels1CL, setExtraSentinels1CL] = useState(0);
  const [showAFI3CL, setShowAFI3CL] = useState(false);
  const [showMHC3CL, setShowMHC3CL] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState(null); // { isOpen, role, dateStr, currentCadetName, classLevel }
  const [showNonPostingModal, setShowNonPostingModal] = useState(null); // '1CL' or '3CL'
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'tomorrow'

  const [now] = useState(new Date());

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { 
    today1CL, tomorrow1CL, permanent1CL, tally1CL,
    today2CL, tomorrow2CL, permanent2CL, tally2CL,
    today3CL, tomorrow3CL, permanent3CL, tally3CL,
    postedDateStr, incomingDateStr, postedDateObj, incomingDateObj 
  } = useMemo(() => {
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
      const permanentNonPostingList = [];
      const tally = {}; // { [cadetName]: { [dateStr]: { label, color } } }

      (data || []).forEach(item => {
        const cleanName = (item.name || '').replace(' AS', '').trim();
        if (BLACKLIST.includes(cleanName.toUpperCase())) return;
        
        const d = parseDateHeader(item.dateHeader);
        if (!d) return;

        const status = getStatusFn(item.color);
        const imageUrl = getSoiPicture(cleanName, soiData) || item.localImageUrl || null;
        const entry = { name: cleanName, status: status.label, statusColor: status.color, imageUrl, originalItem: item };

        if (d === 'PERMANENT' && status.label === 'NON-POSTING') {
          permanentNonPostingList.push(entry);
          return;
        }

        if (d === 'PERMANENT') return;

        const itemObj = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        itemObj.setHours(0,0,0,0);

        if (itemObj.getTime() === postedDate.getTime()) todayList.push(entry);
        else if (itemObj.getTime() === incomingDate.getTime()) tomorrowList.push(entry);

        // Populate Tally
        if (!tally[cleanName]) tally[cleanName] = {};
        const dateStrKey = formatDate(itemObj);
        tally[cleanName][dateStrKey] = { label: status.label, color: status.color };
      });
      return { todayList, tomorrowList, permanentNonPostingList, tally };
    };

    const res1 = processGuards(data1CL, getStatusFromColor1CL);
    const res2 = processGuards(data2CL, getStatusFromColor2CL);
    const res3 = processGuards(data3CL, getStatusFromColor3CL);

    return { 
      today1CL: res1.todayList, tomorrow1CL: res1.tomorrowList, permanent1CL: res1.permanentNonPostingList, tally1CL: res1.tally,
      today2CL: res2.todayList, tomorrow2CL: res2.tomorrowList, permanent2CL: res2.permanentNonPostingList, tally2CL: res2.tally,
      today3CL: res3.todayList, tomorrow3CL: res3.tomorrowList, permanent3CL: res3.permanentNonPostingList, tally3CL: res3.tally,
      postedDateStr: formatDate(postedDate), incomingDateStr: formatDate(incomingDate),
      postedDateObj: postedDate, incomingDateObj: incomingDate
    };
  }, [data1CL, data2CL, data3CL, now, soiData]);

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
  const handleRemoveTemporary = (cadetName, targetClassLevel, isTomorrow) => {
    const apiUrl = targetClassLevel === '1CL' ? apiUrl1CL : targetClassLevel === '2CL' ? apiUrl2CL : apiUrl3CL;
    const targetDateStr = isTomorrow ? incomingDateStr : postedDateStr;

    setPendingChanges(prev => [...prev, {
      cadetName,
      role: 'CLEAR',
      date: targetDateStr,
      apiUrl,
      classLevel: targetClassLevel,
      payload: {
        action: 'assignGuard',
        cadetName: cadetName,
        previousCadetName: cadetName,
        date: targetDateStr,
        color: null
      }
    }]);
  };

  const handleAssign = async (cadetName) => {
    if (!modalConfig) return;
    const { role, dateStr, currentCadetName, classLevel } = modalConfig;
    
    // VALIDATION: Prevent assigning if cadet is non-posting
    if (role !== 'NON-POSTING') {
      const permanentList = classLevel === '1CL' ? permanent1CL : classLevel === '2CL' ? permanent2CL : permanent3CL;
      const todayList = classLevel === '1CL' ? today1CL : classLevel === '2CL' ? today2CL : today3CL;
      const tomorrowList = classLevel === '1CL' ? tomorrow1CL : classLevel === '2CL' ? tomorrow2CL : tomorrow3CL;
      
      const isPermanentNP = permanentList.some(g => g.name === cadetName);
      
      const activeList = activeDateStr === postedDateStr ? todayList : tomorrowList;
      const isTempNP = activeList.some(g => g.name === cadetName && g.status === 'NON-POSTING');
      
      if (isPermanentNP || isTempNP) {
        alert(`ERROR: ${classLevel} ${cadetName} IS NON POSTING`);
        return;
      }
    }

    const apiUrl = classLevel === '1CL' ? apiUrl1CL : classLevel === '2CL' ? apiUrl2CL : apiUrl3CL;
    const colorMap = classLevel === '1CL' ? ROLE_COLORS_1CL : classLevel === '2CL' ? ROLE_COLORS_2CL : ROLE_COLORS_3CL;
    const roleColor = colorMap[role] || '#000000'; 

    setPendingChanges(prev => [...prev, {
      classLevel,
      dateStr,
      role,
      apiUrl,
      payload: {
        action: 'assignGuard',
        cadetName: cadetName,
        date: dateStr,
        color: roleColor,
        previousCadetName: currentCadetName
      }
    }]);

    setModalConfig(null);
  };

  const applyPendingChanges = (list, classLevelTarget, dateStrTarget) => {
    let result = [...list];
    
    pendingChanges.forEach(change => {
      if (change.classLevel !== classLevelTarget || change.dateStr !== dateStrTarget) return;
      
      const { cadetName, previousCadetName, color } = change.payload;
      const role = change.role;
      const imageUrl = getSoiPicture(cadetName, soiData);

      if (previousCadetName) {
        const idx = result.findIndex(g => g.name === previousCadetName && g.status === role);
        if (idx !== -1) {
          result[idx] = { ...result[idx], name: cadetName, imageUrl };
        }
      } else {
        result.push({ name: cadetName, status: role, statusColor: color, imageUrl, originalItem: null });
      }
    });

    return result;
  };

  const handleUploadChanges = async () => {
    setIsUploading(true);
    try {
      for (const change of pendingChanges) {
        await fetch(change.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(change.payload)
        });
      }
      setPendingChanges([]);
      setIsLaunching(true);
      setTimeout(() => {
        setIsLaunching(false);
        setIsUploading(false);
        setShowSuccessToast(true);
        router.refresh();
        setTimeout(() => setShowSuccessToast(false), 3000);
      }, 800);
    } catch (e) {
      console.error(e);
      alert('Network error while uploading changes.');
      setIsUploading(false);
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

  const renderMultiSlotCard = (guards, role, classLevel, title, baseColor, numSlots, extraSlots = 0) => {
    const is3CL = classLevel === '3CL';
    const totalSlots = is3CL && role === 'SENTINEL' ? num3CLSentinels : Math.min(numSlots, guards.length + extraSlots);
    
    // Create array of exactly totalSlots
    const slots = [];
    for (let i = 0; i < totalSlots; i++) {
      slots.push(guards[i] || null); // null if empty
    }

    if (slots.length === 0) return null;

    return (
      <div style={{
        backgroundColor: 'var(--card-bg)', border: `2px solid ${baseColor}60`,
        borderTop: `10px solid ${baseColor}`, borderRadius: '12px', padding: '1.25rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--card-text)', letterSpacing: '0.05em' }}>
              {title}
            </h3>
            <span style={{
              backgroundColor: `${baseColor}15`, color: baseColor, padding: '0.2rem 0.6rem',
              borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800,
              textTransform: 'uppercase', border: `1px solid ${baseColor}`
            }}>
              {guards.length} POSTED
            </span>
          </div>

          {is3CL && role === 'SENTINEL' && (
            <select 
              value={num3CLSentinels} 
              onChange={e => setNum3CLSentinels(Number(e.target.value))}
              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
            >
              <option value={6}>Single Posting (6)</option>
              <option value={12}>Double Posting (12)</option>
            </select>
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

  let active1CL = activeTab === 'today' ? today1CL : tomorrow1CL;
  let active2CL = activeTab === 'today' ? today2CL : tomorrow2CL;
  let active3CL = activeTab === 'today' ? today3CL : tomorrow3CL;
  const activeDateStrTarget = activeTab === 'today' ? postedDateStr : incomingDateStr;

  active1CL = applyPendingChanges(active1CL, '1CL', activeDateStrTarget);
  active2CL = applyPendingChanges(active2CL, '2CL', activeDateStrTarget);
  active3CL = applyPendingChanges(active3CL, '3CL', activeDateStrTarget);

  const guards1FI = getGuardsByRole(active1CL, 'FLOOR INSPECTOR');
  const guards1Int = getGuardsByRole(active1CL, 'INTERIOR');
  const guards1Sent = getGuardsByRole(active1CL, 'SENTINEL');

  const guards2Plebe = getGuardsByRole(active2CL, 'PLEBE DETAIL');
  const guards2Int = getGuardsByRole(active2CL, 'INTERIOR');
  const guards2AFI = getGuardsByRole(active2CL, 'AFI');
  const guards2Sent = getGuardsByRole(active2CL, 'SENTINEL (TOC)');

  const guards3CCQ = getGuardsByRole(active3CL, 'CCQ');
  const guards3ACCQ = getGuardsByRole(active3CL, 'ACCQ');
  const guards3AFI = getGuardsByRole(active3CL, 'AFI');
  const guards3MHC = getGuardsByRole(active3CL, 'MHC');
  const guards3Int = getGuardsByRole(active3CL, 'INTERIOR');
  const guards3Sent = getGuardsByRole(active3CL, 'SENTINEL');

  return (
    <div>
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
          <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-down {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
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
              15% { transform: translateY(20px) scale(0.9); } /* small dip to build momentum */
              100% { transform: translateY(-1500px) scale(0.5); opacity: 0; }
            }
          `}} />
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

      {pendingChanges.length > 0 && !isUploading && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1f2937', color: '#fff', padding: '1rem 2rem', borderRadius: '999px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '1rem',
          zIndex: 1000
        }}>
          <span style={{ fontWeight: 'bold' }}>{pendingChanges.length} unsaved {pendingChanges.length === 1 ? 'change' : 'changes'}</span>
          <button 
            onClick={handleUploadChanges}
            disabled={isUploading}
            style={{
              backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1.5rem',
              borderRadius: '999px', fontWeight: 800, cursor: isUploading ? 'wait' : 'pointer',
              opacity: isUploading ? 0.7 : 1
            }}
          >
            Upload Changes
          </button>
        </div>
      )}

      {/* Toggle Switch */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#e2e8f0', // slate-200
          borderRadius: '9999px',
          padding: '0.35rem',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
        }}>
          {/* Sliding indicator */}
          <div style={{
            position: 'absolute',
            top: '0.35rem',
            bottom: '0.35rem',
            left: activeTab === 'today' ? '0.35rem' : '50%',
            width: 'calc(50% - 0.35rem)',
            backgroundColor: '#ffffff',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }} />
          
          <button 
            onClick={() => setActiveTab('today')}
            style={{
              padding: '0.6rem 2.5rem', fontWeight: 800, border: 'none', background: 'transparent',
              color: activeTab === 'today' ? '#0f172a' : '#64748b', cursor: 'pointer',
              zIndex: 2, transition: 'color 0.3s', whiteSpace: 'nowrap', width: isMobile ? '120px' : '160px', fontSize: '0.9rem',
              letterSpacing: '0.05em'
            }}
          >
            POSTED
          </button>
          
          <button 
            onClick={() => setActiveTab('tomorrow')}
            style={{
              padding: '0.6rem 2.5rem', fontWeight: 800, border: 'none', background: 'transparent',
              color: activeTab === 'tomorrow' ? '#0f172a' : '#64748b', cursor: 'pointer',
              zIndex: 2, transition: 'color 0.3s', whiteSpace: 'nowrap', width: isMobile ? '120px' : '160px', fontSize: '0.9rem',
              letterSpacing: '0.05em'
            }}
          >
            INCOMING
          </button>
        </div>
        
        <button 
          onClick={() => setIsTallyModalOpen(true)}
          style={{
            padding: '0.6rem 1.5rem', fontWeight: 800, border: 'none', background: '#3b82f6',
            color: '#ffffff', cursor: 'pointer', borderRadius: '8px',
            transition: 'background 0.3s', whiteSpace: 'nowrap', fontSize: '0.9rem',
            letterSpacing: '0.05em', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '300px' : 'none'
          }}
        >
          📊 WEEKLY TALLY
        </button>
      </div>
      
      {/* Class Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.5rem', width: '100%' }}>
        {['1CL', '2CL', '3CL'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveClassTab(tab)}
            style={{
              padding: isMobile ? '0.5rem 1.25rem' : '0.5rem 2rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: activeClassTab === tab ? '#0f172a' : '#e2e8f0',
              color: activeClassTab === tab ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeClassTab === tab ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              flex: isMobile ? 1 : 'none',
              maxWidth: isMobile ? '120px' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '-0.5rem', marginBottom: '3rem' }}>
        <span style={{ 
          display: 'inline-block',
          padding: '0.3rem 1rem', 
          backgroundColor: 'var(--bg-secondary)', 
          color: 'var(--text-secondary)', 
          borderRadius: '999px',
          fontSize: '0.8rem', 
          fontWeight: 700, 
          letterSpacing: '0.05em',
          border: '1px solid var(--border-color)'
        }}>
          📅 {activeTab === 'today' ? postedDateStr : incomingDateStr}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* 1CL Column */}
        {activeClassTab === '1CL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1CL Guards</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={sheetUrl1CL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600 }}>
                    View Sheet ↗
                  </a>
                  <button 
                    onClick={() => setShowNonPostingModal('1CL')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Non Posting List
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'INTERIOR', dateStr: activeDateStr, currentCadetName: null, classLevel: '1CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Interior
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'SENTINEL', dateStr: activeDateStr, currentCadetName: null, classLevel: '1CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Sentinel
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'NON-POSTING', dateStr: activeDateStr, currentCadetName: null, classLevel: '1CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#60a5fa', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Non-Posting
                </button>
              </div>
            
            {renderSlot('FLOOR INSPECTOR', guards1FI[0], 'FLOOR INSPECTOR', '1CL')}
            
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INTERIOR GUARDS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: guards1Int.length + extraInteriors1CL }).map((_, i) => (
                  <div key={i}>{renderSlot('INTERIOR', guards1Int[i], 'INTERIOR', '1CL')}</div>
                ))}
                {guards1Int.length + extraInteriors1CL === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                    No interior guards posted.
                  </div>
                )}
              </div>
            </div>

            {renderMultiSlotCard(guards1Sent, 'SENTINEL', '1CL', 'SENTINELS', '#1f2937', 6, extraSentinels1CL)}
          </div>
        )}

        {/* 2CL Column */}
        {activeClassTab === '2CL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2CL Guards</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={sheetUrl2CL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600 }}>
                    View Sheet ↗
                  </a>
                  <button 
                    onClick={() => setShowNonPostingModal('2CL')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Non Posting List
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'PLEBE DETAIL', dateStr: activeDateStr, currentCadetName: null, classLevel: '2CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#eab308', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Plebe Detail
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'SENTINEL (TOC)', dateStr: activeDateStr, currentCadetName: null, classLevel: '2CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Sentinel
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'AFI', dateStr: activeDateStr, currentCadetName: null, classLevel: '2CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#b45309', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add AFI
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'INTERIOR', dateStr: activeDateStr, currentCadetName: null, classLevel: '2CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#d946ef', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Interior
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'NON-POSTING', dateStr: activeDateStr, currentCadetName: null, classLevel: '2CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#60a5fa', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Non-Posting
                </button>
              </div>
            
            {renderMultiSlotCard(guards2Plebe, 'PLEBE DETAIL', '2CL', 'PLEBE DETAIL', '#eab308', 6, 0)}
            {renderSlot('AFI', guards2AFI[0], 'AFI', '2CL')}
            
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INTERIOR GUARDS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {guards2Int.map((guard, i) => (
                  <div key={i}>{renderSlot('INTERIOR', guard, 'INTERIOR', '2CL')}</div>
                ))}
                {guards2Int.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                    No interior guards posted.
                  </div>
                )}
              </div>
            </div>

            {renderMultiSlotCard(guards2Sent, 'SENTINEL (TOC)', '2CL', 'SENTINELS (TOC)', '#06b6d4', 6, 0)}
          </div>
        )}
        
        {/* 3CL Column */}
        {activeClassTab === '3CL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3CL Guards</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={sheetUrl3CL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600 }}>
                    View Sheet ↗
                  </a>
                  <button 
                    onClick={() => setShowNonPostingModal('3CL')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Non Posting List
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'AFI', dateStr: activeDateStr, currentCadetName: null, classLevel: '3CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add AFI
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'MHC', dateStr: activeDateStr, currentCadetName: null, classLevel: '3CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add MHC
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'INTERIOR', dateStr: activeDateStr, currentCadetName: null, classLevel: '3CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Interior
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, role: 'NON-POSTING', dateStr: activeDateStr, currentCadetName: null, classLevel: '3CL' })}
                  style={{ padding: '0.4rem 1rem', background: '#60a5fa', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  + Add Non-Posting
                </button>
              </div>
            
            {renderSlot('CCQ', guards3CCQ[0], 'CCQ', '3CL')}
            {renderSlot('ACCQ', guards3ACCQ[0], 'ACCQ', '3CL')}
            
            {(guards3AFI.length > 0 || showAFI3CL) && renderSlot('AFI', guards3AFI[0], 'AFI', '3CL')}
            {(guards3MHC.length > 0 || showMHC3CL) && renderSlot('MHC', guards3MHC[0], 'MHC', '3CL')}
            
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INTERIOR GUARDS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: guards3Int.length + extraInteriors3CL }).map((_, i) => (
                  <div key={i}>{renderSlot('INTERIOR', guards3Int[i], 'INTERIOR', '3CL')}</div>
                ))}
                {guards3Int.length + extraInteriors3CL === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                    No interior guards posted.
                  </div>
                )}
              </div>
            </div>

            {renderMultiSlotCard(guards3Sent, 'SENTINEL', '3CL', 'SENTINELS', '#1f2937', 6, 0)}
          </div>
        )}
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

      {showNonPostingModal && (
        <NonPostingListModal
          isOpen={!!showNonPostingModal}
          onClose={() => setShowNonPostingModal(null)}
          classLevel={showNonPostingModal}
          dateStr={activeDateStr}
          permanentList={showNonPostingModal === '1CL' ? permanent1CL : showNonPostingModal === '2CL' ? permanent2CL : permanent3CL}
          todayList={showNonPostingModal === '1CL' ? getGuardsByRole(today1CL, 'NON-POSTING') : showNonPostingModal === '2CL' ? getGuardsByRole(today2CL, 'NON-POSTING') : getGuardsByRole(today3CL, 'NON-POSTING')}
          tomorrowList={showNonPostingModal === '1CL' ? getGuardsByRole(tomorrow1CL, 'NON-POSTING') : showNonPostingModal === '2CL' ? getGuardsByRole(tomorrow2CL, 'NON-POSTING') : getGuardsByRole(tomorrow3CL, 'NON-POSTING')}
          soiData={soiData}
          isMobile={isMobile}
          onTogglePermanent={(cadetName, isPermanent) => {
            const apiUrl = showNonPostingModal === '1CL' ? apiUrl1CL : showNonPostingModal === '2CL' ? apiUrl2CL : apiUrl3CL;
            setPendingChanges(prev => [...prev, {
              classLevel: showNonPostingModal,
              dateStr: 'PERMANENT',
              role: 'NON-POSTING',
              apiUrl,
              payload: {
                action: 'setPermanentNonPosting',
                cadetName: cadetName,
                isNonPosting: isPermanent
              }
            }]);
          }}
          onRemoveTemporary={(cadetName, isTomorrow) => handleRemoveTemporary(cadetName, showNonPostingModal, isTomorrow)}
        />
      )}

      {isTallyModalOpen && (
        <TallySheetModal
          isOpen={isTallyModalOpen}
          onClose={() => setIsTallyModalOpen(false)}
          tally1CL={tally1CL}
          tally2CL={tally2CL}
          tally3CL={tally3CL}
          soiData={soiData}
          postedDateObj={postedDateObj}
          pendingChanges={pendingChanges}
          isUploading={isUploading}
          handleUploadChanges={handleUploadChanges}
          onAssignFromTally={(cadetName, classLevel, dateStr) => {
            setRoleModalConfig({ isOpen: true, cadetName, classLevel, dateStr });
          }}
        />
      )}

      <RoleSelectionModal
        isOpen={roleModalConfig.isOpen}
        onClose={() => setRoleModalConfig({ isOpen: false })}
        cadetName={roleModalConfig.cadetName}
        dateStr={roleModalConfig.dateStr}
        classLevel={roleModalConfig.classLevel}
        onAssignRole={(role) => {
          if (!roleModalConfig.cadetName || !roleModalConfig.classLevel || !roleModalConfig.dateStr) return;
          const classLevel = roleModalConfig.classLevel;
          const apiUrl = classLevel === '1CL' ? apiUrl1CL : classLevel === '2CL' ? apiUrl2CL : apiUrl3CL;
          const colorMap = classLevel === '1CL' ? ROLE_COLORS_1CL : classLevel === '2CL' ? ROLE_COLORS_2CL : ROLE_COLORS_3CL;
          const roleColor = colorMap[role] || '#000000';
          setPendingChanges(prev => [...prev, {
            classLevel,
            dateStr: roleModalConfig.dateStr,
            role,
            apiUrl,
            payload: {
              action: 'assignGuard',
              cadetName: roleModalConfig.cadetName,
              date: roleModalConfig.dateStr,
              color: roleColor,
              previousCadetName: ''
            }
          }]);
          setRoleModalConfig({ isOpen: false });
        }}
      />
    </div>
  );
}



// Temporary inline component for the modal
function NonPostingListModal({ isOpen, onClose, classLevel, dateStr, permanentList, todayList, tomorrowList, soiData, onTogglePermanent, onRemoveTemporary, isMobile }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allCadets = soiData.filter(row => {
    const cl = String(row['CL'] || row['CLASS'] || '').trim();
    if (classLevel === '1CL') return cl === '1' || cl === '1CL';
    if (classLevel === '2CL') return cl === '2' || cl === '2CL';
    return cl === '3' || cl === '3CL';
  }).map(row => String(row['SURNAME'] || '').trim()).filter(Boolean);
  const uniqueCadets = [...new Set(allCadets)].sort();

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-secondary)', padding: isMobile ? '1rem' : '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{classLevel} Non-Posting List</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
          <div>
            <h4 style={{ color: '#8b5cf6', borderBottom: '2px solid #8b5cf6', paddingBottom: '0.5rem' }}>Permanent</h4>
            {permanentList.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None assigned.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {permanentList.map(g => (
                  <li key={g.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-primary)', marginBottom: '0.5rem', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                    <button onClick={() => onTogglePermanent(g.name, false)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
              <input type="text" placeholder="Search cadet to add..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '0.5rem' }} />
              {searchTerm && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  {uniqueCadets.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase())).map(name => (
                    <div key={name} onClick={() => { onTogglePermanent(name, true); setSearchTerm(''); }} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      {name} <span style={{ color: '#10b981', fontSize: '0.8rem', float: 'right' }}>+ Add</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#60a5fa', borderBottom: '2px solid #60a5fa', paddingBottom: '0.5rem' }}>Temporary ({dateStr})</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>To add temporary non-posting, close this modal and use the <strong>+ Add Non-Posting</strong> button.</p>
            {todayList.length === 0 && tomorrowList.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None assigned for today/tomorrow.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {todayList.map(g => (
                  <li key={`today-${g.name}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-primary)', marginBottom: '0.5rem', borderRadius: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>(Today)</span>
                    </div>
                    <button onClick={() => onRemoveTemporary(g.name, false)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                  </li>
                ))}
                {tomorrowList.map(g => (
                  <li key={`tomorrow-${g.name}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-primary)', marginBottom: '0.5rem', borderRadius: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>(Tomorrow)</span>
                    </div>
                    <button onClick={() => onRemoveTemporary(g.name, true)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSelectionModal({ isOpen, onClose, cadetName, dateStr, classLevel, onAssignRole }) {
  if (!isOpen) return null;
  
  const roles1CL = ['FLOOR INSPECTOR', 'INTERIOR', 'SENTINEL', 'NON-POSTING'];
  const roles2CL = ['PLEBE DETAIL', 'SENTINEL (TOC)', 'INTERIOR', 'AFI', 'NON-POSTING'];
  const roles3CL = ['CCQ', 'ACCQ', 'AFI', 'MHC', 'INTERIOR', 'SENTINEL', 'NON-POSTING'];
  
  const roles = classLevel === '1CL' ? roles1CL : classLevel === '2CL' ? roles2CL : roles3CL;
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '1rem'
    }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>Assign Role</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Assigning <strong>{cadetName}</strong> ({classLevel}) on <strong>{dateStr}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {roles.map(r => (
              <button
                key={r}
                onClick={() => onAssignRole(r)}
                style={{
                  padding: '0.75rem', textAlign: 'left', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(59, 130, 246, 0.1)'; e.target.style.borderColor = '#3b82f6'; }}
                onMouseLeave={e => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.borderColor = 'var(--border-color)'; }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TallySheetModal({ isOpen, onClose, tally1CL, tally2CL, tally3CL, soiData, postedDateObj, pendingChanges, isUploading, handleUploadChanges, onAssignFromTally }) {
  const [activeTab, setActiveTab] = useState('1CL');
  const [weekOffset, setWeekOffset] = useState(0);
  const [animState, setAnimState] = useState({ opacity: 1, transform: 'translateX(0)', transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' });
  const [hoveredCell, setHoveredCell] = useState(null); // { cadet, dateStr }

  if (!isOpen) return null;

  const handlePrev = () => {
    setAnimState({ opacity: 0, transform: 'translateX(20px)', transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' });
    setTimeout(() => {
      setWeekOffset(prev => prev - 1);
      setAnimState({ opacity: 0, transform: 'translateX(-20px)', transition: 'none' });
      // Force reflow
      setTimeout(() => {
        setAnimState({ opacity: 1, transform: 'translateX(0)', transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' });
      }, 50);
    }, 150);
  };

  const handleNext = () => {
    setAnimState({ opacity: 0, transform: 'translateX(-20px)', transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' });
    setTimeout(() => {
      setWeekOffset(prev => prev + 1);
      setAnimState({ opacity: 0, transform: 'translateX(20px)', transition: 'none' });
      // Force reflow
      setTimeout(() => {
        setAnimState({ opacity: 1, transform: 'translateX(0)', transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' });
      }, 50);
    }, 150);
  };

  // Compute the 7 days starting from postedDateObj - 3 days + weekOffset * 7 (index 3 is today)
  const dates = [];
  const start = new Date(postedDateObj);
  start.setDate(start.getDate() - 3 + (weekOffset * 7));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatHeader = (date) => date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' });

  const isToday = (date) => date.toDateString() === new Date(postedDateObj).toDateString();

  // Get tally for current class
  const baseTally = activeTab === '1CL' ? tally1CL : activeTab === '2CL' ? tally2CL : tally3CL;

  // Merge pendingChanges into the tally for immediate visual feedback
  const activeTally = (() => {
    const merged = {};
    // Copy base
    Object.keys(baseTally).forEach(cadet => {
      merged[cadet] = { ...(baseTally[cadet] || {}) };
    });
    // Overlay pending changes for this class
    (pendingChanges || []).forEach(change => {
      if (change.classLevel !== activeTab) return;
      const cadetName = change.payload?.cadetName;
      const dateStr = change.payload?.date;
      const role = change.role;
      if (!cadetName || !dateStr || !role) return;
      if (!merged[cadetName]) merged[cadetName] = {};
      const colorMap = activeTab === '1CL' ? ROLE_COLORS_1CL : activeTab === '2CL' ? ROLE_COLORS_2CL : ROLE_COLORS_3CL;
      merged[cadetName][dateStr] = { label: role, color: colorMap[role] || '#64748b', pending: true };
    });
    return merged;
  })();

  // Get cadets for current class
  const classCadets = soiData.filter(row => {
    const cl = String(row['CL'] || row['CLASS'] || '').trim();
    if (activeTab === '1CL') return cl === '1' || cl === '1CL';
    if (activeTab === '2CL') return cl === '2' || cl === '2CL';
    return cl === '3' || cl === '3CL';
  }).map(row => String(row['SURNAME'] || '').trim()).filter(Boolean);

  const uniqueCadets = [...new Set(classCadets)].sort();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1400px',
        height: '95vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 900, letterSpacing: '0.05em' }}>WEEKLY POSTING TALLY</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={handlePrev}
                style={{ padding: '0.25rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                &larr; Prev
              </button>
              <div style={{ width: '1px', height: '1.5rem', background: 'var(--border-color)', margin: '0 0.25rem' }} />
              <button 
                onClick={handleNext}
                style={{ padding: '0.25rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                Next &rarr;
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>&times;</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0.75rem 2rem', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          {['1CL', '2CL', '3CL'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               style={{
                 padding: '0.4rem 1.5rem',
                 borderRadius: '999px',
                 border: '1px solid',
                 borderColor: activeTab === tab ? '#3b82f6' : 'var(--border-color)',
                 backgroundColor: activeTab === tab ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                 color: activeTab === tab ? '#3b82f6' : 'var(--text-secondary)',
                 fontWeight: 800,
                 cursor: 'pointer',
                 transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
               }}
               onMouseEnter={e => {
                 if (activeTab !== tab) {
                   e.target.style.color = 'var(--text-primary)';
                   e.target.style.borderColor = 'var(--text-primary)';
                 }
               }}
               onMouseLeave={e => {
                 if (activeTab !== tab) {
                   e.target.style.color = 'var(--text-secondary)';
                   e.target.style.borderColor = 'var(--border-color)';
                 }
               }}
             >
               {tab} POSTINGS
             </button>
          ))}
        </div>

        {/* Tally Grid */}
        <div style={{ overflow: 'auto', flex: 1, padding: '0', background: 'var(--bg-primary)' }}>
          <div style={{ ...animState, minHeight: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.8rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', width: '180px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CADET</th>
                  {dates.map((d, i) => {
                    const today = isToday(d);
                    return (
                      <th key={i} style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center', 
                        borderBottom: '2px solid var(--border-color)', 
                        borderRight: '1px solid var(--border-color)', 
                        minWidth: '100px', 
                        color: today ? '#3b82f6' : 'var(--text-secondary)', 
                        fontWeight: 800,
                        background: today ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                        position: 'relative'
                      }}>
                        {today && <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem', color: '#3b82f6', fontWeight: 900 }}>TODAY</div>}
                        <div style={{ fontSize: today ? '0.9rem' : '0.8rem' }}>{formatHeader(d)}</div>
                        {today && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#3b82f6' }} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {uniqueCadets.map((cadet, rowIdx) => (
                  <tr key={cadet} style={{ borderBottom: '1px solid var(--border-color)', background: rowIdx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}>
                    <td style={{ padding: '0.35rem 1rem', fontWeight: 600, borderRight: '1px solid var(--border-color)', position: 'sticky', left: 0, background: 'inherit', zIndex: 5, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {cadet}
                    </td>
                    {dates.map((d, colIdx) => {
                      const dateStr = formatDate(d);
                      const posting = activeTally[cadet] ? activeTally[cadet][dateStr] : null;
                      const today = isToday(d);
                      const cellKey = `${cadet}__${dateStr}`;
                      const isHovered = hoveredCell === cellKey;
                      return (
                        <td
                          key={colIdx}
                          style={{
                            borderRight: '1px solid var(--border-color)',
                            padding: '0.2rem 0.35rem',
                            textAlign: 'center',
                            background: today
                              ? 'rgba(59, 130, 246, 0.02)'
                              : isHovered && !posting
                              ? 'rgba(59, 130, 246, 0.06)'
                              : 'transparent',
                            cursor: posting ? 'default' : 'pointer',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            if (!posting) {
                              onAssignFromTally(cadet, activeTab, dateStr);
                            }
                          }}
                          title={posting ? posting.label : `Click to assign ${cadet} on ${dateStr}`}
                        >
                          {posting ? (
                            <div
                              style={{
                                background: posting.color,
                                color: '#fff',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                display: 'inline-block',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                boxShadow: posting.pending
                                  ? '0 0 0 2px #facc15, 0 2px 4px rgba(0,0,0,0.1)'
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100px',
                                opacity: posting.pending ? 0.85 : 1,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              {posting.label}
                              {posting.pending && <span style={{ fontSize: '0.55rem', marginLeft: '3px', opacity: 0.8 }}>●</span>}
                            </div>
                          ) : (
                            <div style={{
                              height: '24px',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isHovered ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                              fontSize: '1rem',
                              transition: 'color 0.15s',
                              userSelect: 'none'
                            }}>+</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {uniqueCadets.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No cadets found for {activeTab}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Changes Button — inside modal */}
        {pendingChanges && pendingChanges.length > 0 && (
          <div style={{
            padding: '0.75rem 2rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {pendingChanges.length} unsaved {pendingChanges.length === 1 ? 'change' : 'changes'}
            </span>
            <button
              onClick={handleUploadChanges}
              disabled={isUploading}
              style={{
                backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                padding: '0.5rem 1.5rem', borderRadius: '999px', fontWeight: 800,
                cursor: isUploading ? 'wait' : 'pointer',
                opacity: isUploading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                fontSize: '0.9rem', letterSpacing: '0.03em'
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
