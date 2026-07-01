'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AutoRefresh from './AutoRefresh';
import LoginModal from './LoginModal';
import { useAuth } from './AuthContext';

export default function LayoutContent({ children }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const { adminUser, logout, isLoaded } = useAuth();

  const isCEIS = adminUser && (adminUser.council === 'S6' || String(adminUser.council || '').toUpperCase().includes('CEIS'));
  const isCCQ = adminUser && (adminUser.council === 'CCQ' || isCEIS);
  const pathname = usePathname();

  // Push subscription state
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // PWA Install Prompt state
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const [openSections, setOpenSections] = useState({
    exo: false,
    fsgt: false,
    s1: false,
    s2: false,
    s3: false,
    s6: false,
    athletic: false,
  });

  useEffect(() => {
    setOpenSections({
      exo: pathname.startsWith('/exo-') || pathname === '/disseminations/exo',
      fsgt: pathname === '/exo-punishment' || pathname === '/disseminations/fsgt',
      s1: pathname === '/task-organization' || pathname === '/roster' || pathname === '/disposition' || pathname === '/signify-priv' || pathname === '/disseminations/s1' || pathname === '/ccq-bulletin' || pathname === '/ccq-manager' || pathname === '/s1/sick-call-tracker',
      s2: pathname.startsWith('/s2/') || pathname === '/disseminations/s2',
      s3: pathname === '/calendar-manager' || pathname === '/disseminations/s3',
      s6: pathname === '/cellphone-rack' || pathname === '/tablet-directory' || pathname === '/disseminations/s6',
      athletic: pathname === '/pft-tracker' || pathname === '/disseminations/athletic'
    });
    setIsMobileMenuOpen(false); // Close mobile drawer when route changes
  }, [pathname]);

  const toggleSection = (section, isOpen) => {
    setOpenSections(prev => ({ ...prev, [section]: isOpen }));
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('bravo_dark_mode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Splash screen auto-dismiss
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 2200);
    const hideTimer = setTimeout(() => setShowSplash(false), 2800);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);


  // Base64 helper to convert VAPID public key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Register Service Worker and check subscription state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Web Push is not supported in this browser.');
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then(async (reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
        // Force service worker check for updates on mount
        reg.update().catch(err => console.warn('SW update check failed:', err));
        
        // Wait until service worker is ready
        const activeReg = await navigator.serviceWorker.ready;
        const sub = await activeReg.pushManager.getSubscription();
        if (sub) {
          setIsSubscribed(true);
        } else if (Notification.permission !== 'denied') {
          // Show prompt banner after a 3 second delay
          const timer = setTimeout(() => setShowBanner(true), 3000);
          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  }, []);

  // Check for PWA Installation prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // For iOS, show the prompt manually
      const installTimer = setTimeout(() => {
        const hasDismissed = localStorage.getItem('bravo_dismissed_install');
        if (!hasDismissed) setShowInstallPrompt(true);
      }, 5000);
      return () => clearTimeout(installTimer);
    } else {
      // For Android/Desktop
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        const hasDismissed = localStorage.getItem('bravo_dismissed_install');
        if (!hasDismissed) setShowInstallPrompt(true);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  // Listen for custom trigger-pwa-install event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleTriggerInstall = () => {
      handleInstallClick();
    };
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);
    return () => window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
  }, [deferredPrompt, isIOS]);

  // Handle automatic install prompt from query string
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('install') === 'true') {
      const trigger = () => {
        handleInstallClick();
        // Remove the parameter from history so it doesn't prompt again on refresh
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]install=true/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      };
      const timer = setTimeout(trigger, 1500); // 1.5s delay to let hydration complete
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('bravo_dismissed_install', 'true');
  };

  // Request browser permission and save subscription details
  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const activeReg = await navigator.serviceWorker.ready;
      
      // Fallback to verified key if environment variable isn't injected in the client bundle
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BO9Q7iN7CAdgbkHAL5NlRSY1_PutOA6cxH8ovFBTmAMul4MUcIVWY5lE2Rg6REA_nf2FMIg27f87DqAzuAgu5QU";
      if (!publicVapidKey) {
        alert('Public VAPID key is missing.');
        return;
      }

      // 1. Explicitly request permission first to trigger native browser prompts reliably
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission was not granted. Please enable notifications in your browser settings to receive alerts.');
        return;
      }

      // 2. Clear any existing/stale subscriptions first to avoid "Registration failed - push service error"
      // which happens when there is a VAPID key mismatch or corrupted state.
      const existingSub = await activeReg.pushManager.getSubscription();
      if (existingSub) {
        try {
          await existingSub.unsubscribe();
          console.log('Stale push subscription cleared.');
        } catch (unsubErr) {
          console.warn('Failed to unsubscribe existing push:', unsubErr);
        }
      }

      // 3. Subscribe with the public VAPID key
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      };

      const subscription = await activeReg.pushManager.subscribe(subscribeOptions);
      
      const response = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSubscribed(true);
        setShowBanner(false);
        alert('Dissemination alerts enabled successfully!');
      } else {
        throw new Error(data.error || 'Failed to save subscription.');
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      if (error.message && error.message.includes('push service error')) {
        alert('Could not enable alerts: Registration failed (push service error). \n\nTip: Click the lock icon in your address bar, reset/clear the site permissions, refresh the page, and try again.');
      } else {
        alert('Could not enable alerts: ' + error.message);
      }
    }
  };




  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('bravo_dark_mode', newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return (
    <div className="app-container">

      {/* Splash Screen */}
      {showSplash && (
        <div className={`splash-screen ${splashFading ? 'splash-fading' : ''}`}>
          <div className="splash-smoke splash-smoke-1" />
          <div className="splash-smoke splash-smoke-2" />
          <div className="splash-smoke splash-smoke-3" />
          <div className="splash-glow" />
          <div className="splash-content">
            <div className="splash-logo-wrap">
              <div className="splash-logo-glow" />
              <img src="/logo.png" alt="Bravo Bulls" className="splash-logo" />
            </div>
            <div className="splash-text">BRAVO BULLS</div>
            <div className="splash-sub">Integrated Online BULLetin System</div>
            <div className="splash-loader">
              <div className="splash-loader-bar" />
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-circle" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
            <img src="/logo.png" alt="Bravo Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div>
            <div className="company-title">BRAVO BULL'S</div>
            <div className="company-subtitle">Integrated Online BULLetin System</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Main Navigation</div>
          <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>🏠</span> Home Overview
          </Link>
          <Link href="/ccq-bulletin" className={`nav-item ${pathname === '/ccq-bulletin' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>📋</span> CCQ's Bulletin Board
          </Link>
          {isCCQ && (
            <Link href="/ccq-manager" className={`nav-item ${pathname === '/ccq-manager' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
              <span style={{ marginRight: '10px' }}>⚙️</span> CQ Bulletin Manager
            </Link>
          )}
          <Link href="/event-calendar" className={`nav-item ${pathname === '/event-calendar' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>📅</span> Event Calendar
          </Link>
          <Link href="/leaderboards" className={`nav-item ${pathname === '/leaderboards' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>🏆</span> Leaderboards
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-label">Councils</div>
          
          <Link href="/disseminations/taco" id="nav-taco" className={`nav-item ${pathname === '/disseminations/taco' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🌟</span> Tac O's Corner</Link>
          {adminUser && (adminUser.council === 'TACO' || isCEIS) && (
            <Link href="/taco-dashboard" className={`nav-item ${pathname === '/taco-dashboard' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
              <span style={{ marginRight: '10px', marginLeft: '24px' }}>🦅</span> Tac O's Dashboard
            </Link>
          )}
          <Link href="/disseminations/co" id="nav-co" className={`nav-item ${pathname === '/disseminations/co' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>⭐</span> CO's Corner</Link>
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.exo} onToggle={(e) => toggleSection('exo', e.target.open)}>
            <summary id="nav-exo" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>⚡</span> EX-O's Corner
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/exo-guards" className={`nav-item ${pathname === '/exo-guards' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Guard Posting Dashboard
              </Link>
              {adminUser && (adminUser.council === 'EXO' || isCEIS) && (
                <Link href="/exo-guards/manage" className={`nav-item ${pathname === '/exo-guards/manage' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                  Guard Posting Manager
                </Link>
              )}
              <Link href="/disseminations/exo" className={`nav-item ${pathname === '/disseminations/exo' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.fsgt} onToggle={(e) => toggleSection('fsgt', e.target.open)}>
            <summary id="nav-fsgt" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>📋</span> FSGT's Corner
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/exo-punishment" className={`nav-item ${pathname === '/exo-punishment' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Punishment Monitoring
              </Link>
              <Link href="/disseminations/fsgt" className={`nav-item ${pathname === '/disseminations/fsgt' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.s1} onToggle={(e) => toggleSection('s1', e.target.open)}>
            <summary id="nav-s1" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>👥</span> S1 Personnel
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/ccq-bulletin" className={`nav-item ${pathname === '/ccq-bulletin' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                CCQ Duty Bulletin
              </Link>
              {isCCQ && (
                <Link href="/ccq-manager" className={`nav-item ${pathname === '/ccq-manager' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                  CCQ Bulletin Manager
                </Link>
              )}
              <Link href="/task-organization" className={`nav-item ${pathname === '/task-organization' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Task Organization
              </Link>
              <Link href="/roster" className={`nav-item ${pathname === '/roster' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Company Roster
              </Link>
              <Link href="/disposition" className={`nav-item ${pathname === '/disposition' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Troop Disposition
              </Link>
              <Link href="/signify-priv" className={`nav-item ${pathname === '/signify-priv' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Privilege Signify
              </Link>
              <Link href="/s1/sick-call-tracker" className={`nav-item ${pathname === '/s1/sick-call-tracker' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Sick Call Tracker
              </Link>
              <Link href="/disseminations/s1" className={`nav-item ${pathname === '/disseminations/s1' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>

          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.s2} onToggle={(e) => toggleSection('s2', e.target.open)}>
            <summary id="nav-s2" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>🛡️</span> S2 Security
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/s2/rifle-directory" className={`nav-item ${pathname === '/s2/rifle-directory' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Rifle Directory
              </Link>
              <Link href="/disseminations/s2" className={`nav-item ${pathname === '/disseminations/s2' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.s3} onToggle={(e) => toggleSection('s3', e.target.open)}>
            <summary id="nav-s3" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>⌖</span> S3 Operations
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              {adminUser && (adminUser.council === 'S3' || isCEIS) && (
                <Link href="/calendar-manager" className={`nav-item ${pathname === '/calendar-manager' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                  Calendar Manager
                </Link>
              )}
              <Link href="/disseminations/s3" className={`nav-item ${pathname === '/disseminations/s3' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          <Link href="/disseminations/s4" id="nav-s4" className={`nav-item ${pathname === '/disseminations/s4' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📦</span> S4 Logistics</Link>
          <Link href="/disseminations/s5" id="nav-s5" className={`nav-item ${pathname === '/disseminations/s5' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📊</span> S5 Plans & Programs</Link>
          
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.s6} onToggle={(e) => toggleSection('s6', e.target.open)}>
            <summary id="nav-s6" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>📡</span> S6 Signal
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/cellphone-rack" className={`nav-item ${pathname === '/cellphone-rack' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Smartphone Rack
              </Link>
              <Link href="/tablet-directory" className={`nav-item ${pathname === '/tablet-directory' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Tablet Directory
              </Link>
              <Link href="/disseminations/s6" className={`nav-item ${pathname === '/disseminations/s6' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>

          <Link href="/disseminations/s7" id="nav-s7" className={`nav-item ${pathname === '/disseminations/s7' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>🤝</span> S7 Civil-Military</Link>
          <Link href="/disseminations/s8" id="nav-s8" className={`nav-item ${pathname === '/disseminations/s8' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>📚</span> S8 Education & Training / Academic Council</Link>
          <Link href="/disseminations/s10" id="nav-s10" className={`nav-item ${pathname === '/disseminations/s10' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>💰</span> S10 Finance</Link>
          
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.athletic} onToggle={(e) => toggleSection('athletic', e.target.open)}>
            <summary id="nav-athletic" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>🏃</span> Athletic Council
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/pft-tracker" className={`nav-item ${pathname === '/pft-tracker' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                PFT Tracker
              </Link>
              <Link href="/disseminations/athletic" className={`nav-item ${pathname === '/disseminations/athletic' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
          
          <Link href="/disseminations/honor-comm" id="nav-honor" className={`nav-item ${pathname === '/disseminations/honor-comm' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>⚖️</span> Honor Committee</Link>
          <Link href="/disseminations/ccpb" id="nav-ccpb" className={`nav-item ${pathname === '/disseminations/ccpb' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px' }}>👮</span> CCPB</Link>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
           <div className="nav-label" style={{ padding: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="live-indicator"></div> SYSTEM LIVE
           </div>
           <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div 
                className="badge-outline" 
                onClick={toggleDarkMode}
                style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}
              >
                 {isDarkMode ? '☀️ LIGHT MODE' : '⚙️ DARK MODE'}
              </div>
              {isLoaded && (
                adminUser ? (
                  <div 
                    className="badge-outline" 
                    onClick={logout}
                    style={{ cursor: 'pointer', padding: '0.35rem 1rem', background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca', whiteSpace: 'nowrap' }}
                    title={`Logged in as ${adminUser.username} (${adminUser.council})`}
                  >
                    LOG OUT ({adminUser.council})
                  </div>
                ) : (
                  <div 
                    className="badge-outline" 
                    onClick={() => setIsLoginModalOpen(true)}
                    style={{ cursor: 'pointer', padding: '0.35rem 1rem' }}
                    title="Log in as Administrator"
                  >
                    Log in as Administrator
                  </div>
                )
              )}
           </div>
        </div>
      </aside>

      {/* Mobile Overlay backdrop when menu is open */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Mobile Top Header (Sticky on Mobile, Hidden on Desktop) */}
        <header className="mobile-header">
          <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </button>
          <span className="mobile-header-title">BRAVO CO.</span>
          <button className="mobile-theme-btn" onClick={toggleDarkMode} style={{ color: 'inherit' }}>
            {isDarkMode ? '☀️' : '⚙️'}
          </button>
        </header>

        {/* Top Bar (Only visible on Home Overview) */}
        {pathname === '/' && (
          <header className="topbar">
            <div className="breadcrumbs">
              BRAVO CO. BULLETIN BOARD / HOME
            </div>
            <div className="topbar-actions">
              <div className="badge-outline">
                <div className="live-indicator"></div> LIVE FEED
              </div>
              <div className="badge-outline">
                ⚙️ SETTINGS
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="main-content">
          <AutoRefresh intervalMs={30000} />
          {children}
        </main>
      </div>

      {/* Premium Dark Theme Push Subscription Banner */}
      {showBanner && !isSubscribed && pathname !== '/subscribe' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #d4af37', // Gold accent
          borderRadius: '12px',
          padding: '1.25rem',
          maxWidth: '360px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.05em' }}>
                🔔 ENABLE BULLETIN ALERTS
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Receive instant background alerts on your screen when new announcements or operational disseminations are posted.
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
            <button
              onClick={subscribeUser}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
              }}
            >
              Enable Alerts
            </button>
            <button
              onClick={() => setShowBanner(false)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo.png" alt="Bravo Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#ffffff' }}>
                  Install Bravo App
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Add to your home screen for quick access.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismissInstall}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleInstallClick}
            style={{
              width: '100%',
              padding: '0.6rem',
              background: 'var(--accent-gold)',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
            }}
          >
            {isIOS ? "Show Instructions" : "Install App"}
          </button>
        </div>
      )}

      {/* iOS / Frictionless PWA Install Guide Modal */}
      {showIosGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.25rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => setShowIosGuide(false)}
        >
          <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--accent-gold)',
            borderRadius: '24px',
            padding: '2rem 1.5rem',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowIosGuide(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              ✕
            </button>

            {/* App Logo */}
            <img 
              src="/logo.png" 
              alt="Bravo Logo" 
              style={{ 
                width: '72px', 
                height: '72px', 
                objectFit: 'contain', 
                marginBottom: '1rem',
                filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.25))'
              }} 
            />

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Install Bravo Bulls
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Follow these simple steps to install the app on your iPhone for quick, full-screen offline access.
            </p>

            {/* Visual Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', textAlign: 'left', marginBottom: '1.75rem' }}>
              
              {/* Step 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)' }}>1</span>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Tap the **Share** button in Safari’s bottom toolbar.
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Look for this icon: <span style={{ fontSize: '1rem' }}>📤</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)' }}>2</span>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Scroll down the options list and select **"Add to Home Screen"**.
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Look for this option: <span style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>➕ Add to Home Screen</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)' }}>3</span>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Tap **"Add"** in the top-right corner to complete installation!
                </div>
              </div>

            </div>

            <button 
              onClick={() => setShowIosGuide(false)}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'var(--accent-gold)',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
