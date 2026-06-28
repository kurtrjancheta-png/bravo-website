"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DeleteDisseminationButton from "./DeleteDisseminationButton";
import ImageGallery from "./ImageGallery";
import { useAuth } from "../AuthContext";

const normalizeUrgency = (urgency) => {
  const u = String(urgency || '').trim().toUpperCase();
  if (u === 'LIGHT' || u === 'FOR INFO') return 'FOR INFO';
  if (u === 'MODERATE' || u === 'ATTENTION') return 'ATTENTION';
  if (u === 'EMERGENCY' || u === 'URGENT') return 'URGENT';
  if (u === 'FOR IMMEDIATE COMPLIANCE' || u === 'FOR STRICT COMPLIANCE') return 'FOR STRICT COMPLIANCE';
  return 'FOR INFO';
};

const parseHeadlineAndContent = (content) => {
  const str = String(content || '').trim();
  const colonIndex = str.indexOf(':');
  if (colonIndex > 0) {
    const headline = str.substring(0, colonIndex).trim();
    if (headline.toLowerCase() !== 'http' && headline.toLowerCase() !== 'https') {
      const body = str.substring(colonIndex + 1).trim();
      return { headline, body };
    }
  }
  return { headline: null, body: str };
};

const urgencyStyles = {
  'FOR INFO': {
    border: '#94a3b8', // slate/grey
    bg: 'rgba(148, 163, 184, 0.1)',
    color: '#475569',
    label: 'FOR INFO',
    animation: 'none'
  },
  'ATTENTION': {
    border: '#d4af37', // gold
    bg: 'rgba(212, 175, 55, 0.1)',
    color: '#854d0e',
    label: 'ATTENTION',
    animation: 'none'
  },
  'URGENT': {
    border: '#fb923c', // orange
    bg: 'rgba(251, 146, 60, 0.1)',
    color: '#c2410c',
    label: 'URGENT',
    animation: 'pulse-glow-orange 2s infinite'
  },
  'FOR STRICT COMPLIANCE': {
    border: '#ef4444', // red
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#b91c1c',
    label: 'FOR STRICT COMPLIANCE',
    animation: 'pulse-glow-red 1.5s infinite'
  }
};

const getDynamicFontSize = (text) => {
  if (!text) return '1.2rem';
  const len = text.length;
  if (len < 50) return '1.5rem';
  if (len < 150) return '1.2rem';
  if (len < 300) return '1rem';
  if (len < 600) return '0.9rem';
  return '12px'; // Min size is 12px for list view
};

function DisseminationCard({ card, style, sheetName, isArchived }) {
  const [isMobile, setIsMobile] = useState(false);
  const { adminUser } = useAuth();
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleFollowUp = async (e) => {
    if (e) e.stopPropagation();
    if (isBroadcasting) return;

    const confirmSend = window.confirm("Are you sure you want to broadcast a follow-up push notification for this dissemination to all subscribers?");
    if (!confirmSend) return;

    setIsBroadcasting(true);

    const councilId = card.councilId || sheetName || "SYSTEM";
    const councilLabel = card.council || sheetName || "SYSTEM";
    const councilSlug = String(councilId).trim().toUpperCase() === "HONOR COMM" ? "honor-comm" : String(councilId).trim().toLowerCase();
    
    const { headline, body } = parseHeadlineAndContent(card.CONTENT);
    const displayHeadline = headline || (String(card.TYPE).toUpperCase() === 'ACTIVITY' ? `[ACTIVITY] Event scheduled` : 'Announcement Bulletin');
    
    const title = `[Follow Up] ${councilLabel}`;
    const notificationBody = displayHeadline;
    const url = `/disseminations/${councilSlug}?row=${card.sheetRowIndex}`;
    const image = card.ATTACHMENT || card.Column6 || null;

    try {
      const response = await fetch('/api/web-push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: notificationBody,
          url,
          image
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Follow-up alert broadcasted successfully to ${data.sentCount} subscriber(s)!`);
      } else {
        alert(`Failed to broadcast follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Follow-up broadcast failed:', err);
      alert('Network error when attempting to broadcast follow-up alert.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      id={`dissemination-card-${card.sheetRowIndex}`}
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
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: style.border, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {card['TYPE'] || 'ANNOUNCEMENT'}
            {isArchived && (
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                ARCHIVED
              </span>
            )}
          </div>
          
          {(() => {
            const { headline, body } = parseHeadlineAndContent(card['CONTENT']);
            return (
              <>
                {headline && (
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '850',
                    color: 'var(--text-primary)',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.3'
                  }}>
                    {headline}
                  </h3>
                )}
                <div style={{ fontSize: getDynamicFontSize(body), color: 'var(--text-primary)', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-wrap' }}>
                  {body || 'No content provided.'}
                </div>
              </>
            );
          })()}
          
          {/* If the Google API parses the header as "Column 6", we should check both keys */}
          {((card['ATTACHMENT'] && card['ATTACHMENT'].trim() !== '') || (card['Column 6'] && card['Column 6'].trim() !== '')) && (
            <div style={{ marginTop: '1rem' }}>
              <ImageGallery urls={(card['ATTACHMENT'] || card['Column 6']).split(',')} />
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'row' : 'column', 
          alignItems: isMobile ? 'center' : 'flex-end', 
          justifyContent: isMobile ? 'space-between' : 'flex-start',
          gap: '0.75rem', 
          flexShrink: 0,
          width: isMobile ? '100%' : 'auto',
          borderTop: isMobile ? '1px dashed var(--border-color)' : 'none',
          paddingTop: isMobile ? '0.75rem' : '0'
        }}>
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
              display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', 
              border: `3px solid ${style.border}`, borderRadius: '10px', overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-primary)',
              minWidth: '70px',
              opacity: isArchived ? 0.8 : 1,
              gap: isMobile ? '0.5rem' : '0'
            }}>
              <div style={{ background: style.border, color: 'white', width: isMobile ? 'auto' : '100%', textAlign: 'center', fontSize: '0.9rem', fontWeight: '900', padding: '0.2rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {eventMonth}
              </div>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '900', color: 'var(--text-primary)', padding: isMobile ? '0.1rem 0.5rem' : '0.2rem 0.4rem', lineHeight: '1' }}>
                {eventDay}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ 
        fontSize: '0.8rem', 
        color: 'var(--text-secondary)', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          <strong>Date Announced:</strong> {dateAnnounced || 'N/A'}
        </div>
        {!isArchived && adminUser && (
          <button
            onClick={handleFollowUp}
            disabled={isBroadcasting}
            title="Broadcast a follow-up alert"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold-dark)',
              borderRadius: '6px',
              cursor: isBroadcasting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
            }}
          >
            📢 {isBroadcasting ? 'Sending...' : 'Follow Up'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function DisseminationList({ activeCards, archivedCards, sheetName }) {
  const [viewState, setViewState] = useState("ACTIVE"); // ACTIVE or ARCHIVED

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const row = parseInt(params.get('row'), 10);
    if (!isNaN(row)) {
      // If the row belongs to an archived card, automatically switch to the Archive tab
      const isArchivedCard = archivedCards.some(c => c.sheetRowIndex === row);
      if (isArchivedCard) {
        setViewState("ARCHIVED");
      }
      
      // Scroll to the card and flash highlight it
      const timer = setTimeout(() => {
        const el = document.getElementById(`dissemination-card-${row}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 4px #d4af37, 0 10px 15px -3px rgba(212, 175, 55, 0.4)';
          el.style.transform = 'scale(1.02)';
          el.style.transition = 'all 0.5s ease';
          
          setTimeout(() => {
            el.style.boxShadow = '';
            el.style.transform = '';
          }, 3500);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [archivedCards]);

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
                  const style = urgencyStyles[normalizeUrgency(urgency)] || urgencyStyles['FOR INFO'];
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
                  const style = urgencyStyles[normalizeUrgency(urgency)] || urgencyStyles['FOR INFO'];
                  return <DisseminationCard key={`archive-${i}-${card.sheetRowIndex}`} card={card} style={style} sheetName={sheetName} isArchived={true} />;
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-glow-orange {
          0% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.4); border-color: rgba(251, 146, 60, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(251, 146, 60, 0); border-color: rgba(251, 146, 60, 1); }
          100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); border-color: rgba(251, 146, 60, 0.7); }
        }
        @keyframes pulse-glow-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 1); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.7); }
        }
      `}} />
    </div>
  );
}
