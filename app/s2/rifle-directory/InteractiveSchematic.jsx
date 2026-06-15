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

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#041524',
      backgroundImage: `
        linear-gradient(rgba(12, 208, 205, 0.15) 1px, transparent 1px), 
        linear-gradient(90deg, rgba(12, 208, 205, 0.15) 1px, transparent 1px),
        linear-gradient(rgba(12, 208, 205, 0.05) 1px, transparent 1px), 
        linear-gradient(90deg, rgba(12, 208, 205, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
      border: '2px solid #0cd0cd',
      padding: '2rem',
      fontFamily: 'monospace',
      color: '#0cd0cd',
      minHeight: '800px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'inset 0 0 50px rgba(12, 208, 205, 0.2)'
    }}>
      
      {/* Decorative Corner Brackets */}
      <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderTop: '2px solid #0cd0cd', borderLeft: '2px solid #0cd0cd' }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderTop: '2px solid #0cd0cd', borderRight: '2px solid #0cd0cd' }} />
      <div style={{ position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderBottom: '2px solid #0cd0cd', borderLeft: '2px solid #0cd0cd' }} />
      <div style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderBottom: '2px solid #0cd0cd', borderRight: '2px solid #0cd0cd' }} />

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Top Left: Title and Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.7rem', backgroundColor: '#0cd0cd', color: '#041524', padding: '2px 8px', alignSelf: 'flex-start', fontWeight: 'bold' }}>PREMIUM UI</div>
          <h1 style={{ fontSize: '3.5rem', margin: '0', fontWeight: 'bold', textShadow: '0 0 10px #0cd0cd', letterSpacing: '2px' }}>
            {config.title}
          </h1>
          <div style={{ fontSize: '1rem', letterSpacing: '1px' }}>SERIAL: {rifle.serialNumber}</div>
          <div style={{ fontSize: '1rem', letterSpacing: '1px' }}>OWNER: {rifle.name} ({rifle.class})</div>
          <div style={{ fontSize: '1rem', letterSpacing: '1px' }}>CALIBER: {config.caliber}</div>
          <div style={{ fontSize: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            RATE OF FIRE: {config.rateOfFire}
            <div style={{ width: '100px', height: '10px', border: '1px solid #0cd0cd', padding: '1px' }}>
              <div style={{ width: '70%', height: '100%', backgroundColor: '#0cd0cd' }} />
            </div>
          </div>
        </div>

        {/* Top Right: Status Panels */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Legend */}
          <div style={{ fontSize: '0.7rem' }}>
            <div style={{ marginBottom: '5px' }}>LEGEND</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, backgroundColor: '#0cd0cd' }}/> TARGET NODE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, border: '1px solid #0cd0cd' }}/> ACTIVE TRACE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, border: '1px dashed rgba(12,208,205,0.5)' }}/> STANDBY</div>
          </div>
          {/* Status Box */}
          <div>
            <div style={{ marginBottom: '5px', fontSize: '0.7rem' }}>STATUS</div>
            <div style={{ border: '1px solid #0cd0cd', padding: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '10px', textShadow: '0 0 5px #0cd0cd' }}>SYSTEM OK<br/>SCAN ACTIVE</div>
              {[60, 90, 40, 75].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', fontSize: '0.6rem' }}>
                  <span>{i+1}</span>
                  <div style={{ flex: 1, height: '4px', border: '1px solid #0cd0cd' }}>
                    <div style={{ width: `${w}%`, height: '100%', backgroundColor: '#0cd0cd' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          maxWidth: '1200px', // Enlarged to fill more screen
          aspectRatio: '16/9', 
          zIndex: 10,
          mixBlendMode: 'screen',
        }}>
          <img 
            src={config.image} 
            alt="Rifle"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              transform: 'scale(1.1)', // Scale up the image inside the container
              filter: 'drop-shadow(0 0 15px rgba(12, 208, 205, 0.4)) contrast(1.5) brightness(1.2)'
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
                stroke={selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(12, 208, 205, 0.3)'} 
                strokeWidth={selectedPart?.id === part.id ? '2' : '1'} 
                strokeDasharray={selectedPart?.id === part.id ? 'none' : '4,4'}
                style={{ 
                  transition: 'all 0.2s',
                  filter: selectedPart?.id === part.id ? 'drop-shadow(0 0 5px #0cd0cd)' : 'none' 
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
                 gap: '10px',
                 cursor: 'crosshair',
                 zIndex: 35,
                 transition: 'all 0.2s ease',
                 opacity: selectedPart && selectedPart.id !== part.id ? 0.3 : 1
               }}
             >
               {/* The glowing target dot (floats next to label) */}
               <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px', height: '20px' }}>
                 <div style={{ 
                   width: selectedPart?.id === part.id ? '16px' : '8px', 
                   height: selectedPart?.id === part.id ? '16px' : '8px', 
                   backgroundColor: selectedPart?.id === part.id ? '#0cd0cd' : 'transparent',
                   border: '2px solid #0cd0cd',
                   borderRadius: '50%', 
                   transition: 'all 0.2s ease',
                   boxShadow: selectedPart?.id === part.id ? '0 0 15px #0cd0cd' : 'none'
                 }} />
                 {/* Expanding radar ring on hover */}
                 {selectedPart?.id === part.id && (
                   <div style={{ position: 'absolute', width: '30px', height: '30px', border: '1px solid #0cd0cd', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                 )}
               </div>

               {/* The Text Label */}
               <div style={{
                 color: selectedPart?.id === part.id ? '#020a14' : '#0cd0cd',
                 backgroundColor: selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(4, 21, 36, 0.8)',
                 fontSize: '0.7rem',
                 fontWeight: 'bold',
                 padding: '4px 8px',
                 border: `1px solid ${selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(12, 208, 205, 0.5)'}`,
                 whiteSpace: 'nowrap',
                 boxShadow: selectedPart?.id === part.id ? '0 0 10px #0cd0cd' : 'none',
                 textShadow: selectedPart?.id === part.id ? 'none' : '0 0 5px rgba(12,208,205,0.5)',
                 transition: 'all 0.2s ease',
               }}>
                 {part.name.toUpperCase()}
               </div>
             </div>
          ))}

          {/* Physical dots on the gun itself (targetPos) so users see where the line is pointing */}
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
                 backgroundColor: '#0cd0cd',
                 borderRadius: '50%',
                 pointerEvents: 'none',
                 zIndex: 30,
                 boxShadow: '0 0 5px #0cd0cd',
                 opacity: selectedPart?.id === part.id ? 1 : 0.5
               }}
             />
          ))}
        </div>
      </div>

      {/* DETAILED DESCRIPTION OVERLAY (Fixed positioned on the right) */}
      {selectedPart && (
        <div style={{
          position: 'absolute',
          top: '25%',
          right: '3%',
          width: '380px',
          backgroundColor: 'rgba(4, 21, 36, 0.95)',
          border: '1px solid #0cd0cd',
          padding: '2rem',
          zIndex: 50,
          boxShadow: '0 0 30px rgba(0,0,0,0.9), inset 0 0 15px rgba(12,208,205,0.3)',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none' // Auto-vanish when mouse leaves the target node
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #0cd0cd', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '4px' }}>COMPONENT // {selectedPart.id.toUpperCase()}</div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 8px #0cd0cd' }}>
                {selectedPart.name}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#aeeeee', textAlign: 'justify', textShadow: '0 0 1px rgba(12,208,205,0.5)' }}>
            {selectedPart.desc}
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed rgba(12,208,205,0.4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem' }}>
            <div>
              <div style={{ opacity: 0.6, letterSpacing: '1px' }}>MATERIAL SPEC</div>
              <div style={{ fontWeight: 'bold' }}>MIL-SPEC STANDARD</div>
            </div>
            <div>
              <div style={{ opacity: 0.6, letterSpacing: '1px' }}>DIAGNOSTIC</div>
              <div style={{ color: '#0cd0cd', fontWeight: 'bold', textShadow: '0 0 5px #0cd0cd' }}>NOMINAL_OPERATION</div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', zIndex: 10 }}>
        {/* Bottom Left: Diagnostics / Legend */}
        <div style={{ border: '1px solid rgba(12,208,205,0.5)', padding: '10px', minWidth: '250px', fontSize: '0.7rem' }}>
          <div style={{ backgroundColor: '#0cd0cd', color: '#041524', display: 'inline-block', padding: '2px 5px', fontWeight: 'bold', marginBottom: '10px' }}>ASSET PROFILE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '5px', marginBottom: '5px' }}>
            <span style={{ opacity: 0.7 }}>SERIAL:</span> <span>{rifle.serialNumber}</span>
            <span style={{ opacity: 0.7 }}>ASSEMBLY:</span> <span>STANDARD MIL-SPEC</span>
            <span style={{ opacity: 0.7 }}>CLASS:</span> <span>{rifle.class}</span>
          </div>
        </div>

        {/* Bottom Right: Tactical Scan */}
        <div style={{ border: '1px solid #0cd0cd', padding: '10px', display: 'flex', gap: '20px' }}>
          <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>TACTICAL</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 5px #0cd0cd' }}>OK</div>
              <div style={{ fontSize: '0.5rem', letterSpacing: '2px' }}>DIAGNOSTICS</div>
            </div>
          </div>
          <div style={{ width: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '5px' }}>
            <div style={{ fontSize: '0.6rem', marginBottom: '5px', textAlign: 'right' }}>SCAN ACTIVE</div>
            <div style={{ width: '100%', height: '8px', border: '1px solid #0cd0cd', padding: '1px' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: '#0cd0cd' }} />
            </div>
          </div>
        </div>
      </div>
      
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
