"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DeleteDisseminationButton from "./DeleteDisseminationButton";
import ImageGallery from "./ImageGallery";

const urgencyStyles = {
  LIGHT: {
    border: '#10b981', // green
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    label: 'Standard Info',
    animation: 'none'
  },
  'URGENT - MUST READ': {
    border: '#f59e0b', // amber
    bg: 'rgba(245, 158, 11, 0.1)',
    color: '#d97706',
    label: 'Action Required',
    animation: 'pulse-glow-amber 2s infinite'
  },
  'EXTREME URGENT - MUST COMPLY': {
    border: '#ef4444', // red
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#b91c1c',
    label: 'Immediate Compliance',
    animation: 'pulse-glow-red 1.5s infinite'
  }
};

function DisseminationCard({ card, style, sheetName, isArchived }) {
  let dateAnnounced = String(card['DATE ANNOUNCED'] || '');
  if (dateAnnounced.includes('Date(')) {
    const match = dateAnnounced.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const dateObj = new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
      dateAnnounced = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  
  let eventMonth = '';
  let eventDay = '';
  if (String(card['TYPE'] || '').trim().toUpperCase() === 'ACTIVITY' && card['EVENT DATE']) {
    let eDate = String(card['EVENT DATE']);
    if (eDate.includes('Date(')) {
      const match = eDate.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
        eventMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        eventDay = d.getDate();
      }
    } else if (eDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = eDate.split('-');
      const d = new Date(parts[0], parseInt(parts[1])-1, parts[2]);
      eventMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      eventDay = d.getDate();
    } else {
      try {
        const d = new Date(eDate);
        if (!isNaN(d.getTime())) {
          eventMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          eventDay = d.getDate();
        } else {
          const parts = eDate.split(' ');
          if (parts.length >= 2) {
            eventMonth = parts[0].substring(0, 3).toUpperCase();
            eventDay = parts[1].replace(/[^0-9]/g, '');
          }
        }
      } catch (e) {}
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'relative',
        background: isArchived ? 'rgba(0,0,0,0.1)' : 'var(--bg-secondary)',
        border: `2px solid ${style.border}`,
        borderTop: `12px solid ${style.border}`,
        borderRadius: '12px',
        padding: '1.5rem',
        animation: isArchived ? 'none' : style.animation,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        opacity: isArchived ? 0.75 : 1
      }}
    >
      <DeleteDisseminationButton
        sheetName={sheetName}
        rowIndex={card.sheetRowIndex}
        borderColor={style.border}
      />
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: style.border, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {card['TYPE'] || 'ANNOUNCEMENT'}
            {isArchived && (
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                ARCHIVED
              </span>
            )}
          </div>
          
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-wrap' }}>
            {card['CONTENT'] || 'No content provided.'}
          </div>
          
          {/* If the Google API parses the header as "Column 6", we should check both keys */}
          {((card['ATTACHMENT'] && card['ATTACHMENT'].trim() !== '') || (card['Column 6'] && card['Column 6'].trim() !== '')) && (
            <div style={{ marginTop: '1rem' }}>
              <ImageGallery urls={(card['ATTACHMENT'] || card['Column 6']).split(',')} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ 
            background: style.bg, 
            color: style.color, 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            fontSize: '0.75rem', 
            fontWeight: 800,
            textTransform: 'uppercase'
          }}>
            {style.label}
          </div>

          {eventDay && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              border: `3px solid ${style.border}`, borderRadius: '10px', overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-primary)',
              minWidth: '70px',
              opacity: isArchived ? 0.8 : 1
            }}>
              <div style={{ background: style.border, color: 'white', width: '100%', textAlign: 'center', fontSize: '0.9rem', fontWeight: '900', padding: '0.2rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {eventMonth}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', padding: '0.2rem 0.4rem', lineHeight: '1' }}>
                {eventDay}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <strong>Date Announced:</strong> {dateAnnounced || 'N/A'}
      </div>
    </motion.div>
  );
}

export default function DisseminationList({ activeCards, archivedCards, sheetName }) {
  const [viewState, setViewState] = useState("ACTIVE"); // ACTIVE or ARCHIVED

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {viewState === "ACTIVE" ? "Active Disseminations" : "Archived Disseminations"}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            onClick={() => setViewState("ACTIVE")}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: viewState === "ACTIVE" ? 'var(--gold-primary)' : 'transparent',
              color: viewState === "ACTIVE" ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: viewState === "ACTIVE" ? '0 2px 4px rgba(212, 175, 55, 0.3)' : 'none'
            }}
          >
            Active ({activeCards.length})
          </button>
          <button
            onClick={() => setViewState("ARCHIVED")}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: viewState === "ARCHIVED" ? 'var(--border-color)' : 'transparent',
              color: viewState === "ARCHIVED" ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: viewState === "ARCHIVED" ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Archive ({archivedCards.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewState === "ACTIVE" && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                No active disseminations at this time.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {activeCards.map((card, i) => {
                  const urgency = String(card['URGENCY'] || '').trim().toUpperCase();
                  const style = urgencyStyles[urgency] || urgencyStyles['LIGHT'];
                  return <DisseminationCard key={`active-${i}-${card.sheetRowIndex}`} card={card} style={style} sheetName={sheetName} isArchived={false} />;
                })}
              </div>
            )}
          </motion.div>
        )}

        {viewState === "ARCHIVED" && (
          <motion.div 
            key="archived"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {archivedCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                No archived disseminations available.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {archivedCards.map((card, i) => {
                  const urgency = String(card['URGENCY'] || '').trim().toUpperCase();
                  const style = urgencyStyles[urgency] || urgencyStyles['LIGHT'];
                  return <DisseminationCard key={`archive-${i}-${card.sheetRowIndex}`} card={card} style={style} sheetName={sheetName} isArchived={true} />;
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
