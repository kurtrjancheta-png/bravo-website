'use client';

import { useState, useEffect } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal state for viewing a specific event's details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

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
    if (!isSameMonth(day, currentMonth)) {
      setCurrentMonth(day);
    }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)', margin: 0 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={goToToday} style={{ padding: '0.4rem 0.8rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
            Today
          </button>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={prevMonth} style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&lt;</button>
            <button onClick={nextMonth} style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&gt;</button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.25rem 0' }}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>{days}</div>;
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
        const isSelected = isSameDay(day, selectedDate);

        // Styling for cell
        let dateColor = isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)';
        
        let circleBg = 'transparent';
        let circleColor = dateColor;
        
        if (isSelected) {
          circleBg = 'rgba(212,175,55,0.3)'; // Highlight selected
          circleColor = 'var(--text-primary)';
        }
        if (today) {
          circleBg = 'var(--gold-primary)'; // Today overrides selected color
          circleColor = '#000';
        }

        days.push(
          <div
            key={day}
            onClick={() => onDateClick(cloneDay)}
            style={{
              height: '55px', // Compact height for mobile style
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              cursor: 'pointer',
              paddingTop: '0.2rem'
            }}
          >
            <div style={{ 
              fontWeight: (today || isSelected) ? 'bold' : '500', 
              color: circleColor,
              backgroundColor: circleBg,
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}>
              {formattedDate}
            </div>
            
            {/* Dots underneath the date */}
            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.2rem', maxWidth: '80%' }}>
              {dayBDays.map((_, idx) => (
                <div key={`bday-dot-${idx}`} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ec4899', flexShrink: 0 }} />
              ))}
              {dayActs.map((act, idx) => (
                <div key={`act-dot-${idx}`} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: act.color || '#3b82f6', flexShrink: 0 }} />
              ))}
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
    return <div>{rows}</div>;
  };

  const renderAgenda = () => {
    const { birthdays: dayBDays, activities: dayActs } = getEventsForDay(selectedDate);
    const hasEvents = dayBDays.length > 0 || dayActs.length > 0;

    return (
      <div style={{ marginTop: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {format(selectedDate, 'd')}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {format(selectedDate, 'EEEE')}
          </h3>
        </div>

        {!hasEvents ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            No events scheduled
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dayBDays.map((b, i) => (
              <div key={`agenda-bday-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderLeft: '4px solid #ec4899', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '1.5rem' }}>🎂</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{b.lastName}, {b.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.className}</div>
                </div>
              </div>
            ))}
            {dayActs.map((a, i) => {
              const startDate = a.dateRaw ? new Date(a.dateRaw) : null;
              const isAllDay = a.isAllDay !== undefined ? a.isAllDay : (!a.dateRaw || a.dateRaw.includes('T00:00:00'));
              return (
                <div 
                  key={`agenda-act-${i}`} 
                  onClick={() => { setSelectedEventDetails(a); setIsModalOpen(true); }}
                  style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderLeft: `4px solid ${a.color || '#3b82f6'}`, borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{a.title || a.content || 'Untitled Event'}</div>
                    {!isAllDay && startDate && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{format(startDate, 'h:mm a')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {a.council && <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '10px' }}>{a.council}</span>}
                    {isAllDay && <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '10px' }}>ALL DAY</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEventModal = () => {
    if (!isModalOpen || !selectedEventDetails) return null;
    const a = selectedEventDetails;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem',
          width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto',
          border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button onClick={() => { setIsModalOpen(false); setSelectedEventDetails(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: a.color || '#3b82f6' }}></div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{a.title || a.content || 'Untitled Event'}</h2>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '1.75rem' }}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                {a.endDateRaw && a.endDateRaw !== a.dateRaw && ` - ${format(new Date(a.endDateRaw), 'EEEE, MMMM d, yyyy')}`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingLeft: '1.75rem' }}>
              {a.council && (
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#bfdbfe', backgroundColor: 'rgba(30,58,138,0.6)', padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                  {a.council}
                </span>
              )}
              {a.urgency && (
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? '#fca5a5' : '#93c5fd', border: `1px solid ${a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? '#f87171' : '#60a5fa'}`, textTransform: 'uppercase' }}>
                  {a.urgency}
                </span>
              )}
            </div>

            {a.content && a.content !== a.title && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {a.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Fixed top calendar grid */}
      <div style={{ flexShrink: 0 }}>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      
      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1rem -1.5rem 0' }}></div>
      
      {/* Scrollable agenda list */}
      {renderAgenda()}
      
      {/* Modal */}
      {renderEventModal()}
    </div>
  );
}

