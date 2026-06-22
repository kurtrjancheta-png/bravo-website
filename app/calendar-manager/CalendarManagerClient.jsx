'use client';

import { useState, useRef, useEffect } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, parseISO,
  differenceInDays, isBefore, isAfter, max, min
} from 'date-fns';

export default function CalendarManagerClient({ initialActivities = [], birthdays = [], apiUrl }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Local state for activities, incorporating pending changes
  const [activities, setActivities] = useState(initialActivities);
  const [pendingChanges, setPendingChanges] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // null means new event

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    endDate: '',
    council: '',
    description: '',
    location: '', // new
    photos: '',   // new
    files: '',    // new
    color: '#3b82f6',
    urgency: 'LIGHT'
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const addPendingChange = (change) => {
    setPendingChanges(prev => [...prev, change]);
    
    // Apply optimistically
    if (change.type === 'CREATE') {
      setActivities(prev => [...prev, change.event]);
    } else if (change.type === 'UPDATE') {
      setActivities(prev => prev.map(a => a.id === change.event.id ? change.event : a));
    } else if (change.type === 'DELETE') {
      setActivities(prev => prev.filter(a => a.id !== change.eventId));
    }
  };

  const getEventsForDay = (day) => {
    const dayBirthdays = birthdays.filter(b => b.birthMonth === day.getMonth() && b.birthDay === day.getDate());
    
    const dayActivities = activities.filter(a => {
      if (!a.date) return false;
      try {
        const start = new Date(a.date);
        // Normalize time to start of day for comparison
        const normStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const normDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        
        let normEnd = normStart;
        if (a.endDate) {
          const end = new Date(a.endDate);
          normEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        }
        
        return normDay >= normStart && normDay <= normEnd;
      } catch (e) {
        return false;
      }
    });

    return { birthdays: dayBirthdays, activities: dayActivities };
  };

  const handleDayClick = (day) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: format(day, "yyyy-MM-dd'T'12:00"),
      endDate: format(day, "yyyy-MM-dd'T'13:00"),
      council: '',
      description: '',
      location: '',
      photos: '',
      files: '',
      color: '#3b82f6',
      urgency: 'LIGHT'
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (e, act) => {
    e.stopPropagation();
    setEditingEvent(act);
    setFormData({
      title: act.title || '',
      date: act.date ? new Date(act.date).toISOString().slice(0, 16) : '',
      endDate: act.endDate ? new Date(act.endDate).toISOString().slice(0, 16) : '',
      council: act.council || '',
      description: act.description || '',
      location: act.location || '',
      photos: act.photos || '',
      files: act.files || '',
      color: act.color || '#3b82f6',
      urgency: act.urgency || 'LIGHT'
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Title and Date are required.");
      return;
    }

    // Ensure dates are parsed to standard ISO format strings
    let d = formData.date;
    let ed = formData.endDate;
    try { d = new Date(formData.date).toISOString(); } catch(err){}
    if (ed) {
      try { ed = new Date(formData.endDate).toISOString(); } catch(err){}
    }

    if (editingEvent) {
      const updatedEvent = { ...editingEvent, ...formData, date: d, endDate: ed };
      addPendingChange({ type: 'UPDATE', event: updatedEvent });
    } else {
      const newEvent = { 
        id: `local-${Date.now()}`, // Temporary ID
        ...formData, 
        date: d, 
        endDate: ed 
      };
      addPendingChange({ type: 'CREATE', event: newEvent });
    }

    setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
    if (!editingEvent) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      addPendingChange({ type: 'DELETE', eventId: editingEvent.id });
      setIsModalOpen(false);
    }
  };

  const handleUploadChanges = async () => {
    if (pendingChanges.length === 0) return;
    
    setIsUploading(true);
    setIsLaunching(false);

    try {
      // Process sequentially to handle local IDs properly (though parallel is possible)
      for (const change of pendingChanges) {
        let payload = {};
        if (change.type === 'CREATE') {
          // Remove local ID so backend generates one
          const { id, ...eventData } = change.event;
          payload = { action: 'createEvent', event: eventData };
        } else if (change.type === 'UPDATE') {
          payload = { action: 'updateEvent', event: change.event };
        } else if (change.type === 'DELETE') {
          // If it was created and deleted before sync, ignore it (local IDs won't exist on backend)
          if (String(change.eventId).startsWith('local-')) continue; 
          payload = { action: 'deleteEvent', id: change.eventId };
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          console.error("Failed change:", change, data.error);
          throw new Error(data.error || "Error syncing change");
        }
      }

      // Successful, trigger launch
      setIsLaunching(true);
      setTimeout(() => {
        setIsLaunching(false);
        setIsUploading(false);
        setShowSuccessToast(true);
        setPendingChanges([]);
        setTimeout(() => {
          setShowSuccessToast(false);
          // Optional: Re-fetch or reload to get real IDs for created events
          window.location.reload();
        }, 3000);
      }, 800);

    } catch (err) {
      setIsUploading(false);
      alert(`Upload Failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        
        const payload = {
          action: 'uploadFile',
          filename: file.name,
          mimeType: file.type,
          base64Data: base64Data
        };

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success && data.url) {
          setFormData(prev => ({ ...prev, [fieldName]: data.url }));
        } else {
          alert('Failed to upload file: ' + (data.error || 'Unknown error'));
        }
        setIsUploadingFile(false);
      };
      reader.onerror = () => {
        alert('Failed to read file locally');
        setIsUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(`Upload error: ${err.message}`);
      setIsUploadingFile(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, act, actionType) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ eventId: act.id, actionType }));
    // Optional: set drag image or effect
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.2)'; // Highlight
  };

  const handleDragLeave = (e, originalBg) => {
    e.currentTarget.style.backgroundColor = originalBg;
  };

  const handleDrop = (e, dropDate, originalBg) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = originalBg;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { eventId, actionType } = data;
      const act = activities.find(a => a.id === eventId);
      if (!act) return;

      let newDate = act.date ? new Date(act.date) : new Date();
      let newEndDate = act.endDate ? new Date(act.endDate) : newDate;

      // Keep the time of day, just change the date
      if (actionType === 'move') {
        const diff = differenceInDays(dropDate, new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
        newDate = addDays(newDate, diff);
        newEndDate = addDays(newEndDate, diff);
      } else if (actionType === 'resizeStart') {
        // Must be before or equal to end date
        const droppedAtEnd = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate());
        const endDay = new Date(newEndDate.getFullYear(), newEndDate.getMonth(), newEndDate.getDate());
        if (isAfter(droppedAtEnd, endDay)) return; // Invalid
        
        newDate = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate(), newDate.getHours(), newDate.getMinutes());
      } else if (actionType === 'resizeEnd') {
        // Must be after or equal to start date
        const droppedAtStart = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate());
        const startDay = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        if (isBefore(droppedAtStart, startDay)) return; // Invalid
        
        newEndDate = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate(), newEndDate.getHours(), newEndDate.getMinutes());
      }

      const updatedEvent = {
        ...act,
        date: newDate.toISOString(),
        endDate: newEndDate.toISOString()
      };

      addPendingChange({ type: 'UPDATE', event: updatedEvent });

    } catch (err) {
      console.error("Drop error", err);
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
        
        const { birthdays: dayBDays, activities: dayActs } = getEventsForDay(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const today = isToday(day);

        let bgColor = isCurrentMonth ? 'var(--bg-primary)' : 'rgba(0,0,0,0.1)';
        let dateColor = isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)';
        
        if (today) {
          bgColor = 'rgba(212,175,55,0.05)';
        }

        days.push(
          <div
            key={day}
            onClick={() => handleDayClick(cloneDay)}
            onDragOver={handleDragOver}
            onDragLeave={(e) => handleDragLeave(e, bgColor)}
            onDrop={(e) => handleDrop(e, cloneDay, bgColor)}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, overflowY: 'auto' }}>
              {/* Birthdays (Read-Only) */}
              {dayBDays.map((b, idx) => (
                <div key={`bday-${idx}`} style={{ 
                  backgroundColor: 'rgba(236,72,153,0.8)', color: 'white', padding: '2px 4px', 
                  borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', 
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  cursor: 'default'
                }} onClick={(e) => e.stopPropagation()}>
                  🎂 {b.lastName}
                </div>
              ))}
              
              {/* Activities (Draggable & Editable) */}
              {dayActs.map((act, idx) => {
                const color = act.color || '#3b82f6';
                
                // Determine if this is a multi-day event and if it's the start/end segment
                const actStart = new Date(act.date);
                const actStartNorm = new Date(actStart.getFullYear(), actStart.getMonth(), actStart.getDate());
                const actEnd = act.endDate ? new Date(act.endDate) : actStart;
                const actEndNorm = new Date(actEnd.getFullYear(), actEnd.getMonth(), actEnd.getDate());
                const dayNorm = new Date(cloneDay.getFullYear(), cloneDay.getMonth(), cloneDay.getDate());
                
                const isStart = actStartNorm.getTime() === dayNorm.getTime();
                const isEnd = actEndNorm.getTime() === dayNorm.getTime();
                const isMultiDay = actStartNorm.getTime() !== actEndNorm.getTime();

                return (
                  <div 
                    key={`act-${act.id || idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, act, 'move')}
                    onClick={(e) => handleEventClick(e, act)}
                    style={{ 
                      backgroundColor: color, 
                      color: 'white', 
                      padding: '2px 4px', 
                      borderRadius: isMultiDay ? (isStart ? '4px 0 0 4px' : (isEnd ? '0 4px 4px 0' : '0')) : '4px',
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      cursor: 'grab',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: 0.9,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.9}
                  >
                    {/* Left Resize Handle */}
                    {isStart && (
                       <div 
                         draggable
                         onDragStart={(e) => handleDragStart(e, act, 'resizeStart')}
                         onClick={(e) => e.stopPropagation()}
                         style={{ cursor: 'ew-resize', width: '6px', height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }}
                         title="Drag to adjust start date"
                       />
                    )}
                    
                    <span style={{ padding: '0 4px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(isStart || day.getDay() === 0) ? (act.title || act.description || 'Untitled') : '\u00A0'}
                    </span>

                    {/* Right Resize Handle */}
                    {isEnd && (
                       <div 
                         draggable
                         onDragStart={(e) => handleDragStart(e, act, 'resizeEnd')}
                         onClick={(e) => e.stopPropagation()}
                         style={{ cursor: 'ew-resize', width: '6px', height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }}
                         title="Drag to adjust end date"
                       />
                    )}
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
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fade-in 0.2s ease-out'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem',
          width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {editingEvent ? 'Edit Activity' : 'New Activity'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Title</label>
              <input 
                type="text" required
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Start Date</label>
                <input 
                  type="datetime-local" required
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>End Date</label>
                <input 
                  type="datetime-local" 
                  value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Council/Team</label>
                <input 
                  type="text" 
                  value={formData.council} onChange={e => setFormData({...formData, council: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Urgency</label>
                <select 
                  value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="LIGHT">Light</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Location (Optional)</label>
              <input 
                type="text" placeholder="Where will this take place?"
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Photos URL (Optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="url" placeholder="https://..."
                    value={formData.photos} onChange={e => setFormData({...formData, photos: e.target.value})}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Or upload a file:</span>
                    <input 
                      type="file" 
                      onChange={e => handleFileUpload(e, 'photos')} 
                      disabled={isUploadingFile}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Files/Drive Link (Optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="url" placeholder="https://..."
                    value={formData.files} onChange={e => setFormData({...formData, files: e.target.value})}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Or upload a file:</span>
                    <input 
                      type="file" 
                      onChange={e => handleFileUpload(e, 'files')} 
                      disabled={isUploadingFile}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Color Label</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                  <div 
                    key={color}
                    onClick={() => setFormData({...formData, color})}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                      border: formData.color === color ? '3px solid #fff' : '3px solid transparent',
                      boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Description / Remarks</label>
              <textarea 
                rows="4"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              {editingEvent ? (
                <button type="button" onClick={handleDeleteEvent} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Delete
                </button>
              ) : <div></div>}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploadingFile}
                  style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isUploadingFile ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)', opacity: isUploadingFile ? 0.7 : 1 }}
                >
                  {isUploadingFile ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative' }}>
      
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
          <h2 style={{ margin: 0, fontWeight: 900, letterSpacing: '0.15em', fontSize: '2rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>UPLOADING CHANGES...</h2>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '1rem', marginBottom: '0.2rem', fontSize: '1.1rem', opacity: isLaunching ? 0 : 1, transition: 'opacity 0.2s' }}>Syncing {pendingChanges.length} local edits with the mainframe.</p>
        </div>
      )}

      {/* Floating Action Button for Upload */}
      {pendingChanges.length > 0 && !isUploading && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1f2937', color: '#fff', padding: '1rem 2rem', borderRadius: '999px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '1rem',
          zIndex: 1000, animation: 'slide-down 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 800 }}>{pendingChanges.length} UNSAVED CHANGES</div>
          <button 
            onClick={handleUploadChanges}
            style={{ 
              backgroundColor: 'var(--gold-primary)', color: '#000', border: 'none', 
              padding: '0.5rem 1.5rem', borderRadius: '999px', fontWeight: 900, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <span>🚀</span> UPLOAD TO DATABASE
          </button>
        </div>
      )}

      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderModal()}
    </div>
  );
}
