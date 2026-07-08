'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/navigation';

export default function ScanClient({ initialData, targetName }) {
  const { adminUser, isLoaded } = useAuth();
  const router = useRouter();

  // Find the scanned cadet details
  const [cadet, setCadet] = useState(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  
  // S6 status update states
  const [statusVal, setStatusVal] = useState('Logged In');
  const [remarksVal, setRemarksVal] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // S6 check
  const userCouncil = String(adminUser?.council || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCEIS = userCouncil === 'S6' || userCouncil.includes('CEIS');

  useEffect(() => {
    if (targetName) {
      const found = initialData.find(c => c.name.toUpperCase() === targetName.trim().toUpperCase());
      if (found) {
        setCadet(found);
        setStatusVal(found.status);
        setRemarksVal(found.remarks !== 'null' ? found.remarks : '');
        setIsUnregistered(false);
      } else {
        setCadet({ name: targetName });
        setIsUnregistered(true);
      }
    }
  }, [targetName, initialData]);

  if (!targetName) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
        <h3>Scan Node Idle</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This page handles scanned phone QR codes. Please scan a QR code using the scanner terminal.
        </p>
        {isCEIS && (
          <button 
            onClick={() => router.push('/cellphone-rack/scanner')}
            className="btn"
            style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            Open QR Scanner Terminal
          </button>
        )}
      </div>
    );
  }

  // Audits & Security checks
  const isForgedQR = isUnregistered; 
  const isMissingSerial = cadet && !isUnregistered && (cadet.serial === 'Not Specified' || !cadet.serial);
  const isUnauthorizedLogout = cadet && !isUnregistered && 
    (statusVal.toLowerCase() === 'logged out' && (!remarksVal || remarksVal.trim() === ''));

  const handleApplyChanges = async () => {
    if (!cadet || isUnregistered) return;
    setIsUpdating(true);

    try {
      const changes = [{
        ...cadet,
        status: statusVal,
        remarks: remarksVal
      }];

      const res = await fetch('/api/smartphone-rack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        // Update local state
        setCadet(prev => ({
          ...prev,
          status: statusVal,
          remarks: remarksVal
        }));
        
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          router.refresh();
        }, 2000);
      } else {
        alert(`Failed to save changes: ${result.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert('Error updating smartphone status');
    } finally {
      setIsUpdating(false);
    }
  };

  // -------------------------------------------------------------
  // RENDERING CADET VIEW (Public / Normal Cadet)
  // -------------------------------------------------------------
  const renderCadetView = () => {
    if (isForgedQR) {
      return (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', border: '2px solid #ef4444' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🚨</div>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>SECURITY EXCLUSION</h2>
          <p style={{ fontWeight: 800, marginBottom: '2rem' }}>
            The scanned QR code matches no active cadet registered in the Bravo Company Roster!
          </p>
          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Scanned Signature: "{targetName}"
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            If this is an error, please report to the S6 Officer immediately for device validation.
          </p>
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', border: `1px solid var(--border-color)` }}>
        {/* Status indicator banner */}
        <div style={{
          borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem',
          textAlign: 'center', fontWeight: 900, fontSize: '1.1rem',
          background: isMissingSerial ? 'rgba(239, 68, 68, 0.1)' :
                      isUnauthorizedLogout ? 'rgba(239, 68, 68, 0.15)' :
                      statusVal.toLowerCase() === 'logged in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${
            isMissingSerial || isUnauthorizedLogout ? '#ef4444' :
            statusVal.toLowerCase() === 'logged in' ? '#10b981' : '#f59e0b'
          }`,
          color: 
            isMissingSerial || isUnauthorizedLogout ? '#f87171' :
            statusVal.toLowerCase() === 'logged in' ? '#34d399' : '#fbbf24',
        }}>
          {isMissingSerial ? '⚠️ UNREGISTERED SERIAL' :
           isUnauthorizedLogout ? '⚠️ UNAUTHORIZED OUT' :
           statusVal.toLowerCase() === 'logged in' ? '🟢 DEVICE IN RACK' : '🟡 DEVICE LOGGED OUT'}
        </div>

        {/* Cadet Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '1rem', border: '2px solid var(--border-color)' }}>
            {cadet.picture ? (
              <img src={cadet.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📱</div>
            )}
          </div>
          <h2 style={{ marginBottom: '0.25rem' }}>{cadet.name}</h2>
          <div style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{cadet.cadetClass}CL • BRAVO COMPANY</div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Phone Model:</span>
            <span style={{ fontWeight: 800 }}>{cadet.model || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Color:</span>
            <span style={{ fontWeight: 800 }}>{cadet.color || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Serial Number:</span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: isMissingSerial ? '#f87171' : 'inherit' }}>
              {cadet.serial || 'NOT REGISTERED'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>CP Number:</span>
            <span style={{ fontWeight: 800 }}>{cadet.phone || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Telegram:</span>
            <span style={{ fontWeight: 800 }}>{cadet.telegram || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Signal:</span>
            <span style={{ fontWeight: 800 }}>{cadet.ig || 'N/A'}</span>
          </div>
        </div>

        {/* Remarks Box */}
        {statusVal.toLowerCase() !== 'logged in' && (
          <div style={{
            background: isUnauthorizedLogout ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.2)',
            padding: '1rem', borderRadius: '16px',
            border: isUnauthorizedLogout ? '1px dashed #ef4444' : '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 800, color: isUnauthorizedLogout ? '#f87171' : 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Authorized Reason / Remarks
            </div>
            <div style={{ fontWeight: 800, lineHeight: 1.4 }}>
              {isUnauthorizedLogout ? '⚠️ No authorized reason logged! Contact S6 to validate your logout.' :
               remarksVal || 'None logged.'}
            </div>
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDERING S6 OFFICER VIEW
  // -------------------------------------------------------------
  const renderS6View = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Validation Status Banner */}
        <div style={{
          borderRadius: '20px', padding: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 900,
          background: isForgedQR ? 'rgba(239, 68, 68, 0.15)' :
                      isMissingSerial ? 'rgba(239, 68, 68, 0.15)' :
                      isUnauthorizedLogout ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${
            isForgedQR || isMissingSerial || isUnauthorizedLogout ? '#ef4444' : '#10b981'
          }`,
          color: 
            isForgedQR || isMissingSerial || isUnauthorizedLogout ? '#f87171' : '#34d399',
        }}>
          <span style={{ fontSize: '2rem' }}>
            {isForgedQR || isMissingSerial || isUnauthorizedLogout ? '🚨' : '🟢'}
          </span>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>S6 SECURITY AUDIT</div>
            <div style={{ fontSize: '1.05rem' }}>
              {isForgedQR ? 'FORGED QR CODE - CADET NOT IN ROSTER' :
               isMissingSerial ? 'UNREGISTERED DEVICE - MISSING SERIAL' :
               isUnauthorizedLogout ? 'UNAUTHORIZED OUT - NO REMARKS LOGGED' : 'VALID MATCH - DEVICE AUTHORIZED'}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
              {cadet?.picture ? (
                <img src={cadet.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📱</div>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{cadet?.name}</h2>
              {!isForgedQR && (
                <div style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{cadet?.cadetClass}CL • {cadet?.model || 'Unknown Model'}</div>
              )}
            </div>
          </div>

          {/* Action 1: Display Information */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>DEVICE REGISTER SPECS</div>
            {isForgedQR ? (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', wordBreak: 'break-all' }}>
                Raw Scan Text: "{scannedRawText || targetName}"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Color:</span>
                  <span style={{ fontWeight: 800 }}>{cadet.color || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Serial Number:</span>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: isMissingSerial ? '#f87171' : 'inherit' }}>
                    {cadet.serial || 'NOT REGISTERED'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Phone No:</span>
                  <span style={{ fontWeight: 800 }}>{cadet.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Telegram:</span>
                  <span style={{ fontWeight: 800 }}>{cadet.telegram || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Signal:</span>
                  <span style={{ fontWeight: 800 }}>{cadet.ig || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions 2 & 3: Status Updater */}
          {!isForgedQR && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>LOG STATUS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => setStatusVal('Logged In')}
                    style={{
                      padding: '0.75rem 0.25rem', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer',
                      background: statusVal === 'Logged In' ? '#10b981' : 'var(--bg-secondary)',
                      color: statusVal === 'Logged In' ? '#fff' : 'var(--text-primary)',
                      transition: 'all 0.2s', fontSize: '0.85rem'
                    }}
                  >
                    LOG IN
                  </button>
                  <button
                    onClick={() => setStatusVal('Logged Out')}
                    style={{
                      padding: '0.75rem 0.25rem', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer',
                      background: statusVal === 'Logged Out' ? '#f59e0b' : 'var(--bg-secondary)',
                      color: statusVal === 'Logged Out' ? '#fff' : 'var(--text-primary)',
                      transition: 'all 0.2s', fontSize: '0.85rem'
                    }}
                  >
                    LOG OUT
                  </button>
                  <button
                    onClick={() => setStatusVal('Confiscated')}
                    style={{
                      padding: '0.75rem 0.25rem', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer',
                      background: statusVal === 'Confiscated' ? '#ef4444' : 'var(--bg-secondary)',
                      color: statusVal === 'Confiscated' ? '#fff' : 'var(--text-primary)',
                      transition: 'all 0.2s', fontSize: '0.85rem'
                    }}
                  >
                    CONFISCATE
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>AUTHORIZATION REMARKS / PASS DETAILS</span>
                <textarea
                  value={remarksVal}
                  onChange={(e) => setRemarksVal(e.target.value)}
                  placeholder={
                    statusVal === 'Logged Out' ? 'e.g. Approved weekend overnight pass' :
                    statusVal === 'Confiscated' ? 'e.g. Unregistered backup device found in locker' : 'Enter pass remarks...'
                  }
                  style={{
                    width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '10px',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                    border: isUnauthorizedLogout ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    resize: 'vertical', fontSize: '0.9rem', lineHeight: 1.4
                  }}
                />
                {isUnauthorizedLogout && (
                  <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>* Remarks are required for device logouts.</span>
                )}
              </label>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button
              onClick={() => router.push('/cellphone-rack/scanner')}
              style={{
                background: 'transparent', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)', padding: '0.65rem 1.5rem',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 800
              }}
            >
              Back to Scanner
            </button>
            {!isForgedQR && (
              <button
                onClick={handleApplyChanges}
                disabled={isUpdating}
                style={{
                  background: '#3b82f6', border: 'none', color: '#fff',
                  padding: '0.65rem 2rem', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 800, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isUpdating ? 'Saving...' : 'Apply Status Update'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Dynamic View switching based on who is logged in */}
      {isLoaded ? (
        isCEIS ? renderS6View() : renderCadetView()
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Establishing connection node, checking authorization credentials...</p>
        </div>
      )}

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          animation: 'slide-down 0.3s ease-out forwards'
        }}>
          <span>✅</span> DATABASE COMMITTED SUCCESSFULLY
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-down {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
