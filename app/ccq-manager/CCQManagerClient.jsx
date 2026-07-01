'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const POSITION_LABELS = [
  { code: 'OD',    label: 'Officer of the Day' },
  { code: 'OG1',   label: 'Officer of the Guard 1' },
  { code: 'OG2',   label: 'Officer of the Guard 2' },
  { code: 'SG1',   label: 'Sergeant of the Guard 1' },
  { code: 'SG2',   label: 'Sergeant of the Guard 2' },
  { code: 'CAMO1', label: 'Cadet Asst. to Mess Officer 1' },
  { code: 'CAMO2', label: 'Cadet Asst. to Mess Officer 2' },
  { code: 'CEMA',  label: 'Cadet Equipment Maintenance Asst.' },
  { code: 'CAMOD', label: 'Cadet Asst. to Medical OD' },
  { code: 'CAL',   label: 'Cadet Asst. to Librarian' },
  { code: 'AS1',   label: 'Area Sergeant 1' },
  { code: 'AS2',   label: 'Area Sergeant 2' },
  { code: 'MOG',   label: 'Messenger of the Guard' }
];

export default function CCQManagerClient({
  initialOcName = '',
  initialAocName = '',
  initialGuards = Array(13).fill(''),
  initialSocRows = [],
  initialBestState = {
    '1CL_Locker': '', '1CL_Shoe': '', '1CL_Bunks': '', '1CL_Table': '', '1CL_Room': '',
    '2CL_Locker': '', '2CL_Shoe': '', '2CL_Bunks': '', '2CL_Table': '', '2CL_Room': '',
    '3CL_Locker': '', '3CL_Shoe': '', '3CL_Bunks': '', '3CL_Table': '', '3CL_Room': ''
  }
}) {
  const { adminUser, isLoaded } = useAuth();
  
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbzl8cpIaWa5jk3a0fjYztuwotflL36rMjEGw83FeqFI-EA067WTzULacpUNIuznSqOAfg/exec';

  // Section 1: OC & AOC State
  const [ocName, setOcName] = useState(initialOcName);
  const [aocName, setAocName] = useState(initialAocName);
  const [ocSubmitting, setOcSubmitting] = useState(false);

  // Section 2: Interior Guards State
  const [guardNames, setGuardNames] = useState(initialGuards);
  const [guardsSubmitting, setGuardsSubmitting] = useState(false);

  // Section 3: Schedule of Calls State
  const [socRows, setSocRows] = useState(initialSocRows);
  const [socSubmitting, setSocSubmitting] = useState(false);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');

  // Section 4: Daily Best Best State (Class-divided)
  const [bestState, setBestState] = useState(initialBestState);
  const [bestClassTab, setBestClassTab] = useState('1CL');
  const [bestSubmitting, setBestSubmitting] = useState(false);

  // Unified publishing state
  const [publishAllSubmitting, setPublishAllSubmitting] = useState(false);

  // Rocket Upload Animation States
  const [isUploading, setIsUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Countdowns to reset times
  const [ocCountdown, setOcCountdown] = useState('');
  const [guardsCountdown, setGuardsCountdown] = useState('');
  const [bestCountdown, setBestCountdown] = useState('');

  useEffect(() => {
    const calculateCountdowns = () => {
      const now = new Date();
      const phtOffset = 8 * 3600000;
      const nowPHT = new Date(now.getTime() + phtOffset);
      const y = nowPHT.getUTCFullYear();
      const m = nowPHT.getUTCMonth();
      const d = nowPHT.getUTCDate();

      const formatDiff = (targetUTC) => {
        const diffMs = targetUTC - now;
        if (diffMs <= 0) return 'Expired';
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        return `${hours}h ${mins}m`;
      };

      let ocTarget = new Date(Date.UTC(y, m, d, 9 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 9) ocTarget = new Date(Date.UTC(y, m, d + 1, 9 - 8, 0, 0, 0));
      setOcCountdown(formatDiff(ocTarget));

      let guardsTarget = new Date(Date.UTC(y, m, d, 19 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 19) guardsTarget = new Date(Date.UTC(y, m, d + 1, 19 - 8, 0, 0, 0));
      setGuardsCountdown(formatDiff(guardsTarget));

      let bestTarget = new Date(Date.UTC(y, m, d, 12 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 12) bestTarget = new Date(Date.UTC(y, m, d + 1, 12 - 8, 0, 0, 0));
      setBestCountdown(formatDiff(bestTarget));
    };

    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 60000);
    return () => clearInterval(interval);
  }, []);

  // Parse docx file using mammoth
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);

    try {
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, 'text/html');
      const tables = doc.querySelectorAll('table');
      if (!tables.length) {
        alert('No table detected in this document. Please enter calls manually.');
        return;
      }

      let mainTable = tables[0];
      for (const t of tables) {
        if (t.querySelectorAll('tr').length > mainTable.querySelectorAll('tr').length) {
          mainTable = t;
        }
      }

      const trElements = Array.from(mainTable.querySelectorAll('tr'));
      const grid = [];
      const activeRowSpans = [];

      trElements.forEach((tr) => {
        const rowCells = [];
        const tdElements = Array.from(tr.querySelectorAll('td, th'));
        
        let tdIndex = 0;
        for (let colIndex = 0; colIndex < 4; colIndex++) {
          if (activeRowSpans[colIndex] && activeRowSpans[colIndex].remaining > 0) {
            rowCells[colIndex] = activeRowSpans[colIndex].value;
            activeRowSpans[colIndex].remaining--;
          } else {
            const td = tdElements[tdIndex];
            if (td) {
              const text = td.textContent.trim();
              const rowspan = parseInt(td.getAttribute('rowspan') || '1', 10);
              rowCells[colIndex] = text;
              
              if (rowspan > 1) {
                activeRowSpans[colIndex] = {
                  remaining: rowspan - 1,
                  value: text
                };
              }
              tdIndex++;
            } else {
              rowCells[colIndex] = '';
            }
          }
        }
        grid.push(rowCells);
      });

      const parsedRows = [];
      let headerSkipped = false;

      grid.forEach(cells => {
        if (!headerSkipped) {
          if (cells.some(c => c.toUpperCase().includes('TIME') || c.toUpperCase().includes('ACTIVITY'))) {
            headerSkipped = true;
            return;
          }
          headerSkipped = true;
        }
        if (cells.some(c => c !== '')) {
          parsedRows.push({
            time: cells[0] || '',
            activity: cells[1] || '',
            uniform: cells[2] || '',
            formation: cells[3] || ''
          });
        }
      });

      setSocRows(parsedRows);
    } catch (err) {
      console.error(err);
      alert('Error parsing .docx file.');
    }
  };

  const handlePost = async (actionName, payload, setSubmitting) => {
    setSubmitting(true);
    setIsUploading(true);
    setIsLaunching(false);
    try {
      const res = await fetch('/api/ccq/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl, action: actionName, ...payload })
      });
      const data = await res.json();
      if (!res.ok || (data.status !== 'success' && !data.success)) {
        throw new Error(data.error || 'Failed to update Google Sheet.');
      }
      
      // Trigger rocket blastoff animation
      setIsLaunching(true);
      setTimeout(() => {
        setIsUploading(false);
        setIsLaunching(false);
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      }, 800);

    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setIsLaunching(false);
      alert(`Publish Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const buildBestPayload = () => {
    return [
      { category: '1CL Best Locker', value: bestState['1CL_Locker'] },
      { category: '1CL Best Shoe Display', value: bestState['1CL_Shoe'] },
      { category: '1CL Best Bunks', value: bestState['1CL_Bunks'] },
      { category: '1CL Best Study Table Display', value: bestState['1CL_Table'] },
      { category: '1CL Best Room', value: bestState['1CL_Room'] },
      { category: '2CL Best Locker', value: bestState['2CL_Locker'] },
      { category: '2CL Best Shoe Display', value: bestState['2CL_Shoe'] },
      { category: '2CL Best Bunks', value: bestState['2CL_Bunks'] },
      { category: '2CL Best Study Table Display', value: bestState['2CL_Table'] },
      { category: '2CL Best Room', value: bestState['2CL_Room'] },
      { category: '3CL Best Locker', value: bestState['3CL_Locker'] },
      { category: '3CL Best Shoe Display', value: bestState['3CL_Shoe'] },
      { category: '3CL Best Bunks', value: bestState['3CL_Bunks'] },
      { category: '3CL Best Study Table Display', value: bestState['3CL_Table'] },
      { category: '3CL Best Room', value: bestState['3CL_Room'] }
    ];
  };

  // Publish everything at once
  const handlePublishAll = async () => {
    setPublishAllSubmitting(true);
    setIsUploading(true);
    setIsLaunching(false);
    
    const guardsPayload = POSITION_LABELS.map((p, idx) => ({
      position: p.label,
      code: p.code,
      name: guardNames[idx]
    }));

    const payload = {
      ocName,
      aocName,
      guards: guardsPayload,
      rows: socRows,
      fileData: fileBase64,
      fileName: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      entries: buildBestPayload()
    };

    try {
      const res = await fetch('/api/ccq/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl, action: 'publishAll', ...payload })
      });
      const data = await res.json();
      if (!res.ok || (data.status !== 'success' && !data.success)) {
        throw new Error(data.error || 'Failed to batch update Google Sheets.');
      }
      
      // Trigger rocket blastoff animation
      setIsLaunching(true);
      setTimeout(() => {
        setIsUploading(false);
        setIsLaunching(false);
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      }, 800);

    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setIsLaunching(false);
      alert(`Publish All Failed: ${err.message}`);
    } finally {
      setPublishAllSubmitting(false);
    }
  };

  const handleBestInputChange = (key, val) => {
    setBestState(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // Auth gate check
  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-primary)' }}>
        <h3>Authenticating CCQ Credentials...</h3>
      </div>
    );
  }

  const isCCQ = adminUser?.council === 'CCQ' || adminUser?.council === 'S6' || String(adminUser?.council || '').toUpperCase().includes('CEIS');

  if (!isCCQ) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid #ef4444', borderRadius: '12px', padding: '2.5rem', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginTop: 0 }}>🚫 ACCESS DENIED</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Only the Cadet-in-Charge of Quarters (CCQ) or CEIS Officer can access this bulletin board manager page. Please log in as BravoCCQ or BravoCEIS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)', maxWidth: '1600px', margin: '0 auto' }}>
      
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          animation: 'slide-down 0.3s ease-out forwards'
        }}>
          <span>✅</span> CCQ BULLETIN UPDATED SUCCESSFULLY
        </div>
      )}

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
              15% { transform: translateY(20px) scale(0.9); }
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
            {!isLaunching && (
              <>
                <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px', background: '#cbd5e1', borderRadius: '50%', animation: 'smokeParticles 0.8s infinite ease-out', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-10px', left: '30%', transform: 'translateX(-50%)', width: '15px', height: '15px', background: '#94a3b8', borderRadius: '50%', animation: 'smokeParticles 0.9s infinite ease-out 0.2s', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-15px', left: '70%', transform: 'translateX(-50%)', width: '25px', height: '25px', background: '#e2e8f0', borderRadius: '50%', animation: 'smokeParticles 1s infinite ease-out 0.4s', zIndex: 1 }}></div>
              </>
            )}
          </div>
          <h2 style={{ margin: 0, fontWeight: 900, letterSpacing: '0.15em', fontSize: '2rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s', textTransform: 'uppercase', textAlign: 'center', padding: '0 1.5rem' }}>UPLOADING TO BULLETIN...</h2>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '1rem', marginBottom: '0.2rem', fontSize: '1.1rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s', textAlign: 'center', padding: '0 1.5rem' }}>Syncing data with the Google Sheets database.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .manager-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 5rem;
        }
        @media (min-width: 1024px) {
          .manager-grid {
            grid-template-columns: 1fr 1.2fr 1.5fr;
          }
        }
        .manager-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .manager-section-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .manager-input-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          display: block;
          margin-bottom: 0.25rem;
        }
        .manager-input {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          width: 100%;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }
        .manager-input:focus {
          border-color: var(--accent-gold);
          outline: none;
        }
        .manager-btn-gold {
          background: var(--accent-gold);
          color: #000;
          font-weight: 700;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .manager-btn-gold:hover {
          background: #e5c158;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
        }
        .manager-btn-secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
          font-weight: 600;
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .manager-btn-secondary:hover {
          background: var(--bg-secondary);
          border-color: var(--text-secondary);
        }
        .sticky-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border-top: 2px solid var(--border-color);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        }
        .class-tab {
          flex: 1;
          text-align: center;
          padding: 0.4rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
        }
        .class-tab.active {
          background: var(--accent-gold);
          color: #000;
          border-color: var(--accent-gold);
        }
      `}} />

      {/* TOP HEADER */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 850, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          CCQ Bulletin Manager
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Instantly publish and sync details for the Bravo Company digital duty roster boards
        </p>
      </div>

      {/* 3-COLUMN MANAGER GRID */}
      <div className="manager-grid">
        
        {/* COLUMN 1: DUTY OFFICERS & DAILY BEST BEST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1.1: OC & AOC */}
          <div className="manager-card">
            <div className="manager-section-header">
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                💂‍♂️ Duty Officers
              </h2>
              <span className="badge bg-secondary text-light" style={{ fontSize: '0.7rem' }}>
                Expires: {ocCountdown}
              </span>
            </div>
            
            <label className="manager-input-label">Officer in Charge (OC)</label>
            <input
              type="text"
              className="manager-input"
              placeholder="e.g. CPT JOHN DOE PA"
              value={ocName}
              onChange={(e) => setOcName(e.target.value)}
            />

            <label className="manager-input-label">Assistant OC (AOC)</label>
            <input
              type="text"
              className="manager-input"
              placeholder="e.g. LT JANE DOE PN"
              value={aocName}
              onChange={(e) => setAocName(e.target.value)}
            />

            <div style={{ marginTop: '0.5rem' }}>
              <button
                className="manager-btn-gold"
                disabled={ocSubmitting}
                onClick={() => handlePost('publishOCAOC', { ocName, aocName }, setOcSubmitting)}
              >
                {ocSubmitting ? 'Publishing...' : '📢 Publish Officers'}
              </button>
            </div>
          </div>

          {/* Section 1.2: Daily Best-Best */}
          <div className="manager-card">
            <div className="manager-section-header" style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                🏆 Best-Best Awards
              </h2>
              <span className="badge bg-secondary text-light" style={{ fontSize: '0.7rem' }}>
                Expires: {bestCountdown}
              </span>
            </div>

            {/* Class Tabs Toggle */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {['1CL', '2CL', '3CL'].map(cls => (
                <div 
                  key={cls} 
                  className={`class-tab ${bestClassTab === cls ? 'active' : ''}`}
                  onClick={() => setBestClassTab(cls)}
                >
                  {cls}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {/* Best Locker */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="manager-input-label">🔒 Best Locker Winner</label>
                <input 
                  type="text" 
                  className="manager-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Winner Name" 
                  value={bestState[`${bestClassTab}_Locker`]} 
                  onChange={(e) => handleBestInputChange(`${bestClassTab}_Locker`, e.target.value)} 
                />
              </div>

              {/* Best Shoe Display */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="manager-input-label">👟 Best Shoe Display Winner</label>
                <input 
                  type="text" 
                  className="manager-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Winner Name" 
                  value={bestState[`${bestClassTab}_Shoe`]} 
                  onChange={(e) => handleBestInputChange(`${bestClassTab}_Shoe`, e.target.value)} 
                />
              </div>

              {/* Best Bunks */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="manager-input-label">🛏️ Best Bunks Winner</label>
                <input 
                  type="text" 
                  className="manager-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Winner Name" 
                  value={bestState[`${bestClassTab}_Bunks`]} 
                  onChange={(e) => handleBestInputChange(`${bestClassTab}_Bunks`, e.target.value)} 
                />
              </div>

              {/* Best Study Table */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="manager-input-label">📚 Best Study Table Winner</label>
                <input 
                  type="text" 
                  className="manager-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Winner Name" 
                  value={bestState[`${bestClassTab}_Table`]} 
                  onChange={(e) => handleBestInputChange(`${bestClassTab}_Table`, e.target.value)} 
                />
              </div>

              {/* Best Room */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="manager-input-label">🏠 Best Room Number</label>
                <input 
                  type="text" 
                  className="manager-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="e.g. RM 211" 
                  value={bestState[`${bestClassTab}_Room`]} 
                  onChange={(e) => handleBestInputChange(`${bestClassTab}_Room`, e.target.value)} 
                />
              </div>
            </div>

            <div>
              <button
                className="manager-btn-gold"
                disabled={bestSubmitting}
                onClick={() => handlePost('publishBestBest', { entries: buildBestPayload() }, setBestSubmitting)}
              >
                {bestSubmitting ? 'Publishing...' : '🏆 Publish Best-Best'}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: INTERIOR GUARDS DETAIL */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div className="manager-section-header">
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
              🛡️ Interior Guards Detail
            </h2>
            <span className="badge bg-secondary text-light" style={{ fontSize: '0.7rem' }}>
              Expires: {guardsCountdown}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {POSITION_LABELS.map((p, idx) => (
              <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '60px', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.75rem' }}>
                  {p.code}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="manager-input"
                    style={{ marginBottom: 0 }}
                    placeholder={p.label}
                    value={guardNames[idx]}
                    onChange={(e) => {
                      const next = [...guardNames];
                      next[idx] = e.target.value;
                      setGuardNames(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <button
              className="manager-btn-gold"
              disabled={guardsSubmitting}
              onClick={() => {
                const guardsPayload = POSITION_LABELS.map((p, idx) => ({
                  position: p.label,
                  code: p.code,
                  name: guardNames[idx]
                }));
                handlePost('publishGuards', { guards: guardsPayload }, setGuardsSubmitting);
              }}
            >
              {guardsSubmitting ? 'Publishing...' : '🛡️ Publish Guards List'}
            </button>
          </div>
        </div>

        {/* COLUMN 3: SCHEDULE OF CALLS */}
        <div className="command-card" style={{ height: 'fit-content' }}>
          <div className="manager-section-header">
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
              📅 Schedule of Calls
            </h2>
          </div>

          {/* Docx uploader */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.25rem'
          }}>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Upload SOC Word document (.docx) to auto-extract the calls list
            </p>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="soc-file-manager"
            />
            <label htmlFor="soc-file-manager" className="manager-btn-secondary" style={{ cursor: 'pointer' }}>
              📁 Choose .docx Document
            </label>
            {fileName && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                Selected: {fileName}
              </div>
            )}
          </div>

          {/* Interactive grid list */}
          <div style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                  <th style={{ padding: '0.4rem' }}>TIME</th>
                  <th style={{ padding: '0.4rem' }}>ACTIVITY</th>
                  <th style={{ padding: '0.4rem' }}>UNIFORM</th>
                  <th style={{ padding: '0.4rem' }}>FORMATION</th>
                  <th style={{ padding: '0.4rem', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {socRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.2rem' }}>
                      <input type="text" className="manager-input" style={{ marginBottom: 0, padding: '0.3rem' }} value={row.time} onChange={(e) => {
                        const next = [...socRows]; next[idx].time = e.target.value; setSocRows(next);
                      }} />
                    </td>
                    <td style={{ padding: '0.2rem' }}>
                      <input type="text" className="manager-input" style={{ marginBottom: 0, padding: '0.3rem' }} value={row.activity} onChange={(e) => {
                        const next = [...socRows]; next[idx].activity = e.target.value; setSocRows(next);
                      }} />
                    </td>
                    <td style={{ padding: '0.2rem' }}>
                      <input type="text" className="manager-input" style={{ marginBottom: 0, padding: '0.3rem' }} value={row.uniform} onChange={(e) => {
                        const next = [...socRows]; next[idx].uniform = e.target.value; setSocRows(next);
                      }} />
                    </td>
                    <td style={{ padding: '0.2rem' }}>
                      <input type="text" className="manager-input" style={{ marginBottom: 0, padding: '0.3rem' }} value={row.formation} onChange={(e) => {
                        const next = [...socRows]; next[idx].formation = e.target.value; setSocRows(next);
                      }} />
                    </td>
                    <td style={{ padding: '0.2rem', textAlign: 'center' }}>
                      <button className="manager-btn-secondary" style={{ padding: '0.25rem', borderColor: 'transparent', color: '#ef4444' }} onClick={() => setSocRows(socRows.filter((_, rIdx) => rIdx !== idx))}>
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="manager-btn-secondary" onClick={() => setSocRows([...socRows, { time: '', activity: '', uniform: '', formation: '' }])}>
              ➕ Add Row
            </button>
            <button className="manager-btn-gold" disabled={socSubmitting} onClick={() => handlePost('publishSOC', { rows: socRows, fileData: fileBase64, fileName: fileName }, setSocSubmitting)}>
              {socSubmitting ? 'Publishing...' : '📅 Publish Calls List'}
            </button>
          </div>
        </div>

      </div>

      {/* STICKY BOTTOM ACTIONS FOOTER */}
      <div className="sticky-footer">
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>BRAVO CQ ACTION BOARD</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Publish and sync all four bulletin sections simultaneously.</p>
        </div>
        <div>
          <button
            className="manager-btn-gold"
            style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem', gap: '0.75rem' }}
            disabled={publishAllSubmitting}
            onClick={handlePublishAll}
          >
            {publishAllSubmitting ? 'Publishing All Sections...' : '🚀 PUBLISH ALL BULLETIN UPDATES'}
          </button>
        </div>
      </div>

    </div>
  );
}
