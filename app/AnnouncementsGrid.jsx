'use client';

import React, { useState, useEffect, useRef } from 'react';
import ImageGallery from './disseminations/ImageGallery';
import { useAuth } from './AuthContext';
import InfiniteSlider from './components/InfiniteSlider';

// Emojis mapping for reactions
const EMOJIS = {
  love: '❤️',
  like: '👍',
  salute: '🫡',
  laugh: '😂'
};

// Deterministic seed reactions based on card ID & content
const getInitialReactions = (cardId, content) => {
  let hash = 0;
  const str = cardId + (content || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return {
    love: Math.abs(hash % 4),
    like: Math.abs((hash >> 2) % 6),
    salute: Math.abs((hash >> 4) % 3),
    laugh: Math.abs((hash >> 6) % 2)
  };
};

const getCouncilMetadata = (councilId) => {
  switch (String(councilId).toUpperCase()) {
    case 'TACO': return { icon: '🌟', label: "TACO'S CORNER" };
    case 'CO': return { icon: '⭐', label: "CO'S CORNER" };
    case 'EXO': return { icon: '⚡', label: "EXO'S CORNER" };
    case 'FSGT': return { icon: '📋', label: "FSGT'S CORNER" };
    case 'S1': return { icon: '👥', label: "S1 PERSONNEL" };
    case 'S2': return { icon: '🛡️', label: "S2 SECURITY" };
    case 'S3': return { icon: '⌖', label: "S3 OPERATIONS" };
    case 'S4': return { icon: '📦', label: "S4 LOGISTICS" };
    case 'S5': return { icon: '📊', label: "S5 PLANS & PROG" };
    case 'S6': return { icon: '📡', label: "S6 SIGNAL" };
    case 'S7': return { icon: '🤝', label: "S7 CIVIL-MILITARY" };
    case 'S8': return { icon: '📚', label: "S8 ACADEMICS" };
    case 'S10': return { icon: '💰', label: "S10 FINANCE" };
    case 'ATHLETIC': return { icon: '🏃', label: "ATHLETIC COUNCIL" };
    case 'GAD': return { icon: '⚧', label: "GAD CORNER" };
    case 'HONOR COMM': return { icon: '⚖️', label: "HONOR COMMITTEE" };
    case 'CCPB': return { icon: '👮', label: "CCPB" };
    default: return { icon: '📢', label: String(councilId).toUpperCase() + " COUNCIL" };
  }
};

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

const getUrgencyColor = (urgency) => {
  const normU = normalizeUrgency(urgency);
  switch (normU) {
    case 'FOR STRICT COMPLIANCE':
      return '#ef4444'; // Red
    case 'URGENT':
      return '#fb923c'; // Orange
    case 'ATTENTION':
      return '#d4af37'; // Bravo Gold
    default:
      return '#94a3b8'; // Grey
  }
};

export default function AnnouncementsGrid({ disseminations }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCouncil, setSelectedCouncil] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);


  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Swipe carousel state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (totalCards) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - touchCurrentX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveCardIndex(prev => Math.min(prev + 1, totalCards - 1));
      } else {
        setActiveCardIndex(prev => Math.max(prev - 1, 0));
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const [reactionsState, setReactionsState] = useState({});
  const [userReactionsState, setUserReactionsState] = useState({});

  const { adminUser } = useAuth();
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleFollowUp = async (card, e) => {
    if (e) e.stopPropagation();
    if (isBroadcasting) return;

    const confirmSend = window.confirm("Are you sure you want to broadcast a follow-up push notification for this dissemination to all subscribers?");
    if (!confirmSend) return;

    setIsBroadcasting(true);

    const councilId = card.councilId || "SYSTEM";
    const councilLabel = card.council || "SYSTEM";
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
    const loadedReactions = {};
    const loadedUserReactions = {};

    disseminations.forEach((card, index) => {
      const cardId = `${card.councilId || 'SYSTEM'}_${card.sheetRowIndex || index}`;
      const base = getInitialReactions(cardId, card.CONTENT);
      
      const savedUserReactions = localStorage.getItem(`bravo_user_reactions_${cardId}`);
      let userObj = { love: false, like: false, salute: false, laugh: false };
      if (savedUserReactions) {
        try {
          userObj = JSON.parse(savedUserReactions);
        } catch (e) {}
      }
      loadedUserReactions[cardId] = userObj;

      loadedReactions[cardId] = {
        love: base.love + (userObj.love ? 1 : 0),
        like: base.like + (userObj.like ? 1 : 0),
        salute: base.salute + (userObj.salute ? 1 : 0),
        laugh: base.laugh + (userObj.laugh ? 1 : 0)
      };
    });

    setReactionsState(loadedReactions);
    setUserReactionsState(loadedUserReactions);
  }, [disseminations]);

  const toggleReaction = (cardId, emojiType, e) => {
    e.stopPropagation(); // prevent opening the details modal
    setUserReactionsState(prevUser => {
      const cardUser = prevUser[cardId] || { love: false, like: false, salute: false, laugh: false };
      const currentVal = cardUser[emojiType];
      const newUserObj = { ...cardUser, [emojiType]: !currentVal };
      
      localStorage.setItem(`bravo_user_reactions_${cardId}`, JSON.stringify(newUserObj));

      setReactionsState(prevTotals => {
        const cardTotals = prevTotals[cardId] || { love: 0, like: 0, salute: 0, laugh: 0 };
        return {
          ...prevTotals,
          [cardId]: {
            ...cardTotals,
            [emojiType]: Math.max(0, cardTotals[emojiType] + (!currentVal ? 1 : -1))
          }
        };
      });

      return {
        ...prevUser,
        [cardId]: newUserObj
      };
    });
  };

  const FILTER_COUNCILS = ['ALL', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S10', 'EXO', 'TACO', 'CO', 'FSGT', 'ATHLETIC', 'HONOR COMM', 'CCPB'];
  const FILTER_TYPES = ['ALL', 'FOR INFO', 'ATTENTION', 'URGENT', 'FOR STRICT COMPLIANCE'];

  const filteredDisseminations = disseminations.filter(d => {
    // 1. Search term filter
    const searchLower = searchTerm.toLowerCase();
    const content = String(d['CONTENT'] || '').toLowerCase();
    const type = String(d['TYPE'] || '').toLowerCase();
    const councilName = String(d['council'] || '').toLowerCase();
    const urgency = String(d['URGENCY'] || '').toLowerCase();
    
    const matchesSearch = 
      content.includes(searchLower) ||
      type.includes(searchLower) ||
      councilName.includes(searchLower) ||
      urgency.includes(searchLower);
    
    if (!matchesSearch) return false;

    // 2. Council Filter
    if (selectedCouncil !== 'ALL') {
      const matchId = String(d.councilId).toUpperCase() === selectedCouncil.toUpperCase();
      if (!matchId) return false;
    }

    // 3. Type/Urgency Filter
    if (selectedType !== 'ALL') {
      const u = String(d['URGENCY'] || '').trim().toUpperCase();
      return normalizeUrgency(u) === selectedType;
    }

    return true;
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Header section with Title and Search Input */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '1.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 900, 
            color: 'var(--text-primary)', 
            letterSpacing: '0.04em',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            ALL ANNOUNCEMENTS
          </h1>
          <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: 'var(--text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '0.25rem'
          }}>
            COMPANY-WIDE BULLETINS
          </div>
        </div>

        <div style={{ flex: '1 1 300px', maxWidth: '500px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search announcements..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setActiveCardIndex(0); }}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-gold)';
              e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filters Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Row 1: Council Filter Pills */}
        {isMobile ? (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <InfiniteSlider itemWidth="auto" gap="0.5rem">
              {FILTER_COUNCILS.map(c => (
                <button
                  key={c}
                  onClick={() => { setSelectedCouncil(c); setActiveCardIndex(0); }}
                  style={{
                    position: 'relative',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '20px',
                    border: selectedCouncil === c ? 'none' : '1px solid var(--border-color)',
                    background: selectedCouncil === c ? '#1e293b' : 'var(--bg-primary)',
                    color: selectedCouncil === c ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedCouncil === c ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {selectedCouncil === c && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '6px solid #1e293b',
                      animation: 'dropIn 0.2s ease-out'
                    }} />
                  )}
                  {c}
                </button>
              ))}
            </InfiniteSlider>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }} className="no-scrollbar">
            {FILTER_COUNCILS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCouncil(c)}
                style={{
                  padding: '0.4rem 1.1rem',
                  borderRadius: '20px',
                  border: selectedCouncil === c ? 'none' : '1px solid var(--border-color)',
                  background: selectedCouncil === c ? '#1e293b' : 'var(--bg-primary)',
                  color: selectedCouncil === c ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedCouncil === c ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Row 2: Type/Urgency Filter Pills */}
        {isMobile ? (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <InfiniteSlider itemWidth="auto" gap="0.5rem">
              {FILTER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { setSelectedType(t); setActiveCardIndex(0); }}
                  style={{
                    position: 'relative',
                    padding: '0.3rem 0.9rem',
                    borderRadius: '16px',
                    border: selectedType === t ? 'none' : '1px solid var(--border-color)',
                    background: selectedType === t ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: selectedType === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedType === t && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '5px solid var(--text-primary)',
                      animation: 'dropIn 0.2s ease-out'
                    }} />
                  )}
                  {t}
                </button>
              ))}
            </InfiniteSlider>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }} className="no-scrollbar">
            {FILTER_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: '16px',
                  border: selectedType === t ? 'none' : '1px solid var(--border-color)',
                  background: selectedType === t ? 'var(--text-primary)' : 'var(--bg-secondary)',
                  color: selectedType === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Showing count */}
      <div style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-secondary)', 
        fontWeight: '700',
        marginBottom: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        Showing {filteredDisseminations.length} of {disseminations.length} announcements
      </div>

      {/* Grid of Cards / Mobile Carousel */}

      {filteredDisseminations.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          border: '1px dashed var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          No announcements match your search or filter options.
        </div>
      )}

      {filteredDisseminations.length > 0 && isMobile && (
        <div
          style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y', width: '100%' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(filteredDisseminations.length)}
        >
          <div style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(calc(-${activeCardIndex * 100}% - ${activeCardIndex}rem))`,
            transition: 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
            gap: '1rem',
            alignItems: 'stretch'
          }}>
            {filteredDisseminations.map((card, i) => {
              const cardId = `${card.councilId || 'SYSTEM'}_${card.sheetRowIndex || i}`;
              const stripeColor = getUrgencyColor(card['URGENCY']);
              const councilInfo = getCouncilMetadata(card.councilId);
              const cardType = String(card['TYPE'] || '').trim().toUpperCase();
              const normU = normalizeUrgency(card['URGENCY']);
              const tags = [];
              if (normU === 'FOR STRICT COMPLIANCE') {
                tags.push({ label: 'FOR STRICT COMPLIANCE', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' });
              } else if (normU === 'URGENT') {
                tags.push({ label: 'URGENT', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' });
              } else if (normU === 'ATTENTION') {
                tags.push({ label: 'ATTENTION', bg: '#fef9c3', color: '#854d0e', border: '#fef08a' });
              } else {
                tags.push({ label: 'FOR INFO', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' });
              }
              if (cardType === 'ACTIVITY') {
                tags.push({ label: 'ACTIVITY', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' });
              }
              const { headline, body } = parseHeadlineAndContent(card['CONTENT']);
              const displayHeadline = headline || (cardType === 'ACTIVITY' ? '[ACTIVITY] Event scheduled' : 'Announcement Bulletin');
              const displayBody = body;
              const truncatedText = displayBody && displayBody.length > 180 ? displayBody.substring(0, 180).trim() + '...' : displayBody;
              const cardReactions = reactionsState[cardId] || { love: 0, like: 0, salute: 0, laugh: 0 };
              const cardUserReactions = userReactionsState[cardId] || { love: false, like: false, salute: false, laugh: false };
              return (
                <div
                  key={cardId}
                  onClick={() => setSelectedAnnouncement(card)}
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `6px solid ${stripeColor}`,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                    position: 'relative',
                    width: '100%',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {tags.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '12px', background: t.bg, color: t.color, border: `1px solid ${t.border}`, letterSpacing: '0.04em' }}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      {card['DATE ANNOUNCED'] || ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.4', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
                    {displayHeadline}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 0.75rem 0', whiteSpace: 'pre-wrap' }}>
                    {truncatedText}
                  </p>
                  <div style={{ textAlign: 'right', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700 }}>Tap to read more &rsaquo;</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0 0 0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#ffffff', fontSize: '9px', fontWeight: 900, marginRight: '6px' }}>
                          B
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                          {councilInfo.label}
                        </span>
                      </div>
                      {adminUser && (
                        <button
                          onClick={(e) => handleFollowUp(card, e)}
                          disabled={isBroadcasting}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold-dark)', borderRadius: '6px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          📢 {isBroadcasting ? 'Sending...' : 'Follow Up'}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {Object.entries(EMOJIS).map(([key, emoji]) => {
                        const count = cardReactions[key] || 0;
                        const hasReacted = cardUserReactions[key];
                        return (
                          <button key={key} onClick={(e) => toggleReaction(cardId, key, e)} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: hasReacted ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.03)', border: hasReacted ? '1px solid var(--accent-gold)' : '1px solid transparent', padding: '0.2rem 0.45rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <span>{emoji}</span>
                            <span style={{ fontWeight: 800, color: hasReacted ? 'var(--accent-gold-dark)' : 'var(--text-secondary)' }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '1.25rem' }}>
            {filteredDisseminations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCardIndex(idx)}
                style={{
                  width: idx === activeCardIndex ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === activeCardIndex ? 'var(--accent-gold)' : 'var(--border-color)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
            Swipe to browse &middot; {activeCardIndex + 1} / {filteredDisseminations.length}
          </div>
        </div>
      )}

      {filteredDisseminations.length > 0 && !isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {filteredDisseminations.map((card, i) => {
            const cardId = `${card.councilId || 'SYSTEM'}_${card.sheetRowIndex || i}`;
            const stripeColor = getUrgencyColor(card['URGENCY']);
            const councilInfo = getCouncilMetadata(card.councilId);
            const cardType = String(card['TYPE'] || '').trim().toUpperCase();
            const normU = normalizeUrgency(card['URGENCY']);
            const tags = [];
            if (normU === 'FOR STRICT COMPLIANCE') tags.push({ label: 'FOR STRICT COMPLIANCE', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' });
            else if (normU === 'URGENT') tags.push({ label: 'URGENT', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' });
            else if (normU === 'ATTENTION') tags.push({ label: 'ATTENTION', bg: '#fef9c3', color: '#854d0e', border: '#fef08a' });
            else tags.push({ label: 'FOR INFO', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' });
            if (cardType === 'ACTIVITY') tags.push({ label: 'ACTIVITY', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' });
            const { headline, body } = parseHeadlineAndContent(card['CONTENT']);
            const displayHeadline = headline || (cardType === 'ACTIVITY' ? '[ACTIVITY] Event scheduled' : 'Announcement Bulletin');
            const displayBody = body;
            const truncatedText = displayBody && displayBody.length > 180 ? displayBody.substring(0, 180).trim() + '...' : displayBody;
            const cardReactions = reactionsState[cardId] || { love: 0, like: 0, salute: 0, laugh: 0 };
            const cardUserReactions = userReactionsState[cardId] || { love: false, like: false, salute: false, laugh: false };
            return (
              <div
                key={cardId}
                onClick={() => setSelectedAnnouncement(card)}
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  borderLeft: `6px solid ${stripeColor}`,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease, border-color 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08), 0 0 15px rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {tags.map((t, idx) => (<span key={idx} style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '12px', background: t.bg, color: t.color, border: `1px solid ${t.border}`, letterSpacing: '0.04em' }}>{t.label}</span>))}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{card['DATE ANNOUNCED'] || ''}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.4', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>{displayHeadline}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap' }}>{truncatedText}</p>
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '0 0 1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#ffffff', fontSize: '9px', fontWeight: 900, marginRight: '6px' }}>B</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>{councilInfo.label}</span>
                    </div>
                    {adminUser && (<button onClick={(e) => handleFollowUp(card, e)} disabled={isBroadcasting} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold-dark)', borderRadius: '6px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>📢 {isBroadcasting ? 'Sending...' : 'Follow Up'}</button>)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {Object.entries(EMOJIS).map(([key, emoji]) => { const count = cardReactions[key] || 0; const hasReacted = cardUserReactions[key]; return (<button key={key} onClick={(e) => toggleReaction(cardId, key, e)} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: hasReacted ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.03)', border: hasReacted ? '1px solid var(--accent-gold)' : '1px solid transparent', padding: '0.2rem 0.45rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.75rem' }}><span>{emoji}</span><span style={{ fontWeight: 800, color: hasReacted ? 'var(--accent-gold-dark)' : 'var(--text-secondary)' }}>{count}</span></button>); })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Styled css for removing scrollbars from pills slider */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />

      {/* Details View Modal */}
      {selectedAnnouncement && (() => {
        const d = selectedAnnouncement;
        const cardId = `${d.councilId || 'SYSTEM'}_${d.sheetRowIndex}`;
        const stripeColor = getUrgencyColor(d['URGENCY']);
        const councilInfo = getCouncilMetadata(d.councilId);
        const cardReactions = reactionsState[cardId] || { love: 0, like: 0, salute: 0, laugh: 0 };
        const cardUserReactions = userReactionsState[cardId] || { love: false, like: false, salute: false, laugh: false };

        const { headline, body } = parseHeadlineAndContent(d['CONTENT']);
        const isActivity = String(d['TYPE'] || '').trim().toUpperCase() === 'ACTIVITY';
        const displayHeadline = headline || (isActivity ? `[ACTIVITY] Event details` : 'Announcement Bulletin Details');
        const displayBody = body;

        return (
          <div 
            onClick={() => setSelectedAnnouncement(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(3px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              animation: 'fadeIn 0.25s ease'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} // stop close on inner click
              style={{
                background: 'var(--card-bg)',
                width: '100%',
                maxWidth: '650px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                borderTop: `12px solid ${stripeColor}`,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {/* Modal Header */}
              <div style={{ 
                padding: '1.5rem 1.5rem 0.75rem 1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-gold)', 
                    color: '#ffffff', 
                    fontSize: '11px', 
                    fontWeight: 900 
                  }}>
                    B
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-secondary)' }}>
                    {councilInfo.label}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ 
                padding: '0 1.5rem 1.5rem 1.5rem', 
                overflowY: 'auto', 
                flex: '1' 
              }} className="custom-scrollbar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 1rem 0' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '800', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px', 
                    background: stripeColor + '1a', 
                    color: stripeColor,
                    border: `1px solid ${stripeColor}50`
                  }}>
                    {normalizeUrgency(d['URGENCY'])}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                    Announced: {d['DATE ANNOUNCED'] || 'N/A'}
                  </span>
                </div>

                <h2 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 900, 
                  color: 'var(--text-primary)', 
                  marginBottom: '1rem',
                  lineHeight: '1.3'
                }}>
                  {displayHeadline}
                </h2>

                <p style={{ 
                  fontSize: '0.98rem', 
                  color: 'var(--text-primary)', 
                  lineHeight: '1.6', 
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1.5rem'
                }}>
                  {displayBody}
                </p>

                {/* EVENT DATE if it is an activity */}
                {d['TYPE'] === 'ACTIVITY' && d['EVENT DATE'] && (
                  <div style={{ 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '10px', 
                    padding: '0.75rem 1rem', 
                    border: '1px solid var(--border-color)',
                    marginBottom: '1.5rem'
                  }}>
                    <strong>Event Date:</strong> {d['EVENT DATE']}
                  </div>
                )}

                {/* Attachments inside modal */}
                {((d['ATTACHMENT'] && d['ATTACHMENT'].trim() !== '') || (d['Column 6'] && d['Column 6'].trim() !== '')) && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Attachments
                    </div>
                    <ImageGallery urls={(d['ATTACHMENT'] || d['Column 6']).split(',')} />
                  </div>
                )}
              </div>

              {/* Modal Footer (Reactions inside Modal too!) */}
              <div style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border-color)', 
                background: 'var(--bg-secondary)', 
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {adminUser ? (
                  <button
                    onClick={(e) => handleFollowUp(d, e)}
                    disabled={isBroadcasting}
                    style={{
                      padding: '0.4rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isBroadcasting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s',
                      boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-gold-dark)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-gold)';
                    }}
                  >
                    📢 {isBroadcasting ? 'Broadcasting...' : 'Broadcast Follow-Up'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Was this helpful?
                  </span>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {Object.entries(EMOJIS).map(([key, emoji]) => {
                    const count = cardReactions[key] || 0;
                    const hasReacted = cardUserReactions[key];
                    return (
                      <button
                        key={key}
                        onClick={(e) => toggleReaction(cardId, key, e)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: hasReacted ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.8)',
                          border: hasReacted ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        <span>{emoji}</span>
                        <span style={{ fontWeight: 800, color: hasReacted ? 'var(--accent-gold-dark)' : 'var(--text-secondary)' }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(128,128,128,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(128,128,128,0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(128,128,128,0.25);
        }
      `}} />
    </div>
  );
}
