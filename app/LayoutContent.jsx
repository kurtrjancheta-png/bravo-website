'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingGuards, setIncomingGuards] = useState(null);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const { adminUser, login, logout, isLoaded } = useAuth();

  // Secure gating login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const isCEIS = adminUser && (adminUser.council === 'S6' || String(adminUser.council || '').toUpperCase().includes('CEIS'));
  const isCCQ = adminUser && (adminUser.council === 'CCQ' || isCEIS);
  const pathname = usePathname();

  // Push subscription state
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // PWA Install Prompt state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
    s4: false,
    s6: false,
    athletic: false,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const autoHideTimerRef = useRef(null);

  const resetAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    if (typeof window !== 'undefined' && window.innerWidth > 1024 && !isSidebarCollapsed && !isHovered) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsSidebarCollapsed(true);
      }, 10000); // 10 seconds
    }
  };

  useEffect(() => {
    resetAutoHideTimer();
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [isSidebarCollapsed, isHovered]);

  useEffect(() => {
    setOpenSections({
      exo: pathname.startsWith('/exo-') || pathname === '/disseminations/exo',
      fsgt: pathname === '/exo-punishment' || pathname === '/disseminations/fsgt',
      s1: pathname === '/task-organization' || pathname === '/roster' || pathname === '/disposition' || pathname === '/signify-priv' || pathname === '/disseminations/s1' || pathname === '/s1/sick-call-tracker',
      s2: pathname.startsWith('/s2/') || pathname === '/disseminations/s2',
      s3: pathname === '/calendar-manager' || pathname === '/disseminations/s3',
      s4: pathname === '/s4-inventory' || pathname === '/disseminations/s4',
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

  // Mobile swipe gesture to open/close sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      if (window.innerWidth >= 1024) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    };

    const handleTouchMove = (e) => {
      if (window.innerWidth >= 1024) return;
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (window.innerWidth >= 1024) return;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Minimum swipe distance of 50px, and primarily horizontal
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) {
          // Swipe from left to right (open drawer)
          // Starting from within 60px of the left screen boundary
          if (touchStartX < 60 && !isMobileMenuOpen) {
            setIsMobileMenuOpen(true);
          }
        } else {
          // Swipe from right to left (close drawer)
          if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
          }
        }
      }

      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen]);


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

  // Handle incoming barracks guards query string trigger from notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('showIncomingGuards') === 'true') {
      setShowIncomingModal(true);
      setLoadingGuards(true);
      
      // Clean query parameter from URL so it doesn't reopen on reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Fetch and compile guards
      const getIncomingGuards = async () => {
        const SCRIPT_URL_1CL = 'https://script.google.com/macros/s/AKfycbwNVo5buoeHliZfJ17yLduSCMEPfoHkuvXNnAT8ed-wIs0lVE6ucpkvItNZN2zv0SbtTw/exec';
        const SCRIPT_URL_2CL = 'https://script.google.com/macros/s/AKfycbx9slx3s4GRQCnR98HrUmSfRvJnKfbWoHjLq2avXeoNqYCthhUlOS1iYP1t-ORb_zLL/exec';
        const SCRIPT_URL_3CL = 'https://script.google.com/macros/s/AKfycbxs0fmHK3QikUCYBTSnD_xuh7sVoXF5urCISgtQvGz5QJHiRF94e0ajx0XwSoZ09X-3tg/exec';

        try {
          const [res1, res2, res3] = await Promise.all([
            fetch(SCRIPT_URL_1CL).then(r => r.ok ? r.json() : []),
            fetch(SCRIPT_URL_2CL).then(r => r.ok ? r.json() : []),
            fetch(SCRIPT_URL_3CL).then(r => r.ok ? r.json() : [])
          ]);

          const manilaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          // Check if before guard mount (6:30 PM PHT)
          const isBeforeGuardMount = (manilaNow.getHours() < 18) || (manilaNow.getHours() === 18 && manilaNow.getMinutes() < 30);
          const postedDate = new Date(manilaNow);
          postedDate.setHours(0, 0, 0, 0);
          if (isBeforeGuardMount) {
            postedDate.setDate(postedDate.getDate() - 1);
          }
          const incomingDate = new Date(postedDate);
          incomingDate.setDate(incomingDate.getDate() + 1);
          const incomingTime = incomingDate.getTime();

          const parseHdrDate = (hdr) => {
            if (!hdr) return null;
            const pts = hdr.split(' | ');
            try {
              const d = new Date(pts[0]);
              if (isNaN(d.getTime())) return null;
              return d;
            } catch (e) { return null; }
          };

          const BLACKLIST = ['INTERIOR', 'SENTINEL', 'NON POSTING', 'NON-POSTING', 'FI', 'CCQ', 'ACCQ', 'MHC', 'AFI'];

          const getStatus1CL = (color) => {
            if (!color) return 'UNKNOWN';
            if (color === '#ff0000' || color === '#ea4335') return 'INTERIOR';
            if (color === '#ffc000' || color === '#ffa500' || color === '#fbbc04' || color === '#ff9900') return 'FLOOR INSPECTOR';
            if (color === '#00ff00' || color === '#34a853') return 'SENTINEL';
            return 'POSTED';
          };

          const getStatus2CL = (color) => {
            if (!color) return 'UNKNOWN';
            if (color === '#ffff00' || color === '#ffff01') return 'PLEBE DETAIL';
            if (color === '#00ffff' || color === '#00b0f0') return 'SENTINEL (TOC)';
            if (color === '#ff00ff' || color === '#ff00fe') return 'INTERIOR';
            if (color === '#b45f06' || color === '#b87333' || color === '#a67c00' || color === '#bf9000') return 'AFI';
            return 'POSTED';
          };

          const getStatus3CL = (color) => {
            if (!color) return 'UNKNOWN';
            switch (color) {
              case '#ff0000':
              case '#ea4335': return 'CCQ';
              case '#4a86e8':
              case '#4285f4':
              case '#2b78e4': return 'ACCQ';
              case '#00ff00':
              case '#34a853': return 'MHC';
              case '#ff9900':
              case '#ffa500':
              case '#ffc000': return 'INTERIOR';
              case '#00ffff':
              case '#00b0f0': return 'AFI';
              case '#000000':
              case '#111111': return 'SENTINEL';
              default: return 'POSTED';
            }
          };

          const extractGuards = (list, getStatusFn) => {
            const arr = [];
            list.forEach(item => {
              const name = (item.name || '').replace(' AS', '').trim();
              if (BLACKLIST.includes(name.toUpperCase())) return;

              const d = parseHdrDate(item.dateHeader);
              if (!d) return;

              const itemDateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
              const itemObj = new Date(itemDateStr);
              itemObj.setHours(0,0,0,0);

              if (itemObj.getTime() === incomingTime) {
                arr.push({ name, status: getStatusFn(item.color) });
              }
            });
            return arr;
          };

          const guards1 = extractGuards(res1, getStatus1CL);
          const guards2 = extractGuards(res2, getStatus2CL);
          const guards3 = extractGuards(res3, getStatus3CL);

          let fi = [];
          let afi = [];
          let ccq = [];
          let accq = [];
          let sentinels = [];

          guards1.forEach(g => {
            const formatted = `1CL ${g.name} 'B' CO`;
            if (g.status === 'FLOOR INSPECTOR') fi.push(formatted);
            else if (g.status === 'SENTINEL') sentinels.push(formatted);
          });

          guards2.forEach(g => {
            const formatted = `2CL ${g.name} 'B' CO`;
            if (g.status === 'AFI') afi.push(formatted);
            else if (g.status === 'SENTINEL (TOC)') sentinels.push(formatted);
          });

          guards3.forEach(g => {
            const formatted = `3CL ${g.name} 'B' CO`;
            if (g.status === 'CCQ') ccq.push(formatted);
            else if (g.status === 'ACCQ') accq.push(formatted);
            else if (g.status === 'AFI') afi.push(formatted);
            else if (g.status === 'SENTINEL') sentinels.push(formatted);
          });

          return {
            date: incomingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
            fi: fi.join(', ') || '—',
            afi: afi.join(', ') || '—',
            ccq: ccq.join(', ') || '—',
            accq: accq.join(', ') || '—',
            sentinels: sentinels.join(', ') || '—'
          };
        } catch (e) {
          console.error(e);
          return null;
        }
      };

      getIncomingGuards().then(data => {
        setIncomingGuards(data);
        setLoadingGuards(false);
      });
    }
  }, [pathname]);

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
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIosDevice && !isStandalone) {
      alert('Notification alerts on iPhone/iOS require installing the app first.\n\nPlease install the app (tap Share 📤 -> Add to Home Screen ➕), launch it from your home screen, and try enabling alerts again.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser or private browsing mode.');
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

  if (isLoaded && !adminUser && !showSplash) {
    return (
      <div className="login-gate-container" style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#0a0d0f',
        backgroundImage: 'radial-gradient(circle at 50% 30%, #151e24 0%, #0a0d0f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background smoke */}
        <div className="splash-smoke splash-smoke-1" style={{ opacity: 0.1 }} />
        <div className="splash-smoke splash-smoke-2" style={{ opacity: 0.1 }} />
        
        <div className="login-card-wrapper" style={{
          backgroundColor: '#111518',
          border: '2px solid var(--accent-gold)',
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
              border: '2px solid var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
            }}>
              <img src="/logo.png" alt="Bravo Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
            </div>
          </div>

          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '1.8rem',
            fontWeight: '900',
            color: '#ffffff',
            margin: '0 0 0.25rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            BRAVO COMPANY
          </h2>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: '800',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '2rem'
          }}>
            SECURE ACCESS SYSTEM
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoginError('');
            setLoginLoading(true);
            try {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password: loginPassword })
              });
              const data = await res.json();
              if (data.success && data.user) {
                setShowSplash(true);
                setSplashFading(false);
                login(data.user);
                setTimeout(() => {
                  setSplashFading(true);
                }, 2200);
                setTimeout(() => {
                  setShowSplash(false);
                }, 2800);
              } else {
                setLoginError(data.error || 'Invalid credentials');
              }
            } catch (err) {
              setLoginError('Authentication failed. Please try again.');
            } finally {
              setLoginLoading(false);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            
            {loginError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: '900',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                USERNAME / SERIAL NUMBER
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder=""
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: '900',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                SECURE PASSWORD
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)',
                transition: 'transform 0.1s, opacity 0.2s',
                marginTop: '0.5rem'
              }}
            >
              {loginLoading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
            </button>
          </form>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center'
        }}>
          Authorized Personnel Only &bull; All Access is Logged
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

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
      <aside 
        className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={resetAutoHideTimer}
      >
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div className="logo-circle" style={{ padding: 0, overflow: 'hidden', background: 'transparent', flexShrink: 0 }}>
              <img src="/logo.png" alt="Bravo Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="company-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BRAVO BULL'S</div>
              <div className="company-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Integrated Online BULLetin System</div>
            </div>
          </div>
          <button 
            className="desktop-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              marginLeft: '0.5rem',
              flexShrink: 0
            }}
            title="Collapse Sidebar"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ◀
          </button>
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
          <div 
            onClick={() => {
              setIsSettingsModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="nav-item"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{ marginRight: '10px' }}>⚙️</span> Settings
          </div>
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
          <details className="nav-item-group" style={{ cursor: 'pointer' }} open={openSections.s4} onToggle={(e) => toggleSection('s4', e.target.open)}>
            <summary id="nav-s4" className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>📦</span> S4 Logistics
              <span className="dropdown-arrow">▼</span>
            </summary>
            <div style={{ marginLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/s4-inventory" className={`nav-item ${pathname === '/s4-inventory' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Inventory Dashboard
              </Link>
              <Link href="/disseminations/s4" className={`nav-item ${pathname === '/disseminations/s4' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center' }}>
                Disseminations
              </Link>
            </div>
          </details>
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
                    {adminUser.council === 'CADET' ? `LOG OUT (${adminUser.username})` : `LOG OUT (${adminUser.council})`}
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
          <button className="mobile-theme-btn" onClick={() => setIsSettingsModalOpen(true)} style={{ color: 'inherit' }}>
            ⚙️
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
              <div 
                className="badge-outline" 
                onClick={() => setIsSettingsModalOpen(true)}
                style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--accent-gold)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
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

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={() => {
          setShowSplash(true);
          setSplashFading(false);
          setTimeout(() => setSplashFading(true), 2200);
          setTimeout(() => setShowSplash(false), 2800);
        }}
      />

      {/* INCOMING BARRACKS GUARDS MODAL OVERLAY */}
      {showIncomingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.25)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '550px',
            width: '100%',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--text-primary)',
            fontFamily: 'inherit'
          }}>
            {/* Close Button */}
            <button 
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onClick={() => setShowIncomingModal(false)}
            >
              ✕
            </button>

            {/* Title / Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Crown top back (Blue cloth) */}
                  <path d="M8 26 C8 15, 56 15, 56 26 L48 35 L16 35 Z" fill="#0f2a4a" />
                  {/* Crown top cover (Blue cloth) */}
                  <path d="M8 26 C8 14, 56 14, 56 26 C56 31, 8 31, 8 26 Z" fill="#0f2a4a" stroke="#1b365d" stroke-width="2"/>
                  {/* Shadow/crease under crown top */}
                  <path d="M12 28 C20 30, 44 30, 52 28" stroke="#000000" stroke-width="1.5" fill="none" opacity="0.3"/>
                  {/* Black Band / Lining */}
                  <path d="M14 33 C14 33, 32 35, 50 33 L48 40 C48 40, 32 42, 16 40 Z" fill="#000000" stroke="#000000" stroke-width="1"/>
                  {/* Black Strap */}
                  <path d="M15 37 C24 39.5, 40 39.5, 49 37" stroke="#000000" stroke-width="2.5" fill="none"/>
                  {/* Gold side strap buttons */}
                  <circle cx="15.5" cy="37.5" r="2.5" fill="#d4af37" />
                  <circle cx="48.5" cy="37.5" r="2.5" fill="#d4af37" />
                  {/* Visor / Peak */}
                  <path d="M15 40 C19 49, 45 49, 49 40 C44 44, 20 44, 15 40 Z" fill="#000000" />
                  {/* Gold PMA Insignia (Shield + Wings + Star) */}
                  {/* Wings */}
                  <path d="M25 26 C28 24, 30 24, 30 27 L27 29 Z" fill="#d4af37"/>
                  <path d="M39 26 C36 24, 34 24, 34 27 L37 29 Z" fill="#d4af37"/>
                  {/* Shield */}
                  <path d="M30 24 L34 24 L35 28 C35 31, 32 33, 32 33 C32 33, 29 31, 29 28 Z" fill="#d4af37"/>
                  {/* Star */}
                  <path d="M32 20.5 L33 22 L34.5 22 L33.2 23 L33.7 24.5 L32 23.5 L30.3 24.5 L30.8 23 L29.5 22 L31 22 Z" fill="#d4af37"/>
                  {/* Sword detail */}
                  <line x1="32" y1="24" x2="32" y2="31" stroke="#0f2a4a" stroke-width="1"/>
                </svg>
              </div>
              <h2 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                INCOMING BARRACKS GUARDS
              </h2>
              {incomingGuards && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '0.2rem' }}>
                  Detail for {incomingGuards.date}
                </div>
              )}
            </div>

            {loadingGuards ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.2)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'logoGlowPulse 1.5s infinite linear' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 750 }}>Extracting incoming guard list...</span>
              </div>
            ) : incomingGuards ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { role: 'incoming FI:', value: incomingGuards.fi },
                  { role: 'incoming AFI:', value: incomingGuards.afi },
                  { role: 'incoming CCQ:', value: incomingGuards.ccq },
                  { role: 'incoming ACCQ:', value: incomingGuards.accq },
                  { role: 'incoming Sentinels:', value: incomingGuards.sentinels }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem 1.25rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      color: 'var(--accent-gold)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {item.role}
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4
                    }}>
                      {item.value.includes(', ') ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.15rem' }}>
                          {item.value.split(', ').map((name, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--accent-gold)' }}>•</span>
                              <span>{name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                ⚠️ Failed to load the incoming guards detail. Please check connection.
              </div>
            )}

            <button 
              onClick={() => setShowIncomingModal(false)}
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
                transition: 'all 0.2s',
                marginTop: '1.75rem'
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Floating Expand Sidebar Button & Hover Edge Trigger */}
      {isSidebarCollapsed && (
        <>
          <button 
            className="desktop-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(false)}
            style={{
              position: 'fixed',
              left: '16px',
              top: '12px',
              zIndex: 9999,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontSize: '1.2rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title="Expand Sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ☰
          </button>
          <div 
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '12px',
              zIndex: 9998,
              background: 'transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            title="Hover to show sidebar"
          />
        </>
      )}

      {/* Premium Settings Modal */}
      {isSettingsModalOpen && (
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
        onClick={() => setIsSettingsModalOpen(false)}
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
            position: 'relative',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
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

            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ System Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              
              {/* Setting 1: Theme Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dark Mode Theme</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Enable dark background theme</div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: isDarkMode ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.03)',
                    color: isDarkMode ? '#000000' : 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>

              {/* Setting 2: Push Notifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bulletin Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                      Receive screen notifications for new announcements.
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '8px',
                    background: isSubscribed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isSubscribed ? '#22c55e' : '#ef4444',
                    border: isSubscribed ? '1px solid #22c55e' : '1px solid #ef4444'
                  }}>
                    {isSubscribed ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                
                {!isSubscribed && (
                  <button
                    onClick={async () => {
                      await subscribeUser();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🔔 Enable Alerts
                  </button>
                )}
              </div>

            </div>

            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '2rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
