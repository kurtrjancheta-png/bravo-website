'use client';

import React, { useState } from 'react';
import { validateLogin } from '../lib/adminLogin';
import { useAuth } from './AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await validateLogin(username, password);
      
      if (result.success) {
        login({ username: result.username, council: result.council });
        setSuccessData(result);
        setShowSuccess(true);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '2.5rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          &times;
        </button>

        {showSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#16a34a', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>
              Welcome, {successData.council} OFFICER
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              You have been successfully logged in as the {successData.council} officer. You may now publish announcements and activities, along with accessing other administrative privileges pertaining to your council.
            </p>
            <button 
              onClick={() => {
                setShowSuccess(false);
                setSuccessData(null);
                setUsername('');
                setPassword('');
                onClose();
              }}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ 
              marginTop: 0, 
              color: '#1e293b', 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              Administrator Login
            </h2>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                textAlign: 'center',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? 'Authenticating...' : 'LOG IN'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
