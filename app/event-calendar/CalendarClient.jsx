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
  parse,
  isToday
} from 'date-fns';
import confetti from 'canvas-confetti';

export default function CalendarClient({ birthdays, activities }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal state for viewing a specific day's events
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

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
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#D4AF37', '#FFFFFF', '#000000']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#D4AF37', '#FFFFFF', '#000000']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  };

  const renderHeader = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={prevMonth} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--text-primary)' }}>&lt;</button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--text-primary)' }}>&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 0' }}>
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
        const hasEvents = dayBDays.length > 0 || dayActs.length > 0;
        const isSelected = selectedDate && isSameDay(day, selectedDate) && isModalOpen;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const today = isToday(day);

        // Render blank cells for days outside the current month
        if (!isCurrentMonth) {
          days.push(<div key={day} style={{ minHeight: '100px', backgroundColor: 'transparent' }}></div>);
          day = addDays(day, 1);
          continue;
        }

        // Determine cell styling based on state
        let bgColor = 'var(--bg-secondary)';
        let borderColor = 'rgba(255,255,255,0.05)';
        let boxShadow = 'none';
        let zIndex = 1;

        if (today) {
          bgColor = 'rgba(212,175,55,0.05)';
          borderColor = 'var(--gold-primary)';
        }
        if (isSelected) {
          boxShadow = '0 0 0 2px var(--gold-primary)';
          zIndex = 10;
        }

        days.push(
          <div
            key={day}
            onClick={() => onDateClick(cloneDay)}
            style={{
              position: 'relative',
              minHeight: '100px',
              border: `1px solid ${borderColor}`,
              padding: '0.5rem',
              cursor: 'pointer',
              backgroundColor: bgColor,
              boxShadow: boxShadow,
              zIndex: zIndex,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
               if (isCurrentMonth) e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.2)';
            }}
            onMouseLeave={(e) => {
               if (isCurrentMonth) e.currentTarget.style.backgroundColor = bgColor;
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', color: today ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                {formattedDate}
              </span>
              {hasEvents && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
                  {dayBDays.map((_, idx) => (
                    <span key={`bday-${idx}`} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899', boxShadow: '0 0 8px rgba(236,72,153,0.8)' }}></span>
                  ))}
                  {dayActs.map((act, idx) => {
                    const colors = {
                      'LIGHT': '#4ade80',
                      'MODERATE': '#facc15',
                      'EMERGENCY': '#f87171',
                      'FOR IMMEDIATE COMPLIANCE': '#fb923c'
                    };
                    const color = colors[act.urgency] || '#3b82f6';
                    return (
                      <span key={`act-${idx}`} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', height: '60px' }}>
              {/* Names and councils hidden on grid view to keep it clean */}
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
    return <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>{rows}</div>;
  };

  const renderEventModal = () => {
    if (!isModalOpen || !selectedDate) return null;

    const { birthdays: selectedBdays, activities: selectedActs } = getEventsForDay(selectedDate);
    const hasEvents = selectedBdays.length > 0 || selectedActs.length > 0;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              &times;
            </button>
          </div>
          
          {!hasEvents ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📅</span>
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, fontSize: '1.1rem' }}>No events scheduled for this day.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Birthdays */}
              {selectedBdays.length > 0 && (
                <div>
                  <h4 style={{ color: '#f472b6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎂</span> Birthdays
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {selectedBdays.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(to bottom right, #ec4899, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', border: '2px solid black' }}>
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '900', color: 'white', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{b.lastName.toUpperCase()}</div>
                          <div style={{ fontWeight: '500', color: '#f9a8d4', fontSize: '0.85rem' }}>{b.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#fbcfe8', fontWeight: '600', marginTop: '0.25rem', backgroundColor: 'rgba(236,72,153,0.2)', display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{b.className}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              {selectedActs.length > 0 && (
                <div>
                  <h4 style={{ color: '#60a5fa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
                    <span style={{ fontSize: '1.5rem' }}>📌</span> Council Activities
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {selectedActs.map((a, i) => (
                      <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '1.25rem', borderLeft: '6px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#bfdbfe', textTransform: 'uppercase', backgroundColor: 'rgba(30,58,138,0.6)', padding: '0.25rem 0.75rem', borderRadius: '6px' }}>{a.council}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderRadius: '6px', backgroundColor: a.urgency === 'EMERGENCY' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: a.urgency === 'EMERGENCY' ? '#fca5a5' : '#93c5fd', border: `1px solid ${a.urgency === 'EMERGENCY' ? '#f87171' : '#60a5fa'}` }}>{a.urgency}</span>
                        </div>
                        <p style={{ color: '#f3f4f6', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>{a.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventModal()}
    </div>
  );
}
