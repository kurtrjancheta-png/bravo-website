'use client';

import { useState } from 'react';

export default function SOIGenerator({ soiData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [showCard, setShowCard] = useState(false);

  // Helper to extract fields regardless of exact case
  const getField = (row, fieldName) => {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(fieldName.toLowerCase()));
    return key && row[key] ? String(row[key]) : 'N/A';
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    // Find cadet matching the search term in First Name, Surname, or Full Name
    const term = searchTerm.toLowerCase();
    const found = soiData.find(row => {
      const first = getField(row, 'FIRST NAME').toLowerCase();
      const last = getField(row, 'SURNAME').toLowerCase();
      const middle = getField(row, 'MIDDLE NAME').toLowerCase();
      const serial = getField(row, 'SERIAL NR').toLowerCase();
      
      return first.includes(term) || last.includes(term) || middle.includes(term) || serial.includes(term);
    });

    if (found) {
      setSelectedCadet(found);
      setShowCard(true);
    } else {
      alert("Cadet not found. Please try another name or serial number.");
      setShowCard(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="soi-generator-container" style={{ marginBottom: '3rem' }}>
      <div className="soi-search-box" style={{ 
        background: 'var(--bg-tertiary)', 
        padding: '2rem', 
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🗂️</span> SUMMARY OF INFORMATION GENERATOR
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Enter a cadet's surname, first name, or serial number to generate their complete SOI profile.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px', marginTop: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search Name or Serial No. (e.g. Ancheta)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '0.8rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '1rem',
              outline: 'none',
              color: 'var(--text-primary)'
            }}
          />
          <button 
            onClick={handleSearch}
            style={{
              background: 'var(--accent-gold)',
              color: 'white',
              border: 'none',
              padding: '0 1.5rem',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--accent-gold-dark)'}
            onMouseOut={(e) => e.target.style.background = 'var(--accent-gold)'}
          >
            Generate SOI
          </button>
        </div>
      </div>

      {showCard && selectedCadet && (
        <div className="soi-card" style={{
          marginTop: '2rem',
          background: 'white',
          border: '1px solid var(--accent-gold)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease'
        }}>
          {/* Header */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '120px', height: '120px', background: '#333', borderRadius: '8px', border: '3px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '3rem' }}>👤</span>
            </div>
            <div>
              <div style={{ color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                {getField(selectedCadet, 'CLASS')} CLASS CADET
              </div>
              <h2 style={{ fontSize: '2.5rem', margin: 0, textTransform: 'uppercase' }}>
                {getField(selectedCadet, 'FIRST NAME')} {getField(selectedCadet, 'MIDDLE NAME')} {getField(selectedCadet, 'SURNAME')}
              </h2>
              <div style={{ fontSize: '1.25rem', opacity: 0.9, marginTop: '0.25rem', fontFamily: 'monospace' }}>
                SN: {getField(selectedCadet, 'SERIAL NR')}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            {/* Section 1 */}
            <div className="soi-section">
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>PERSONAL DATA</h4>
              <SoiField label="Birthdate" value={getField(selectedCadet, 'BIRTHDATE').replace(/Date\(|\)/g, '').split(',').join('-')} />
              <SoiField label="Religion" value={getField(selectedCadet, 'RELIGION')} />
              <SoiField label="Blood Type" value={getField(selectedCadet, 'BLOOD TYPE')} />
              <SoiField label="Height / Weight" value={`${getField(selectedCadet, 'HEIGHT')} / ${getField(selectedCadet, 'WEIGHT')}`} />
              <SoiField label="Hair / Eyes" value={`${getField(selectedCadet, 'HAIR')} / ${getField(selectedCadet, 'EYES')}`} />
              <SoiField label="Ethnic Group" value={getField(selectedCadet, 'ETHNIC GROUP')} />
              <SoiField label="Contact No." value={getField(selectedCadet, 'CP NO.')} />
              <SoiField label="Address" value={getField(selectedCadet, 'ADDRESS')} />
              <SoiField label="Region" value={getField(selectedCadet, 'REGION')} />
              <SoiField label="Other ID Data" value={getField(selectedCadet, 'OTHER IDENTIFYING DATA')} />
            </div>

            {/* Section 2 */}
            <div className="soi-section">
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>BACKGROUND</h4>
              <SoiField label="Educational Attainment" value={getField(selectedCadet, 'HIGHEST EDUCATIONAL ATTAINMENT')} />
              <SoiField label="Course (Pre-PMA)" value={getField(selectedCadet, 'COURSE BEFORE APPOINTMENT')} />
              <SoiField label="College/University" value={getField(selectedCadet, 'NAME OF COLLEGE')} />
              <SoiField label="High School" value={getField(selectedCadet, 'NAME OF HIGH SCHOOL')} />
              <SoiField label="Honors Received" value={getField(selectedCadet, 'HONORS RECEIVED')} />
              <SoiField label="Corps Squad" value={getField(selectedCadet, 'CORPS SQUAD MEMBERSHIP')} />
              <SoiField label="Clubs / Orgs" value={getField(selectedCadet, 'CLUBS AND ORGANIZATION')} />
              <SoiField label="Hobbies" value={getField(selectedCadet, 'HOBBIES')} />
              <SoiField label="Allergies" value={getField(selectedCadet, 'ALLERGIES')} />
            </div>

            {/* Section 3 */}
            <div className="soi-section">
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>FAMILY & EMERGENCY</h4>
              <SoiField label="Father's Name" value={getField(selectedCadet, 'NAME OF FATHER')} />
              <SoiField label="Mother's Name" value={getField(selectedCadet, 'NAME OF MOTHER')} />
              <SoiField label="Next of Kin" value={`${getField(selectedCadet, 'NAME OF NEXT OF KIN')} (${getField(selectedCadet, 'RELATIONSHIP')})`} />
              <SoiField label="Kin Contact" value={getField(selectedCadet, 'CONTACT NUMBER')} />
              <SoiField label="Kin Address" value={getField(selectedCadet, 'ADDRESS')} />
              <br/>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>IN CASE OF EMERGENCY</h4>
              <SoiField label="Contact Person" value={getField(selectedCadet, 'EMERGENCY DETAILS NAME')} />
              <SoiField label="Emergency No." value={getField(selectedCadet, 'CONTACT NR')} />
              <SoiField label="Address" value={getField(selectedCadet, 'ADDRESS')} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function SoiField({ label, value }) {
  // Hide empty/N/A values if desired, or just show them clearly
  const displayValue = value && value !== 'N/A' && value !== 'undefined' ? value : '--';
  return (
    <div style={{ display: 'flex', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
      <span style={{ width: '45%', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}:</span>
      <span style={{ width: '55%', color: 'var(--text-primary)', fontWeight: 500 }}>{displayValue}</span>
    </div>
  );
}
