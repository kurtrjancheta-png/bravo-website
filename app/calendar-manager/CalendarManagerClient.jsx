'use client';

import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
  parseISO
} from 'date-fns';

const COUNCILS = ['TACO', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S10', 'ATHLETIC', 'GAD', 'HONOR COMM', 'CCPB'];
const COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Gold', value: '#d4af37' },
  { label: 'Dark Gray', value: '#4b5563' }
];

export default function CalendarManagerClient({ initialActivities, apiUrl }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState(initialActivities || []);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // null means new event

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    endDate: '',
    council: 'S3',
    description: '',
    color: '#3b82f6',
    urgency: 'LIGHT'
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getEventsForDay = (day) => {
    return activities.filter(a => {
      if (!a.date) return false;
      try {
        const actDate = new Date(a.date);
        if (isNaN(actDate)) return false;
        return actDate.getMonth() === day.getMonth() && 
               actDate.getDate() === day.getDate() && 
               actDate.getFullYear() === day.getFullYear();
      } catch (e) {
        return false;
      }
    });
  };

  const openNewEventModal = (day) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: format(day, 'yyyy-MM-dd'),
      endDate: '',
      council: 'S3',
      description: '',
      color: '#3b82f6',
      urgency: 'LIGHT'
    });
    setIsModalOpen(true);
  };

  const openEditEventModal = (event, e) => {
    e.stopPropagation(); // prevent triggering day click
    setEditingEvent(event);
    
    // Parse date safely
    let formattedDate = '';
    try {
      if (event.date) {
        const d = new Date(event.date);
        if (!isNaN(d)) formattedDate = format(d, 'yyyy-MM-dd');
      }
    } catch(err) {}

    let formattedEndDate = '';
    try {
      if (event.endDate) {
        const d = new Date(event.endDate);
        if (!isNaN(d)) formattedEndDate = format(d, 'yyyy-MM-dd');
      }
    } catch(err) {}

    setFormData({
      title: event.title || '',
      date: formattedDate,
      endDate: formattedEndDate,
      council: event.council || 'S3',
      description: event.description || '',
      color: event.color || '#3b82f6',
      urgency: event.urgency || 'LIGHT'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiUrl || apiUrl === 'YOUR_SCRIPT_URL_HERE') {
      alert("API URL not configured! Cannot save.");
      return;
    }

    setIsSubmitting(true);
    
    // Format dates to ISO if possible
    let isoDate = formData.date;
    try { if (formData.date) isoDate = new Date(formData.date).toISOString(); } catch(err) {}
    
    let isoEndDate = formData.endDate;
    try { if (formData.endDate) isoEndDate = new Date(formData.endDate).toISOString(); } catch(err) {}

    const payloadEvent = {
      ...formData,
      date: isoDate,
      endDate: isoEndDate
    };

    const action = editingEvent ? 'updateEvent' : 'createEvent';
    if (editingEvent) payloadEvent.id = editingEvent.id;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, event: payloadEvent })
      });
      const data = await res.json();
      
      if (data.success) {
        if (editingEvent) {
          setActivities(activities.map(a => a.id === editingEvent.id ? { ...a, ...payloadEvent } : a));
        } else {
          setActivities([...activities, { ...payloadEvent, id: data.id }]);
        }
        setIsModalOpen(false);
      } else {
        alert("Error saving event: " + data.error);
      }
    } catch (err) {
      alert("Network error. Could not save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !apiUrl || apiUrl === 'YOUR_SCRIPT_URL_HERE') return;
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteEvent', id: editingEvent.id })
      });
      const data = await res.json();
      
      if (data.success) {
        setActivities(activities.filter(a => a.id !== editingEvent.id));
        setIsModalOpen(false);
      } else {
        alert("Error deleting event: " + data.error);
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') { currentCell += '"'; i++; }
          else { inQuotes = false; }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') { inQuotes = true; }
        else if (char === ',') { currentRow.push(currentCell.trim()); currentCell = ''; }
        else if (char === '\n' || char === '\r') {
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c !== '')) rows.push(currentRow);
          currentRow = []; currentCell = '';
          if (char === '\r' && nextChar === '\n') i++;
        } else {
          currentCell += char;
        }
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setIsLaunching(false);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row.");
        
        const headers = rows[0].map(h => h.toLowerCase().trim());
        const expectedHeaders = ['title', 'date', 'enddate', 'council', 'description', 'color', 'urgency'];
        const headerMap = {};
        expectedHeaders.forEach(eh => {
          const idx = headers.findIndex(h => h === eh || h === eh.replace('date', ' date'));
          if (idx !== -1) headerMap[eh] = idx;
        });

        if (headerMap['title'] === undefined || headerMap['date'] === undefined) {
          throw new Error("CSV must have 'Title' and 'Date' columns.");
        }

        const eventsToUpload = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          let d = row[headerMap['date']] || '';
          let ed = headerMap['enddate'] !== undefined ? row[headerMap['enddate']] : '';
          
          try { if (d) d = new Date(d).toISOString(); } catch(e){}
          try { if (ed) ed = new Date(ed).toISOString(); } catch(e){}

          eventsToUpload.push({
            title: row[headerMap['title']] || '',
            date: d,
            endDate: ed,
            council: headerMap['council'] !== undefined ? row[headerMap['council']] : '',
            description: headerMap['description'] !== undefined ? row[headerMap['description']] : '',
            color: headerMap['color'] !== undefined ? row[headerMap['color']] : '#3b82f6',
            urgency: headerMap['urgency'] !== undefined ? row[headerMap['urgency']] : 'LIGHT'
          });
        }

        if (eventsToUpload.length > 0) {
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'massUpload', events: eventsToUpload })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Unknown upload error.");
          
          // Successful, trigger launch
          setIsLaunching(true);
          setTimeout(() => {
            setIsLaunching(false);
            setIsUploading(false);
            setShowSuccessToast(true);
            setTimeout(() => {
              setShowSuccessToast(false);
              window.location.reload(); // Reload to fetch fresh data
            }, 3000);
          }, 800);
        } else {
          setIsUploading(false);
          alert("No valid events found to upload.");
        }
      } catch (err) {
        setIsUploading(false);
        alert(`Upload Failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const renderHeader = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gold-primary)', margin: 0 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={goToToday} style={{ padding: '0.4rem 1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
            Today
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold-primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--gold-primary)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.2)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'}>
            <span>📤</span> Mass CSV Upload
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&lt;</button>
          <button onClick={nextMonth} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&gt;</button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', padding: '0.5rem 0' }}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)' }}>{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const dayActs = getEventsForDay(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const today = isToday(day);

        let bgColor = isCurrentMonth ? 'var(--bg-primary)' : 'rgba(0,0,0,0.1)';
        let dateColor = isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)';
        
        if (today) bgColor = 'rgba(212,175,55,0.05)';

        days.push(
          <div
            key={day}
            onClick={() => openNewEventModal(cloneDay)}
            style={{
              minHeight: '120px',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              padding: '0.25rem',
              cursor: 'pointer',
              backgroundColor: bgColor,
              transition: 'background-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; }}
            title="Click to add event"
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
              <span style={{ 
                fontWeight: today ? 'bold' : 'normal', 
                color: today ? '#000' : dateColor,
                backgroundColor: today ? 'var(--gold-primary)' : 'transparent',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}>
                {formattedDate}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, overflowY: 'auto' }}>
              {dayActs.map((act, idx) => {
                const color = act.color || '#3b82f6';
                return (
                  <div 
                    key={`act-${idx}`} 
                    onClick={(e) => openEditEventModal(act, e)}
                    style={{ 
                      backgroundColor: color, 
                      color: 'white', 
                      padding: '2px 4px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      cursor: 'pointer'
                    }}
                    title="Click to edit event"
                  >
                    {act.title || 'Untitled Event'}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }} key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div style={{ borderLeft: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>{rows}</div>;
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem',
          width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold-primary)', margin: 0 }}>
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Title *</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                placeholder="Event Title"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Start Date *</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>End Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Council</label>
                <select 
                  value={formData.council}
                  onChange={e => setFormData({...formData, council: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                >
                  {COUNCILS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Urgency</label>
                <select 
                  value={formData.urgency}
                  onChange={e => setFormData({...formData, urgency: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                >
                  <option value="LIGHT">Light</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="FOR IMMEDIATE COMPLIANCE">Immediate Compliance</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Event Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div 
                    key={c.value}
                    onClick={() => setFormData({...formData, color: c.value})}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c.value,
                      cursor: 'pointer', border: formData.color === c.value ? '3px solid white' : '2px solid transparent',
                      boxShadow: formData.color === c.value ? `0 0 0 2px ${c.value}` : 'none'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description / Details</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', resize: 'vertical' }}
                placeholder="Event details..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {editingEvent ? (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  Delete Event
                </button>
              ) : <div></div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--gold-primary)', color: 'black', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          animation: 'slide-down 0.3s ease-out forwards'
        }}>
          <span>✅</span> CALENDAR UPDATED SUCCESSFULLY
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
          <h2 style={{ margin: 0, fontWeight: 900, letterSpacing: '0.15em', fontSize: '2rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>UPLOADING...</h2>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '1rem', marginBottom: '0.2rem', fontSize: '1.1rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>Parsing calendar activities.</p>
          <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0, fontSize: '0.9rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>Please stand by while I establish a secure uplink...</p>
        </div>
      )}

      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderModal()}
    </div>
  );
}
