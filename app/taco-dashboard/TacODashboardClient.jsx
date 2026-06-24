"use client";

import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TacODashboardClient({ metrics }) {
  const { adminUser, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Loading Eagle Eye View...
      </div>
    );
  }

  // Double-check auth
  if (!adminUser || adminUser.council !== 'TACO') {
    return (
      <div className="dashboard-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Unauthorized Access</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This dashboard is strictly for the Tactical Officer's eyes only.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '8px' }}>
          Return Home
        </Link>
      </div>
    );
  }

  const { character, physical } = metrics;
  const totalPft = physical.passed + physical.failed + physical.other;
  const passRate = totalPft > 0 ? Math.round((physical.passed / totalPft) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15 
      } 
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 100%)', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '16px', 
        padding: '2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'var(--gold-primary)', fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tac O's Eagle Eye
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.6 }}>
            <strong>Company Overview.</strong> Real-time performance metrics across Academics, Character, Military, and Physical domains.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '-20%',
          fontSize: '12rem',
          opacity: 0.03,
          fontWeight: 900,
          pointerEvents: 'none'
        }}>
          EAGLE
        </div>
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}
      >
        {/* ACADEMICS */}
        <motion.div variants={cardVariants} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>📚</span>
            <h2>Academics</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>--</div>
              <div style={styles.statLabel}>Company GPA</div>
            </div>
            <div style={styles.pendingBadge}>Data integration pending...</div>
          </div>
        </motion.div>

        {/* CHARACTER */}
        <motion.div variants={cardVariants} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>⚖️</span>
            <h2>Character</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{character.touringCadets}</div>
                <div style={styles.statLabel}>Cadets Touring</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{character.hoursRemaining}</div>
                <div style={styles.statLabel}>Hours Pending</div>
              </div>
            </div>
            <Link href="/exo-punishment" style={styles.cardLink}>
              View F/SGT Punishment Board &rarr;
            </Link>
          </div>
        </motion.div>

        {/* MILITARY */}
        <motion.div variants={cardVariants} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>🎖️</span>
            <h2>Military</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>--</div>
              <div style={styles.statLabel}>Avg Demerits</div>
            </div>
            <div style={styles.pendingBadge}>Data integration pending...</div>
          </div>
        </motion.div>

        {/* PHYSICAL */}
        <motion.div variants={cardVariants} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>🏃</span>
            <h2>Physical</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{passRate}%</div>
                <div style={styles.statLabel}>Pass Rate</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ ...styles.statValue, color: 'var(--error-color)' }}>{physical.failed}</div>
                <div style={styles.statLabel}>Total Failed</div>
              </div>
            </div>
            <Link href="/pft-tracker" style={styles.cardLink}>
              View Athletic Council PFT Board &rarr;
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem'
  },
  icon: {
    fontSize: '1.5rem'
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
    gap: '1.5rem'
  },
  statBox: {
    background: 'var(--bg-primary)',
    padding: '1rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid var(--border-color)'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 900,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700
  },
  cardLink: {
    display: 'block',
    textAlign: 'center',
    padding: '0.75rem',
    background: 'var(--gold-primary)',
    color: '#000',
    fontWeight: 800,
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'opacity 0.2s ease',
    marginTop: 'auto'
  },
  pendingBadge: {
    textAlign: 'center',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    fontSize: '0.9rem'
  }
};
