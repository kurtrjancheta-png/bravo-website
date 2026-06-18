'use client';
import { useState } from 'react';

export default function ReportForm({ rifle, isS2Admin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('Damaged');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    try {
      const res = await fetch('/api/s2/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rifle.name,
          rifleType: rifle.rifleType,
          serialNumber: rifle.serialNumber,
          reportType,
          description,
          date: new Date().toISOString()
        })
      });
      
      if (res.ok) {
        setStatus('Report submitted successfully.');
        setTimeout(() => {
          setIsOpen(false);
          setDescription('');
          setStatus('');
        }, 2000);
      } else {
        setStatus('Failed to submit report.');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred.');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--accent-gold)',
          color: 'var(--text-primary)',
          padding: '1rem 2rem',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1rem',
          cursor: 'pointer',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        Report Damaged/Lost/Stolen Parts
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'var(--panel-bg, #1a202c)',
            border: '1px solid var(--border-color)',
            padding: '2rem',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>File a Report</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Cadet Name</label>
                <input type="text" value={rifle.name} disabled style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px' }} />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Serial Number</label>
                <input type="text" value={rifle.serialNumber} disabled style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Report Type</label>
                <select 
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                >
                  <option value="Damaged">Damaged Part</option>
                  <option value="Lost">Lost Part</option>
                  <option value="Stolen">Stolen Part</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Detailed Explanation</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              {status && <div style={{ marginBottom: '1rem', color: status.includes('success') ? '#48bb78' : '#e53e3e' }}>{status}</div>}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={status === 'Submitting...'} style={{ background: 'var(--accent-gold)', color: 'var(--text-primary)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isS2Admin && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px dashed var(--accent-gold)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
          <strong>S2 Administrator Tools:</strong> View all filed reports (Module coming soon).
        </div>
      )}
    </div>
  );
}
