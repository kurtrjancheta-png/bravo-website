"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SICK_CALL_TYPES = [
  "REGULAR",
  "FOLLOW-UP",
  "EMERGENCY SICK CALL",
  "DENTAL SICK CALL"
];

const STATUS_OPTIONS = [
  "FAD",
  "SIQ",
  "FULL DUTY",
  "OTHERS (SPECIFY)"
];

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(5px)',
};

const modalStyle = {
  background: 'var(--bg-secondary)',
  padding: '2rem',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  border: '1px solid var(--border-color)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  marginBottom: '1rem',
  fontSize: '1rem'
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'No Date';
  const match = String(dateStr).match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    // Google Sheets Date(...) format month is 0-indexed
    const d = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return String(dateStr);
};

export default function SickCallTrackerClient({ activeSickCalls, soiData }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedbackCard, setFeedbackCard] = useState(null); // stores the card being updated
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ADD SICK CALL STATE
  const [addForm, setAddForm] = useState({
    classNum: '1CL',
    name: '',
    platoon: '',
    squad: '',
    reason: '',
    typeOfSickCall: 'REGULAR',
    dateOfSickCall: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  });

  // FEEDBACK FORM STATE
  const [feedbackForm, setFeedbackForm] = useState({
    statusSelect: 'FAD',
    statusOther: '',
    startDate: '',
    endDate: '',
    isEndDateUndetermined: false
  });

  // Auto-fill from SOI
  const handleNameChange = (e) => {
    const selectedName = e.target.value.toUpperCase();
    setAddForm(prev => ({ ...prev, name: selectedName }));

    const match = soiData.find(c => 
      String(c['CLASS '] || c['CLASS']).includes(addForm.classNum) &&
      String(c['LAST NAME'] || '').toUpperCase().includes(selectedName)
    );

    if (match) {
      setAddForm(prev => ({
        ...prev,
        platoon: String(match['PLTN '] || match['PLTN'] || prev.platoon),
        squad: String(match['SQD '] || match['SQD'] || prev.squad)
      }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/s1/sick-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...addForm
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit');
      
      alert('Sick call added successfully! It will appear after refreshing.');
      setIsAddModalOpen(false);
      window.location.reload();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const finalStatus = feedbackForm.statusSelect === 'OTHERS (SPECIFY)' 
      ? feedbackForm.statusOther 
      : feedbackForm.statusSelect;

    let finalStartDate = feedbackForm.startDate;
    let finalEndDate = feedbackForm.isEndDateUndetermined 
      ? 'UNDETERMINED' 
      : feedbackForm.endDate;

    if (feedbackForm.statusSelect === 'FULL DUTY') {
      finalStartDate = 'N/A';
      finalEndDate = 'N/A';
    }

    if (!finalStatus) {
      setErrorMsg('Status is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/s1/sick-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          rowIndex: feedbackCard.sheetRowIndex,
          status: finalStatus,
          startDate: finalStartDate,
          endDate: finalEndDate
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit');
      
      alert('Feedback updated successfully!');
      setFeedbackCard(null);
      window.location.reload();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
        <a 
          href="https://docs.google.com/spreadsheets/d/1btCK6FhiAHTTbjEZAQZIm_f4l5-_Ik-3IKZm3f983es/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '0.75rem 1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}
        >
          📊 VIEW SPREADSHEET
        </a>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          + ADD SICK CALL
        </button>
      </div>

      {activeSickCalls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏥</span>
          <h3>No Active Sick Calls</h3>
          <p>All cadets have returned from sick call and filled their feedback.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {activeSickCalls.map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '2px solid var(--border-color)',
                borderTop: '6px solid #2563eb',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                📅 {formatDisplayDate(card['DATE OF SICK CALL'])}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', marginTop: 0 }}>
                {card['CLASS']} {card['NAME']}
              </h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {card['PLTN']} Platoon | {card['SQD']} Squad
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reason</strong>
                <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.95rem' }}>
                  {card['REASON'] || 'Not specified'}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</strong>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>
                  {card['TYPE OF SICK CALL'] || 'Not specified'}
                </div>
              </div>

              <button 
                onClick={() => setFeedbackCard(card)}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'var(--border-color)'}
                onMouseOut={(e) => e.target.style.background = 'var(--bg-primary)'}
              >
                📝 WRITE FEEDBACK
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD SICK CALL MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={modalStyle}
            >
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>File Sick Call</h2>
              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>CLASS</label>
                    <select 
                      style={inputStyle}
                      value={addForm.classNum}
                      onChange={e => setAddForm({...addForm, classNum: e.target.value})}
                      required
                    >
                      <option value="1CL">1CL</option>
                      <option value="2CL">2CL</option>
                      <option value="3CL">3CL</option>
                      <option value="4CL">4CL</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>NAME</label>
                    <input 
                      type="text" 
                      style={inputStyle}
                      value={addForm.name}
                      onChange={handleNameChange}
                      placeholder="e.g. DELA CRUZ"
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>PLATOON</label>
                    <select style={inputStyle} value={addForm.platoon} onChange={e => setAddForm({...addForm, platoon: e.target.value})} required>
                      <option value="">Select Platoon</option>
                      <option value="1ST">1ST</option>
                      <option value="2ND">2ND</option>
                      <option value="3RD">3RD</option>
                      <option value="4TH">4TH</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>SQUAD</label>
                    <select style={inputStyle} value={addForm.squad} onChange={e => setAddForm({...addForm, squad: e.target.value})} required>
                      <option value="">Select Squad</option>
                      <option value="1ST">1ST</option>
                      <option value="2ND">2ND</option>
                      <option value="3RD">3RD</option>
                      <option value="4TH">4TH</option>
                    </select>
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>REASON</label>
                <input 
                  type="text" 
                  style={inputStyle}
                  value={addForm.reason}
                  onChange={e => setAddForm({...addForm, reason: e.target.value})}
                  placeholder="e.g. Headache & Stomachache"
                  required 
                />

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>TYPE OF SICK CALL</label>
                <select 
                  style={inputStyle}
                  value={addForm.typeOfSickCall}
                  onChange={e => setAddForm({...addForm, typeOfSickCall: e.target.value})}
                  required
                >
                  {SICK_CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>DATE OF SICK CALL</label>
                <input 
                  type="text" 
                  style={inputStyle}
                  value={addForm.dateOfSickCall}
                  onChange={e => setAddForm({...addForm, dateOfSickCall: e.target.value})}
                  placeholder="14 May 2026"
                  required 
                />

                {errorMsg && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', background: '#2563eb', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Submitting...' : 'Add Sick Call'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
        {feedbackCard && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={modalStyle}
            >
              <h2 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Write Feedback</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                For {feedbackCard['CLASS']} {feedbackCard['NAME']} on {feedbackCard['DATE OF SICK CALL']}
              </p>
              
              <form onSubmit={handleFeedbackSubmit}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>STATUS</label>
                <select 
                  style={inputStyle}
                  value={feedbackForm.statusSelect}
                  onChange={e => setFeedbackForm({...feedbackForm, statusSelect: e.target.value})}
                  required
                >
                  {STATUS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {feedbackForm.statusSelect === 'OTHERS (SPECIFY)' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                    <input 
                      type="text" 
                      style={inputStyle}
                      value={feedbackForm.statusOther}
                      onChange={e => setFeedbackForm({...feedbackForm, statusOther: e.target.value})}
                      placeholder="Specify status..."
                      required={feedbackForm.statusSelect === 'OTHERS (SPECIFY)'} 
                    />
                  </motion.div>
                )}

                {feedbackForm.statusSelect !== 'FULL DUTY' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>START DATE</label>
                        <input 
                          type="date" 
                          style={inputStyle}
                          value={feedbackForm.startDate}
                          onChange={e => setFeedbackForm({...feedbackForm, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>END DATE</label>
                        <input 
                          type="date" 
                          style={inputStyle}
                          value={feedbackForm.endDate}
                          onChange={e => setFeedbackForm({...feedbackForm, endDate: e.target.value})}
                          disabled={feedbackForm.isEndDateUndetermined}
                          style={{ ...inputStyle, opacity: feedbackForm.isEndDateUndetermined ? 0.5 : 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                      <input 
                        type="checkbox" 
                        id="undetermined-check"
                        checked={feedbackForm.isEndDateUndetermined}
                        onChange={(e) => setFeedbackForm({...feedbackForm, isEndDateUndetermined: e.target.checked})}
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="undetermined-check" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>End date is undetermined</label>
                    </div>
                  </>
                )}

                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2563eb', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <strong>Note:</strong> Submitting this feedback will mark the sick call as completed and remove it from the active tracker.
                </div>

                {errorMsg && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setFeedbackCard(null)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', background: '#2563eb', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Saving...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
