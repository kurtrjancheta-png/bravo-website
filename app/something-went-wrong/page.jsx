'use client';

import { useState } from 'react';

export default function SomethingWentWrongPage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'var(--text-primary)',
      textAlign: 'center'
    }}>
      {/* Premium Broken Connection Icon */}
      <div style={{
        position: 'relative',
        marginBottom: '2rem',
        animation: 'float 4s ease-in-out infinite',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '120px',
        height: '120px',
        background: 'rgba(239, 68, 68, 0.08)',
        borderRadius: '50%',
        border: '2px solid rgba(239, 68, 68, 0.2)',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.05)'
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#ef4444"/>
        </svg>
      </div>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 900,
        marginBottom: '1rem',
        letterSpacing: '-0.5px'
      }}>
        Oops! Something went wrong.
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        maxWidth: '460px',
        lineHeight: 1.6,
        marginBottom: '2.5rem',
        fontSize: '1.05rem',
        fontWeight: 500
      }}>
        A gateway timeout or internal application error occurred while fetching the required database resources. We are attempting to re-establish a secure connection.
      </p>

      {/* Action Button */}
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        style={{
          background: 'var(--accent-gold, #d4af37)',
          color: '#000',
          border: 'none',
          padding: '0.85rem 2.5rem',
          borderRadius: '12px',
          fontWeight: 800,
          cursor: isRetrying ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          outline: 'none'
        }}
      >
        {isRetrying && (
          <span className="spinner" style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(0,0,0,0.2)',
            borderTop: '2px solid #000',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
        {isRetrying ? 'RECONNECTING...' : 'TRY RECONNECTING'}
      </button>

      {/* Convincing Mock Console Log */}
      <div style={{
        marginTop: '4rem',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem 1.75rem',
        maxWidth: '480px',
        width: '100%',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        textAlign: 'left',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fca5a5', fontWeight: 'bold' }}>
          <span>[DIAGNOSTIC_ERR]</span>
          <span>CODE: 504_GATEWAY_TIMEOUT</span>
        </div>
        <div style={{ margin: '2px 0' }}>HOST: db.bravo-company.internal.net</div>
        <div style={{ margin: '2px 0' }}>ACTION: SELECT * FROM roster, config, smartphone_rack;</div>
        <div style={{ margin: '2px 0' }}>STATUS: Connection pool exhausted (max_active=50)</div>
        <div style={{ margin: '2px 0', color: 'rgba(255,255,255,0.2)' }}>Timestamp: {new Date().toISOString()}</div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
