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
  isToday
} from 'date-fns';
import confetti from 'canvas-confetti';

export default function CalendarClient({ birthdays, activities }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal state for viewing a specific day's events
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Collect events for a given day
  const getEventsForDay = (day) => {
    const dayBirthdays = birthdays.filter(b => b.birthMonth === day.getMonth() && b.birthDay === day.getDate());
    
    const dayActivities = activities.filter(a => {
      if (!a.dateRaw) return false;
      try {
        const actDate = new Date(a.dateRaw);
        if (isNaN(actDate)) return false;
        return actDate.getMonth() === day.getMonth() && 
               actDate.getDate() === day.getDate() && 
               actDate.getFullYear() === day.getFullYear();
      } catch (e) {
        return false;
      }
    });

    return { birthdays: dayBirthdays, activities: dayActivities };
  };

  const onDateClick = (day) => {
    setSelectedDate(day);
    setIsModalOpen(true);

    const { birthdays: dayBirthdays } = getEventsForDay(day);
    
    // Trigger confetti ONLY when clicking a date with a birthday that is TODAY
    if (dayBirthdays.length > 0 && isToday(day)) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
          colors: ['#D4AF37', '#FFFFFF', '#000000']
        });
        confetti({
          particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
          colors: ['#D4AF37', '#FFFFFF', '#000000']
        });

        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
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

        // Styling for cell
        let bgColor = isCurrentMonth ? 'var(--bg-primary)' : 'rgba(0,0,0,0.1)';
        let dateColor = isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)';
        
        if (today) {
          bgColor = 'rgba(212,175,55,0.05)';
        }

        days.push(
          <div
            key={day}
            onClick={() => onDateClick(cloneDay)}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, overflowY: 'auto' }}>
              {/* Event Chips */}
              {dayBDays.map((b, idx) => (
                <div key={`bday-${idx}`} style={{ backgroundColor: '#ec4899', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🎂 {b.lastName}
                </div>
              ))}
              {dayActs.map((act, idx) => {
                const color = act.color || '#3b82f6';
                return (
                  <div key={`act-${idx}`} style={{ backgroundColor: color, color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.title || act.content || 'Untitled Event'}
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

  const renderEventModal = () => {
    if (!isModalOpen || !selectedDate) return null;

    const { birthdays: selectedBdays, activities: selectedActs } = getEventsForDay(selectedDate);
    const hasEvents = selectedBdays.length > 0 || selectedActs.length > 0;

    if (selectedEventDetails) {
      const a = selectedEventDetails;
      return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem',
            width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setSelectedEventDetails(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                &larr; Back
              </button>
              <button onClick={() => { setIsModalOpen(false); setSelectedEventDetails(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: a.color || '#3b82f6' }}></div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{a.title || a.content || 'Untitled Event'}</h2>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.75rem' }}>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  {a.endDateRaw && a.endDateRaw !== a.dateRaw && ` - ${format(new Date(a.endDateRaw), 'EEEE, MMMM d, yyyy')}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {a.council && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#bfdbfe', backgroundColor: 'rgba(30,58,138,0.6)', padding: '0.35rem 0.75rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                    {a.council}
                  </span>
                )}
                {a.urgency && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.35rem 0.75rem', borderRadius: '6px', backgroundColor: a.urgency === 'EMERGENCY' || a.urgency === 'FOR IMMEDIATE COMPLIANCE' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: a.urgency === 'EMERGENCY' || a.urgency === 'FOR IMMEDIATE COMPLIANCE' ? '#fca5a5' : '#93c5fd', border: `1px solid ${a.urgency === 'EMERGENCY' || a.urgency === 'FOR IMMEDIATE COMPLIANCE' ? '#f87171' : '#60a5fa'}`, textTransform: 'uppercase' }}>
                    {a.urgency}
                  </span>
                )}
              </div>

              {a.content && a.content !== a.title && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Description</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {a.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem',
          width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
          border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          {!hasEvents ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No events scheduled for this day.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedBdays.map((b, i) => (
                <div key={`bday-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'rgba(236,72,153,0.1)', borderLeft: '4px solid #ec4899', borderRadius: '4px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎂</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{b.lastName}, {b.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.className}</div>
                  </div>
                </div>
              ))}
              {selectedActs.map((a, i) => (
                <div 
                  key={`act-${i}`} 
                  onClick={() => setSelectedEventDetails(a)}
                  style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${a.color || '#3b82f6'}`, borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{a.title || a.content || 'Untitled Event'}</div>
                    {a.council && <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px' }}>{a.council}</span>}
                  </div>
                  {a.content && a.content !== a.title && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventModal()}
    </div>
  );
}
