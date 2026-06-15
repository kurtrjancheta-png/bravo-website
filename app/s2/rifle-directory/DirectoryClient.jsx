'use client';
import { useState } from 'react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'monospace', color: '#0cd0cd' }}>
      
      {/* Search Section */}
      <div style={{ background: 'rgba(12, 208, 205, 0.05)', padding: '2rem', borderRadius: '4px', border: '1px solid #0cd0cd', position: 'relative', boxShadow: 'inset 0 0 20px rgba(12, 208, 205, 0.1)' }}>
        
        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: '2px solid #0cd0cd', borderLeft: '2px solid #0cd0cd' }} />
        <div style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: '2px solid #0cd0cd', borderRight: '2px solid #0cd0cd' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: '2px solid #0cd0cd', borderLeft: '2px solid #0cd0cd' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: '2px solid #0cd0cd', borderRight: '2px solid #0cd0cd' }} />

        <div style={{ marginBottom: '1rem', fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.8 }}>// DATABASE QUERY INTERFACE</div>
        
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#0cd0cd', fontSize: '1.5rem' }}>⌕</span>
          <input 
            type="text" 
            placeholder="SEARCH BY CADET NAME OR SERIAL NUMBER..." 
            value={searchTerm}
            onChange={(e) => {
               setSearchTerm(e.target.value);
               if (e.target.value === '') setSelectedRifle(null);
            }}
            style={{ 
              width: '100%', padding: '1rem 1rem 1rem 3rem', fontSize: '1.2rem', 
              border: '1px solid #0cd0cd', background: '#020a14', color: '#0cd0cd',
              outline: 'none', fontFamily: 'monospace', letterSpacing: '1px'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(12, 208, 205, 0.5)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>
        
        {searchTerm && !selectedRifle && (
          <div style={{ 
            marginTop: '0.5rem', maxHeight: '300px', overflowY: 'auto', 
            background: '#020a14', border: '1px solid #0cd0cd', 
            position: 'absolute', width: 'calc(100% - 4rem)', zIndex: 100,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            {filteredInventory.length === 0 ? (
              <div style={{ padding: '1rem', color: '#0cd0cd', opacity: 0.7 }}>NO RESULTS FOUND.</div>
            ) : (
              filteredInventory.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '1rem', borderBottom: '1px solid rgba(12, 208, 205, 0.3)', 
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => {
                    setSelectedRifle(item);
                    setSearchTerm(''); // Clear search to hide dropdown
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(12, 208, 205, 0.2)'; e.currentTarget.style.paddingLeft = '1.5rem'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.paddingLeft = '1rem'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>CLASS: {item.class} // WEAPON PLATFORM: <span style={{ fontWeight: 'bold', textShadow: '0 0 5px #0cd0cd' }}>{item.rifleType}</span></span>
                  </div>
                  <span style={{ fontWeight: '600', letterSpacing: '2px', border: '1px solid rgba(12, 208, 205, 0.5)', padding: '5px 10px' }}>SN: {item.serialNumber}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Schematic Rendering */}
      {selectedRifle && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(12, 208, 205, 0.5)', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontWeight: 'normal', letterSpacing: '1px' }}>TARGET ACQUIRED: <span style={{ fontWeight: 'bold', textShadow: '0 0 10px #0cd0cd' }}>{selectedRifle.name}&apos;S WEAPON</span></h2>
            <button 
              onClick={() => setSelectedRifle(null)} 
              style={{ 
                background: 'transparent', border: '1px solid #0cd0cd', color: '#0cd0cd', 
                padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'monospace',
                textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0cd0cd'; e.currentTarget.style.color = '#020a14'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0cd0cd'; }}
            >
              [X] CLEAR DIAGNOSTIC
            </button>
          </div>
          <InteractiveSchematic rifle={selectedRifle} />
          <ReportForm rifle={selectedRifle} isS2Admin={isS2Admin} />
        </>
      )}
    </div>
  );
}
