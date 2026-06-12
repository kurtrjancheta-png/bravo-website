'use client';

import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

export default function TabletDirectoryClient({ initialData }) {
  const { adminUser } = useAuth();
  const router = useRouter();
  
  const userCouncil = String(adminUser?.council || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCEIS = userCouncil === 'S6' || userCouncil.includes('CEIS');
  const [filterClass, setFilterClass] = useState('All');
  
  // Sort all data alphabetically
  const activeData = [...initialData].sort((a, b) => a.name.localeCompare(b.name));
  const filteredData = activeData.filter(c => filterClass === 'All' || c.cadetClass === filterClass);

  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase() === 'n/a' || dateStr.trim() === '') return null;
    
    // Handle Google Visualization API Date string format: "Date(2026,5,12)"
    const match = dateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      // Month is 0-indexed in JS Date
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div>
      {/* Filter and Link */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>


          <a 
            href="https://docs.google.com/spreadsheets/d/1LbsJwJ7nMyh9SOb-SX0MOHwmLq85UVz4BaPxtHPesqA/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: isCEIS ? 'flex' : 'none', alignItems: 'center', gap: '8px',
              padding: '0.5rem 1rem', borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
              textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem',
              transition: 'all 0.2s ease', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
            </svg>
            OPEN DIRECTORY SHEET
          </a>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
          {filteredData.length} TABLETS REGISTERED
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '2.5rem',
      }}>
        {filteredData.map((cadet, i) => {
          const startDate = parseDate(cadet.dateStarted);
          const endDate = parseDate(cadet.authorizedUntil);
          const today = new Date();
          
          let progressPercent = 0;
          let timeRemainingText = "Dates Missing";
          let isExpired = false;
          let progressBarColor = '#10b981'; // Emerald

          if (startDate && endDate) {
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsed = today.getTime() - startDate.getTime();
            progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining < 0) {
              isExpired = true;
              timeRemainingText = "Expired";
              progressPercent = 100;
              progressBarColor = '#ef4444'; // Red
            } else if (daysRemaining <= 14) {
              timeRemainingText = `${daysRemaining} days left`;
              progressBarColor = '#f59e0b'; // Amber (warning)
            } else {
              timeRemainingText = `${daysRemaining} days left`;
            }
          }

          return (
            <div key={i} style={{
              borderRadius: '24px',
              background: isExpired ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)',
              border: isExpired ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: isExpired ? '0 10px 25px -5px rgba(239, 68, 68, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              if (isExpired) e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (isExpired) e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(239, 68, 68, 0.2)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                  border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0
                }}>
                  {cadet.picture ? (
                    <img src={cadet.picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '📱'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', margin: '0 0 0.2rem', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                    {cadet.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                    {cadet.model && cadet.model !== 'Not Specified' ? cadet.model : 'Tablet'} 
                    {cadet.color && cadet.color !== 'Not Specified' ? ` (${cadet.color})` : ''}
                  </div>
                </div>
              </div>

              {/* Progress Bar UI */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>AUTHORIZATION</span>
                  <span style={{ color: isExpired ? '#ef4444' : 'var(--text-primary)' }}>{timeRemainingText}</span>
                </div>
                
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: progressBarColor, 
                    borderRadius: '4px',
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                  <span>{formatDate(startDate)}</span>
                  <span>{formatDate(endDate)}</span>
                </div>
              </div>

              {/* Remarks/Notes */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Features / Remarks</div>
                {cadet.dbRemarks && cadet.dbRemarks !== 'None' ? cadet.dbRemarks : 'No special remarks.'}
              </div>
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No tablets found.
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
