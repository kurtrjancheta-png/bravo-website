'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to convert base64 to Uint8Array
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

export default function SubscribePage() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsAlreadySubscribed(true);
            setStatus('success');
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    setStatus('loading');
    setErrorMessage('');

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('error');
      setErrorMessage('Push notifications are not supported in your browser. Please try Chrome or Safari on your phone.');
      return;
    }

    try {
      // Request notification permission first to preserve user gesture context
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('error');
        setErrorMessage('You blocked notifications. You must allow them in your browser settings to receive alerts.');
        return;
      }

      const activeReg = await navigator.serviceWorker.ready;
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BO9Q7iN7CAdgbkHAL5NlRSY1_PutOA6cxH8ovFBTmAMul4MUcIVWY5lE2Rg6REA_nf2FMIg27f87DqAzuAgu5QU";

      const existingSub = await activeReg.pushManager.getSubscription();
      if (existingSub) {
        try {
          await existingSub.unsubscribe();
        } catch (unsubErr) {
          console.warn('Failed to unsubscribe existing push:', unsubErr);
        }
      }

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
        setStatus('success');
        setIsAlreadySubscribed(true);
      } else {
        throw new Error(data.error || 'Failed to save subscription to database.');
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      setStatus('error');
      if (error.message && error.message.includes('push service error')) {
        setErrorMessage('Registration failed. Try clicking the lock icon in your address bar to reset permissions.');
      } else {
        setErrorMessage(error.message || 'An unknown error occurred.');
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '2rem',
      color: 'white',
      textAlign: 'center'
    }}>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'var(--brand-primary, #3b82f6)', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 1.5rem auto',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
        }}>
          🔔
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Bravo Notifications
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.5', marginBottom: '2.5rem' }}>
          Enable push notifications to receive instant alerts for important announcements and schedules.
        </p>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: '#4ade80'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem' }}>You're all set!</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Your device is now registered to receive Bravo Company alerts. You can safely close this page.
              </p>
            </motion.div>
          ) : (
            <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={handleSubscribe}
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  borderRadius: '12px',
                  background: 'var(--brand-primary, #3b82f6)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  border: 'none',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.2s, background 0.2s'
                }}
                onMouseOver={e => { if(status !== 'loading') e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseOut={e => { if(status !== 'loading') e.currentTarget.style.transform = 'scale(1)' }}
              >
                {status === 'loading' ? (
                  <>
                    <span className="spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Activating...
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>

              {status === 'error' && (
                <div style={{
                  marginTop: '1.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#fca5a5',
                  fontSize: '0.9rem',
                  textAlign: 'left'
                }}>
                  <strong>❌ Error:</strong> {errorMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}} />
    </div>
  );
}
