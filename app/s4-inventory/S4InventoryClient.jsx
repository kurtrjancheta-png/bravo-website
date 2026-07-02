'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function S4InventoryClient({ electronics = [], furniture = [], miscellaneous = [] }) {
  const { adminUser } = useAuth();
  
  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Flatten all items into a single array for easier global filtering and statistics
  const allItems = [
    ...electronics.map(item => ({ ...item, category: 'ELECTRONICS & APPLIANCES' })),
    ...furniture.map(item => ({ ...item, category: 'FURNITURE' })),
    ...miscellaneous.map(item => ({ ...item, category: 'MISCELLANEOUS' }))
  ];

  // Helper to resolve location categories from remarks
  const resolveLocation = (remarks) => {
    const r = (remarks || '').toUpperCase();
    if (r.includes('CLUBROOM')) return 'CLUBROOM';
    if (r.includes('EI ROOM')) return 'EI ROOM';
    if (r.includes('CQ STATION') || r.includes('CQ')) return 'CQ STATION';
    if (r.includes('STOCKROOM')) return 'STOCKROOM';
    if (r.includes('BARRACKS') || r.includes('RESPECTIVE')) return 'BARRACKS';
    if (r.includes('OPEN AREA') || r.includes('OPEN')) return 'OPEN AREA';
    return 'OTHER';
  };

  // Attach resolved locations
  const itemsWithLocation = allItems.map(item => ({
    ...item,
    resolvedLocation: resolveLocation(item.remarks)
  }));

  // Unique list of locations for filtering
  const locations = ['ALL', 'CLUBROOM', 'EI ROOM', 'CQ STATION', 'STOCKROOM', 'BARRACKS', 'OPEN AREA', 'OTHER'];

  // Icon mapping
  const getItemIcon = (name, type) => {
    const n = name.toUpperCase();
    const t = type ? type.toUpperCase() : '';
    if (n.includes('PRINTER') || t.includes('PRINTER')) return '🖨️';
    if (n.includes('TV') || n.includes('FLATSCREEN') || t.includes('TV')) return '📺';
    if (n.includes('REFRIGIRATOR') || n.includes('FRIDGE') || t.includes('REFRIGIRATOR')) return '🧊';
    if (n.includes('DRYER') || n.includes('TUMBLE') || t.includes('DRYER')) return '🌀';
    if (n.includes('SPEAKER') || n.includes('SOUND') || t.includes('ELECTRONICS')) return '🔊';
    if (n.includes('LAMINATOR') || t.includes('LAMINATOR')) return '📄';
    if (n.includes('HUMIDIFIER') || t.includes('HUMIDIFIER')) return '💨';
    if (n.includes('PHONE') || t.includes('PHONE')) return '📱';
    if (n.includes('LAMP') || n.includes('LIGHT') || t.includes('LAMP')) return '💡';
    if (n.includes('TABLE') || n.includes('DESK')) return '🪵';
    if (n.includes('SOFA') || n.includes('COUCH')) return '🛋️';
    if (n.includes('CHAIR') || n.includes('STOOL')) return '🪑';
    if (n.includes('MIRROR')) return '🪞';
    if (n.includes('SHELF') || n.includes('CABINET')) return '🗄️';
    if (n.includes('FOOTBALL') || n.includes('GAME')) return '⚽';
    if (n.includes('BOARD') || n.includes('BULLETIN')) return '📋';
    if (n.includes('CURTAIN')) return '🪟';
    if (n.includes('CARPET') || n.includes('RUG')) return '🧶';
    if (n.includes('BROOM')) return '🧹';
    if (n.includes('MOP')) return '🪠';
    if (n.includes('WIPER')) return '🧹';
    return '📦';
  };

  // Stats calculations
  const totalItemsCount = itemsWithLocation.reduce((acc, item) => acc + item.quantity, 0);
  
  const usableItemsCount = itemsWithLocation
    .filter(item => {
      const cond = item.condition.toUpperCase();
      return cond.includes('USABLE') || cond.includes('COMPLETE');
    })
    .reduce((acc, item) => acc + item.quantity, 0);

  const faultyItemsCount = totalItemsCount - usableItemsCount;
  
  const operationalRate = totalItemsCount > 0 
    ? Math.round((usableItemsCount / totalItemsCount) * 100) 
    : 0;

  // Category breakdowns
  const elecQty = itemsWithLocation.filter(i => i.category === 'ELECTRONICS & APPLIANCES').reduce((acc, i) => acc + i.quantity, 0);
  const furnQty = itemsWithLocation.filter(i => i.category === 'FURNITURE').reduce((acc, i) => acc + i.quantity, 0);
  const miscQty = itemsWithLocation.filter(i => i.category === 'MISCELLANEOUS').reduce((acc, i) => acc + i.quantity, 0);

  // Filtered lists
  const filteredItems = itemsWithLocation.filter(item => {
    // 1. Category Filter
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;

    // 2. Condition Filter
    const isUsable = item.condition.includes('USABLE') || item.condition.includes('COMPLETE');
    if (conditionFilter === 'USABLE' && !isUsable) return false;
    if (conditionFilter === 'FAULTY' && isUsable) return false;

    // 3. Location Filter
    if (locationFilter !== 'ALL' && item.resolvedLocation !== locationFilter) return false;

    // 4. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchType = (item.type || '').toLowerCase().includes(q);
      const matchRemarks = item.remarks.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchRemarks) return false;
    }

    return true;
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem 3rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--text-primary)'
    }}>
      {/* Dynamic font stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800&display=swap');
        
        .s4-header-stencil {
          font-family: 'Oswald', sans-serif;
          letter-spacing: 0.05em;
        }
        
        .kpi-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          transition: transform 0.2s, border-color 0.2s;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-gold);
        }
        
        .filter-pill {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill.active {
          background: var(--accent-gold);
          color: #000;
          border-color: var(--accent-gold);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
        }
        
        .inventory-card {
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          transition: all 0.2s ease;
        }
        .inventory-card:hover {
          border-color: rgba(212, 175, 55, 0.4);
          background: rgba(30, 41, 59, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .search-input-field {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.6rem 1rem;
          border-radius: 8px;
          width: 100%;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }
        .search-input-field:focus {
          outline: none;
          border-color: var(--accent-gold);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.25);
        }
        
        .badge-usable {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.25);
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .badge-faulty {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .badge-location {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        
        .operational-ring-glow {
          position: absolute;
          right: -20px;
          top: -20px;
          font-size: 6rem;
          opacity: 0.05;
          pointer-events: none;
        }
      `}} />

      {/* TOP HEADER */}
      <div style={{
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="s4-header-stencil" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>📦</span> S4 LOGISTICS INVENTORY
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Real-time supply, appliance, and furniture logs for Bravo Company
          </p>
        </div>
        
        {/* Admin Sheet link */}
        {adminUser && adminUser.council === 'S4' && (
          <a
            href="https://docs.google.com/spreadsheets/d/1UGGxJCoQpetYtqGOCxI-PSMPY1at5O9b3ayFd1pzqRs/edit"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, #d4af37 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.85rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(212,175,55,0.2)'
            }}
          >
            ✏️ Manage Inventory Sheet
          </a>
        )}
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Total items count */}
        <div className="kpi-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Items
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '0.5rem' }}>
            {totalItemsCount}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Across all categories
          </span>
          <span className="operational-ring-glow">📦</span>
        </div>

        {/* Card 2: Operational readiness rate */}
        <div className="kpi-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Operational Readiness
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e', marginTop: '0.5rem' }}>
            {operationalRate}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {usableItemsCount} Usable / {faultyItemsCount} Faulty
          </span>
          <span className="operational-ring-glow">⚙️</span>
        </div>

        {/* Card 3: Location density */}
        <div className="kpi-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Stock Distribution
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.75rem', lineHeight: '1.4' }}>
            🔌 Elec/Appliances: <strong style={{ color: 'var(--accent-gold)' }}>{elecQty}</strong><br />
            🪑 Furniture: <strong style={{ color: 'var(--accent-gold)' }}>{furnQty}</strong><br />
            🎨 Miscellaneous: <strong style={{ color: 'var(--accent-gold)' }}>{miscQty}</strong>
          </span>
          <span className="operational-ring-glow">📊</span>
        </div>
      </div>

      {/* FILTER CONTROLS CARD */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.2)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Row 1: Search & dropdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          {/* Search field */}
          <div style={{ display: 'flex', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search items by name, type, or remarks..."
              className="search-input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Condition Filter */}
          <div>
            <select
              className="search-input-field"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
            >
              <option value="ALL">🔍 All Conditions</option>
              <option value="USABLE">🟢 Usable / Complete Only</option>
              <option value="FAULTY">🔴 Faulty / Incomplete Only</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              className="search-input-field"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="ALL">📍 All Locations</option>
              {locations.filter(l => l !== 'ALL').map(loc => (
                <option key={loc} value={loc}>📍 {loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Category pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button
            className={`filter-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            All Items
          </button>
          <button
            className={`filter-pill ${activeCategory === 'ELECTRONICS & APPLIANCES' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ELECTRONICS & APPLIANCES')}
          >
            🔌 Electronics & Appliances
          </button>
          <button
            className={`filter-pill ${activeCategory === 'FURNITURE' ? 'active' : ''}`}
            onClick={() => setActiveCategory('FURNITURE')}
          >
            🪑 Furniture
          </button>
          <button
            className={`filter-pill ${activeCategory === 'MISCELLANEOUS' ? 'active' : ''}`}
            onClick={() => setActiveCategory('MISCELLANEOUS')}
          >
            🎨 Miscellaneous
          </button>
        </div>
      </div>

      {/* INVENTORY LISTINGS */}
      {filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(30, 41, 59, 0.1)',
          border: '1px dashed var(--border-color)',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '3rem' }}>📦</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>No matching items found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Try adjusting your search filters or clearing the search query.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {filteredItems.map((item, idx) => {
            const isUsable = item.condition.includes('USABLE') || item.condition.includes('COMPLETE');
            return (
              <div key={idx} className="inventory-card">
                {/* Upper section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>
                      {getItemIcon(item.name, item.type)}
                    </span>
                    <span style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {item.type || item.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                    {item.name}
                  </h3>
                  
                  {/* Category Indicator */}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.02em' }}>
                    {item.category}
                  </span>
                </div>

                {/* Bottom section */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quantity:</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--accent-gold)' }}>{item.quantity}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Condition:</span>
                    <span className={isUsable ? 'badge-usable' : 'badge-faulty'}>
                      {item.condition}
                    </span>
                  </div>

                  {item.remarks && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Location:</span>
                      <span className="badge-location" style={{ textAlign: 'right', whiteSpace: 'pre-line' }}>
                        {item.remarks}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
