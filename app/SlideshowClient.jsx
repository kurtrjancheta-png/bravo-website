'use client';

import { useState, useEffect } from 'react';
import ImageGallery from './disseminations/ImageGallery';

const urgencyStyles = {
  'LIGHT': { bg: '#dcfce7', border: '#4ade80', color: '#166534', animation: 'none', label: 'FOR INFO' },
  'MODERATE': { bg: '#fef08a', border: '#facc15', color: '#854d0e', animation: 'none', label: 'ATTENTION!' },
  'EMERGENCY': { bg: '#fecaca', border: '#f87171', color: '#991b1b', animation: 'pulse-red 1.5s infinite', label: 'EMERGENCY' },
  'FOR IMMEDIATE COMPLIANCE': { bg: '#fed7aa', border: '#fb923c', color: '#9a3412', animation: 'pulse-orange 1.5s infinite', label: 'FOR IMMEDIATE COMPLIANCE' }
};

export default function SlideshowClient({ disseminations }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalSlides = disseminations && disseminations.length > 0 ? disseminations.length + 1 : 0;

  useEffect(() => {
    if (totalSlides === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }, 12000); // 12 seconds per slide
    
    return () => clearInterval(interval);
  }, [totalSlides]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (totalSlides === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
        No active disseminations across all councils.
      </div>
    );
  }

  const isCaughtUp = currentIndex === disseminations.length;
  let currentSlide, urgency, style;

  if (isCaughtUp) {
    currentSlide = {
      council: 'SYSTEM',
      TYPE: "YOU'RE ALL CAUGHT UP!",
      CONTENT: "You have reviewed all the latest disseminations. Have a great day!",
      'DATE ANNOUNCED': new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    urgency = 'LIGHT';
    style = urgencyStyles['LIGHT'];
  } else {
    currentSlide = disseminations[currentIndex];
    urgency = String(currentSlide['URGENCY'] || '').trim().toUpperCase();
    style = urgencyStyles[urgency] || urgencyStyles['LIGHT'];
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0 70px' }}>
      <style>{`
        @keyframes dealCard {
          0% { opacity: 0; transform: translateY(-40px) scale(0.95) rotate(-2deg); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        }
      `}</style>
      
      <button 
        onClick={prevSlide}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = 'var(--border-color)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
        style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%) scale(1)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        &lt;
      </button>

      <div style={{ width: '100%', position: 'relative' }}>
        {/* Progress Indicators */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', justifyContent: 'center' }}>
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div 
              key={idx} 
              style={{ 
                height: '4px', 
                flex: 1, 
                background: idx === currentIndex ? style.border : 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                transition: 'background 0.3s'
              }} 
            />
          ))}
        </div>

        <div 
          key={currentIndex}
          style={{
            backgroundColor: '#fdfbf7', // Pastel paper color
            border: `2px solid ${style.border}`,
            borderTop: `16px solid ${style.border}`, // Thick top border like a tab
            borderRadius: '16px',
            padding: '2.5rem',
            animation: `dealCard 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both${style.animation !== 'none' ? `, ${style.animation}` : ''}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            minHeight: '350px', // Allow growth
            transition: 'border 0.3s ease-in-out',
            width: '100%',
            color: '#1e293b' // Dark text for paper background
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {currentSlide.council} COUNCIL
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em', color: style.border, textTransform: 'uppercase' }}>
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
              border: `1px solid ${style.border}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {style.label}
            </div>
          </div>
          
          <div style={{ 
            fontSize: '1.5rem', 
            color: '#334155', // slightly softer dark text
            lineHeight: 1.6, 
            flex: 1, 
            fontWeight: 500,
            whiteSpace: 'pre-wrap'
            // overflowY removed to allow natural expanding
          }}>
            {currentSlide['CONTENT'] || 'No content provided.'}
          </div>

          {/* Render Attachments if they exist */}
          {!isCaughtUp && ((currentSlide['ATTACHMENT'] && currentSlide['ATTACHMENT'].trim() !== '') || (currentSlide['Column 6'] && currentSlide['Column 6'].trim() !== '')) && (
            <div style={{ marginTop: '1rem' }}>
              <ImageGallery urls={(currentSlide['ATTACHMENT'] || currentSlide['Column 6']).split(',')} />
            </div>
          )}
          
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span><strong>Date Announced:</strong> {currentSlide['DATE ANNOUNCED'] || 'N/A'}</span>
            <span>Slide {currentIndex + 1} of {totalSlides}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={nextSlide}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = 'var(--border-color)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%) scale(1)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        &gt;
      </button>
    </div>
  );
}
