'use client';

import React, { useState, useEffect } from 'react';

export default function InstallAppButton() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone
    ) {
      setIsInstallable(false);
      return;
    }

    // Show the button on all cellphones/mobile devices
    const checkMobile = () => {
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsInstallable(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isInstallable) return null;

  return (
    <button
      onClick={() => {
        window.dispatchEvent(new Event('trigger-pwa-install'));
      }}
      className="home-hero-install-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(212, 175, 55, 0.15)',
        border: '1px solid var(--accent-gold)',
        color: 'var(--accent-gold)',
        padding: '0.45rem 1rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '800',
        cursor: 'pointer',
        marginTop: '0.5rem',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.1)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      📥 Install Bravo App
    </button>
  );
}
