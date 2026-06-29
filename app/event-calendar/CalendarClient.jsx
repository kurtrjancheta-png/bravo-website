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
  addWeeks,
  subWeeks,
  isToday
} from 'date-fns';
import confetti from 'canvas-confetti';

export default function CalendarClient({ birthdays, activities }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('MONTH'); // 'MONTH' or 'WEEK'
  
  // Modal state for viewing a specific day's events
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextPeriod = () => {
    if (viewMode === 'MONTH') setCurrentMonth(addMonths(currentMonth, 1));
    else if (viewMode === 'WEEK') setCurrentMonth(addWeeks(currentMonth, 1));
    else setCurrentMonth(addDays(currentMonth, 1));
  };
  const prevPeriod = () => {
    if (viewMode === 'MONTH') setCurrentMonth(subMonths(currentMonth, 1));
    else if (viewMode === 'WEEK') setCurrentMonth(subWeeks(currentMonth, 1));
    else setCurrentMonth(subDays(currentMonth, 1));
  };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gold-primary)', margin: 0 }}>
            {viewMode === 'MONTH' ? format(currentMonth, 'MMMM yyyy') : viewMode === 'WEEK' ? `Week of ${format(startOfWeek(currentMonth), 'MMM d, yyyy')}` : format(currentMonth, 'MMMM d, yyyy')}
          </h2>
          <button onClick={goToToday} style={{ padding: '0.4rem 1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
            Today
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
            <button 
              onClick={() => setViewMode('MONTH')} 
              style={{ padding: '0.4rem 1rem', backgroundColor: viewMode === 'MONTH' ? 'var(--gold-primary)' : 'transparent', color: viewMode === 'MONTH' ? '#000' : 'var(--text-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('WEEK')} 
              style={{ padding: '0.4rem 1rem', backgroundColor: viewMode === 'WEEK' ? 'var(--gold-primary)' : 'transparent', color: viewMode === 'WEEK' ? '#000' : 'var(--text-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode('DAY')} 
              style={{ padding: '0.4rem 1rem', backgroundColor: viewMode === 'DAY' ? 'var(--gold-primary)' : 'transparent', color: viewMode === 'DAY' ? '#000' : 'var(--text-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Day
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={prevPeriod} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&lt;</button>
            <button onClick={nextPeriod} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>&gt;</button>
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
        <div key={i} style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', padding: '0.5rem 0' }}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)' }}>{days}</div>;
  };

  const renderCells = () => {
    let startDate, endDate, monthStart;

    if (viewMode === 'MONTH') {
      monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    } else {
      startDate = startOfWeek(currentMonth);
      endDate = endOfWeek(currentMonth);
      monthStart = startDate; // to avoid graying out days in week view
    }

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const { birthdays: dayBDays, activities: dayActs } = getEventsForDay(day);
        const isCurrentMonth = viewMode === 'WEEK' ? true : isSameMonth(day, monthStart);
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
              minHeight: viewMode === 'WEEK' ? (isMobile ? '250px' : '600px') : (isMobile ? '65px' : '120px'),
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
            onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'; }}
            onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.backgroundColor = bgColor; }}
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
            
            {isMobile ? (
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.25rem', overflow: 'hidden' }}>
                {dayBDays.map((_, idx) => (
                  <div key={`bday-dot-${idx}`} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ec4899', flexShrink: 0 }} title="Birthday" />
                ))}
                {dayActs.map((act, idx) => (
                  <div key={`act-dot-${idx}`} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: act.color || '#3b82f6', flexShrink: 0 }} title={act.title} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, overflowY: 'auto' }}>
                {/* Event Chips */}
                {dayBDays.map((b, idx) => (
                  <div key={`bday-${idx}`} className="clickable-event-chip birthday-chip" style={{ backgroundColor: '#ec4899', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🎂 {b.lastName}
                  </div>
                ))}
                {dayActs.map((act, idx) => {
                  const color = act.color || '#3b82f6';
                  return (
                    <div key={`act-${idx}`} className="clickable-event-chip" style={{ backgroundColor: color, color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.title || act.content || 'Untitled Event'}
                    </div>
                  );
                })}
              </div>
            )}
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

  const renderDayView = () => {
    const { birthdays: dayBDays, activities: dayActs } = getEventsForDay(currentMonth);
    
    const allDayEvents = [];
    const timedEvents = [];
    
    dayActs.forEach(act => {
      const isAllDay = act.isAllDay !== undefined ? act.isAllDay : (!act.dateRaw || act.dateRaw.includes('T00:00:00'));
      if (isAllDay) {
        allDayEvents.push(act);
      } else {
        timedEvents.push(act);
      }
    });

    return (
      <div style={{ borderLeft: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '60px', flexShrink: 0, padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}>
            All Day
          </div>
          <div style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dayBDays.map((b, idx) => (
              <div key={`day-bday-${idx}`} className="clickable-event-chip" style={{ backgroundColor: '#ec4899', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                🎂 {b.lastName}, {b.name} (Birthday)
              </div>
            ))}
            {allDayEvents.map((act, idx) => (
              <div key={`day-all-${idx}`} className="clickable-event-chip" onClick={() => { setSelectedDate(currentMonth); setSelectedEventDetails(act); setIsModalOpen(true); }} style={{ backgroundColor: act.color || '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                {act.title || act.content || 'Untitled Event'}
              </div>
            ))}
            {dayBDays.length === 0 && allDayEvents.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No all-day events</span>}
          </div>
        </div>

        <div style={{ display: 'flex', position: 'relative', height: '600px', overflowY: 'auto' }}>
          <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color)' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={`time-${i}`} style={{ height: '60px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', right: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={`grid-${i}`} style={{ height: '60px', borderBottom: '1px solid var(--border-color)', opacity: 0.1 }}></div>
            ))}
            
            {timedEvents.map((act, idx) => {
              const startDate = new Date(act.dateRaw);
              const startHour = startDate.getHours();
              const startMinute = startDate.getMinutes();
              const top = (startHour * 60) + startMinute;
              
              let duration = 60;
              if (act.endDateRaw) {
                const endDate = new Date(act.endDateRaw);
                const diffMins = (endDate - startDate) / 60000;
                if (diffMins > 0) duration = diffMins;
              }
              const height = Math.max(20, duration);

              return (
                <div 
                  key={`day-timed-${idx}`} 
                  onClick={() => { setSelectedDate(currentMonth); setSelectedEventDetails(act); setIsModalOpen(true); }}
                  style={{
                    position: 'absolute', top: `${top}px`, height: `${height}px`, left: '10px', right: '10px',
                    backgroundColor: act.color || '#3b82f6', color: 'white', borderRadius: '4px', padding: '4px 8px',
                    fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{act.title || act.content || 'Untitled'}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {format(startDate, 'h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.35rem 0.75rem', borderRadius: '6px', backgroundColor: a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? '#fca5a5' : '#93c5fd', border: `1px solid ${a.urgency === 'URGENT' || a.urgency === 'FOR STRICT COMPLIANCE' ? '#f87171' : '#60a5fa'}`, textTransform: 'uppercase' }}>
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
                  className="clickable-event-list-item"
                  style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${a.color || '#3b82f6'}`, borderRadius: '4px', cursor: 'pointer' }}
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
      {viewMode === 'DAY' ? (
        renderDayView()
      ) : (
        <>
          {renderDays()}
          {renderCells()}
        </>
      )}
      {renderEventModal()}
    </div>
  );
}
