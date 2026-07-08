'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerClient({ initialData }) {
  const { adminUser, isLoaded } = useAuth();
  const router = useRouter();
  
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedCadet, setScannedCadet] = useState(null);
  const [scannedRawText, setScannedRawText] = useState('');
  
  // Quick actions editing states
  const [statusVal, setStatusVal] = useState('Logged In');
  const [remarksVal, setRemarksVal] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const qrRef = useRef(null);
  const scannerRef = useRef(null);
  const isPausedRef = useRef(false);

  // S6 access check
  const userCouncil = String(adminUser?.council || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCEIS = userCouncil === 'S6' || userCouncil.includes('CEIS');

  // Load cameras
  useEffect(() => {
    if (!isCEIS) return;

    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile (usually contains "back" or index > 0)
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to query camera devices:', err);
      });

    return () => {
      stopScanner();
    };
  }, [isCEIS]);

  // Handle scanner starting/stopping when camera selection changes
  useEffect(() => {
    if (selectedCameraId && isCEIS) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  const startScanner = async (cameraId) => {
    try {
      await stopScanner();
      
      const html5QrCode = new Html5Qrcode('qr-viewfinder');
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          if (isPausedRef.current) return;
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore verbose scanner noise
        }
      );
      
      setScannerActive(true);
      isPausedRef.current = false;
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setScannerActive(false);
  };

  // Play audio beep using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitched scan success beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 100);
    } catch (e) {
      console.error('Web Audio beep failed:', e);
    }
  };

  const handleScanSuccess = (decodedText) => {
    isPausedRef.current = true; // Pause scanning in-memory
    playBeep();
    setScannedRawText(decodedText);

    // Extract name parameter from QR URL
    let nameParam = '';
    try {
      if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        const url = new URL(decodedText);
        nameParam = url.searchParams.get('name') || '';
      } else {
        nameParam = decodedText; // fallback to raw string
      }
    } catch (e) {
      nameParam = decodedText;
    }

    const cadetName = nameParam.trim();
    const cadet = initialData.find(c => c.name.toUpperCase() === cadetName.toUpperCase());

    if (cadet) {
      setScannedCadet(cadet);
      setStatusVal(cadet.status);
      setRemarksVal(cadet.remarks !== 'null' ? cadet.remarks : '');
    } else {
      setScannedCadet({ name: cadetName, unregistered: true });
    }
  };

  const resumeScanning = () => {
    setScannedCadet(null);
    setScannedRawText('');
    setRemarksVal('');
    isPausedRef.current = false;
  };

  const handleStatusUpdateSubmit = async () => {
    if (!scannedCadet || scannedCadet.unregistered) return;
    setIsUpdating(true);

    try {
      const changes = [{
        ...scannedCadet,
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
        // Find index and update local initialData state so subsequent scans reflect it
        const idx = initialData.findIndex(c => c.name === scannedCadet.name);
        if (idx !== -1) {
          initialData[idx].status = statusVal;
          initialData[idx].remarks = remarksVal;
        }

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2500);
        resumeScanning();
      } else {
        alert(`Failed to update status: ${result.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert('Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoaded && !isCEIS) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Only S6 Officers or authorized CEIS personnel can access the QR Scanner terminal.
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

  // Audits / Security Diagnostics
  const isUnregistered = scannedCadet?.unregistered;
  const isForgedQR = isUnregistered && !initialData.some(c => c.name.toUpperCase() === scannedRawText.toUpperCase());
  const isMissingSerial = scannedCadet && !isUnregistered && (scannedCadet.serial === 'Not Specified' || !scannedCadet.serial);
  const isUnauthorizedLogout = scannedCadet && !isUnregistered && 
    (statusVal.toLowerCase() === 'logged out' && (!remarksVal || remarksVal.trim() === ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      
      {/* Scanner Window */}
      <div className="card" style={{ 
        width: '100%', maxWidth: '480px', padding: '1.5rem', 
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CAMERA:</span>
          <select 
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            style={{ 
              padding: '0.4rem 0.8rem', borderRadius: '8px', 
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', outline: 'none',
              maxWidth: '60%', fontWeight: 800, fontSize: '0.8rem'
            }}
          >
            {cameras.map(cam => (
              <option key={cam.id} value={cam.id}>{cam.label}</option>
            ))}
          </select>
        </div>

        {/* Viewfinder Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          background: '#000',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {/* Laser animation */}
          {scannerActive && !scannedCadet && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
              background: 'rgba(16, 185, 129, 0.8)', boxShadow: '0 0 10px #10b981',
              zIndex: 10, animation: 'scannerLaser 2.5s infinite linear'
            }} />
          )}

          {/* Target Reticle */}
          {scannerActive && !scannedCadet && (
            <div style={{
              position: 'absolute', top: '15%', left: '15%', right: '15%', bottom: '15%',
              border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '16px',
              zIndex: 5, pointerEvents: 'none'
            }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981', borderRadius: '4px 0 0 0' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981', borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981', borderRadius: '0 0 0 4px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981', borderRadius: '0 0 4px 0' }} />
            </div>
          )}

          <div id="qr-viewfinder" style={{ width: '100%', height: '100%' }}></div>
        </div>

        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 800 }}>
          {scannerActive ? '🟢 TERMINAL ACTIVE - READY FOR SCAN' : '🔴 CONNECTING CAMERA...'}
        </div>
      </div>

      {/* S6 Actions Overlay Modal */}
      {scannedCadet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={resumeScanning}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
            borderRadius: '32px', padding: '2rem', width: '440px', maxWidth: '92%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Security Audit Banner */}
            <div style={{
              borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800,
              background: isForgedQR ? 'rgba(239, 68, 68, 0.15)' :
                          isUnregistered ? 'rgba(245, 158, 11, 0.15)' :
                          isMissingSerial ? 'rgba(239, 68, 68, 0.15)' :
                          isUnauthorizedLogout ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${
                isForgedQR || isMissingSerial || isUnauthorizedLogout ? '#ef4444' :
                isUnregistered ? '#f59e0b' : '#10b981'
              }`,
              color: 
                isForgedQR || isMissingSerial || isUnauthorizedLogout ? '#f87171' :
                isUnregistered ? '#fbbf24' : '#34d399',
            }}>
              <span style={{ fontSize: '1.5rem' }}>
                {isForgedQR || isMissingSerial || isUnauthorizedLogout ? '🚨' :
                 isUnregistered ? '⚠️' : '🟢'}
              </span>
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>SECURITY VALIDATION STATUS</div>
                <div style={{ fontSize: '0.9rem' }}>
                  {isForgedQR ? 'FORGED QR CODE / ROSTER MISMATCH' :
                   isUnregistered ? 'UNREGISTERED CADET ROSTER' :
                   isMissingSerial ? 'UNREGISTERED DEVICE (NO SERIAL)' :
                   isUnauthorizedLogout ? 'UNAUTHORIZED DEVICE OUT' : 'DEVICE VALIDATED / AUTHORIZED'}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                {scannedCadet.picture ? (
                  <img src={scannedCadet.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📱</div>
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{scannedCadet.name}</h3>
                {!isUnregistered && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 800 }}>{scannedCadet.cadetClass}CL • {scannedCadet.model || 'Unknown Model'}</div>
                )}
              </div>
            </div>

            {/* Action 1: Display Information */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.65rem', marginBottom: '0.5rem' }}>DEVICE INFORMATION</div>
              {isForgedQR ? (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', wordBreak: 'break-all' }}>
                  Raw QR text: {scannedRawText}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Color:</span>
                    <span style={{ fontWeight: 800 }}>{scannedCadet.color || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Serial/IMEI:</span>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: isMissingSerial ? '#f87171' : 'inherit' }}>
                      {scannedCadet.serial || 'NOT REGISTERED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Contact No:</span>
                    <span style={{ fontWeight: 800 }}>{scannedCadet.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Telegram:</span>
                    <span style={{ fontWeight: 800 }}>{scannedCadet.telegram || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Signal:</span>
                    <span style={{ fontWeight: 800 }}>{scannedCadet.ig || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions 2 & 3: Status Updater Controls (Only for registered cadets) */}
            {!isUnregistered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.65rem', marginBottom: '0.5rem' }}>UPDATE STATUS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => setStatusVal('Logged In')}
                      style={{
                        padding: '0.6rem 0.2rem', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                        background: statusVal === 'Logged In' ? '#10b981' : 'var(--bg-secondary)',
                        color: statusVal === 'Logged In' ? '#fff' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      LOG IN
                    </button>
                    <button
                      onClick={() => setStatusVal('Logged Out')}
                      style={{
                        padding: '0.6rem 0.2rem', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                        background: statusVal === 'Logged Out' ? '#f59e0b' : 'var(--bg-secondary)',
                        color: statusVal === 'Logged Out' ? '#fff' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      LOG OUT
                    </button>
                    <button
                      onClick={() => setStatusVal('Confiscated')}
                      style={{
                        padding: '0.6rem 0.2rem', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                        background: statusVal === 'Confiscated' ? '#ef4444' : 'var(--bg-secondary)',
                        color: statusVal === 'Confiscated' ? '#fff' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      CONFISCATE
                    </button>
                  </div>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 800, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>AUTHORIZED REASON / REMARKS</span>
                  <textarea
                    value={remarksVal}
                    onChange={(e) => setRemarksVal(e.target.value)}
                    placeholder={
                      statusVal === 'Logged Out' ? 'e.g. Authorized overnight pass' :
                      statusVal === 'Confiscated' ? 'e.g. Unauthorized possession past Taps' : 'Enter remarks...'
                    }
                    style={{
                      width: '100%', minHeight: '60px', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                      border: isUnauthorizedLogout ? '1px solid #ef4444' : '1px solid var(--border-color)',
                      resize: 'none', fontSize: '0.85rem'
                    }}
                  />
                  {isUnauthorizedLogout && (
                    <span style={{ color: '#ef4444', fontSize: '0.65rem' }}>* Remarks are required for device logouts.</span>
                  )}
                </label>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                Cannot perform status updates on unregistered devices.
              </div>
            )}

            {/* Modal Bottom Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={resumeScanning}
                style={{
                  background: 'transparent', border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)', padding: '0.6rem 1.2rem',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem'
                }}
              >
                Close
              </button>
              {!isUnregistered && (
                <button
                  onClick={handleStatusUpdateSubmit}
                  disabled={isUpdating}
                  style={{
                    background: '#3b82f6', border: 'none', color: '#fff',
                    padding: '0.6rem 1.8rem', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 800, fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {isUpdating ? 'Applying...' : 'Apply Changes'}
                </button>
              )}
            </div>
          </div>
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
          <span>✅</span> STATUS UPDATED SUCCESSFULLY
        </div>
      )}

      {/* Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scannerLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        /* Native html5-qrcode override styles for clean UI */
        #qr-viewfinder video {
          object-fit: cover !important;
          border-radius: 22px;
        }
        #qr-viewfinder {
          border: none !important;
        }
      `}} />

    </div>
  );
}
