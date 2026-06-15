'use client';
import { useState, useEffect } from 'react';
import InteractiveSchematic from './InteractiveSchematic';
import { useAuth } from '../../AuthContext';
import ReportForm from './ReportForm';

export default function DirectoryClient({ initialInventory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRifle, setSelectedRifle] = useState(null);
  const { adminUser } = useAuth();
  
  const isS2Admin = adminUser?.council === 'S2';

  const filteredInventory = initialInventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: 'var(--bg-tertiary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search by Cadet Name or Rifle Serial Number..." 
            value={searchTerm}
            onChange={(e) => {
               setSearchTerm(e.target.value);
               if (e.target.value === '') setSelectedRifle(null);
            }}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        
        {searchTerm && !selectedRifle && (
          <div style={{ marginTop: '0.5rem', maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'absolute', width: 'calc(100% - 4rem)', zIndex: 10 }}>
            {filteredInventory.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No results found.</div>
            ) : (
              filteredInventory.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    setSelectedRifle(item);
                    setSearchTerm(''); // Clear search to hide dropdown
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Class: {item.class}</span>
                  </div>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>SN: {item.serialNumber}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedRifle && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>Currently Viewing: <span style={{ color: 'var(--accent-gold)' }}>{selectedRifle.name}&apos;s Rifle</span></h2>
            <button onClick={() => setSelectedRifle(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Clear Selection</button>
          </div>
          <InteractiveSchematic rifle={selectedRifle} />
          <ReportForm rifle={selectedRifle} isS2Admin={isS2Admin} />
        </>
      )}
    </div>
  );
}
