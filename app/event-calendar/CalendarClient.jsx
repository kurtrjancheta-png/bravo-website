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
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Confetti on load if there's a birthday today!
  useEffect(() => {
    const today = new Date();
    const hasBirthdayToday = birthdays.some(b => b.birthMonth === today.getMonth() && b.birthDay === today.getDate());
    
    if (hasBirthdayToday) {
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
  }, [birthdays]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const onDateClick = day => setSelectedDate(day);

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
          {format(addDays(startDate, i), 'EEEEEE')}
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
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const today = isToday(day);

        // Determine cell styling based on state
        let bgColor = 'var(--bg-secondary)';
        let opacity = 1;
        let borderColor = 'rgba(255,255,255,0.05)';
        let boxShadow = 'none';
        let zIndex = 1;

        if (!isCurrentMonth) {
          opacity = 0.3;
          bgColor = 'rgba(0,0,0,0.2)';
        }
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
              opacity: opacity,
              boxShadow: boxShadow,
              zIndex: zIndex,
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', color: today ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                {formattedDate}
              </span>
              {hasEvents && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {dayBDays.length > 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899', boxShadow: '0 0 8px rgba(236,72,153,0.8)' }}></span>}
                  {dayActs.length > 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.8)' }}></span>}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', height: '60px' }}>
              {dayBDays.slice(0, 2).map((b, idx) => (
                <div key={idx} style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: 'rgba(236,72,153,0.2)', color: '#f9a8d4', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(236,72,153,0.3)', fontWeight: '600' }}>
                  🎂 {b.name.split(' ')[0]}
                </div>
              ))}
              {dayActs.slice(0, 2).map((a, idx) => (
                <div key={idx} style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.3)', fontWeight: '600' }}>
                  📌 {a.council}
                </div>
              ))}
              {(dayBDays.length + dayActs.length) > 2 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center' }}>
                  +{(dayBDays.length + dayActs.length) - 2} more
                </div>
              )}
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

  const renderEventDetails = () => {
    const { birthdays: selectedBdays, activities: selectedActs } = getEventsForDay(selectedDate);
    const hasEvents = selectedBdays.length > 0 || selectedActs.length > 0;

    return (
      <div style={{ marginTop: '2rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
          Events for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {!hasEvents ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>No events scheduled for this day.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Birthdays */}
            {selectedBdays.length > 0 && (
              <div>
                <h4 style={{ color: '#f472b6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0' }}>
                  <span style={{ fontSize: '1.125rem' }}>🎂</span> Birthdays
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {selectedBdays.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(to bottom right, #ec4899, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.25rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid black' }}>
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.875rem' }}>{b.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#f9a8d4', fontWeight: '600' }}>{b.className}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedActs.length > 0 && (
              <div>
                <h4 style={{ color: '#60a5fa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0' }}>
                  <span style={{ fontSize: '1.125rem' }}>📌</span> Council Activities
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {selectedActs.map((a, i) => (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase', backgroundColor: 'rgba(30,58,138,0.4)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{a.council}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: a.urgency === 'EMERGENCY' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: a.urgency === 'EMERGENCY' ? '#f87171' : '#60a5fa' }}>{a.urgency}</span>
                      </div>
                      <p style={{ color: '#e5e7eb', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventDetails()}
    </div>
  );
}
