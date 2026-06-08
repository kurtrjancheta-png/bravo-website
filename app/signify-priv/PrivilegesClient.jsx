'use client';
import { useState, useEffect } from 'react';
import S1AdminForms from './S1AdminForms';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzklVtvSKHZmH6abCRFPSTGmh_H4-ytVjN4FYAiM1aDg4ttyUShxqRAZYGLpMKWJgylqw/exec';

export default function PrivilegesClient({ activePrivileges }) {
  const [selectedPriv, setSelectedPriv] = useState(null); // Which card is clicked
  const [cadetClass, setCadetClass] = useState('1CL');
  const [fullName, setFullName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to check deadlines dynamically
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSignify = async (e) => {
    e.preventDefault();
    if (!fullName || !serialNumber) {
      alert("Please fill out full name and serial number.");
      return;
    }

    // Format: CDT 1CL KURT RANDLE JOSH ANCHETA C-27011 'B' CO CCAFP
    const formattedData = `CDT ${cadetClass} ${fullName.toUpperCase()} ${serialNumber.toUpperCase()} 'B' CO CCAFP`;

    setStatus('loading');
    
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'signify',
          sheetName: selectedPriv.sheetName,
          cadetClass: cadetClass,
          formattedData: formattedData
        })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
         setStatus('success');
         setTimeout(() => {
            setSelectedPriv(null);
            setStatus('idle');
            setFullName('');
            setSerialNumber('');
         }, 2000);
      } else {
         throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to connect to Apps Script.');
    }
  };

  const parseDeadline = (deadlineStr) => {
     if (!deadlineStr) return null;
     // The string is likely in ISO format or similar from Google Sheets
     return new Date(deadlineStr);
  };

  return (
    <div style={{ padding: '2rem' }}>
      
      {/* Header section */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 100%)', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '16px', 
        padding: '2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'var(--gold-primary)', fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Signify for Privilege
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.6 }}>
            <strong>Welcome.</strong> Check active privileges and signify if you intend to avail them before the deadline closes.
          </p>
        </div>
      </div>

      <S1AdminForms />

      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Active Privileges</h2>

      {activePrivileges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
          No active privileges found at this time.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {activePrivileges.map((priv, idx) => {
            const deadline = parseDeadline(priv.DEADLINE);
            const isClosed = deadline && currentTime > deadline;
            
            return (
              <div 
                key={idx} 
                onClick={() => !isClosed && setSelectedPriv({
                   type: priv.TYPE, 
                   date: priv.DATE, 
                   sheetName: priv['SHEET NAME'] || `${priv.TYPE} ${priv.DATE}`
                })}
                style={{
                  background: isClosed ? 'var(--bg-secondary)' : 'white',
                  border: `2px solid ${isClosed ? 'var(--border-color)' : 'var(--accent-gold)'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: isClosed ? 'not-allowed' : 'pointer',
                  opacity: isClosed ? 0.6 : 1,
                  boxShadow: isClosed ? 'none' : '0 4px 12px rgba(212, 175, 55, 0.15)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => { if (!isClosed) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { if (!isClosed) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                     {priv.DATE}
                   </div>
                   <div style={{ 
                      background: isClosed ? '#ef4444' : '#4ade80', 
                      color: 'white', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold' 
                   }}>
                     {isClosed ? 'CLOSED' : 'OPEN'}
                   </div>
                </div>
                
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {priv.TYPE}
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <strong>Deadline:</strong> {deadline ? deadline.toLocaleString() : 'No deadline'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Signifying */}
      {selectedPriv && (
         <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
         }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
               <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Signify</h2>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                 For: {selectedPriv.type} ({selectedPriv.date})
               </p>

               <form onSubmit={handleSignify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Class</label>
                    <select 
                      value={cadetClass} 
                      onChange={e => setCadetClass(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                    >
                      <option value="1CL">1CL</option>
                      <option value="2CL">2CL</option>
                      <option value="3CL">3CL</option>
                      <option value="4CL">4CL</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KURT RANDLE JOSH ANCHETA"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Serial Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. C-27011"
                      value={serialNumber}
                      onChange={e => setSerialNumber(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textTransform: 'uppercase' }}
                    />
                  </div>

                  {status === 'error' && <div style={{ color: 'red', fontSize: '0.85rem' }}>{errorMsg}</div>}
                  {status === 'success' && <div style={{ color: 'green', fontSize: '0.85rem', fontWeight: 'bold' }}>Signify successful!</div>}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <button 
                        type="button" 
                        onClick={() => setSelectedPriv(null)}
                        style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-gold)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
                     >
                        {status === 'loading' ? 'Submitting...' : 'Signify'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
