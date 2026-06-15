'use client';
import { useState } from 'react';

// labelPos = Where the text and interactive dot float in space
// targetPos = The exact spot on the physical gun image
const weaponConfigs = {
  'M14': {
    title: 'M14 GARAND (MIL-SPEC)',
    image: '/weapons/m14.png',
    caliber: '7.62x51mm NATO',
    rateOfFire: '700 RPM',
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', targetPos: { x: 25, y: 50 }, labelPos: { x: 20, y: 20 }, desc: 'National Match profile slotted flash suppressor.' },
      { id: 'barrel', name: '22" Match Barrel', targetPos: { x: 35, y: 50 }, labelPos: { x: 35, y: 15 }, desc: '22-inch heavy barrel. 1:12 RH twist rate.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', targetPos: { x: 33, y: 53 }, labelPos: { x: 30, y: 80 }, desc: 'Short-stroke gas piston system.' },
      { id: 'front_sight', name: 'Front Sight', targetPos: { x: 27, y: 46 }, labelPos: { x: 10, y: 25 }, desc: 'Winged front sight post.' },
      { id: 'receiver', name: 'Forged Receiver', targetPos: { x: 53, y: 48 }, labelPos: { x: 50, y: 15 }, desc: 'The core of the M14. Forged from 8620 alloy steel.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', targetPos: { x: 55, y: 45 }, labelPos: { x: 65, y: 10 }, desc: 'Fully adjustable rear aperture sight.' },
      { id: 'trigger', name: 'Trigger Group', targetPos: { x: 53, y: 55 }, labelPos: { x: 55, y: 85 }, desc: 'Two-stage military trigger.' },
      { id: 'magazine', name: '20-Round Box', targetPos: { x: 51, y: 62 }, labelPos: { x: 45, y: 90 }, desc: 'Detachable 20-round double-stack magazine.' },
      { id: 'stock_front', name: 'Walnut Forestock', targetPos: { x: 43, y: 52 }, labelPos: { x: 35, y: 90 }, desc: 'The front section of the chassis.' },
      { id: 'stock_rear', name: 'Fixed Buttstock', targetPos: { x: 68, y: 53 }, labelPos: { x: 75, y: 85 }, desc: 'A traditional sloping wooden chassis.' },
      { id: 'buttplate', name: 'Hinged Buttplate', targetPos: { x: 81, y: 55 }, labelPos: { x: 85, y: 20 }, desc: 'Checkered steel buttplate.' }
    ]
  },
  'M16': {
    title: 'M16A4 (MIL-SPEC)',
    image: '/weapons/m16.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-950 RPM',
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', targetPos: { x: 15, y: 50 }, labelPos: { x: 10, y: 20 }, desc: 'Standard A2 birdcage flash hider. Features closed bottom slots to prevent dust kick-up when firing prone.' },
      { id: 'barrel', name: '20" Chrome-Lined Barrel', targetPos: { x: 25, y: 50 }, labelPos: { x: 25, y: 15 }, desc: '20-inch 4150 CMV steel barrel, chrome-lined bore and chamber. 1:7 RH twist rate optimized for 62gr M855 penetrator rounds.' },
      { id: 'front_sight', name: 'A2 Front Sight Base', targetPos: { x: 23, y: 46 }, labelPos: { x: 15, y: 25 }, desc: 'Forged A2 profile front sight base with bayonet lug. Pinned to the barrel, doubling as the gas block for the rifle-length gas system.' },
      { id: 'handguard', name: 'Polymer Handguard', targetPos: { x: 35, y: 50 }, labelPos: { x: 35, y: 85 }, desc: 'Standard ribbed polymer handguard with internal aluminum heat shields. Protects the stainless steel gas tube and operator hands.' },
      { id: 'upper', name: 'Upper Receiver', targetPos: { x: 45, y: 48 }, labelPos: { x: 40, y: 15 }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver with Mil-Spec hardcoat anodizing. Houses the M16-profile bolt carrier group.' },
      { id: 'carry_handle', name: 'Detachable Carry Handle', targetPos: { x: 45, y: 43 }, labelPos: { x: 50, y: 10 }, desc: 'Detachable A2 carry handle mounted to the Picatinny rail. Features integrated rear sights adjustable for windage and elevation.' },
      { id: 'ejection_port', name: 'Ejection Port Cover', targetPos: { x: 48, y: 50 }, labelPos: { x: 60, y: 20 }, desc: 'Spring-loaded stamped steel dust cover. Automatically flips open when the bolt carrier cycles backward.' },
      { id: 'forward_assist', name: 'Forward Assist', targetPos: { x: 51, y: 49 }, labelPos: { x: 70, y: 25 }, desc: 'Plunger mechanism used to manually force the bolt carrier forward into battery if fouled by carbon or debris.' },
      { id: 'charging_handle', name: 'Charging Handle', targetPos: { x: 52, y: 46 }, labelPos: { x: 60, y: 15 }, desc: 'T-shaped forged aluminum handle used to manually cycle the action, chamber a round, or clear malfunctions.' },
      { id: 'lower', name: 'Lower Receiver', targetPos: { x: 45, y: 53 }, labelPos: { x: 40, y: 80 }, desc: 'Forged 7075-T6 aluminum lower receiver. Houses the fire control group, magazine catch, and bolt release mechanism.' },
      { id: 'trigger', name: 'Fire Control Group', targetPos: { x: 47, y: 55 }, labelPos: { x: 50, y: 85 }, desc: 'Standard mil-spec trigger group featuring a heavy 6-8 lb pull. Provides Safe, Semi, and 3-Round Burst selector options.' },
      { id: 'grip', name: 'A2 Pistol Grip', targetPos: { x: 49, y: 60 }, labelPos: { x: 60, y: 85 }, desc: 'Standard A2 profile polymer pistol grip with a single finger groove and aggressive texturing.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 43, y: 65 }, labelPos: { x: 35, y: 90 }, desc: 'Standard NATO STANAG 30-round curved box magazine. Aluminum body with an anti-tilt follower and green/tan follower.' },
      { id: 'buffer', name: 'Buffer Tube', targetPos: { x: 60, y: 50 }, labelPos: { x: 70, y: 15 }, desc: 'Rifle-length receiver extension. Houses the heavy rifle buffer and spring, absorbing recoil and cycling the action.' },
      { id: 'stock', name: 'A2 Fixed Stock', targetPos: { x: 70, y: 52 }, labelPos: { x: 80, y: 20 }, desc: 'A2 profile fixed polymer stock. Provides a stable cheek weld, high durability, and features a trapdoor for the cleaning kit.' }
    ]
  },
  'R4': {
    title: 'R4 TACTICAL CARBINE',
    image: '/weapons/r4.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-900 RPM',
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', targetPos: { x: 26, y: 54 }, labelPos: { x: 15, y: 20 }, desc: 'Standard A2 flash hider.' },
      { id: 'barrel', name: '14.5" Carbine Barrel', targetPos: { x: 36, y: 54 }, labelPos: { x: 30, y: 15 }, desc: 'Short 14.5-inch 4150 CMV barrel. Carbine-length gas system designed for CQB engagements.' },
      { id: 'handguard', name: 'Quad Rail System', targetPos: { x: 55, y: 54 }, labelPos: { x: 50, y: 85 }, desc: 'Free-floated aluminum quad-rail handguard system for mounting tactical lights, lasers, and vertical grips.' },
      { id: 'optic', name: 'Red Dot Optic', targetPos: { x: 80, y: 40 }, labelPos: { x: 65, y: 15 }, desc: 'Close-quarters reflex red dot sight mounted on the upper receiver rail for rapid target acquisition.' },
      { id: 'upper', name: 'Upper Receiver', targetPos: { x: 80, y: 52 }, labelPos: { x: 75, y: 15 }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver.' },
      { id: 'charging_handle', name: 'Charging Handle', targetPos: { x: 85, y: 48 }, labelPos: { x: 90, y: 20 }, desc: 'Used to manually chamber a round or clear malfunctions.' },
      { id: 'lower', name: 'Lower Receiver', targetPos: { x: 80, y: 60 }, labelPos: { x: 65, y: 80 }, desc: 'Forged 7075-T6 aluminum lower receiver containing the fire control group.' },
      { id: 'trigger', name: 'Trigger Assembly', targetPos: { x: 82, y: 64 }, labelPos: { x: 75, y: 85 }, desc: 'Mil-spec single-stage trigger group.' },
      { id: 'grip', name: 'Ergonomic Grip', targetPos: { x: 88, y: 72 }, labelPos: { x: 90, y: 85 }, desc: 'Upgraded ergonomic pistol grip with stippling.' },
      { id: 'magazine', name: 'PMAG 30', targetPos: { x: 75, y: 75 }, labelPos: { x: 55, y: 90 }, desc: 'Polymer 30-round magazine with a constant-curve internal geometry.' },
      { id: 'stock', name: 'Telescopic Stock', targetPos: { x: 95, y: 60 }, labelPos: { x: 95, y: 30 }, desc: 'Adjustable 6-position telescopic carbine stock for varying body armor thicknesses.' }
    ]
  },
  '9MM': {
    title: '9MM TACTICAL SIDEARM',
    image: '/weapons/9mm.png',
    caliber: '9x19mm Parabellum',
    rateOfFire: 'SEMI-AUTO',
    parts: [
      { id: 'slide', name: 'Steel Slide', targetPos: { x: 45, y: 40 }, labelPos: { x: 30, y: 20 }, desc: 'Machined steel slide with front and rear cocking serrations. Houses the recoil spring assembly, extractor, and firing pin.' },
      { id: 'sights', name: 'Tritium Night Sights', targetPos: { x: 40, y: 37 }, labelPos: { x: 45, y: 15 }, desc: 'Steel 3-dot sights equipped with tritium inserts for low-light aiming.' },
      { id: 'barrel', name: '4.5" Cold Hammer Forged Barrel', targetPos: { x: 50, y: 41 }, labelPos: { x: 60, y: 15 }, desc: 'Internal 4.5-inch 9mm barrel. Cold hammer forged for extreme longevity and precision.' },
      { id: 'ejection_port', name: 'Ejection Port & Extractor', targetPos: { x: 55, y: 40 }, labelPos: { x: 70, y: 25 }, desc: 'Large ejection port. Features a heavy-duty claw extractor that doubles as a tactile loaded chamber indicator.' },
      { id: 'frame', name: 'Polymer Frame', targetPos: { x: 50, y: 47 }, labelPos: { x: 30, y: 80 }, desc: 'Lightweight, high-strength polymer frame. Includes a standard Picatinny accessory rail for weapon lights.' },
      { id: 'trigger', name: 'Striker-Fired Trigger', targetPos: { x: 53, y: 50 }, labelPos: { x: 40, y: 85 }, desc: 'Striker-fired action with a consistent 5.5 lb trigger pull. Features an integrated blade safety.' },
      { id: 'slide_catch', name: 'Slide Stop Lever', targetPos: { x: 55, y: 45 }, labelPos: { x: 65, y: 80 }, desc: 'Ambidextrous lever that automatically locks the slide back when the magazine is empty.' },
      { id: 'mag_release', name: 'Magazine Release', targetPos: { x: 57, y: 48 }, labelPos: { x: 75, y: 80 }, desc: 'Reversible push-button magazine release.' },
      { id: 'grip', name: 'Textured Grip', targetPos: { x: 60, y: 55 }, labelPos: { x: 80, y: 85 }, desc: 'Ergonomic grip housing with aggressive stippling and interchangeable backstraps.' },
      { id: 'magazine', name: '17-Round Magazine', targetPos: { x: 62, y: 65 }, labelPos: { x: 65, y: 95 }, desc: 'Double-stack 17-round steel magazine with polymer baseplate and witness holes.' }
    ]
  }
};

export default function InteractiveSchematic({ rifle }) {
  const [selectedPart, setSelectedPart] = useState(null);

  const type = rifle.rifleType || 'M16';
  const config = weaponConfigs[type] || weaponConfigs['M16'];

  // Colors based on the requested dark blueprint aesthetic
  const colors = {
    bg: '#050a14',
    grid: '#121f3a',
    accent: '#a7b4c9', // muted light blue/silver for text
    highlight: '#4da6ff', // bright cyan/blue for active elements
    gold: '#c2a176', // gold/beige for borders and secondary accents
  };

  return (
    <div style={{
      position: 'relative',
      backgroundColor: colors.bg,
      backgroundImage: `
        linear-gradient(${colors.grid} 1px, transparent 1px), 
        linear-gradient(90deg, ${colors.grid} 1px, transparent 1px),
        linear-gradient(rgba(18, 31, 58, 0.4) 1px, transparent 1px), 
        linear-gradient(90deg, rgba(18, 31, 58, 0.4) 1px, transparent 1px)
      `,
      backgroundSize: '120px 120px, 120px 120px, 20px 20px, 20px 20px',
      border: `2px solid ${colors.gold}`,
      padding: '2rem',
      fontFamily: 'monospace',
      color: colors.accent,
      minHeight: '800px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: `inset 0 0 100px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0,0,0,0.5)`
    }}>
      
      {/* Decorative Outer Border Lines */}
      <div style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, border: `1px solid rgba(194, 161, 118, 0.3)`, pointerEvents: 'none' }} />
      
      {/* Decorative Corner Elements */}
      <div style={{ position: 'absolute', top: 15, left: 15, width: 40, height: 40, borderTop: `2px solid ${colors.gold}`, borderLeft: `2px solid ${colors.gold}` }} />
      <div style={{ position: 'absolute', top: 15, right: 15, width: 40, height: 40, borderTop: `2px solid ${colors.gold}`, borderRight: `2px solid ${colors.gold}` }} />
      <div style={{ position: 'absolute', bottom: 15, left: 15, width: 40, height: 40, borderBottom: `2px solid ${colors.gold}`, borderLeft: `2px solid ${colors.gold}` }} />
      <div style={{ position: 'absolute', bottom: 15, right: 15, width: 40, height: 40, borderBottom: `2px solid ${colors.gold}`, borderRight: `2px solid ${colors.gold}` }} />

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 10, borderBottom: `1px solid ${colors.grid}`, paddingBottom: '10px' }}>
        {/* Top Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '1.5rem', color: colors.gold, border: `1px solid ${colors.gold}`, padding: '4px 12px', letterSpacing: '4px' }}>
            [{rifle.serialNumber.substring(0, 4)}]
          </div>
          <h1 style={{ fontSize: '2rem', margin: '0', fontWeight: 'normal', letterSpacing: '8px', color: '#fff', textTransform: 'uppercase' }}>
            {config.title} // MK I
          </h1>
        </div>

        {/* Top Right: Dense Data Block */}
        <div style={{ fontSize: '0.6rem', textAlign: 'right', opacity: 0.7, lineHeight: '1.4', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ color: colors.gold, marginBottom: '5px' }}>SYSTEM REGISTRY // 0x8F9B</div>
          <div>CALIBER: {config.caliber}</div>
          <div>CYCLIC RATE: {config.rateOfFire}</div>
          <div>OPERATOR: {rifle.name}</div>
          <div>CLASS: {rifle.class}</div>
          <div style={{ marginTop: '5px', width: '150px', height: '1px', backgroundColor: colors.accent }} />
          <div style={{ marginTop: '5px' }}>10110010 11001010 00110101</div>
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
        
        {/* SVG Decorative Wireframes (Background) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {/* Top Left Schematic Element */}
          <circle cx="15%" cy="20%" r="60" stroke={colors.grid} strokeWidth="2" fill="none" />
          <circle cx="15%" cy="20%" r="40" stroke={colors.accent} strokeWidth="1" fill="none" strokeDasharray="5,5" />
          <line x1="15%" y1="10%" x2="15%" y2="30%" stroke={colors.accent} strokeWidth="1" />
          <line x1="5%" y1="20%" x2="25%" y2="20%" stroke={colors.accent} strokeWidth="1" />
          
          {/* Top Right Schematic Element */}
          <circle cx="85%" cy="15%" r="80" stroke={colors.grid} strokeWidth="1" fill="none" />
          <circle cx="85%" cy="15%" r="60" stroke={colors.gold} strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="85%" cy="15%" r="30" stroke={colors.accent} strokeWidth="2" fill="none" />
          <path d="M 85% 15% L 90% 5% L 95% 5%" stroke={colors.accent} strokeWidth="1" fill="none" />

          {/* Bottom Data Grid */}
          <rect x="25%" y="80%" width="50%" height="15%" stroke={colors.grid} fill="none" strokeWidth="2" />
          <line x1="25%" y1="85%" x2="75%" y2="85%" stroke={colors.grid} strokeWidth="1" />
          <line x1="25%" y1="90%" x2="75%" y2="90%" stroke={colors.grid} strokeWidth="1" />
          <line x1="41%" y1="80%" x2="41%" y2="95%" stroke={colors.grid} strokeWidth="1" />
          <line x1="58%" y1="80%" x2="58%" y2="95%" stroke={colors.grid} strokeWidth="1" />

          {/* Random Tech Lines */}
          <polyline points="5%,50% 10%,50% 12%,55% 18%,55%" stroke={colors.gold} strokeWidth="1" fill="none" opacity="0.6" />
          <polyline points="95%,60% 90%,60% 88%,65% 80%,65%" stroke={colors.gold} strokeWidth="1" fill="none" opacity="0.6" />
        </svg>

        {/* Main Weapon Container */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '1200px',
          aspectRatio: '16/9', 
          zIndex: 10,
          mixBlendMode: 'screen', // Helps it blend into the dark background
        }}>
          {/* Deep Blue Schematic CSS Filter applied to the weapon image */}
          <img 
            src={config.image} 
            alt="Rifle"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              transform: 'scale(1.1)',
              // The magic filter to create the dark blue schematic look
              filter: 'sepia(100%) hue-rotate(185deg) saturate(300%) contrast(150%) brightness(85%) drop-shadow(0 0 15px rgba(77, 166, 255, 0.4))'
            }} 
          />

          {/* Permanent SVG Tracelines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
            {config.parts.map(part => (
              <line 
                key={`line-${part.id}`}
                x1={`${part.labelPos.x}%`} 
                y1={`${part.labelPos.y}%`} 
                x2={`${part.targetPos.x}%`} 
                y2={`${part.targetPos.y}%`} 
                stroke={selectedPart?.id === part.id ? '#fff' : colors.highlight} 
                strokeWidth={selectedPart?.id === part.id ? '2' : '1'} 
                strokeDasharray={selectedPart?.id === part.id ? 'none' : '3,3'}
                style={{ 
                  transition: 'all 0.2s',
                  opacity: selectedPart?.id === part.id ? 1 : 0.4,
                  filter: selectedPart?.id === part.id ? `drop-shadow(0 0 5px ${colors.highlight})` : 'none' 
                }}
              />
            ))}
          </svg>

          {/* Interactive Text Labels with Floating Nodes */}
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
               {/* The glowing target dot (floats next to label) */}
               <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '16px', height: '16px' }}>
                 <div style={{ 
                   width: selectedPart?.id === part.id ? '12px' : '6px', 
                   height: selectedPart?.id === part.id ? '12px' : '6px', 
                   backgroundColor: selectedPart?.id === part.id ? '#fff' : 'transparent',
                   border: `1px solid ${selectedPart?.id === part.id ? '#fff' : colors.highlight}`,
                   borderRadius: '50%', 
                   transition: 'all 0.2s ease',
                   boxShadow: selectedPart?.id === part.id ? `0 0 10px ${colors.highlight}` : 'none'
                 }} />
                 {/* Expanding radar ring on hover */}
                 {selectedPart?.id === part.id && (
                   <div style={{ position: 'absolute', width: '24px', height: '24px', border: `1px solid ${colors.highlight}`, borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                 )}
               </div>

               {/* The Text Label */}
               <div style={{
                 color: selectedPart?.id === part.id ? '#fff' : colors.accent,
                 fontSize: '0.65rem',
                 letterSpacing: '1px',
                 padding: '2px 6px',
                 borderBottom: selectedPart?.id === part.id ? `1px solid ${colors.highlight}` : `1px solid transparent`,
                 whiteSpace: 'nowrap',
                 textShadow: selectedPart?.id === part.id ? `0 0 8px ${colors.highlight}` : 'none',
                 transition: 'all 0.2s ease',
               }}>
                 {part.name.toUpperCase()}
               </div>
             </div>
          ))}

          {/* Physical dots on the gun itself (targetPos) */}
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
                 opacity: selectedPart?.id === part.id ? 1 : 0.3
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
          backgroundColor: 'rgba(5, 10, 20, 0.9)',
          border: `1px solid ${colors.gold}`,
          borderLeft: `4px solid ${colors.highlight}`,
          padding: '1.5rem',
          zIndex: 50,
          boxShadow: `0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(77, 166, 255, 0.1)`,
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '3px', color: colors.gold, marginBottom: '8px' }}>
            SEC: {Math.random().toString(36).substring(2, 8).toUpperCase()} // COMPONENT_ID: {selectedPart.id.toUpperCase()}
          </div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#fff', letterSpacing: '2px', textShadow: `0 0 5px ${colors.highlight}` }}>
            {selectedPart.name}
          </h3>
          <div style={{ fontSize: '0.8rem', lineHeight: '1.6', color: colors.accent, textAlign: 'justify' }}>
            {selectedPart.desc}
          </div>
          
          {/* Decorative tech lines in the box */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.grid }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: colors.highlight }} />
            <div style={{ width: '20px', height: '1px', backgroundColor: colors.highlight }} />
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
