'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getCadetImageUrl } from '../../lib/imageMatcher';

const CATEGORIES = [
  { 
    id: 'character', 
    label: 'Character', 
    icon: '⚖️', 
    color: '#10b981', 
    glow: 'rgba(16, 185, 129, 0.25)', 
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    description: 'Discipline Honor Roll (Lowest accumulated demerits & outstanding merits)'
  },
  { 
    id: 'academics', 
    label: 'Academics', 
    icon: '🎓', 
    color: '#3b82f6', 
    glow: 'rgba(59, 130, 246, 0.25)', 
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'Academic Excellence (Highest overall semester GPA)'
  },
  { 
    id: 'military', 
    label: 'Military', 
    icon: '🎖️', 
    color: '#ef4444', 
    glow: 'rgba(239, 68, 68, 0.25)', 
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    description: 'Military Aptitude (Highest command ratings & tactical excellence)'
  },
  { 
    id: 'physical', 
    label: 'Physical', 
    icon: '🏃', 
    color: '#fbbf24', 
    glow: 'rgba(251, 191, 36, 0.25)', 
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
    description: 'Physical Fitness Test (Highest overall average PFT scores)'
  }
];

export default function LeaderboardsClient({ data }) {
  const [activeCategory, setActiveCategory] = useState('physical');
  const [activeClass, setActiveClass] = useState('1cl');

  const triggerConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 28, spread: 360, ticks: 50, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);
      
      // Gold and white sparkles for victory theme
      confetti({
        ...defaults,
        particleCount,
        colors: ['#fbbf24', '#ffffff', '#f59e0b', '#d4af37'],
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        colors: ['#fbbf24', '#ffffff', '#f59e0b', '#d4af37'],
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 }
      });
    }, 200);

    return () => clearInterval(interval);
  };

  // Trigger confetti on category change or class change
  useEffect(() => {
    triggerConfetti();
  }, [activeCategory, activeClass]);

  const activeCategoryInfo = CATEGORIES.find(c => c.id === activeCategory);
  const classLeaderboard = data[activeCategory]?.[activeClass] || [];

  // Separate Top 3 (Podium) and 4-5th spots
  const podiumCadets = [];
  const runnerUpCadets = [];

  // Podium order: 2nd Place, 1st Place, 3rd Place
  if (classLeaderboard[1]) podiumCadets.push({ rank: 2, cadet: classLeaderboard[1] });
  if (classLeaderboard[0]) podiumCadets.push({ rank: 1, cadet: classLeaderboard[0] });
  if (classLeaderboard[2]) podiumCadets.push({ rank: 3, cadet: classLeaderboard[2] });

  if (classLeaderboard[3]) runnerUpCadets.push({ rank: 4, cadet: classLeaderboard[3] });
  if (classLeaderboard[4]) runnerUpCadets.push({ rank: 5, cadet: classLeaderboard[4] });

  const formatScore = (score) => {
    if (activeCategory === 'character') {
      // In character, score is (demerits - merits) where lower is better.
      // If negative, it means they have net merits, which is outstanding!
      if (score < 0) {
        return `${Math.abs(score)} Net Merits`;
      } else if (score === 0) {
        return `Pristine (0 Demerits)`;
      } else {
        return `${score} Demerits`;
      }
    }
    if (activeCategory === 'academics') {
      return `${score.toFixed(2)} GPA`;
    }
    if (activeCategory === 'military') {
      return `${score.toFixed(1)} Rating`;
    }
    if (activeCategory === 'physical') {
      return `${score.toFixed(1)}% Avg`;
    }
    return score;
  };

  // Helper to format run time values (seconds -> mm:ss)
  const formatRunValue = (val) => {
    if (typeof val === 'number' && val > 0) {
      const mins = Math.floor(val / 60);
      const secs = Math.floor(val % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return val;
  };

  const renderPhysicalEventHolder = (title, dataM, labelM, unitM, dataF, labelF, unitF, icon, isTime = false) => {
    const hasM = dataM && dataM.value !== -1 && dataM.value !== 999999 && dataM.cadets.length > 0;
    const hasF = dataF && dataF.value !== -1 && dataF.value !== 999999 && dataF.cadets.length > 0;
    
    if (!hasM && !hasF) return null;

    const renderGenderSection = (genderData, label, unit) => {
      if (!genderData || genderData.value === -1 || genderData.value === 999999 || genderData.cadets.length === 0) return null;
      let displayValue = isTime ? formatRunValue(genderData.value) : genderData.value;
      
      return (
        <div style={{ flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{label}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            {displayValue} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{unit}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {genderData.cadets.map((c, i) => {
              const pic = getCadetImageUrl(c.surname || c.name, '', c.name, c.class);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {pic ? (
                    <img src={pic} alt={c.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                      🧑‍✈️
                    </div>
                  )}
                  <span style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.surname || c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div style={{ flex: '1 1 230px', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{icon}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {hasM && renderGenderSection(dataM, 'Male', unitM)}
          {hasF && renderGenderSection(dataF, 'Female', unitF)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Gilded Header */}
      <div className="section-header" style={{ marginBottom: '2.5rem', textAlign: 'center', position: 'relative' }}>
        <h1 className="section-title" style={{ fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #d4af37 0%, #fde68a 50%, #d4af37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em', margin: 0 }}>
          🏆 COMPANY LEADERBOARDS
        </h1>
        <div className="section-subtitle" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>
          Glorifying Bravo Company's Top Performers
        </div>
      </div>

      {/* Category Toggle Capsule */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '20px', 
        padding: '0.5rem', 
        gap: '0.5rem', 
        marginBottom: '2.5rem', 
        border: '1px solid var(--border-color)', 
        flexWrap: 'wrap' 
      }}>
        {CATEGORIES.map(category => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                borderRadius: '16px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? category.gradient : 'transparent',
                boxShadow: isActive ? `0 0 20px ${category.glow}` : 'none',
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{category.icon}</span>
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Class Level Selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {['1cl', '2cl', '3cl'].map(cls => {
          const isActive = activeClass === cls;
          const displayLabels = { '1cl': '1st Class (1CL)', '2cl': '2nd Class (2CL)', '3cl': '3rd Class (3CL)' };
          return (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '12px',
                border: isActive ? `2px solid ${activeCategoryInfo.color}` : '1px solid var(--border-color)',
                background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                boxShadow: isActive ? `0 0 10px ${activeCategoryInfo.glow}` : 'none'
              }}
            >
              {displayLabels[cls]}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Card Container */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '24px', 
        border: '1px solid var(--border-color)', 
        padding: '2.5rem', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        marginBottom: '2.5rem',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        {/* Category Info Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.8rem', fontWeight: 800 }}>
            <span style={{ fontSize: '2rem' }}>{activeCategoryInfo.icon}</span>
            {activeClass.toUpperCase()} {activeCategoryInfo.label.toUpperCase()} LEADERBOARD
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
            {activeCategoryInfo.description}
          </p>
        </div>

        {classLeaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>No top performers data found for this class.</span>
          </div>
        ) : (
          <>
            {/* 3D-Like Glorious Podium Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-end', 
              gap: '2rem', 
              paddingTop: '2rem',
              flexWrap: 'wrap'
            }} className="podium-wrapper">
              
              {podiumCadets.map(({ rank, cadet }) => {
                const pic = getCadetImageUrl(cadet.surname || cadet.name, '', cadet.name, cadet.class);
                
                // Styling details based on Rank
                let podiumHeight = '100px';
                let podiumBg = '';
                let borderStyle = '';
                let rankLabel = '';
                let badgeBg = '';
                let scale = '1';
                let zIndex = 1;

                if (rank === 1) {
                  podiumHeight = '170px';
                  podiumBg = 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)';
                  borderStyle = '3px solid #fbbf24';
                  rankLabel = '1st Place';
                  badgeBg = '#d4af37';
                  scale = '1.1';
                  zIndex = 3;
                } else if (rank === 2) {
                  podiumHeight = '130px';
                  podiumBg = 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)';
                  borderStyle = '2px solid #94a3b8';
                  rankLabel = '2nd Place';
                  badgeBg = '#94a3b8';
                  zIndex = 2;
                } else if (rank === 3) {
                  podiumHeight = '100px';
                  podiumBg = 'linear-gradient(180deg, #b45309 0%, #78350f 100%)';
                  borderStyle = '2px solid #b45309';
                  rankLabel = '3rd Place';
                  badgeBg = '#b45309';
                  zIndex = 1;
                }

                return (
                  <div 
                    key={rank} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      width: '180px',
                      transform: `scale(${scale})`,
                      zIndex: zIndex,
                      transition: 'transform 0.3s ease',
                    }}
                    className={`podium-column-${rank}`}
                  >
                    {/* Crown for 1st Place */}
                    {rank === 1 && (
                      <div style={{ fontSize: '2.5rem', marginBottom: '-5px', transform: 'rotate(-5deg)', filter: 'drop-shadow(0 4px 6px rgba(251,191,36,0.5))', animation: 'crown-bob 2s ease-in-out infinite alternate' }}>
                        👑
                      </div>
                    )}

                    {/* Cadet Avatar */}
                    <div style={{ 
                      position: 'relative', 
                      marginBottom: '1rem',
                    }}>
                      <div style={{
                        width: rank === 1 ? '90px' : '75px',
                        height: rank === 1 ? '90px' : '75px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: borderStyle,
                        boxShadow: rank === 1 ? '0 0 25px rgba(251, 191, 36, 0.4)' : '0 4px 10px rgba(0,0,0,0.15)',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {pic ? (
                          <img src={pic} alt={cadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: rank === 1 ? '3rem' : '2.2rem' }}>🧑‍✈️</span>
                        )}
                      </div>

                      {/* Rank Medal Circle */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '-5px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: badgeBg,
                        border: '2px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}>
                        {rank}
                      </div>
                    </div>

                    {/* Cadet Details */}
                    <div style={{ textAlign: 'center', marginBottom: '0.75rem', width: '100%' }}>
                      <div style={{ fontWeight: 800, fontSize: rank === 1 ? '1.05rem' : '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cadet.name.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                        {cadet.name.split(',')[1] || ''}
                      </div>
                    </div>

                    {/* 3D Podium Block */}
                    <div style={{
                      width: '100%',
                      height: podiumHeight,
                      background: podiumBg,
                      borderRadius: '16px 16px 12px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                      padding: '0.5rem',
                      color: '#ffffff'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>
                        {rankLabel}
                      </span>
                      <span style={{ fontSize: rank === 1 ? '1.25rem' : '1.05rem', fontWeight: 950, marginTop: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        {formatScore(cadet.score)}
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>

            {/* Runner-Ups / Honor Roll (Ranks 4-5) */}
            {runnerUpCadets.length > 0 && (
              <div style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '2rem', 
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem' 
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  🎖️ Honor Roll (4th & 5th Positions)
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {runnerUpCadets.map(({ rank, cadet }) => {
                    const pic = getCadetImageUrl(cadet.surname || cadet.name, '', cadet.name, cadet.class);
                    return (
                      <div 
                        key={rank} 
                        style={{ 
                          flex: '1 1 300px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '16px', 
                          padding: '0.75rem 1.25rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)', width: '20px' }}>
                            #{rank}
                          </span>
                          {pic ? (
                            <img src={pic} alt={cadet.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--border-color)' }}>
                              🧑‍✈️
                            </div>
                          )}
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {cadet.name}
                          </span>
                        </div>
                        <span style={{ fontWeight: 900, color: activeCategoryInfo.color, fontSize: '1rem' }}>
                          {formatScore(cadet.score)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PFT Individual Event Records Showcase (Only for Physical tab) */}
      {activeCategory === 'physical' && data.pftEvents && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)', 
          padding: '2rem', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)' 
        }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💪 INDIVIDUAL EVENT RECORD HOLDERS
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
              Peak scores recorded in {activeClass.toUpperCase()} for individual fitness events
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
            {renderPhysicalEventHolder(
              'Push-Ups', 
              data.pftEvents[activeClass]?.pushups, 'Male Record', 'reps', 
              data.pftEvents[activeClass]?.pushupsF, 'Female Record', 'reps', 
              '💪'
            )}
            {renderPhysicalEventHolder(
              'Sit-Ups', 
              data.pftEvents[activeClass]?.situps, 'Male Record', 'reps', 
              data.pftEvents[activeClass]?.situpsF, 'Female Record', 'reps', 
              '💪'
            )}
            {renderPhysicalEventHolder(
              'Pull-Ups / Flexed-Arm', 
              data.pftEvents[activeClass]?.pullups, 'Pull-Ups (M)', 'reps', 
              data.pftEvents[activeClass]?.flexarm, 'Flexed-Arm (F)', 'secs', 
              '💪'
            )}
            {renderPhysicalEventHolder(
              '3.2KM Run', 
              data.pftEvents[activeClass]?.run, 'Male Record', '', 
              data.pftEvents[activeClass]?.runF, 'Female Record', '', 
              '🏃', 
              true
            )}
          </div>
        </div>
      )}

      {/* Styled Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crown-bob {
          0% { transform: translateY(0) rotate(-5deg); }
          100% { transform: translateY(-6px) rotate(-3deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 650px) {
          .podium-wrapper {
            flex-direction: column;
            align-items: center;
            gap: 3rem;
          }
          .podium-column-1 {
            order: 1;
          }
          .podium-column-2 {
            order: 2;
          }
          .podium-column-3 {
            order: 3;
          }
        }
      `}} />

    </div>
  );
}
