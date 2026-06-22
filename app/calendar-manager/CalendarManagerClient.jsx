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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderModal()}
    </div>
  );
}
