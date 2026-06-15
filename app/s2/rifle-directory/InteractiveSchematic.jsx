'use client';
import { useState } from 'react';

const weaponConfigs = {
  'M14': {
    title: 'M14 GARAND (MIL-SPEC)',
    image: '/weapons/m14.png',
    caliber: '7.62x51mm NATO',
    rateOfFire: '700 RPM',
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', node: { x: 22, y: 50 }, label: { x: 15, y: 20 }, desc: 'National Match profile slotted flash suppressor. Forged steel construction designed to reduce muzzle flash and mitigate recoil rise during rapid fire.' },
      { id: 'barrel', name: '22" Match Barrel', node: { x: 32, y: 50 }, label: { x: 30, y: 15 }, desc: '22-inch heavy barrel. 1:12 RH twist rate, 4-groove rifling. Parkerized finish, machined from 4140 chrome-moly steel for exceptional harmonic stability and long-range accuracy.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', node: { x: 30, y: 53 }, label: { x: 25, y: 80 }, desc: 'Short-stroke gas piston system. Features a hard-chromed piston housed within a precision-machined stainless steel cylinder, ensuring reliable cycling in adverse environments.' },
      { id: 'front_sight', name: 'Front Sight', node: { x: 24, y: 46 }, label: { x: 20, y: 25 }, desc: 'Winged front sight post. 0.062" National Match blade, drift adjustable for zeroing windage at the armory level.' },
      { id: 'receiver', name: 'Forged Receiver', node: { x: 50, y: 48 }, label: { x: 45, y: 15 }, desc: 'The core of the M14. Forged from 8620 alloy steel and heat-treated. Houses the dual-lug rotating bolt and robust operating rod assembly.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', node: { x: 52, y: 45 }, label: { x: 55, y: 10 }, desc: 'Fully adjustable rear aperture sight. 1 MOA elevation and windage click adjustments, ranging out to 1,000 meters.' },
      { id: 'trigger', name: 'Trigger Group', node: { x: 50, y: 55 }, label: { x: 55, y: 85 }, desc: 'Two-stage military trigger. Crisp 4.5-pound pull weight. Contains the hammer, sear, and ambidextrous safety latch within a forged housing.' },
      { id: 'magazine', name: '20-Round Box', node: { x: 48, y: 62 }, label: { x: 45, y: 85 }, desc: 'Detachable 20-round double-stack magazine. Constructed from stamped steel with a parkerized finish and anti-tilt follower feeding 7.62x51mm ammunition.' },
      { id: 'stock_front', name: 'Walnut Forestock', node: { x: 40, y: 52 }, label: { x: 35, y: 85 }, desc: 'The front section of the chassis. Crafted from dense American Walnut, providing exceptional durability and thermal insulation from the barrel.' },
      { id: 'stock_rear', name: 'Fixed Buttstock', node: { x: 65, y: 53 }, label: { x: 75, y: 85 }, desc: 'A traditional sloping wooden chassis. Reinforced with a steel recoil lug bedded into the wood to distribute the heavy 7.62 recoil forces.' },
      { id: 'buttplate', name: 'Hinged Buttplate', node: { x: 78, y: 55 }, label: { x: 85, y: 20 }, desc: 'Checkered steel buttplate. Features a hinged shoulder rest for full-auto control, with an internal compartment housing the field cleaning kit.' }
    ]
  },
  'M16': {
    title: 'M16A4 (MIL-SPEC)',
    image: '/weapons/m16.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-950 RPM',
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', node: { x: 20, y: 50 }, label: { x: 15, y: 20 }, desc: 'Standard A2 birdcage flash hider. Features closed bottom slots to prevent dust kick-up when firing prone.' },
      { id: 'barrel', name: '20" Chrome-Lined Barrel', node: { x: 30, y: 50 }, label: { x: 30, y: 15 }, desc: '20-inch 4150 CMV steel barrel, chrome-lined bore and chamber. 1:7 RH twist rate optimized for 62gr M855 penetrator rounds.' },
      { id: 'front_sight', name: 'A2 Front Sight Base', node: { x: 28, y: 46 }, label: { x: 20, y: 25 }, desc: 'Forged A2 profile front sight base with bayonet lug. Pinned to the barrel, doubling as the gas block for the rifle-length gas system.' },
      { id: 'handguard', name: 'Polymer Handguard', node: { x: 40, y: 50 }, label: { x: 40, y: 85 }, desc: 'Standard ribbed polymer handguard with internal aluminum heat shields. Protects the stainless steel gas tube and operator hands.' },
      { id: 'upper', name: 'Upper Receiver', node: { x: 50, y: 48 }, label: { x: 45, y: 15 }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver with Mil-Spec hardcoat anodizing. Houses the M16-profile bolt carrier group.' },
      { id: 'carry_handle', name: 'Detachable Carry Handle', node: { x: 50, y: 43 }, label: { x: 55, y: 10 }, desc: 'Detachable A2 carry handle mounted to the Picatinny rail. Features integrated rear sights adjustable for windage and elevation.' },
      { id: 'ejection_port', name: 'Ejection Port Cover', node: { x: 53, y: 50 }, label: { x: 65, y: 20 }, desc: 'Spring-loaded stamped steel dust cover. Automatically flips open when the bolt carrier cycles backward.' },
      { id: 'forward_assist', name: 'Forward Assist', node: { x: 56, y: 49 }, label: { x: 75, y: 25 }, desc: 'Plunger mechanism used to manually force the bolt carrier forward into battery if fouled by carbon or debris.' },
      { id: 'charging_handle', name: 'Charging Handle', node: { x: 57, y: 46 }, label: { x: 65, y: 15 }, desc: 'T-shaped forged aluminum handle used to manually cycle the action, chamber a round, or clear malfunctions.' },
      { id: 'lower', name: 'Lower Receiver', node: { x: 50, y: 53 }, label: { x: 45, y: 80 }, desc: 'Forged 7075-T6 aluminum lower receiver. Houses the fire control group, magazine catch, and bolt release mechanism.' },
      { id: 'trigger', name: 'Fire Control Group', node: { x: 52, y: 55 }, label: { x: 55, y: 85 }, desc: 'Standard mil-spec trigger group featuring a heavy 6-8 lb pull. Provides Safe, Semi, and 3-Round Burst selector options.' },
      { id: 'grip', name: 'A2 Pistol Grip', node: { x: 54, y: 60 }, label: { x: 65, y: 85 }, desc: 'Standard A2 profile polymer pistol grip with a single finger groove and aggressive texturing.' },
      { id: 'magazine', name: 'STANAG Magazine', node: { x: 48, y: 65 }, label: { x: 40, y: 90 }, desc: 'Standard NATO STANAG 30-round curved box magazine. Aluminum body with an anti-tilt follower and green/tan follower.' },
      { id: 'buffer', name: 'Buffer Tube', node: { x: 65, y: 50 }, label: { x: 75, y: 15 }, desc: 'Rifle-length receiver extension. Houses the heavy rifle buffer and spring, absorbing recoil and cycling the action.' },
      { id: 'stock', name: 'A2 Fixed Stock', node: { x: 75, y: 52 }, label: { x: 85, y: 20 }, desc: 'A2 profile fixed polymer stock. Provides a stable cheek weld, high durability, and features a trapdoor for the cleaning kit.' }
    ]
  },
  'R4': {
    title: 'R4 TACTICAL CARBINE',
    image: '/weapons/r4.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-900 RPM',
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', node: { x: 30, y: 50 }, label: { x: 20, y: 20 }, desc: 'Standard A2 flash hider.' },
      { id: 'barrel', name: '14.5" Carbine Barrel', node: { x: 35, y: 50 }, label: { x: 30, y: 15 }, desc: 'Short 14.5-inch 4150 CMV barrel. Carbine-length gas system designed for CQB engagements.' },
      { id: 'handguard', name: 'Quad Rail System', node: { x: 45, y: 50 }, label: { x: 40, y: 85 }, desc: 'Free-floated aluminum quad-rail handguard system for mounting tactical lights, lasers, and vertical grips.' },
      { id: 'optic', name: 'Red Dot Optic', node: { x: 52, y: 40 }, label: { x: 50, y: 15 }, desc: 'Close-quarters reflex red dot sight mounted on the upper receiver rail for rapid target acquisition.' },
      { id: 'upper', name: 'Upper Receiver', node: { x: 55, y: 48 }, label: { x: 60, y: 15 }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver.' },
      { id: 'charging_handle', name: 'Charging Handle', node: { x: 58, y: 46 }, label: { x: 70, y: 20 }, desc: 'Used to manually chamber a round or clear malfunctions.' },
      { id: 'lower', name: 'Lower Receiver', node: { x: 55, y: 52 }, label: { x: 45, y: 80 }, desc: 'Forged 7075-T6 aluminum lower receiver containing the fire control group.' },
      { id: 'trigger', name: 'Trigger Assembly', node: { x: 57, y: 55 }, label: { x: 55, y: 85 }, desc: 'Mil-spec single-stage trigger group.' },
      { id: 'grip', name: 'Ergonomic Grip', node: { x: 59, y: 62 }, label: { x: 65, y: 85 }, desc: 'Upgraded ergonomic pistol grip with stippling.' },
      { id: 'magazine', name: 'PMAG 30', node: { x: 52, y: 65 }, label: { x: 40, y: 85 }, desc: 'Polymer 30-round magazine with a constant-curve internal geometry.' },
      { id: 'stock', name: 'Telescopic Stock', node: { x: 70, y: 53 }, label: { x: 85, y: 20 }, desc: 'Adjustable 6-position telescopic carbine stock for varying body armor thicknesses.' }
    ]
  },
  '9MM': {
    title: '9MM TACTICAL SIDEARM',
    image: '/weapons/9mm.png',
    caliber: '9x19mm Parabellum',
    rateOfFire: 'SEMI-AUTO',
    parts: [
      { id: 'slide', name: 'Steel Slide', node: { x: 40, y: 45 }, label: { x: 30, y: 20 }, desc: 'Machined steel slide with front and rear cocking serrations. Houses the recoil spring assembly, extractor, and firing pin.' },
      { id: 'sights', name: 'Tritium Night Sights', node: { x: 35, y: 42 }, label: { x: 45, y: 15 }, desc: 'Steel 3-dot sights equipped with tritium inserts for low-light aiming.' },
      { id: 'barrel', name: '4.5" Cold Hammer Forged Barrel', node: { x: 45, y: 46 }, label: { x: 60, y: 15 }, desc: 'Internal 4.5-inch 9mm barrel. Cold hammer forged for extreme longevity and precision.' },
      { id: 'ejection_port', name: 'Ejection Port & Extractor', node: { x: 50, y: 45 }, label: { x: 70, y: 25 }, desc: 'Large ejection port. Features a heavy-duty claw extractor that doubles as a tactile loaded chamber indicator.' },
      { id: 'frame', name: 'Polymer Frame', node: { x: 45, y: 52 }, label: { x: 30, y: 80 }, desc: 'Lightweight, high-strength polymer frame. Includes a standard Picatinny accessory rail for weapon lights.' },
      { id: 'trigger', name: 'Striker-Fired Trigger', node: { x: 48, y: 55 }, label: { x: 40, y: 85 }, desc: 'Striker-fired action with a consistent 5.5 lb trigger pull. Features an integrated blade safety.' },
      { id: 'slide_catch', name: 'Slide Stop Lever', node: { x: 50, y: 50 }, label: { x: 65, y: 80 }, desc: 'Ambidextrous lever that automatically locks the slide back when the magazine is empty.' },
      { id: 'mag_release', name: 'Magazine Release', node: { x: 52, y: 53 }, label: { x: 75, y: 80 }, desc: 'Reversible push-button magazine release.' },
      { id: 'grip', name: 'Textured Grip', node: { x: 55, y: 60 }, label: { x: 80, y: 85 }, desc: 'Ergonomic grip housing with aggressive stippling and interchangeable backstraps.' },
      { id: 'magazine', name: '17-Round Magazine', node: { x: 57, y: 70 }, label: { x: 65, y: 90 }, desc: 'Double-stack 17-round steel magazine with polymer baseplate and witness holes.' }
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

      {/* CENTRAL SCHEMATIC AREA (Enlarged) */}
      <div style={{ 
        flex: 1, 
        marginTop: '2rem', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
      }}>
        
        {/* Background Decorative Wireframes */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '90%', height: '80%', pointerEvents: 'none', opacity: 0.3, zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '5%', left: '15%', width: '70%', height: '50%', border: '2px solid #0cd0cd', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: '55%', left: '25%', width: '50%', height: '40%', border: '2px solid #0cd0cd', borderTop: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '20%', width: '60%', height: '1px', backgroundColor: '#0cd0cd' }} />
        </div>

        {/* Main Weapon Container (Enlarged width) */}
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
              transform: 'scale(1.2)', // Scale up the image inside the container to make it larger
              filter: 'drop-shadow(0 0 15px rgba(12, 208, 205, 0.4)) contrast(1.5) brightness(1.2)'
            }} 
          />

          {/* Permanent SVG Tracelines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
            {config.parts.map(part => (
              <line 
                key={`line-${part.id}`}
                x1={`${part.node.x}%`} 
                y1={`${part.node.y}%`} 
                x2={`${part.label.x}%`} 
                y2={`${part.label.y}%`} 
                stroke={selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(12, 208, 205, 0.3)'} 
                strokeWidth={selectedPart?.id === part.id ? '2' : '1'} 
                strokeDasharray={selectedPart?.id === part.id ? 'none' : '2,2'}
                style={{ 
                  transition: 'all 0.2s',
                  filter: selectedPart?.id === part.id ? 'drop-shadow(0 0 5px #0cd0cd)' : 'none' 
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
                 left: `${part.label.x}%`,
                 top: `${part.label.y}%`,
                 transform: 'translate(-50%, -50%)',
                 color: selectedPart?.id === part.id ? '#020a14' : '#0cd0cd',
                 backgroundColor: selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(4, 21, 36, 0.8)',
                 fontSize: '0.7rem',
                 fontWeight: 'bold',
                 cursor: 'crosshair',
                 zIndex: 35,
                 padding: '4px 8px',
                 border: `1px solid ${selectedPart?.id === part.id ? '#0cd0cd' : 'rgba(12, 208, 205, 0.5)'}`,
                 whiteSpace: 'nowrap',
                 transition: 'all 0.2s ease',
                 boxShadow: selectedPart?.id === part.id ? '0 0 10px #0cd0cd' : 'none'
               }}
             >
               {part.name.toUpperCase()}
             </div>
          ))}

          {/* Interactive Target Nodes */}
          {config.parts.map((part) => (
            <div
              key={`node-${part.id}`}
              onMouseEnter={() => setSelectedPart(part)}
              onMouseLeave={() => setSelectedPart(null)}
              style={{
                position: 'absolute',
                left: `${part.node.x}%`,
                top: `${part.node.y}%`,
                width: '30px',
                height: '30px',
                transform: 'translate(-50%, -50%)',
                cursor: 'crosshair',
                zIndex: 30,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{ 
                width: selectedPart?.id === part.id ? '16px' : '6px', 
                height: selectedPart?.id === part.id ? '16px' : '6px', 
                backgroundColor: selectedPart?.id === part.id ? '#0cd0cd' : 'transparent',
                border: '1px solid #0cd0cd',
                borderRadius: '50%', 
                transition: 'all 0.2s ease',
                boxShadow: selectedPart?.id === part.id ? '0 0 15px #0cd0cd' : 'none'
              }} />
              {/* Optional expanding radar ring on hover */}
              {selectedPart?.id === part.id && (
                <div style={{ position: 'absolute', width: '30px', height: '30px', border: '1px solid #0cd0cd', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              )}
            </div>
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
          pointerEvents: 'none' // Prevent mouse from accidentally staying hovered over the description instead of the node
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
