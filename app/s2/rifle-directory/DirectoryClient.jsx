'use client';
import { useState } from 'react';
import InteractiveSchematic from './InteractiveSchematic';
import { useAuth } from '../../AuthContext';
import ReportForm from './ReportForm';

export default function DirectoryClient({ initialInventory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRifle, setSelectedRifle] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const { adminUser } = useAuth();
  
  const isS2Admin = adminUser?.council === 'S2';

  const filteredInventory = initialInventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* iOS Style Search Section */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#ffffff', 
          borderRadius: '20px', 
          padding: '0.5rem 1rem',
          boxShadow: isFocused ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}>
          {/* Magnifying Glass Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          <input 
            type="text" 
            placeholder="Search by name or serial number..." 
            value={searchTerm}
            onChange={(e) => {
               setSearchTerm(e.target.value);
               if (e.target.value === '') setSelectedRifle(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ 
              flex: 1, 
              border: 'none', 
              background: 'transparent', 
              fontSize: '1.1rem',
              color: '#1d1d1f',
              outline: 'none',
              padding: '0.5rem 0'
            }}
          />
        </div>
        
        {/* iOS Style Dropdown Results */}
        {searchTerm && !selectedRifle && (
          <div style={{ 
            marginTop: '0.8rem', 
            maxHeight: '400px', 
            overflowY: 'auto', 
            background: '#ffffff', 
            borderRadius: '16px',
            position: 'absolute', 
            width: '100%', 
            zIndex: 100,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {filteredInventory.length === 0 ? (
              <div style={{ padding: '1.5rem', color: '#86868b', textAlign: 'center' }}>No results found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredInventory.map((item, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '1rem 1.5rem', 
                      borderBottom: idx === filteredInventory.length - 1 ? 'none' : '1px solid #f5f5f7', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      setSelectedRifle(item);
                      setSearchTerm(''); // Clear search to hide dropdown
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9f9fb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1d1d1f' }}>{item.name}</span>
                      <span style={{ fontSize: '0.85rem', color: '#86868b' }}>{item.class} • {item.rifleType}</span>
                    </div>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '500', 
                      color: '#d4af37', // Gold accent
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '12px'
                    }}>
                      {item.serialNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schematic Rendering */}
      {selectedRifle && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e5e5ea' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1d1d1f' }}>
                {selectedRifle.name}&apos;s Weapon
              </h2>
              <span style={{ color: '#86868b', fontSize: '0.9rem', marginTop: '4px' }}>Diagnostic View</span>
            </div>
            
            <button 
              onClick={() => setSelectedRifle(null)} 
              style={{ 
                background: '#f5f5f7', 
                border: 'none', 
                color: '#1d1d1f', 
                padding: '8px 16px', 
                borderRadius: '16px',
                cursor: 'pointer', 
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e5ea'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f7'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close
            </button>
          </div>
          
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '24px', 
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <InteractiveSchematic rifle={selectedRifle} />
          </div>
          
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '24px', 
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <ReportForm rifle={selectedRifle} isS2Admin={isS2Admin} />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
