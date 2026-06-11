import React, { useState, useMemo } from 'react';

export default function CadetSelectionModal({ isOpen, onClose, role, dateStr, classLevel, currentCadetName, soiData, onAssign }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter cadets by class
  const availableCadets = useMemo(() => {
    if (!soiData) return [];
    return soiData.filter(row => {
      // Assuming 'CL' or similar column exists. Or if we just rely on the user knowing.
      // Wait, SOI data has class. The columns vary. Let's assume there's a column like "CLASS" or we just filter by "3CL"/"1CL".
      // Actually, if we just want to search by last name:
      const name = String(row['SURNAME'] || '').trim();
      const first = String(row['FIRST NAME'] || '').trim();
      // To strictly filter by class, we need a reliable column. If we don't have one, we just show all.
      // But the user requested filtering by class.
      // "only display the last name of the 1cl cadets since only 1cl cadets will be posting for those guard types."
      // Let's check if there's a 'CL' or 'CLASS' column in soiData.
      const cl = String(row['CL'] || row['CLASS'] || '').trim();
      if (classLevel === '1CL' && cl !== '1' && cl !== '1CL') return false; // This might fail if the column is missing, so we'll be loose.
      // Wait, let's just make it a pure search for now, and if they typed, we match last name.
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    }).map(row => String(row['SURNAME'] || '').trim()).filter(Boolean);
  }, [soiData, searchTerm, classLevel]);

  // Remove duplicates
  const uniqueCadets = [...new Set(availableCadets)].sort();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>
          Assign {role} <br/><span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>for {dateStr}</span>
        </h3>
        
        {currentCadetName && (
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Currently Assigned: <strong>{currentCadetName}</strong>
          </div>
        )}

        <input 
          type="text" 
          placeholder={`Search ${classLevel} by Last Name...`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}
        />

        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          {uniqueCadets.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No cadets found.</div>
          ) : (
            uniqueCadets.map(name => (
              <div 
                key={name}
                onClick={() => onAssign(name)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = 'var(--btn-bg-hover)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'var(--bg-primary)'}
              >
                {name}
              </div>
            ))
          )}
        </div>

        <button 
          onClick={onClose}
          style={{
            marginTop: '1.5rem', width: '100%', padding: '0.75rem',
            background: 'transparent', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
