'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const POSITION_LABELS = [
  { code: 'OD',    label: 'Officer of the Day' },
  { code: 'OG1',   label: 'Officer of the Guard 1' },
  { code: 'OG2',   label: 'Officer of the Guard 2' },
  { code: 'SG1',   label: 'Sergeant of the Guard 1' },
  { code: 'SG2',   label: 'Sergeant of the Guard 2' },
  { code: 'CAMO1', label: 'Cadet Assistant to the Mess Officer 1' },
  { code: 'CAMO2', label: 'Cadet Assistant to the Mess Officer 2' },
  { code: 'CEMA',  label: 'Cadet Equipment Maintenance Assistant' },
  { code: 'CAMOD', label: 'Cadet Assistant to the Medical Officer of the Day' },
  { code: 'CAL',   label: 'Cadet Assistant to the Librarian' },
  { code: 'AS1',   label: 'Area Sergeant 1' },
  { code: 'AS2',   label: 'Area Sergeant 2' },
  { code: 'MOG',   label: 'Messenger of the Guard' }
];

export default function CCQManagerClient() {
  const { adminUser, isLoaded } = useAuth();
  
  const [scriptUrl, setScriptUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScriptUrl(localStorage.getItem('ccq_script_url') || 'https://script.google.com/macros/s/AKfycbzl8cpIaWa5jk3a0fjYztuwotflL36rMjEGw83FeqFI-EA067WTzULacpUNIuznSqOAfg/exec');
    }
  }, []);

  const handleSaveUrl = (url) => {
    setScriptUrl(url);
    localStorage.setItem('ccq_script_url', url);
    alert('Apps Script URL Saved!');
  };

  // Section 1: OC & AOC State
  const [ocName, setOcName] = useState('');
  const [aocName, setAocName] = useState('');
  const [ocSubmitting, setOcSubmitting] = useState(false);

  // Section 2: Interior Guards State
  const [guardNames, setGuardNames] = useState(Array(13).fill(''));
  const [guardsSubmitting, setGuardsSubmitting] = useState(false);

  // Section 3: Schedule of Calls State
  const [socRows, setSocRows] = useState([]);
  const [socSubmitting, setSocSubmitting] = useState(false);
  const [socFile, setSocFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');

  // Section 4: Daily Best Best State
  const [bestLockerWinner, setBestLockerWinner] = useState('');
  const [bestLockerRoom, setBestLockerRoom] = useState('');
  const [bestShoeWinner, setBestShoeWinner] = useState('');
  const [bestShoeRoom, setBestShoeRoom] = useState('');
  const [bestBunksWinner, setBestBunksWinner] = useState('');
  const [bestBunksRoom, setBestBunksRoom] = useState('');
  const [bestTableWinner, setBestTableWinner] = useState('');
  const [bestTableRoom, setBestTableRoom] = useState('');
  const [bestRoomWinner, setBestRoomWinner] = useState('');
  const [bestRoomRoom, setBestRoomRoom] = useState('');
  const [bestSubmitting, setBestSubmitting] = useState(false);

  // Expire Countdowns
  const [ocCountdown, setOcCountdown] = useState('');
  const [guardsCountdown, setGuardsCountdown] = useState('');
  const [socCountdown, setSocCountdown] = useState('');
  const [bestCountdown, setBestCountdown] = useState('');

  // Accordion Sections Open State
  const [openSection, setOpenSection] = useState('url'); // 'url', 'oc', 'guards', 'soc', 'best'

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
        return `${hours}h ${mins}m remaining`;
      };

      // OC reset: 9am PHT today (or next day if past 9am)
      let ocTarget = new Date(Date.UTC(y, m, d, 9 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 9) ocTarget = new Date(Date.UTC(y, m, d + 1, 9 - 8, 0, 0, 0));
      setOcCountdown(formatDiff(ocTarget));

      // Guards reset: 7pm (19:00) PHT today (or next day)
      let guardsTarget = new Date(Date.UTC(y, m, d, 19 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 19) guardsTarget = new Date(Date.UTC(y, m, d + 1, 19 - 8, 0, 0, 0));
      setGuardsCountdown(formatDiff(guardsTarget));

      // SOC reset: Midnight PHT today (16:00 UTC previous day / 16:00 UTC today if PHT is past midnight)
      let socTarget = new Date(Date.UTC(y, m, d, 16, 0, 0, 0));
      if (now >= socTarget) socTarget = new Date(Date.UTC(y, m, d + 1, 16, 0, 0, 0));
      setSocCountdown(formatDiff(socTarget));

      // Best-Best reset: 1200 Noon PHT
      let bestTarget = new Date(Date.UTC(y, m, d, 12 - 8, 0, 0, 0));
      if (nowPHT.getUTCHours() >= 12) bestTarget = new Date(Date.UTC(y, m, d + 1, 12 - 8, 0, 0, 0));
      setBestCountdown(formatDiff(bestTarget));
    };

    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mammoth file parser
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    // Convert file to base64 for Drive upload payload
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

      // Find largest table
      let mainTable = tables[0];
      for (const t of tables) {
        if (t.querySelectorAll('tr').length > mainTable.querySelectorAll('tr').length) {
          mainTable = t;
        }
      }

      const trElements = Array.from(mainTable.querySelectorAll('tr'));
      const grid = [];
      const activeRowSpans = [];

      trElements.forEach((tr, rowIndex) => {
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
      alert('Error parsing .docx file. You can enter rows manually.');
    }
  };

  const handlePost = async (actionName, payload, setSubmitting) => {
    if (!scriptUrl) {
      alert('Please configure your CCQ Apps Script URL first!');
      return;
    }
    setSubmitting(true);
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: actionName, ...payload })
      });
      alert('Published successfully! (Updates should appear on the bulletin shortly)');
    } catch (err) {
      console.error(err);
      alert('Error communicating with Google Sheets. Please confirm script URL is correct.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auth gate check
  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#111416', color: '#fff' }}>
        <h3>Authenticating CCQ Credentials...</h3>
      </div>
    );
  }

  const isCCQ = adminUser?.council === 'CCQ' || adminUser?.council === 'S6' || String(adminUser?.council || '').toUpperCase().includes('CEIS');

  if (!isCCQ) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#111416', padding: '2rem' }}>
        <div style={{ background: '#181d20', border: '1px solid #ef4444', borderRadius: '12px', padding: '2.5rem', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginTop: 0 }}>🚫 ACCESS DENIED</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Only the Cadet-in-Charge of Quarters (CCQ) can access this bulletin board manager page. Please log in as BravoCCQ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#111416', color: '#e2e8f0', minHeight: '100vh', padding: '2rem 1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .accordion-header {
          background: #22282c;
          border: 1px solid #2e353b;
          padding: 1rem 1.25rem;
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          transition: background 0.2s;
        }
        .accordion-header:hover {
          background: #2b3237;
        }
        .accordion-content {
          background: #181d20;
          border: 1px solid #2e353b;
          border-top: none;
          padding: 1.5rem;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          margin-bottom: 1rem;
        }
        .form-input {
          background: #111416;
          border: 1px solid #2e353b;
          color: #fff;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          width: 100%;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }
        .form-input:focus {
          border-color: #d4af37;
          outline: none;
        }
        .btn-gold {
          background: #d4af37;
          color: #111416;
          font-weight: 700;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .btn-gold:hover {
          background: #e5c158;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }
        .btn-secondary {
          background: #2e353b;
          color: #fff;
          font-weight: 600;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #3c454d;
        }
      `}} />

      {/* TOP HEADER */}
      <div style={{ borderBottom: '2px solid #2e353b', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Oswald', letterSpacing: '0.1em', fontSize: '2.2rem', color: '#d4af37', margin: 0 }}>
          CCQ BULLETIN MANAGER
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>
          Publish & update the Bravo Company digital duty roster boards
        </p>
      </div>

      {/* ── SECTION 0: APPS SCRIPT URL CONFIGURATION ── */}
      <div className="accordion-header" onClick={() => setOpenSection(openSection === 'url' ? '' : 'url')}>
        <span>⚙️ Apps Script Configuration</span>
        <span>{openSection === 'url' ? '▲' : '▼'}</span>
      </div>
      {openSection === 'url' && (
        <div className="accordion-content">
          <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>CCQ Google Apps Script Web App URL</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ marginTop: 0 }}
              placeholder="https://script.google.com/macros/s/.../exec"
              defaultValue={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
            />
            <button className="btn-gold" onClick={() => handleSaveUrl(scriptUrl)}>Save</button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
            Ensure your deployed Apps Script web app is set to "Execute as: Me" and "Who has access: Anyone".
          </p>
        </div>
      )}

      {/* ── SECTION 1: OC / AOC ── */}
      <div className="accordion-header" onClick={() => setOpenSection(openSection === 'oc' ? '' : 'oc')}>
        <span>💂‍♂️ Officer in Charge (OC) & Assistant OIC (AOC)</span>
        <span style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'none' }}>{ocCountdown}</span>
      </div>
      {openSection === 'oc' && (
        <div className="accordion-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Officer in Charge (OC) Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CPT JOHN DOE PA"
                value={ocName}
                onChange={(e) => setOcName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Assistant OC (AOC) Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. LT JANE DOE PN"
                value={aocName}
                onChange={(e) => setAocName(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn-gold"
            disabled={ocSubmitting}
            onClick={() => handlePost('publishOCAOC', { ocName, aocName }, setOcSubmitting)}
          >
            {ocSubmitting ? 'Publishing...' : '📢 Publish Duty Officers'}
          </button>
        </div>
      )}

      {/* ── SECTION 2: INTERIOR GUARDS ── */}
      <div className="accordion-header" onClick={() => setOpenSection(openSection === 'guards' ? '' : 'guards')}>
        <span>🛡️ Interior Guard Postings</span>
        <span style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'none' }}>{guardsCountdown}</span>
      </div>
      {openSection === 'guards' && (
        <div className="accordion-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {POSITION_LABELS.map((p, idx) => (
              <div key={p.code}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                  <span style={{ color: '#d4af37', marginRight: '0.25rem' }}>[{p.code}]</span> {p.label}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cadet Rank & Full Name"
                  value={guardNames[idx]}
                  onChange={(e) => {
                    const next = [...guardNames];
                    next[idx] = e.target.value;
                    setGuardNames(next);
                  }}
                />
              </div>
            ))}
          </div>
          <button
            className="btn-gold"
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
            {guardsSubmitting ? 'Publishing...' : '🛡️ Publish Guard Roster'}
          </button>
        </div>
      )}

      {/* ── SECTION 3: SCHEDULE OF CALLS ── */}
      <div className="accordion-header" onClick={() => setOpenSection(openSection === 'soc' ? '' : 'soc')}>
        <span>📅 Schedule of Calls (SOC) Document Upload</span>
        <span style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'none' }}>{socCountdown}</span>
      </div>
      {openSection === 'soc' && (
        <div className="accordion-content">
          {/* WORD FILE UPLOADER */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px dashed #2e353b', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Upload the Schedule of Calls Word Document (.docx). The system will automatically scan it and extract the timetable.
            </p>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="soc-file-input"
            />
            <label htmlFor="soc-file-input" className="btn-gold" style={{ display: 'inline-flex', margin: '0 auto' }}>
              📁 Choose .docx Document
            </label>
            {fileName && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#d4af37', fontWeight: 600 }}>
                Selected: {fileName}
              </div>
            )}
          </div>

          {/* MANUAL TABLE ADJUSTMENT */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#d4af37', borderBottom: '1px solid #2e353b', paddingBottom: '0.5rem' }}>Parsed Table & Manual Edits</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#22282c', borderBottom: '2px solid #2e353b' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>TIME</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>ACTIVITY</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>UNIFORM</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>FORMATION</th>
                  <th style={{ padding: '0.5rem', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {socRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #252b30' }}>
                    <td style={{ padding: '0.25rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: 0 }}
                        value={row.time}
                        onChange={(e) => {
                          const next = [...socRows];
                          next[idx].time = e.target.value;
                          setSocRows(next);
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.25rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: 0 }}
                        value={row.activity}
                        onChange={(e) => {
                          const next = [...socRows];
                          next[idx].activity = e.target.value;
                          setSocRows(next);
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.25rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: 0 }}
                        value={row.uniform}
                        onChange={(e) => {
                          const next = [...socRows];
                          next[idx].uniform = e.target.value;
                          setSocRows(next);
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.25rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: 0 }}
                        value={row.formation}
                        onChange={(e) => {
                          const next = [...socRows];
                          next[idx].formation = e.target.value;
                          setSocRows(next);
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', color: '#ef4444' }}
                        onClick={() => {
                          setSocRows(socRows.filter((_, rIdx) => rIdx !== idx));
                        }}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => setSocRows([...socRows, { time: '', activity: '', uniform: '', formation: '' }])}
            >
              ➕ Add Custom Call Row
            </button>
          </div>

          <button
            className="btn-gold"
            disabled={socSubmitting}
            onClick={() => handlePost('publishSOC', {
              rows: socRows,
              fileData: fileBase64,
              fileName: fileName,
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }, setSocSubmitting)}
          >
            {socSubmitting ? 'Publishing SOC...' : '📅 Publish Schedule of Calls'}
          </button>
        </div>
      )}

      {/* ── SECTION 4: DAILY BEST BEST ── */}
      <div className="accordion-header" onClick={() => setOpenSection(openSection === 'best' ? '' : 'best')}>
        <span>🏆 Daily Best-Best Awards</span>
        <span style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'none' }}>{bestCountdown}</span>
      </div>
      {openSection === 'best' && (
        <div className="accordion-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Locker */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid #2e353b' }}>
              <h4 style={{ color: '#d4af37', margin: '0 0 0.75rem 0' }}>🔒 Best Locker</h4>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Winner Name</label>
              <input type="text" className="form-input" placeholder="Rank & Name" value={bestLockerWinner} onChange={(e) => setBestLockerWinner(e.target.value)} />
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Room Number</label>
              <input type="text" className="form-input" placeholder="e.g. 211" value={bestLockerRoom} onChange={(e) => setBestLockerRoom(e.target.value)} />
            </div>

            {/* Shoe */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid #2e353b' }}>
              <h4 style={{ color: '#d4af37', margin: '0 0 0.75rem 0' }}>👟 Best Shoe Display</h4>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Winner Name</label>
              <input type="text" className="form-input" placeholder="Rank & Name" value={bestShoeWinner} onChange={(e) => setBestShoeWinner(e.target.value)} />
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Room Number</label>
              <input type="text" className="form-input" placeholder="e.g. 212" value={bestShoeRoom} onChange={(e) => setBestShoeRoom(e.target.value)} />
            </div>

            {/* Bunks */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid #2e353b' }}>
              <h4 style={{ color: '#d4af37', margin: '0 0 0.75rem 0' }}>🛏️ Best Bunks</h4>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Winner Name</label>
              <input type="text" className="form-input" placeholder="Rank & Name" value={bestBunksWinner} onChange={(e) => setBestBunksWinner(e.target.value)} />
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Room Number</label>
              <input type="text" className="form-input" placeholder="e.g. 215" value={bestBunksRoom} onChange={(e) => setBestBunksRoom(e.target.value)} />
            </div>

            {/* Table */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid #2e353b' }}>
              <h4 style={{ color: '#d4af37', margin: '0 0 0.75rem 0' }}>📚 Best Study Table Display</h4>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Winner Name</label>
              <input type="text" className="form-input" placeholder="Rank & Name" value={bestTableWinner} onChange={(e) => setBestTableWinner(e.target.value)} />
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Room Number</label>
              <input type="text" className="form-input" placeholder="e.g. 218" value={bestTableRoom} onChange={(e) => setBestTableRoom(e.target.value)} />
            </div>

            {/* Room */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid #2e353b' }}>
              <h4 style={{ color: '#d4af37', margin: '0 0 0.75rem 0' }}>🏠 Best Room</h4>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Winner Name</label>
              <input type="text" className="form-input" placeholder="Rank & Name" value={bestRoomWinner} onChange={(e) => setBestRoomWinner(e.target.value)} />
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Room Number</label>
              <input type="text" className="form-input" placeholder="e.g. 220" value={bestRoomRoom} onChange={(e) => setBestRoomRoom(e.target.value)} />
            </div>
          </div>
          
          <button
            className="btn-gold"
            disabled={bestSubmitting}
            onClick={() => {
              const bestPayload = [
                { category: 'Best Locker', winner: bestLockerWinner, room: bestLockerRoom },
                { category: 'Best Shoe Display', winner: bestShoeWinner, room: bestShoeRoom },
                { category: 'Best Bunks', winner: bestBunksWinner, room: bestBunksRoom },
                { category: 'Best Study Table Display', winner: bestTableWinner, room: bestTableRoom },
                { category: 'Best Room', winner: bestRoomWinner, room: bestRoomRoom }
              ];
              handlePost('publishBestBest', { entries: bestPayload }, setBestSubmitting);
            }}
          >
            {bestSubmitting ? 'Publishing...' : '🏆 Publish Best-Best Awards'}
          </button>
        </div>
      )}
    </div>
  );
}
