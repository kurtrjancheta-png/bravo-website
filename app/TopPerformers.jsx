"use client";

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { getCadetImageUrl } from '../lib/imageMatcher';
import InfiniteSlider from './components/InfiniteSlider';

export default function TopPerformers({ topPerformers }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fire confetti for 3 seconds on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const formatRunValue = (val) => {
    // val is expected to be total seconds
    if (typeof val === 'number' && val > 0) {
        const mins = Math.floor(val / 60);
        const secs = Math.floor(val % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return val;
  };

  const renderCombinedEvent = (title, dataM, labelM, unitM, dataF, labelF, unitF, icon, isTime = false) => {
    const hasM = dataM && dataM.value !== -1 && dataM.value !== 999999 && dataM.cadets.length > 0;
    const hasF = dataF && dataF.value !== -1 && dataF.value !== 999999 && dataF.cadets.length > 0;
    
    if (!hasM && !hasF) return null;

    const renderGenderSection = (genderData, label, unit) => {
      if (!genderData || genderData.value === -1 || genderData.value === 999999 || genderData.cadets.length === 0) return null;
      let displayValue = isTime ? formatRunValue(genderData.value) : genderData.value;
      
      return (
        <div style={{ marginBottom: '1rem', borderBottom: label === labelM && hasF ? '1px dashed #cbd5e1' : 'none', paddingBottom: label === labelM && hasF ? '1rem' : '0' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.75rem' }}>
            {displayValue} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>{unit}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {genderData.cadets.map((c, i) => {
              const pic = getCadetImageUrl(c.surname || c.name, '', c.name, c.class);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {pic ? (
                    <img src={pic} alt={c.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} />
                  ) : (
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      🧑‍✈️
                    </div>
                  )}
                  <span style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="event-card" style={{ flex: '1', minWidth: '220px', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h4 style={{ color: '#475569', fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <span style={{ fontSize: '1.25rem' }}>{icon}</span> {title}
        </h4>
        {hasM && renderGenderSection(dataM, labelM, unitM)}
        {hasF && renderGenderSection(dataF, labelF, unitF)}
      </div>
    );
  };

  const renderClass = (className, data) => {
    if (!data.average.cadets.length && !data.pushups.cadets.length) return null;

    return (
      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ borderBottom: '3px solid var(--accent-gold)', paddingBottom: '0.75rem', marginBottom: '2rem', textTransform: 'uppercase', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>
          {className} PFT1 TOP PERFORMERS
        </h3>
        
        {/* Highest Average */}
        {data.average.value !== -1 && data.average.cadets.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '2rem', borderRadius: '16px', border: '1px solid #fde68a', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.1)' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
              <h4 style={{ color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Overall Top Performer</h4>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#92400e' }}>
                {data.average.value} <span style={{ fontSize: '1.1rem', fontWeight: '600', opacity: 0.8 }}>Average Score</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {data.average.cadets.map((c, i) => {
                const pic = getCadetImageUrl(c.surname || c.name, '', c.name, c.class);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    {pic ? (
                      <img src={pic} alt={c.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fbbf24', padding: '2px', background: '#fff' }} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #fbbf24', padding: '2px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
                        🧑‍✈️
                      </div>
                    )}
                    <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#1e293b' }}>{c.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Events */}
        {/* Individual Events */}
        {isMobile ? (
          <div style={{ margin: '-0.5rem', width: '100%', overflow: 'hidden' }}>
            <InfiniteSlider itemWidth="85%" gap="1rem">
              {renderCombinedEvent('Push-Ups', data.pushups, '(M)', 'reps', data.pushupsF, '(F)', 'reps', '💪')}
              {renderCombinedEvent('Sit-Ups', data.situps, '(M)', 'reps', data.situpsF, '(F)', 'reps', '💪')}
              {renderCombinedEvent('Pull-Ups / Flexed-Arm', data.pullups, 'Pull-Ups (M)', 'reps', data.flexarm, 'Flexed-Arm (F)', 'secs', '💪')}
              {renderCombinedEvent('3.2KM Run', data.run, '(M)', '', data.runF, '(F)', '', '🏃', true)}
            </InfiniteSlider>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-0.5rem' }}>
            {renderCombinedEvent('Push-Ups', data.pushups, '(M)', 'reps', data.pushupsF, '(F)', 'reps', '💪')}
            {renderCombinedEvent('Sit-Ups', data.situps, '(M)', 'reps', data.situpsF, '(F)', 'reps', '💪')}
            {renderCombinedEvent('Pull-Ups / Flexed-Arm', data.pullups, 'Pull-Ups (M)', 'reps', data.flexarm, 'Flexed-Arm (F)', 'secs', '💪')}
            {renderCombinedEvent('3.2KM Run', data.run, '(M)', '', data.runF, '(F)', '', '🏃', true)}
          </div>
        )}
      </div>
    );
  };

  // If no data to display at all
  if (
    topPerformers['1cl'].average.value === -1 &&
    topPerformers['2cl'].average.value === -1 &&
    topPerformers['3cl'].average.value === -1
  ) {
    return null;
  }

  return (
    <div className="top-performers-section" style={{ marginTop: '3rem', padding: '2.5rem', background: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div className="section-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 className="section-title" style={{ color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-0.5px' }}>TOP PFT PERFORMERS</h2>
        <div className="section-subtitle" style={{ fontSize: '1.2rem', color: '#64748b' }}>PFT 1 Honor Roll</div>
      </div>
      
      {renderClass('1ST CLASS', topPerformers['1cl'])}
      {renderClass('2ND CLASS', topPerformers['2cl'])}
      {renderClass('3RD CLASS', topPerformers['3cl'])}
    </div>
  );
}
