'use client';

import { useState, useEffect } from 'react';

const urgencyStyles = {
  'LIGHT': { bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', color: '#4ade80', animation: 'none' },
  'MODERATE': { bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', color: '#facc15', animation: 'none' },
  'EMERGENCY': { bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171', color: '#f87171', animation: 'pulse-red 1.5s infinite' },
  'FOR IMMEDIATE COMPLIANCE': { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', color: '#fb923c', animation: 'pulse-orange 1.5s infinite' }
};

export default function SlideshowClient({ disseminations }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!disseminations || disseminations.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % disseminations.length);
    }, 5000); // 5 seconds per slide
    
    return () => clearInterval(interval);
  }, [disseminations]);

  if (!disseminations || disseminations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
        No active disseminations across all councils.
      </div>
    );
  }

  const currentSlide = disseminations[currentIndex];
  const urgency = String(currentSlide['URGENCY'] || '').trim().toUpperCase();
  const style = urgencyStyles[urgency] || urgencyStyles['LIGHT'];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Progress Indicators */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', justifyContent: 'center' }}>
        {disseminations.map((_, idx) => (
          <div 
            key={idx} 
            style={{ 
              height: '4px', 
              flex: 1, 
              background: idx === currentIndex ? style.color : 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              transition: 'background 0.3s'
            }} 
          />
        ))}
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: `3px solid ${style.border}`,
        borderRadius: '16px',
        padding: '2.5rem',
        animation: style.animation,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        minHeight: '250px',
        transition: 'all 0.3s ease-in-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {currentSlide.council} COUNCIL
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em', color: style.color, textTransform: 'uppercase' }}>
              {currentSlide['TYPE'] || 'ANNOUNCEMENT'}
            </div>
          </div>
          
          <div style={{ 
            background: style.bg, 
            color: style.color, 
            padding: '0.5rem 1rem', 
            borderRadius: '9999px', 
            fontSize: '0.85rem', 
            fontWeight: 800,
            textTransform: 'uppercase',
            border: `1px solid ${style.border}`
          }}>
            {urgency || 'LIGHT'}
          </div>
        </div>
        
        <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: 1.5, flex: 1, fontWeight: 500 }}>
          {currentSlide['CONTENT'] || 'No content provided.'}
        </div>
        
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Date Announced:</strong> {currentSlide['DATE ANNOUNCED'] || 'N/A'}</span>
          <span>Slide {currentIndex + 1} of {disseminations.length}</span>
        </div>
      </div>
      
    </div>
  );
}
