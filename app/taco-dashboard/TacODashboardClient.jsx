"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const TABS = [
  { id: 'character', label: 'Character', icon: '⚖️', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
  { id: 'academics', label: 'Academics', icon: '📚', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
  { id: 'military',  label: 'Military',  icon: '🎖️', color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
  { id: 'physical',  label: 'Physical',  icon: '🏃', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
];

function StatCard({ value, label, color, icon, delay = 0, suffix = '' }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) return;
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setDisplayed(target); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}33`,
        borderRadius: '20px',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
        background: `radial-gradient(circle at top right, ${color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{icon}</span>
      <div style={{ fontSize: '3rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
        {Number(value) > 0 ? displayed : (value ?? '--')}{suffix}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </div>
    </motion.div>
  );
}

function RadialProgress({ value, max, color, label, size = 120 }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <text
          x="50" y="54" textAnchor="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
          fill="white" fontSize="18" fontWeight="900"
        >
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>
        {label}
      </span>
    </div>
  );
}

function SectionCharacter({ character }) {
  const totalCadets = character.totalDelinquencies;
  return (
    <motion.div key="character" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* Big KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard value={character.touringCadets}     label="Cadets Touring"      icon="🚶" color="#f59e0b" delay={0.0} />
        <StatCard value={character.confinedCadets}    label="Confined Cadets"     icon="🔒" color="#ef4444" delay={0.1} />
        <StatCard value={character.excessiveDemerits} label=">50% Demerit Load"   icon="⚠️" color="#f97316" delay={0.2} />
        <StatCard value={character.totalDelinquencies}label="Total Delinquencies" icon="📋" color="#a78bfa" delay={0.3} />
      </div>

      {/* Health bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>
          Company Discipline Health
        </div>
        {[
          { label: 'Touring Load', value: character.touringCadets, max: Math.max(totalCadets, 1), color: '#f59e0b' },
          { label: 'Confinement Rate', value: character.confinedCadets, max: Math.max(totalCadets, 1), color: '#ef4444' },
          { label: 'Excessive Demerits', value: character.excessiveDemerits, max: Math.max(totalCadets, 1), color: '#f97316' },
        ].map((bar, i) => {
          const pct = Math.min((bar.value / bar.max) * 100, 100);
          return (
            <div key={bar.label} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{bar.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: bar.color }}>{bar.value} cadet{bar.value !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.9, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${bar.color}cc, ${bar.color})`, borderRadius: '999px' }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Links */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/exo-punishment" style={actionBtn('#f59e0b')}>
          View F/SGT Punishment Board →
        </Link>
        <Link href="/s1/sick-call-tracker" style={actionBtn('#a78bfa')}>
          View Sick Call Tracker →
        </Link>
      </motion.div>
    </motion.div>
  );
}

function SectionAcademics() {
  return (
    <motion.div key="academics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard value="--" label="Company GPA" icon="📊" color="#3b82f6" delay={0.0} />
        <StatCard value="--" label="Honor Roll Cadets" icon="🏆" color="#6366f1" delay={0.1} />
        <StatCard value="--" label="Academic Probation" icon="⚠️" color="#f59e0b" delay={0.2} />
        <StatCard value="--" label="Dean's Listers" icon="🎓" color="#10b981" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
          Academic Data Integration Coming Soon
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
          Grade tracking and GPA dashboards are being developed. Check back for real-time academic performance monitoring.
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionMilitary() {
  return (
    <motion.div key="military" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard value="--" label="Avg Demerits"     icon="📉" color="#10b981" delay={0.0} />
        <StatCard value="--" label="Avg Merits"        icon="📈" color="#3b82f6" delay={0.1} />
        <StatCard value="--" label="On Probation"      icon="⚠️" color="#f59e0b" delay={0.2} />
        <StatCard value="--" label="Merit Citations"   icon="🎖️" color="#a78bfa" delay={0.3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎖️</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
          Military Data Integration Coming Soon
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
          Demerit/merit averages and military performance metrics are being integrated from regimental records.
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionPhysical({ physical }) {
  const totalPft = physical.passed + physical.failed + physical.other;
  const passRate = totalPft > 0 ? Math.round((physical.passed / totalPft) * 100) : 0;
  const failRate = totalPft > 0 ? Math.round((physical.failed / totalPft) * 100) : 0;

  return (
    <motion.div key="physical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard value={passRate}       label="Pass Rate"     icon="✅" color="#10b981" delay={0.0} suffix="%" />
        <StatCard value={physical.passed}label="Passed"        icon="🏅" color="#3b82f6" delay={0.1} />
        <StatCard value={physical.failed}label="Failed"        icon="❌" color="#ef4444" delay={0.2} />
        <StatCard value={totalPft}       label="Total Tested"  icon="📋" color="#a78bfa" delay={0.3} />
      </div>

      {/* Pass/Fail visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RadialProgress value={physical.passed} max={totalPft} color="#10b981" label="Pass Rate" />
        </motion.div>

        {physical.topFailedEvents && physical.topFailedEvents.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
              Top Failed Events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {physical.topFailedEvents.map(([evt, count], idx) => (
                <div key={evt} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', minWidth: '20px' }}>#{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.25rem' }}>{evt}</div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min((count / (physical.failed || 1)) * 100, 100)}%` }}
                        transition={{ delay: 0.6 + idx * 0.1, duration: 0.8 }}
                        style={{ height: '100%', background: '#ef4444', borderRadius: '999px' }}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ef4444' }}>{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RadialProgress value={physical.failed} max={totalPft} color="#ef4444" label="Fail Rate" />
          </motion.div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Link href="/pft-tracker" style={actionBtn('#ef4444')}>
          View Athletic Council PFT Board →
        </Link>
      </motion.div>
    </motion.div>
  );
}

function actionBtn(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.85rem 1.75rem',
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    fontWeight: 800,
    fontSize: '0.9rem',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    letterSpacing: '0.02em',
  };
}

export default function TacODashboardClient({ metrics }) {
  const { adminUser, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('character');

  if (!isLoaded) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
        Loading Eagle Eye View...
      </div>
    );
  }

  if (!adminUser || adminUser.council !== 'TACO') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Unauthorized Access</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>This dashboard is strictly for the Tactical Officer's eyes only.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>
          Return Home
        </Link>
      </div>
    );
  }

  const { character, physical } = metrics;
  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(245,158,11,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 50%)',
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    }}>

      {/* ─── HERO HEADER ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%', background: '#10b981',
            boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)' }}>
            Live · Tac O's Eyes Only
          </span>
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #d4af37 0%, #fde68a 50%, #d4af37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
        }}>
          Eagle Eye Dashboard
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', fontWeight: 500 }}>
          Bravo Company · Real-time performance intelligence
        </p>
      </motion.div>

      {/* ─── TAB SWITCHER ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '6px',
          gap: '4px',
          marginBottom: '2.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                padding: '0.65rem 1.4rem',
                borderRadius: '11px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
                background: isActive ? `linear-gradient(135deg, ${tab.color}33, ${tab.color}18)` : 'transparent',
                color: isActive ? tab.color : 'rgba(255,255,255,0.4)',
                boxShadow: isActive ? `0 0 20px ${tab.glow}, inset 0 1px 0 ${tab.color}33` : 'none',
                outline: isActive ? `1px solid ${tab.color}44` : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tabIndicator"
                  style={{
                    position: 'absolute', bottom: '5px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px', height: '3px',
                    background: tab.color,
                    borderRadius: '999px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ─── SECTION LABEL ─── */}
      <motion.div
        key={activeTab + '-label'}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}
      >
        <div style={{
          width: '4px', height: '28px',
          background: `linear-gradient(180deg, ${activeTabData.color}, ${activeTabData.color}44)`,
          borderRadius: '999px',
        }} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: activeTabData.color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {activeTabData.icon} {activeTabData.label} Overview
        </h2>
      </motion.div>

      {/* ─── TAB CONTENT ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'character' && <SectionCharacter key="character" character={character} />}
        {activeTab === 'academics' && <SectionAcademics key="academics" />}
        {activeTab === 'military'  && <SectionMilitary  key="military"  />}
        {activeTab === 'physical'  && <SectionPhysical  key="physical"  physical={physical} />}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        button:hover { filter: brightness(1.12); }
      `}</style>
    </div>
  );
}
