'use client';
import { useState } from 'react';
import { useAuth } from '../AuthContext';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzklVtvSKHZmH6abCRFPSTGmh_H4-ytVjN4FYAiM1aDg4ttyUShxqRAZYGLpMKWJgylqw/exec';

export default function S1AdminForms() {
  const { adminUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [type, setType] = useState('Entertaining priv');
  const [date, setDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!type || !date || !deadlineDate || !deadlineTime) {
      alert("Please fill out all fields.");
      return;
    }
    
    // Combine deadline date and time into a single ISO-like string
    const deadlineString = `${deadlineDate}T${deadlineTime}:00`;

    setStatus('loading');
    
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'createPrivilege',
          type: type,
          date: date,
          deadline: deadlineString
        })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
         // Trigger push notification to all users
         try {
           await fetch('/api/web-push/broadcast', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               title: 'New Privilege Signify Form Posted',
               body: `A new ${type} form for ${date} has been posted by S1. Please signify before the deadline.`,
               url: '/signify-priv'
             })
           });
         } catch (pushErr) {
           console.error('Failed to send push notification:', pushErr);
         }

         setStatus('success');
         setTimeout(() => window.location.reload(), 2000);
      } else {
         throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to connect to Apps Script.');
    }
  };

  // Only render if logged in as S1 globally
  if (!adminUser || adminUser.council !== 'S1') {
    return null;
  }

  if (!showAddForm) {
    return (
       <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
             onClick={() => setShowAddForm(true)}
             style={{ 
               padding: '1rem 2rem', 
               background: 'var(--accent-gold)', 
               color: 'var(--text-primary)', 
               borderRadius: '8px', 
               border: 'none', 
               fontWeight: '800', 
               fontSize: '1.1rem',
               cursor: 'pointer',
               boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
             }}
          >
             + Add Priv
          </button>

          <a 
            href="https://docs.google.com/spreadsheets/d/16i_7nny1QbFkFvhqnTX9ebgCOT7WeUmq8Uz_r5Vaj5w/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              padding: '1rem 2rem', 
              background: '#e0e7ff', 
              color: '#3730a3', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              fontWeight: '800', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#c7d2fe'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e0e7ff'}
          >
            View Sheet ↗
          </a>
       </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>Create New Privilege Signify Sheet</h2>
        <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}>✖ Cancel</button>
      </div>
      
      <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type of Privilege</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="Entertaining priv">Entertaining priv</option>
            <option value="malling priv">malling priv</option>
            <option value="visiting priv">visiting priv</option>
            <option value="overnight priv">overnight priv</option>
            <option value="weekend leave">weekend leave</option>
            <option value="leave">leave</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date of Privilege</label>
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Deadline Date</label>
            <input 
              type="date" 
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Deadline Time</label>
            <input 
              type="time" 
              value={deadlineTime}
              onChange={e => setDeadlineTime(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>

        {status === 'error' && <div style={{ color: 'red', fontSize: '0.9rem' }}>Error: {errorMsg}</div>}
        {status === 'success' && <div style={{ color: 'green', fontSize: '0.9rem', fontWeight: 'bold' }}>Success! Sheet created. Reloading...</div>}

        <button 
          type="submit" 
          disabled={status === 'loading'}
          style={{ 
            padding: '1rem', 
            background: 'var(--text-primary)', 
            color: 'white', 
            borderRadius: '8px', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            marginTop: '1rem',
            opacity: status === 'loading' ? 0.7 : 1
          }}
        >
          {status === 'loading' ? 'Publishing...' : 'Publish Privilege'}
        </button>
      </form>
    </div>
  );
}
