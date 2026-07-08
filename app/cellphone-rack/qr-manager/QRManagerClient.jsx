'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/navigation';

export default function QRManagerClient({ initialData }) {
  const { adminUser, isLoaded } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [editingCadet, setEditingCadet] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // S6 access check
  const userCouncil = String(adminUser?.council || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCEIS = userCouncil === 'S6' || userCouncil.includes('CEIS');

  if (isLoaded && !isCEIS) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Only S6 Officers or authorized CEIS personnel can access the QR Code Manager.
        </p>
        <button 
          onClick={() => router.push('/cellphone-rack')}
          className="btn"
          style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
        >
          Return to Smartphone Rack
        </button>
      </div>
    );
  }

  const handleFieldChange = (cadetName, field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [cadetName]: {
        ...(prev[cadetName] || {}),
        [field]: value
      }
    }));
  };

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsSaving(true);

    try {
      const changesArray = Object.entries(pendingChanges).map(([name, changes]) => {
        const cadet = initialData.find(c => c.name === name);
        return { ...cadet, ...changes };
      });

      const res = await fetch('/api/smartphone-rack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changesArray)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setPendingChanges({});
        setEditingCadet(null);
        setShowSuccessToast(true);
        router.refresh();
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        alert(`Failed to save changes: ${result.error || result.details || 'Unknown error'}`);
      }
    } catch (e) {
      alert('Error updating database');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered list
  const filteredCadets = initialData.filter(cadet => {
    const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cadet.model && cadet.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cadet.serial && cadet.serial.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = filterClass === 'All' || cadet.cadetClass === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div>
      {/* Control Panel */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by cadet name, model, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: '0.65rem 1rem', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{
                padding: '0.65rem 1rem', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', outline: 'none', fontWeight: 800
              }}
            >
              <option value="All">All Classes</option>
              <option value="1">1st Class</option>
              <option value="2">2nd Class</option>
              <option value="3">3rd Class</option>
              <option value="4">4th Class</option>
            </select>
          </div>
          
          <button
            onClick={handlePrint}
            style={{
              background: '#10b981', color: '#fff', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            🖨️ PRINT QR LABELS (1x1")
          </button>
        </div>
      </div>

      {/* Roster & QR Table */}
      <div className="card" style={{ overflowX: 'auto', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem' }}>Cadet Name</th>
              <th style={{ padding: '1rem' }}>Class</th>
              <th style={{ padding: '1rem' }}>Phone Details</th>
              <th style={{ padding: '1rem' }}>Serial Number</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>QR Preview</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCadets.map((cadet) => {
              const currentChanges = pendingChanges[cadet.name] || {};
              const activeModel = currentChanges.model !== undefined ? currentChanges.model : cadet.model;
              const activeColor = currentChanges.color !== undefined ? currentChanges.color : cadet.color;
              const activeSerial = currentChanges.serial !== undefined ? currentChanges.serial : cadet.serial;
              const hasNoPhone = !cadet.numPhones || cadet.numPhones === 0 || cadet.status === 'No Smartphone';

              const scanUrl = `${origin}/cellphone-rack/scan?name=${encodeURIComponent(cadet.name)}`;
              const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;

              return (
                <tr key={cadet.name} style={{ borderBottom: '1px solid var(--border-color)', opacity: hasNoPhone ? 0.6 : 1 }}>
                  <td style={{ padding: '1rem', fontWeight: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                        <img src={cadet.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {cadet.name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--accent-gold)', fontWeight: 800 }}>{cadet.cadetClass}CL</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{activeModel}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Color: {activeColor}</div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 800 }}>
                    {activeSerial === 'Not Specified' ? (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not Registered</span>
                    ) : (
                      activeSerial
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    {!hasNoPhone && (
                      <a href={qrCodeSrc} target="_blank" rel="noopener noreferrer" title="Click to view full QR">
                        <img 
                          src={qrCodeSrc} 
                          alt="QR Code" 
                          style={{ width: '50px', height: '50px', background: '#fff', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
                        />
                      </a>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setEditingCadet(cadet)}
                      style={{
                        background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)',
                        border: '1px solid rgba(212, 175, 55, 0.3)', padding: '0.4rem 0.8rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem'
                      }}
                    >
                      ✏️ EDIT DEVICE
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Device Modal */}
      {editingCadet && (() => {
        const cadet = editingCadet;
        const currentChanges = pendingChanges[cadet.name] || {};
        const activeModel = currentChanges.model !== undefined ? currentChanges.model : cadet.model;
        const activeColor = currentChanges.color !== undefined ? currentChanges.color : cadet.color;
        const activeSerial = currentChanges.serial !== undefined ? currentChanges.serial : cadet.serial;
        const activeDbRemarks = currentChanges.dbRemarks !== undefined ? currentChanges.dbRemarks : cadet.dbRemarks;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setEditingCadet(null)}>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
              borderRadius: '24px', padding: '2rem', width: '420px', maxWidth: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Edit Phone: {cadet.name}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span>PHONE MODEL:</span>
                  <input
                    type="text"
                    value={activeModel !== 'Not Specified' ? activeModel : ''}
                    onChange={(e) => handleFieldChange(cadet.name, 'model', e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. iPhone 15 Pro"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span>PHONE COLOR:</span>
                  <input
                    type="text"
                    value={activeColor !== 'Not Specified' ? activeColor : ''}
                    onChange={(e) => handleFieldChange(cadet.name, 'color', e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. Titanium Gray"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SERIAL NUMBER / IMEI:</span>
                    <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem' }}>*Required for QR matches</span>
                  </span>
                  <input
                    type="text"
                    value={activeSerial !== 'Not Specified' ? activeSerial : ''}
                    onChange={(e) => handleFieldChange(cadet.name, 'serial', e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                    placeholder="e.g. C39XG123K389"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span>CASE / IDENTIFYING DETAILS:</span>
                  <input
                    type="text"
                    value={activeDbRemarks !== 'None' ? activeDbRemarks : ''}
                    onChange={(e) => handleFieldChange(cadet.name, 'dbRemarks', e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. Black Otterbox case with gold ring"
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingCadet(null)}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hidden Print Container for 1x1 inch stickers */}
      <div id="qr-stickers-print-container">
        {filteredCadets
          .filter(cadet => cadet.numPhones > 0 && cadet.status !== 'No Smartphone')
          .map((cadet) => {
            const currentChanges = pendingChanges[cadet.name] || {};
            const activeSerial = currentChanges.serial !== undefined ? currentChanges.serial : cadet.serial;
            const scanUrl = `${origin}/cellphone-rack/scan?name=${encodeURIComponent(cadet.name)}`;
            const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;

            return (
              <div key={`print-${cadet.name}`} className="qr-sticker">
                <div className="sticker-header">BRAVO CO</div>
                <div className="sticker-name">{cadet.name}</div>
                <div className="sticker-class">{cadet.cadetClass}CL</div>
                <div className="sticker-qr-wrapper">
                  <img src={qrCodeSrc} alt="" className="sticker-qr-img" />
                </div>
                <div className="sticker-serial">{activeSerial !== 'Not Specified' ? activeSerial : 'NO S/N'}</div>
              </div>
            );
          })}
      </div>

      {/* Global CSS and Print overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Default state: hide print layout in screen view */
        #qr-stickers-print-container {
          display: none;
        }

        @media print {
          /* Hide everything except the print container */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          
          #qr-stickers-print-container, #qr-stickers-print-container * {
            visibility: visible;
          }
          
          /* Position the print container perfectly */
          #qr-stickers-print-container {
            display: grid !important;
            grid-template-columns: repeat(6, 1.1in); /* 6 stickers per row */
            gap: 0.15in;
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            background: #fff !important;
            width: 8.5in; /* standard letter size */
          }
          
          /* Styles for the 1x1 inch sticker */
          .qr-sticker {
            width: 1in;
            height: 1in;
            border: 1px dashed #000;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 4px;
            box-sizing: border-box;
            background: #fff !important;
            page-break-inside: avoid;
            overflow: hidden;
          }

          .sticker-header {
            font-size: 5px;
            font-weight: 900;
            color: #000;
            letter-spacing: 0.5px;
            line-height: 1;
            text-transform: uppercase;
          }

          .sticker-name {
            font-size: 7px;
            font-weight: 800;
            color: #000;
            max-width: 90%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
            text-align: center;
          }

          .sticker-class {
            font-size: 5px;
            font-weight: 800;
            color: #444;
            line-height: 1;
          }

          .sticker-qr-wrapper {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sticker-qr-img {
            width: 48px;
            height: 48px;
            display: block;
          }

          .sticker-serial {
            font-size: 5px;
            font-family: monospace;
            color: #000;
            max-width: 95%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1;
            font-weight: bold;
          }
        }
      `}} />

      {/* Success Notification */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          animation: 'slide-down 0.3s ease-out forwards'
        }}>
          <span>✅</span> DATABASE UPDATED SUCCESSFULLY
        </div>
      )}
    </div>
  );
}
