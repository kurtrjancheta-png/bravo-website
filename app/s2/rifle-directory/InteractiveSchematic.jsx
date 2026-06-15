'use client';
import { useState } from 'react';

const rifleParts = [
  {
    id: 'barrel',
    name: 'Barrel & Muzzle',
    desc: '20-inch barrel for the M16. Responsible for projectile stabilization (rifling) and velocity. Muzzle device reduces flash.',
    defaultPos: { x: -80, y: 0 },
    explodedPos: { x: -200, y: -20 },
    width: 140,
    height: 12,
  },
  {
    id: 'handguard',
    name: 'Handguard',
    desc: 'Protects the operators hand from barrel heat and houses the gas tube.',
    defaultPos: { x: -60, y: 0 },
    explodedPos: { x: -120, y: 40 },
    width: 100,
    height: 24,
  },
  {
    id: 'upper',
    name: 'Upper Receiver & Carry Handle',
    desc: 'Houses the bolt carrier group and charging handle. The carry handle includes the rear iron sight.',
    defaultPos: { x: 20, y: -12 },
    explodedPos: { x: 20, y: -60 },
    width: 100,
    height: 30,
  },
  {
    id: 'lower',
    name: 'Lower Receiver & Magazine',
    desc: 'Houses the fire control group, trigger, and magazine well. Fits standard 30-round STANAG magazines.',
    defaultPos: { x: 20, y: 20 },
    explodedPos: { x: 20, y: 80 },
    width: 90,
    height: 50,
  },
  {
    id: 'stock',
    name: 'Buttstock',
    desc: 'Provides stability against the shoulder and houses the buffer tube and recoil spring.',
    defaultPos: { x: 110, y: 0 },
    explodedPos: { x: 180, y: 20 },
    width: 80,
    height: 35,
  }
];

export default function InteractiveSchematic({ rifle }) {
  const [isExploded, setIsExploded] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(null);

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#0a0d14',
      backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
      backgroundSize: '30px 30px',
      borderRadius: '12px',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      overflow: 'hidden',
      boxShadow: '0 0 30px rgba(0, 255, 255, 0.1) inset',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '600px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Blueprint Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 255, 255, 0.3)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ color: '#0ff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>M16 TACTICAL SCHEMATIC</h3>
          <p style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.8rem', margin: '0.5rem 0 0 0', fontFamily: 'monospace' }}>OWNER: {rifle.name} // SN: {rifle.serialNumber}</p>
        </div>
        <button 
          onClick={() => setIsExploded(!isExploded)}
          style={{
            background: isExploded ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
            border: '1px solid #0ff',
            color: '#0ff',
            padding: '0.5rem 1.5rem',
            cursor: 'pointer',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            transition: 'all 0.3s'
          }}
        >
          {isExploded ? 'Reassemble' : '3D Blowout'}
        </button>
      </div>

      {/* Schematic Container */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Render Parts */}
        {rifleParts.map((part) => {
          const isHovered = hoveredPart === part.id;
          const x = isExploded ? part.explodedPos.x : part.defaultPos.x;
          const y = isExploded ? part.explodedPos.y : part.defaultPos.y;
          
          return (
            <div
              key={part.id}
              onMouseEnter={() => setHoveredPart(part.id)}
              onMouseLeave={() => setHoveredPart(null)}
              style={{
                position: 'absolute',
                width: part.width,
                height: part.height,
                background: 'linear-gradient(135deg, #2a2a2a, #111)',
                border: isHovered ? '2px solid #0ff' : '1px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: isHovered ? '0 0 15px rgba(0, 255, 255, 0.5)' : '5px 5px 15px rgba(0,0,0,0.8)',
                zIndex: isHovered ? 10 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.1)',
                transform: `translate(${x}px, ${y}px) scale(${isHovered ? 1.05 : 1})`,
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border 0.3s ease'
              }}
            >
              {/* Tooltip */}
              <div style={{
                position: 'absolute',
                top: part.height + 15,
                width: '200px',
                background: 'rgba(0, 20, 30, 0.9)',
                border: '1px solid #0ff',
                padding: '1rem',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.8rem',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                opacity: (isHovered || isExploded) ? 1 : 0,
                transform: `translateY(${(isHovered || isExploded) ? 0 : 10}px)`,
                transition: 'opacity 0.3s ease, transform 0.3s ease'
              }}>
                <div style={{ color: '#0ff', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0, 255, 255, 0.3)', paddingBottom: '0.2rem' }}>
                  {part.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.4 }}>
                  {part.desc}
                </div>
              </div>
            </div>
          );
        })}

        {/* Decorative blueprint lines joining parts when NOT exploded */}
        <div style={{ 
          position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none',
          opacity: isExploded ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}>
          {/* Horizontal measurement line */}
          <div style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '1px', borderBottom: '1px dashed #0ff', opacity: 0.5 }}></div>
          <div style={{ position: 'absolute', top: '72%', left: '50%', transform: 'translateX(-50%)', color: '#0ff', fontSize: '0.7rem', fontFamily: 'monospace' }}>LENGTH: 39.5 INCHES</div>
        </div>
      </div>

      {/* Blueprint Footer / Tech Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem', borderTop: '1px solid rgba(0, 255, 255, 0.3)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #0ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ff' }}>C</div>
          <div>
            <div style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Caliber</div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>5.56x45mm NATO</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #0ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ff' }}>V</div>
          <div>
            <div style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Muzzle Velocity</div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>3,150 ft/s</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #0ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ff' }}>A</div>
          <div>
            <div style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Action</div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>Gas-operated</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #0ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ff' }}>R</div>
          <div>
            <div style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Effective Range</div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>550m (Point)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
