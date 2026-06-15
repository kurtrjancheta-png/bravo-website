'use client';
import { useState } from 'react';

// M14 SVG Trace Component
const M14Trace = () => (
  <svg viewBox="0 0 1000 400" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px #0cd0cd)' }}>
    <g fill="rgba(12, 208, 205, 0.05)" stroke="#0cd0cd" strokeWidth="2">
      {/* Barrel */}
      <rect x="150" y="180" width="300" height="8" />
      {/* Flash Hider */}
      <polygon points="90,175 150,175 150,193 90,193 80,184" />
      <line x1="100" y1="175" x2="100" y2="193" />
      <line x1="110" y1="175" x2="110" y2="193" />
      <line x1="120" y1="175" x2="120" y2="193" />
      <line x1="130" y1="175" x2="130" y2="193" />
      {/* Front Sight */}
      <polygon points="130,180 130,160 145,160 150,180" />
      {/* Gas Cylinder */}
      <rect x="250" y="195" width="120" height="12" rx="4" />
      <circle cx="260" cy="201" r="3" fill="#0cd0cd" />
      {/* Stock Front */}
      <path d="M 370 190 L 550 190 L 550 220 L 370 210 Z" />
      <line x1="450" y1="195" x2="450" y2="215" strokeDasharray="2,2" />
      <line x1="500" y1="195" x2="500" y2="215" strokeDasharray="2,2" />
      {/* Receiver */}
      <path d="M 550 160 L 700 160 L 700 190 L 550 190 Z" />
      <path d="M 570 160 L 570 150 L 630 150 L 630 160 Z" />
      <rect x="640" y="165" width="40" height="10" />
      {/* Rear Sight */}
      <circle cx="690" cy="150" r="10" />
      <circle cx="690" cy="150" r="3" fill="#0cd0cd" />
      {/* Magazine */}
      <path d="M 570 220 L 610 220 L 600 320 L 560 310 Z" />
      <line x1="575" y1="230" x2="565" y2="300" />
      {/* Trigger & Guard */}
      <path d="M 640 220 L 640 260 L 680 260 L 690 220 Z" fill="none" />
      <path d="M 660 220 L 660 240 L 670 245" fill="none" strokeWidth="3" />
      {/* Stock Rear & Butt */}
      <path d="M 700 160 L 950 180 L 950 280 L 850 250 L 720 260 L 700 190 Z" />
      <circle cx="750" cy="210" r="15" fill="none" />
      <circle cx="750" cy="210" r="5" fill="#0cd0cd" />
      {/* Buttplate */}
      <rect x="950" y="180" width="10" height="100" rx="3" />
    </g>
  </svg>
);

// Generic Trace for other platforms to maintain consistency
const TacticalTrace = () => (
  <svg viewBox="0 0 1000 400" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px #0cd0cd)' }}>
    <g fill="rgba(12, 208, 205, 0.05)" stroke="#0cd0cd" strokeWidth="2">
      <rect x="150" y="180" width="200" height="10" />
      <rect x="100" y="177" width="50" height="16" />
      <polygon points="250,180 250,130 270,130 280,180" />
      <path d="M 280 170 L 500 170 L 500 200 L 280 200 Z" />
      <path d="M 500 160 L 680 160 L 680 190 L 500 190 Z" />
      <path d="M 520 160 L 520 120 L 650 120 L 650 160 L 630 160 L 630 135 L 540 135 L 540 160 Z" />
      <path d="M 500 190 L 650 190 L 650 220 L 550 220 L 550 230 L 500 230 Z" />
      <path d="M 500 230 L 540 230 L 530 350 L 480 340 Z" />
      <path d="M 600 220 L 630 220 L 610 300 L 580 290 Z" />
      <path d="M 550 220 L 550 240 L 600 240 L 600 220" fill="none" />
      <path d="M 580 220 L 580 235" strokeWidth="3" />
      <rect x="680" y="165" width="200" height="25" />
      <path d="M 750 165 L 900 165 L 900 250 L 750 200 Z" />
    </g>
  </svg>
);


const weaponConfigs = {
  'M14': {
    title: 'M14 GARAND (VECTOR TRACE)',
    TraceComponent: M14Trace,
    caliber: '7.62x51mm NATO',
    rateOfFire: '700 RPM',
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', targetPos: { x: 12, y: 46 }, labelPos: { x: 10, y: 20 }, desc: 'National Match profile slotted flash suppressor.' },
      { id: 'front_sight', name: 'Front Sight', targetPos: { x: 14, y: 42 }, labelPos: { x: 25, y: 15 }, desc: 'Winged front sight post.' },
      { id: 'barrel', name: '22" Match Barrel', targetPos: { x: 22, y: 46 }, labelPos: { x: 20, y: 75 }, desc: '22-inch heavy barrel. 1:12 RH twist rate.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', targetPos: { x: 30, y: 50 }, labelPos: { x: 35, y: 85 }, desc: 'Short-stroke gas piston system.' },
      { id: 'stock_front', name: 'Walnut Forestock', targetPos: { x: 45, y: 51 }, labelPos: { x: 50, y: 80 }, desc: 'The front section of the chassis.' },
      { id: 'receiver', name: 'Forged Receiver', targetPos: { x: 60, y: 43 }, labelPos: { x: 55, y: 15 }, desc: 'The core of the M14. Forged from 8620 alloy steel.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', targetPos: { x: 69, y: 37 }, labelPos: { x: 75, y: 15 }, desc: 'Fully adjustable rear aperture sight.' },
      { id: 'magazine', name: '20-Round Box', targetPos: { x: 58, y: 65 }, labelPos: { x: 40, y: 90 }, desc: 'Detachable 20-round double-stack magazine.' },
      { id: 'trigger', name: 'Trigger Group', targetPos: { x: 66, y: 58 }, labelPos: { x: 65, y: 85 }, desc: 'Two-stage military trigger.' },
      { id: 'stock_rear', name: 'Fixed Buttstock', targetPos: { x: 80, y: 55 }, labelPos: { x: 90, y: 85 }, desc: 'A traditional sloping wooden chassis.' },
      { id: 'buttplate', name: 'Hinged Buttplate', targetPos: { x: 95, y: 57 }, labelPos: { x: 90, y: 15 }, desc: 'Checkered steel buttplate.' }
    ]
  },
  'M16': {
    title: 'M16A4 (VECTOR TRACE)',
    TraceComponent: TacticalTrace,
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-950 RPM',
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', targetPos: { x: 12, y: 46 }, labelPos: { x: 10, y: 20 }, desc: 'Standard A2 birdcage flash hider.' },
      { id: 'front_sight', name: 'A2 Front Sight Base', targetPos: { x: 26, y: 38 }, labelPos: { x: 25, y: 15 }, desc: 'Forged A2 profile front sight base.' },
      { id: 'barrel', name: '20" Chrome-Lined Barrel', targetPos: { x: 20, y: 46 }, labelPos: { x: 20, y: 75 }, desc: '20-inch 4150 CMV steel barrel.' },
      { id: 'handguard', name: 'Polymer Handguard', targetPos: { x: 39, y: 46 }, labelPos: { x: 40, y: 85 }, desc: 'Standard ribbed polymer handguard.' },
      { id: 'upper', name: 'Upper Receiver', targetPos: { x: 58, y: 43 }, labelPos: { x: 55, y: 15 }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver.' },
      { id: 'carry_handle', name: 'Detachable Carry Handle', targetPos: { x: 58, y: 35 }, labelPos: { x: 70, y: 15 }, desc: 'Detachable A2 carry handle mounted to the Picatinny rail.' },
      { id: 'lower', name: 'Lower Receiver', targetPos: { x: 58, y: 51 }, labelPos: { x: 65, y: 80 }, desc: 'Forged 7075-T6 aluminum lower receiver.' },
      { id: 'grip', name: 'A2 Pistol Grip', targetPos: { x: 61, y: 65 }, labelPos: { x: 80, y: 85 }, desc: 'Standard A2 profile polymer pistol grip.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 51, y: 72 }, labelPos: { x: 40, y: 90 }, desc: 'Standard NATO STANAG 30-round curved box magazine.' },
      { id: 'stock', name: 'A2 Fixed Stock', targetPos: { x: 82, y: 50 }, labelPos: { x: 90, y: 20 }, desc: 'A2 profile fixed polymer stock.' }
    ]
  }
};

export default function InteractiveSchematic({ rifle }) {
  const [selectedPart, setSelectedPart] = useState(null);

  // Fallback to M16 mapping for unknown traces (like R4 or 9MM)
  const type = weaponConfigs[rifle.rifleType] ? rifle.rifleType : 'M16';
  const config = weaponConfigs[type];
  const TraceComponent = config.TraceComponent;

  const colors = {
    bg: '#020a14',
    grid: '#0cd0cd',
    accent: '#0cd0cd',
    highlight: '#ffffff',
  };

  return (
    <div style={{
      position: 'relative',
      backgroundColor: colors.bg,
      border: `2px solid ${colors.grid}`,
      padding: '2rem',
      fontFamily: 'monospace',
      color: colors.accent,
      minHeight: '800px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: `inset 0 0 50px rgba(12, 208, 205, 0.1)`
    }}>
      
      {/* Decorative Corner Elements */}
      <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: `2px solid ${colors.grid}`, borderLeft: `2px solid ${colors.grid}` }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: `2px solid ${colors.grid}`, borderRight: `2px solid ${colors.grid}` }} />
      <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: `2px solid ${colors.grid}`, borderLeft: `2px solid ${colors.grid}` }} />
      <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: `2px solid ${colors.grid}`, borderRight: `2px solid ${colors.grid}` }} />

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 10, borderBottom: `1px solid ${colors.grid}`, paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '1.2rem', color: colors.bg, backgroundColor: colors.grid, padding: '4px 12px', fontWeight: 'bold' }}>
            {rifle.serialNumber.substring(0, 6)}
          </div>
          <h1 style={{ fontSize: '2rem', margin: '0', fontWeight: 'bold', letterSpacing: '4px', textShadow: `0 0 10px ${colors.grid}` }}>
            {config.title}
          </h1>
        </div>

        <div style={{ fontSize: '0.8rem', textAlign: 'right', opacity: 0.8, lineHeight: '1.4' }}>
          <div style={{ color: colors.highlight, fontWeight: 'bold' }}>GEOMETRIC VECTOR TRACE // ONLINE</div>
          <div>CALIBER: {config.caliber}</div>
          <div>OPERATOR: {rifle.name}</div>
        </div>
      </div>

      {/* CENTRAL SCHEMATIC AREA */}
      <div style={{ 
        flex: 1, 
        marginTop: '2rem', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
      }}>
        
        {/* Main Weapon Container */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '1200px',
          aspectRatio: '2.5', // 1000/400 to match the SVG viewbox exactly
          zIndex: 10,
        }}>
          
          {/* NATIVE SVG RIFLE TRACE */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
            <TraceComponent />
          </div>

          {/* SVG Tracelines overlay */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
            {config.parts.map(part => (
              <line 
                key={`line-${part.id}`}
                x1={`${part.labelPos.x}%`} 
                y1={`${part.labelPos.y}%`} 
                x2={`${part.targetPos.x}%`} 
                y2={`${part.targetPos.y}%`} 
                stroke={selectedPart?.id === part.id ? colors.highlight : colors.grid} 
                strokeWidth={selectedPart?.id === part.id ? '2' : '1'} 
                strokeDasharray={selectedPart?.id === part.id ? 'none' : '4,4'}
                style={{ 
                  transition: 'all 0.2s',
                  opacity: selectedPart?.id === part.id ? 1 : 0.3,
                  filter: selectedPart?.id === part.id ? `drop-shadow(0 0 5px ${colors.highlight})` : 'none' 
                }}
              />
            ))}
          </svg>

          {/* Interactive Text Labels */}
          {config.parts.map(part => (
             <div 
               key={`label-${part.id}`}
               onMouseEnter={() => setSelectedPart(part)}
               onMouseLeave={() => setSelectedPart(null)}
               style={{
                 position: 'absolute',
                 left: `${part.labelPos.x}%`,
                 top: `${part.labelPos.y}%`,
                 transform: 'translate(-50%, -50%)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 cursor: 'crosshair',
                 zIndex: 35,
                 transition: 'all 0.2s ease',
                 opacity: selectedPart && selectedPart.id !== part.id ? 0.2 : 1
               }}
             >
               <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '16px', height: '16px' }}>
                 <div style={{ 
                   width: selectedPart?.id === part.id ? '12px' : '6px', 
                   height: selectedPart?.id === part.id ? '12px' : '6px', 
                   backgroundColor: selectedPart?.id === part.id ? colors.highlight : 'transparent',
                   border: `1px solid ${selectedPart?.id === part.id ? colors.highlight : colors.grid}`,
                   borderRadius: '50%', 
                   transition: 'all 0.2s ease',
                   boxShadow: selectedPart?.id === part.id ? `0 0 10px ${colors.highlight}` : 'none'
                 }} />
                 {selectedPart?.id === part.id && (
                   <div style={{ position: 'absolute', width: '24px', height: '24px', border: `1px solid ${colors.highlight}`, borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                 )}
               </div>

               <div style={{
                 color: selectedPart?.id === part.id ? colors.bg : colors.grid,
                 backgroundColor: selectedPart?.id === part.id ? colors.highlight : 'rgba(2, 10, 20, 0.9)',
                 fontSize: '0.75rem',
                 fontWeight: 'bold',
                 letterSpacing: '1px',
                 padding: '4px 8px',
                 border: `1px solid ${selectedPart?.id === part.id ? colors.highlight : 'rgba(12, 208, 205, 0.3)'}`,
                 whiteSpace: 'nowrap',
                 boxShadow: selectedPart?.id === part.id ? `0 0 10px ${colors.highlight}` : 'none',
                 transition: 'all 0.2s ease',
               }}>
                 {part.name.toUpperCase()}
               </div>
             </div>
          ))}

          {/* Target dots directly on the geometric trace */}
          {config.parts.map(part => (
             <div 
               key={`target-${part.id}`}
               style={{
                 position: 'absolute',
                 left: `${part.targetPos.x}%`,
                 top: `${part.targetPos.y}%`,
                 transform: 'translate(-50%, -50%)',
                 width: '4px',
                 height: '4px',
                 backgroundColor: colors.highlight,
                 borderRadius: '50%',
                 pointerEvents: 'none',
                 zIndex: 30,
                 boxShadow: `0 0 5px ${colors.highlight}`,
                 opacity: selectedPart?.id === part.id ? 1 : 0
               }}
             />
          ))}
        </div>
      </div>

      {/* DETAILED DESCRIPTION OVERLAY */}
      {selectedPart && (
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '5%',
          width: '350px',
          backgroundColor: 'rgba(2, 10, 20, 0.95)',
          border: `1px solid ${colors.grid}`,
          borderLeft: `4px solid ${colors.highlight}`,
          padding: '1.5rem',
          zIndex: 50,
          boxShadow: `0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(12, 208, 205, 0.1)`,
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: colors.grid, marginBottom: '8px' }}>
            ID // {selectedPart.id.toUpperCase()}
          </div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: colors.highlight, letterSpacing: '2px', textShadow: `0 0 5px ${colors.highlight}` }}>
            {selectedPart.name}
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: colors.accent, textAlign: 'justify' }}>
            {selectedPart.desc}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}} />
    </div>
  );
}
