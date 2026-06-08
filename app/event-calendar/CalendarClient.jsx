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
        // Try parsing 'MM/DD/YYYY' or similar
        // Since we don't know the exact format, let's try a generic parse
        // Usually JS Date can parse '12/25/2026'
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
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-gold)] hover:text-black transition-colors font-bold text-lg">&lt;</button>
        <h2 className="text-2xl font-black text-[var(--gold-primary)] uppercase tracking-widest">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-gold)] hover:text-black transition-colors font-bold text-lg">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider py-2">
          {format(addDays(startDate, i), 'EEEEEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
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

        days.push(
          <div
            key={day}
            onClick={() => onDateClick(cloneDay)}
            className={`
              relative min-h-[100px] border border-[rgba(255,255,255,0.05)] p-2 cursor-pointer transition-all
              ${!isCurrentMonth ? 'opacity-30 bg-black/20' : 'bg-[var(--bg-secondary)] hover:bg-[rgba(212,175,55,0.1)]'}
              ${isSelected ? 'ring-2 ring-[var(--gold-primary)] z-10' : ''}
              ${today ? 'bg-[rgba(212,175,55,0.05)] border-[var(--gold-primary)]' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`font-bold ${today ? 'text-[var(--gold-primary)]' : 'text-white'}`}>
                {formattedDate}
              </span>
              {hasEvents && (
                <div className="flex gap-1">
                  {dayBDays.length > 0 && <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>}
                  {dayActs.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                </div>
              )}
            </div>
            
            <div className="mt-2 flex flex-col gap-1 overflow-hidden h-[60px]">
              {dayBDays.slice(0, 2).map((b, idx) => (
                <div key={idx} className="text-[0.65rem] truncate bg-pink-500/20 text-pink-300 px-1 py-0.5 rounded border border-pink-500/30 font-semibold">
                  🎂 {b.name.split(' ')[0]}
                </div>
              ))}
              {dayActs.slice(0, 2).map((a, idx) => (
                <div key={idx} className="text-[0.65rem] truncate bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded border border-blue-500/30 font-semibold">
                  📌 {a.council}
                </div>
              ))}
              {(dayBDays.length + dayActs.length) > 2 && (
                <div className="text-[0.65rem] text-[var(--text-secondary)] font-bold text-center">
                  +{(dayBDays.length + dayActs.length) - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-black/40 rounded-xl overflow-hidden border border-[var(--border-color)] shadow-2xl">{rows}</div>;
  };

  const renderEventDetails = () => {
    const { birthdays: selectedBdays, activities: selectedActs } = getEventsForDay(selectedDate);
    const hasEvents = selectedBdays.length > 0 || selectedActs.length > 0;

    return (
      <div className="mt-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-[var(--gold-primary)] mb-4 border-b border-[var(--border-color)] pb-2 uppercase tracking-wide">
          Events for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {!hasEvents ? (
          <p className="text-[var(--text-secondary)] italic">No events scheduled for this day.</p>
        ) : (
          <div className="space-y-6">
            {/* Birthdays */}
            {selectedBdays.length > 0 && (
              <div>
                <h4 className="text-pink-400 font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">🎂</span> Birthdays
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedBdays.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 bg-black/30 border border-pink-500/20 rounded-lg p-3 hover:border-pink-500/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-black">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{b.name}</div>
                        <div className="text-xs text-pink-300 font-semibold">{b.className}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedActs.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">📌</span> Council Activities
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedActs.map((a, i) => (
                    <div key={i} className="bg-black/30 border border-blue-500/20 rounded-lg p-4 border-l-4 border-l-blue-500 hover:bg-black/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-300 uppercase bg-blue-900/40 px-2 py-1 rounded">{a.council}</span>
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{
                          backgroundColor: a.urgency === 'EMERGENCY' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: a.urgency === 'EMERGENCY' ? '#f87171' : '#60a5fa'
                        }}>{a.urgency}</span>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{a.content}</p>
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
    <div className="calendar-wrapper">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventDetails()}
    </div>
  );
}
