'use client';
import { useState } from 'react';

const weaponConfigs = {
  'M14': {
    title: 'M14 TACTICAL SCHEMATIC',
    specs: [
      { label: 'Caliber', val: '7.62x51mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '2,800 ft/s', char: 'V' },
      { label: 'Action', val: 'Gas-operated', char: 'A' },
      { label: 'Effective Range', val: '460m (Point)', char: 'R' }
    ],
    lengthLine: '44.3 INCHES',
    parts: [
      { id: 'barrel', name: 'Barrel & Suppressor', desc: '22-inch barrel with long slotted flash suppressor.', defaultPos: { x: -140, y: -10 }, explodedPos: { x: -220, y: -40 }, width: 160, height: 8, borderRadius: '2px', color: '#1a1a1a' },
      { id: 'handguard', name: 'Upper Handguard', desc: 'Protects the operators hand from the heat of the barrel.', defaultPos: { x: -50, y: -16 }, explodedPos: { x: -50, y: -60 }, width: 120, height: 12, borderRadius: '10px 10px 0 0', color: '#2a2a2a' },
      { id: 'receiver', name: 'Receiver & Bolt', desc: 'Houses the rotating bolt and operating rod assembly.', defaultPos: { x: 30, y: -14 }, explodedPos: { x: 30, y: -50 }, width: 80, height: 20, borderRadius: '4px', color: '#111' },
      { id: 'magazine', name: '20-Round Magazine', desc: 'Detachable box magazine holding 7.62x51mm NATO.', defaultPos: { x: 20, y: 20 }, explodedPos: { x: 20, y: 80 }, width: 45, height: 40, borderRadius: '2px 2px 8px 8px', color: '#1a1a1a' },
      { id: 'stock', name: 'Wooden Stock', desc: 'The main chassis of the rifle.', defaultPos: { x: 40, y: 0 }, explodedPos: { x: 140, y: 40 }, width: 200, height: 35, clipPath: 'polygon(0% 0%, 50% 0%, 100% 20%, 100% 100%, 80% 100%, 60% 40%, 0% 40%)', color: '#3d2b1f' }
    ]
  },
  'M16': {
    title: 'M16 TACTICAL SCHEMATIC',
    specs: [
      { label: 'Caliber', val: '5.56x45mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '3,150 ft/s', char: 'V' },
      { label: 'Action', val: 'Direct Impingement', char: 'A' },
      { label: 'Effective Range', val: '550m (Point)', char: 'R' }
    ],
    lengthLine: '39.5 INCHES',
    parts: [
      { id: 'barrel', name: 'Barrel Assembly', desc: '20-inch barrel with birdcage flash hider.', defaultPos: { x: -160, y: -5 }, explodedPos: { x: -240, y: -20 }, width: 140, height: 10, borderRadius: '2px', color: '#1a1a1a' },
      { id: 'handguard', name: 'Ribbed Handguard', desc: 'Polymer handguard protecting the gas tube.', defaultPos: { x: -70, y: -5 }, explodedPos: { x: -70, y: -50 }, width: 100, height: 24, borderRadius: '12px 12px 12px 12px', color: '#222' },
      { id: 'upper', name: 'Upper Receiver', desc: 'Houses the bolt carrier group and carry handle.', defaultPos: { x: 20, y: -15 }, explodedPos: { x: 20, y: -60 }, width: 80, height: 35, clipPath: 'polygon(0% 40%, 20% 0%, 80% 0%, 100% 40%, 100% 100%, 0% 100%)', color: '#111' },
      { id: 'lower', name: 'Lower Receiver', desc: 'Contains the trigger assembly and mag well.', defaultPos: { x: 15, y: 15 }, explodedPos: { x: 15, y: 70 }, width: 70, height: 35, clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 80% 100%, 40% 100%, 20% 40%, 0% 40%)', color: '#151515' },
      { id: 'magazine', name: '30-Round Magazine', desc: 'Standard curved STANAG magazine.', defaultPos: { x: 5, y: 40 }, explodedPos: { x: -30, y: 100 }, width: 35, height: 60, borderRadius: '4px', clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)', color: '#1a1a1a' },
      { id: 'stock', name: 'Fixed Stock', desc: 'A2 profile fixed polymer stock.', defaultPos: { x: 105, y: 5 }, explodedPos: { x: 180, y: 30 }, width: 100, height: 40, clipPath: 'polygon(0% 10%, 100% 0%, 100% 100%, 0% 80%)', color: '#1a1a1a' },
      { id: 'grip', name: 'Pistol Grip', desc: 'A2 profile pistol grip.', defaultPos: { x: 35, y: 40 }, explodedPos: { x: 60, y: 100 }, width: 25, height: 45, clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)', color: '#222' }
    ]
  },
  'R4': {
    title: 'R4 TACTICAL SCHEMATIC',
    specs: [
      { label: 'Caliber', val: '5.56x45mm NATO', char: 'C' },
      { label: 'Muzzle Velocity', val: '2,900 ft/s', char: 'V' },
      { label: 'Action', val: 'Direct Impingement', char: 'A' },
      { label: 'Effective Range', val: '500m (Point)', char: 'R' }
    ],
    lengthLine: '33.0 INCHES (Collapsed)',
    parts: [
      { id: 'barrel', name: '14.5" Barrel', desc: 'Carbine length barrel.', defaultPos: { x: -130, y: -5 }, explodedPos: { x: -200, y: -20 }, width: 100, height: 10, borderRadius: '2px', color: '#1a1a1a' },
      { id: 'handguard', name: 'Quad Rail System', desc: 'Allows mounting of tactical accessories.', defaultPos: { x: -60, y: -5 }, explodedPos: { x: -60, y: -50 }, width: 80, height: 24, borderRadius: '2px', color: '#222' },
      { id: 'upper', name: 'Flat-top Upper', desc: 'Picatinny rail upper receiver.', defaultPos: { x: 20, y: -5 }, explodedPos: { x: 20, y: -40 }, width: 80, height: 25, borderRadius: '4px', color: '#111' },
      { id: 'lower', name: 'Lower Receiver', desc: 'Contains the trigger assembly.', defaultPos: { x: 15, y: 15 }, explodedPos: { x: 15, y: 60 }, width: 70, height: 35, clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 80% 100%, 40% 100%, 20% 40%, 0% 40%)', color: '#151515' },
      { id: 'magazine', name: 'PMAG Magazine', desc: 'Polymer 30-round magazine.', defaultPos: { x: 5, y: 40 }, explodedPos: { x: -30, y: 90 }, width: 35, height: 60, borderRadius: '4px', clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)', color: '#252525' },
      { id: 'stock', name: 'Telescopic Stock', desc: 'Adjustable 6-position carbine stock.', defaultPos: { x: 95, y: 5 }, explodedPos: { x: 160, y: 20 }, width: 80, height: 35, clipPath: 'polygon(0% 30%, 40% 30%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 40% 70%, 0% 70%)', color: '#1a1a1a' },
      { id: 'grip', name: 'Pistol Grip', desc: 'Ergonomic grip.', defaultPos: { x: 35, y: 40 }, explodedPos: { x: 60, y: 90 }, width: 25, height: 45, clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)', color: '#222' },
      { id: 'optic', name: 'Red Dot Sight', desc: 'Close quarters optic.', defaultPos: { x: 10, y: -25 }, explodedPos: { x: 10, y: -80 }, width: 30, height: 20, borderRadius: '4px', color: '#1a1a1a' }
    ]
  },
  '9MM': {
    title: '9MM PISTOL SCHEMATIC',
    specs: [
      { label: 'Caliber', val: '9x19mm Parabellum', char: 'C' },
      { label: 'Muzzle Velocity', val: '1,250 ft/s', char: 'V' },
      { label: 'Action', val: 'Short Recoil', char: 'A' },
      { label: 'Effective Range', val: '50m', char: 'R' }
    ],
    lengthLine: '8.5 INCHES',
    parts: [
      { id: 'slide', name: 'Slide & Barrel', desc: 'Houses the firing pin and recoil spring.', defaultPos: { x: -20, y: -20 }, explodedPos: { x: -20, y: -60 }, width: 120, height: 25, borderRadius: '4px 8px 0 0', color: '#1a1a1a' },
      { id: 'frame', name: 'Lower Frame', desc: 'Polymer or steel chassis.', defaultPos: { x: -20, y: 5 }, explodedPos: { x: -50, y: 20 }, width: 120, height: 15, borderRadius: '0 0 4px 4px', color: '#222' },
      { id: 'grip', name: 'Pistol Grip', desc: 'Houses the magazine.', defaultPos: { x: 25, y: 35 }, explodedPos: { x: 50, y: 40 }, width: 40, height: 70, clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 100%)', color: '#151515' },
      { id: 'magazine', name: '15-Round Magazine', desc: 'Double-stack 9mm magazine.', defaultPos: { x: 20, y: 50 }, explodedPos: { x: 50, y: 120 }, width: 30, height: 60, clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 100%)', color: '#2a2a2a' },
      { id: 'trigger', name: 'Trigger Assembly', desc: 'Double/Single action trigger.', defaultPos: { x: -5, y: 20 }, explodedPos: { x: -20, y: 60 }, width: 25, height: 20, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 80% 100%, 80% 20%, 0% 20%)', color: '#111' }
    ]
  }
};

export default function InteractiveSchematic({ rifle }) {
  const [isExploded, setIsExploded] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(null);

  const type = rifle.rifleType || 'M14';
  const config = weaponConfigs[type] || weaponConfigs['M14'];

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#050a0f',
      backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
      backgroundSize: '30px 30px',
      borderRadius: '12px',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      overflow: 'hidden',
      boxShadow: '0 0 30px rgba(0, 255, 255, 0.05) inset',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '600px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Blueprint Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 255, 255, 0.2)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ color: '#0ff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
            {config.title}
          </h3>
          <p style={{ color: 'rgba(0, 255, 255, 0.7)', fontSize: '0.85rem', margin: '0.5rem 0 0 0', fontFamily: 'monospace' }}>
            OWNER: {rifle.name} // SN: {rifle.serialNumber} // CLASS: {rifle.class}
          </p>
        </div>
        <button 
          onClick={() => setIsExploded(!isExploded)}
          style={{
            background: isExploded ? 'rgba(0, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #0ff',
            color: '#0ff',
            padding: '0.5rem 1.5rem',
            cursor: 'pointer',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            transition: 'all 0.3s',
            boxShadow: isExploded ? '0 0 15px rgba(0, 255, 255, 0.2)' : 'none'
          }}
        >
          {isExploded ? 'Reassemble' : '3D Blowout'}
        </button>
      </div>

      {/* Schematic Container */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem' }}>
        
        {/* Render Parts */}
        {config.parts.map((part) => {
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
                backgroundColor: part.color,
                borderRadius: part.borderRadius || '0',
                clipPath: part.clipPath || 'none',
                border: isHovered ? '2px solid #0ff' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                boxShadow: isHovered ? '0 0 20px rgba(0, 255, 255, 0.6)' : 'inset 0 0 10px rgba(0,0,0,0.8), 5px 5px 15px rgba(0,0,0,0.5)',
                zIndex: isHovered ? 10 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: `translate(${x}px, ${y}px) scale(${isHovered ? 1.05 : 1})`,
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border 0.3s ease'
              }}
            >
              {/* Tooltip */}
              <div style={{
                position: 'absolute',
                top: part.height + 20,
                width: '220px',
                background: 'rgba(5, 15, 25, 0.95)',
                border: '1px solid #0ff',
                padding: '1rem',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 8px 20px rgba(0,0,0,0.6), 0 0 15px rgba(0, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                opacity: (isHovered || isExploded) ? 1 : 0,
                transform: `translateY(${(isHovered || isExploded) ? 0 : 10}px)`,
                transition: 'opacity 0.3s ease, transform 0.3s ease'
              }}>
                <div style={{ color: '#0ff', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0, 255, 255, 0.3)', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {part.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5 }}>
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
          <div style={{ position: 'absolute', top: '75%', left: '25%', width: '50%', height: '1px', borderBottom: '1px dashed #0ff', opacity: 0.4 }}></div>
          <div style={{ position: 'absolute', top: '77%', left: '50%', transform: 'translateX(-50%)', color: '#0ff', fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '1px' }}>LENGTH: {config.lengthLine}</div>
        </div>
      </div>

      {/* Blueprint Footer / Tech Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: 'auto', borderTop: '1px solid rgba(0, 255, 255, 0.2)', paddingTop: '2rem' }}>
        {config.specs.map((spec, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #0ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ff', fontWeight: 'bold' }}>{spec.char}</div>
            <div>
              <div style={{ color: 'rgba(0, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{spec.label}</div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace' }}>{spec.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
