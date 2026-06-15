'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const weaponConfigs = {
  'M14': {
    title: 'M14 TACTICAL SCHEMATIC',
    image: '/weapons/m14.png',
    specs: [
      { label: 'Caliber', val: '7.62x51mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '2,800 ft/s', char: 'V' },
      { label: 'Action', val: 'Gas-operated', char: 'A' },
      { label: 'Effective Range', val: '460m (Point)', char: 'R' }
    ],
    lengthLine: '44.3 INCHES',
    slices: [
      { id: 'barrel', name: 'Barrel Assembly', clip: 'polygon(0% 0%, 35% 0%, 35% 100%, 0% 100%)', explodedX: -80, explodedY: -30 },
      { id: 'receiver', name: 'Receiver & Magazine', clip: 'polygon(35% 0%, 65% 0%, 65% 100%, 35% 100%)', explodedX: 0, explodedY: 40 },
      { id: 'stock', name: 'Wooden Stock', clip: 'polygon(65% 0%, 100% 0%, 100% 100%, 65% 100%)', explodedX: 80, explodedY: -20 }
    ]
  },
  'M16': {
    title: 'M16 TACTICAL SCHEMATIC',
    image: '/weapons/m16.png',
    specs: [
      { label: 'Caliber', val: '5.56x45mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '3,150 ft/s', char: 'V' },
      { label: 'Action', val: 'Direct Impingement', char: 'A' },
      { label: 'Effective Range', val: '550m (Point)', char: 'R' }
    ],
    lengthLine: '39.5 INCHES',
    slices: [
      { id: 'barrel', name: 'Barrel & Handguard', clip: 'polygon(0% 0%, 45% 0%, 45% 100%, 0% 100%)', explodedX: -100, explodedY: -20 },
      { id: 'receiver', name: 'Upper & Lower Receiver', clip: 'polygon(45% 0%, 75% 0%, 75% 100%, 45% 100%)', explodedX: 0, explodedY: 50 },
      { id: 'stock', name: 'Fixed Stock', clip: 'polygon(75% 0%, 100% 0%, 100% 100%, 75% 100%)', explodedX: 90, explodedY: -10 }
    ]
  },
  'R4': {
    title: 'R4 TACTICAL SCHEMATIC',
    image: '/weapons/r4.png',
    specs: [
      { label: 'Caliber', val: '5.56x45mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '2,900 ft/s', char: 'V' },
      { label: 'Action', val: 'Direct Impingement', char: 'A' },
      { label: 'Effective Range', val: '500m (Point)', char: 'R' }
    ],
    lengthLine: '33.0 INCHES (Collapsed)',
    slices: [
      { id: 'barrel', name: 'Carbine Barrel & Rail', clip: 'polygon(0% 0%, 45% 0%, 45% 100%, 0% 100%)', explodedX: -90, explodedY: -30 },
      { id: 'receiver', name: 'Receiver Group', clip: 'polygon(45% 0%, 70% 0%, 70% 100%, 45% 100%)', explodedX: 0, explodedY: 45 },
      { id: 'stock', name: 'Telescopic Stock', clip: 'polygon(70% 0%, 100% 0%, 100% 100%, 70% 100%)', explodedX: 80, explodedY: -15 }
    ]
  },
  '9MM': {
    title: '9MM PISTOL SCHEMATIC',
    image: '/weapons/9mm.png',
    specs: [
      { label: 'Caliber', val: '9x19mm Parabellum', char: 'C' },
      { label: 'Muzzle Velocity', val: '1,250 ft/s', char: 'V' },
      { label: 'Action', val: 'Short Recoil', char: 'A' },
      { label: 'Effective Range', val: '50m', char: 'R' }
    ],
    lengthLine: '8.5 INCHES',
    slices: [
      { id: 'barrel', name: 'Slide & Barrel', clip: 'polygon(0% 0%, 60% 0%, 60% 40%, 0% 40%)', explodedX: -60, explodedY: -40 },
      { id: 'frame', name: 'Lower Frame', clip: 'polygon(0% 40%, 50% 40%, 50% 100%, 0% 100%)', explodedX: -30, explodedY: 40 },
      { id: 'grip', name: 'Grip & Magazine', clip: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)', explodedX: 60, explodedY: 20 }
    ]
  }
};

export default function InteractiveSchematic({ rifle }) {
  const [isExploded, setIsExploded] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const type = rifle.rifleType || 'M14';
  const config = weaponConfigs[type] || weaponConfigs['M14'];

  if (!mounted) return null;

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(56, 189, 248, 0.15)',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      padding: '2.5rem',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '650px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Background Grid Pattern */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.8
      }} />

      {/* Blueprint Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '24px', background: '#38bdf8', borderRadius: '4px', boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}></div>
            <h3 style={{ color: '#f8fafc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '1.75rem', fontWeight: 800 }}>
              {config.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>OWNER</span>
              <div style={{ color: '#38bdf8', fontSize: '1.1rem', fontWeight: 'bold' }}>{rifle.name}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>SERIAL NO.</span>
              <div style={{ color: '#f8fafc', fontSize: '1.1rem', fontFamily: 'monospace' }}>{rifle.serialNumber}</div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsExploded(!isExploded)}
          style={{
            background: isExploded ? 'rgba(56, 189, 248, 0.1)' : 'linear-gradient(to bottom, #0ea5e9, #0284c7)',
            border: isExploded ? '1px solid #38bdf8' : 'none',
            color: isExploded ? '#38bdf8' : '#fff',
            padding: '0.75rem 2rem',
            cursor: 'pointer',
            borderRadius: '8px',
            textTransform: 'uppercase',
            fontWeight: '800',
            letterSpacing: '1.5px',
            transition: 'all 0.3s ease',
            boxShadow: isExploded ? 'none' : '0 10px 20px -10px rgba(2, 132, 199, 0.5)',
            transform: 'translateY(0)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {isExploded ? 'REASSEMBLE' : 'INITIATE 3D BLOWOUT'}
        </button>
      </div>

      {/* Schematic Container */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '3rem', marginBottom: '3rem' }}>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', aspectRatio: '16/9' }}>
          
          {/* Base invisible image to establish bounding box */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}>
            <img src={config.image} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Render Slices */}
          {config.slices.map((slice) => {
            const isHovered = hoveredPart === slice.id;
            const x = isExploded ? slice.explodedX : 0;
            const y = isExploded ? slice.explodedY : 0;
            const scale = isHovered && isExploded ? 1.05 : 1;
            
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredPart(slice.id)}
                onMouseLeave={() => setHoveredPart(null)}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  clipPath: slice.clip,
                  cursor: isExploded ? 'crosshair' : 'default',
                  transform: `translate(${x}px, ${y}px) scale(${scale})`,
                  transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                  zIndex: isHovered ? 20 : 10,
                }}
              >
                <img 
                  src={config.image} 
                  alt={slice.name}
                  style={{
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    mixBlendMode: 'screen', // Removes black background
                    filter: isHovered && isExploded 
                      ? 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.8)) brightness(1.2)' 
                      : 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                  }} 
                />

                {/* Tooltip for the slice (only visible when exploded and hovered) */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${isHovered && isExploded ? 1 : 0.8})`,
                  opacity: isHovered && isExploded ? 1 : 0,
                  background: 'rgba(2, 6, 23, 0.9)',
                  border: '1px solid #38bdf8',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  zIndex: 30,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(56, 189, 248, 0.3)',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {slice.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative blueprint lines joining parts when NOT exploded */}
        <div style={{ 
          position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none',
          opacity: isExploded ? 0 : 1,
          transition: 'opacity 0.5s ease',
          zIndex: 5
        }}>
          {/* Horizontal measurement line */}
          <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: '60%', height: '1px', borderBottom: '1px dashed rgba(56, 189, 248, 0.4)' }}></div>
          <div style={{ position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)', color: '#38bdf8', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
            TOTAL LENGTH: {config.lengthLine}
          </div>
        </div>
      </div>

      {/* Blueprint Footer / Tech Specs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.5rem', 
        marginTop: 'auto', 
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(56, 189, 248, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        {config.specs.map((spec, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: 48, height: 48, 
              borderRadius: '12px', 
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              color: '#38bdf8', fontSize: '1.25rem', fontWeight: 'bold',
              boxShadow: 'inset 0 0 10px rgba(56, 189, 248, 0.1)'
            }}>
              {spec.char}
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>{spec.label}</div>
              <div style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>{spec.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
