'use client';
import { useState } from 'react';

const weaponConfigs = {
  'M14': {
    title: 'M14 GARAND',
    image: '/weapons/m14.png',
    caliber: '7.62x51mm NATO',
    rateOfFire: '700 RPM',
    parts: [
      { 
        id: 'barrel', 
        name: 'Barrel & Flash Suppressor', 
        hitbox: { left: '0%', top: '35%', width: '40%', height: '30%' },
        desc: 'A 22-inch barrel equipped with a long, slotted flash suppressor. Designed for maximum accuracy and range with the 7.62x51mm NATO cartridge. It incorporates the gas cylinder mechanism below the barrel.'
      },
      { 
        id: 'receiver', 
        name: 'Receiver & Action', 
        hitbox: { left: '40%', top: '20%', width: '25%', height: '50%' },
        desc: 'The core of the M14, housing the rotating bolt and operating rod assembly. It operates using a short-stroke gas piston system. Includes the rear peep sight and stripper clip guide.'
      },
      { 
        id: 'stock', 
        name: 'Wooden Stock', 
        hitbox: { left: '65%', top: '30%', width: '35%', height: '40%' },
        desc: 'A traditional sloping wooden chassis that provides exceptional durability and a classic profile. It houses the trigger group assembly and features a hinged steel buttplate for cleaning kit storage.'
      },
      { 
        id: 'magazine', 
        name: '20-Round Box Magazine', 
        hitbox: { left: '40%', top: '70%', width: '15%', height: '25%' },
        desc: 'A detachable 20-round double-stack box magazine feeding 7.62x51mm ammunition. It rocks into place and is secured by a paddle release.'
      }
    ]
  },
  'M16': {
    title: 'M16A4',
    image: '/weapons/m16.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-950 RPM',
    parts: [
      { 
        id: 'barrel', 
        name: 'Barrel & Handguard', 
        hitbox: { left: '0%', top: '30%', width: '45%', height: '35%' },
        desc: '20-inch barrel maximizing the ballistic potential of the 5.56mm round. Fitted with a birdcage flash hider and a ribbed polymer handguard protecting the gas tube.'
      },
      { 
        id: 'upper', 
        name: 'Upper Receiver', 
        hitbox: { left: '45%', top: '20%', width: '30%', height: '25%' },
        desc: 'Forged aluminum upper receiver housing the bolt carrier group. Features an integrated carry handle (A2) or flat-top rail (A4) with adjustable rear sights.'
      },
      { 
        id: 'lower', 
        name: 'Lower Receiver & Grip', 
        hitbox: { left: '45%', top: '45%', width: '20%', height: '35%' },
        desc: 'Contains the fire control group, magazine well, and buffer tube interface. Fitted with the standard A2 profile pistol grip.'
      },
      { 
        id: 'stock', 
        name: 'Fixed Polymer Stock', 
        hitbox: { left: '75%', top: '30%', width: '25%', height: '40%' },
        desc: 'A2 profile fixed polymer stock providing a stable cheek weld and housing the rifle-length recoil buffer spring system.'
      },
      { 
        id: 'magazine', 
        name: '30-Round Magazine', 
        hitbox: { left: '40%', top: '75%', width: '15%', height: '25%' },
        desc: 'Standard STANAG 30-round curved box magazine. Constructed from lightweight aluminum or polymer.'
      }
    ]
  },
  'R4': {
    title: 'R4 CARBINE',
    image: '/weapons/r4.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-900 RPM',
    parts: [
      { 
        id: 'barrel', 
        name: 'Carbine Barrel & Rail', 
        hitbox: { left: '0%', top: '35%', width: '45%', height: '30%' },
        desc: 'Short 14.5-inch carbine barrel fitted with a quad-rail handguard system for mounting tactical accessories, lights, and grips.'
      },
      { 
        id: 'receiver', 
        name: 'Receiver Group', 
        hitbox: { left: '45%', top: '20%', width: '30%', height: '50%' },
        desc: 'Flat-top upper and standard lower receiver. Features an optic mounted on the top rail and ambidextrous controls.'
      },
      { 
        id: 'stock', 
        name: 'Telescopic Stock', 
        hitbox: { left: '75%', top: '35%', width: '25%', height: '35%' },
        desc: 'Adjustable 6-position telescopic carbine stock allowing the operator to adjust the length of pull for close quarters combat.'
      }
    ]
  },
  '9MM': {
    title: '9MM TACTICAL',
    image: '/weapons/9mm.png',
    caliber: '9x19mm Parabellum',
    rateOfFire: 'SEMI-AUTO',
    parts: [
      { 
        id: 'slide', 
        name: 'Slide Assembly', 
        hitbox: { left: '10%', top: '20%', width: '60%', height: '35%' },
        desc: 'The upper slide housing the barrel, recoil spring, extractor, and firing pin. Recoils backward to eject spent casings and load a fresh round.'
      },
      { 
        id: 'frame', 
        name: 'Lower Frame', 
        hitbox: { left: '10%', top: '55%', width: '40%', height: '30%' },
        desc: 'The polymer chassis containing the trigger mechanism, slide catch, and accessory rail.'
      },
      { 
        id: 'grip', 
        name: 'Pistol Grip & Mag Well', 
        hitbox: { left: '50%', top: '55%', width: '40%', height: '40%' },
        desc: 'Ergonomic grip housing the double-stack 15-round magazine. Features stippled texturing for maximum control.'
      }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, backgroundColor: '#0cd0cd' }}/> RECEIVER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, border: '1px solid #0cd0cd' }}/> KINETIC VECTOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}><div style={{ width: 8, height: 8, border: '1px solid rgba(12,208,205,0.5)' }}/> DIAGNOSTIC</div>
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
      <div style={{ flex: 1, position: 'relative', marginTop: '4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Background Decorative Wireframes (Mimicking Blueprint) */}
        <div style={{ position: 'absolute', top: '-50px', left: '10%', width: '80%', height: '100%', pointerEvents: 'none', opacity: 0.3 }}>
          {/* Fake receiver wireframe outline */}
          <div style={{ position: 'absolute', top: '10%', left: '20%', width: '60%', height: '40%', border: '2px solid #0cd0cd', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '30%', width: '40%', height: '30%', border: '2px solid #0cd0cd', borderTop: 'none' }} />
          <div style={{ position: 'absolute', top: '45%', left: '25%', width: '50%', height: '1px', backgroundColor: '#0cd0cd' }} />
          {/* Grid target markings */}
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '20px', height: '20px', border: '1px solid #0cd0cd', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '60%', left: '75%', width: '20px', height: '20px', border: '1px solid #0cd0cd', borderRadius: '50%' }} />
        </div>

        {/* Leader Lines (Decorative) */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ position: 'absolute', top: '20%', left: '45%', width: '1px', height: '15%', backgroundColor: '#0cd0cd', opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: '20%', left: '35%', width: '10%', height: '1px', backgroundColor: '#0cd0cd', opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: '18%', left: '32%', fontSize: '0.6rem' }}>OPTIC SENSOR</div>
          
          <div style={{ position: 'absolute', bottom: '30%', left: '55%', width: '1px', height: '15%', backgroundColor: '#0cd0cd', opacity: 0.6 }} />
          <div style={{ position: 'absolute', bottom: '30%', left: '55%', width: '10%', height: '1px', backgroundColor: '#0cd0cd', opacity: 0.6 }} />
          <div style={{ position: 'absolute', bottom: '28%', left: '66%', fontSize: '0.6rem' }}>MAGAZINE WELL</div>
        </div>

        {/* Main Weapon Image Container */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', aspectRatio: '16/9', zIndex: 10 }}>
          <img 
            src={config.image} 
            alt="Rifle"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 15px rgba(12, 208, 205, 0.4)) contrast(1.2)'
            }} 
          />

          {/* Interactive Hitboxes */}
          {config.parts.map((part) => (
            <div
              key={part.id}
              onClick={() => setSelectedPart(part)}
              style={{
                position: 'absolute',
                left: part.hitbox.left,
                top: part.hitbox.top,
                width: part.hitbox.width,
                height: part.hitbox.height,
                cursor: 'crosshair',
                backgroundColor: selectedPart?.id === part.id ? 'rgba(12, 208, 205, 0.2)' : 'transparent',
                border: selectedPart?.id === part.id ? '1px dashed #0cd0cd' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if(selectedPart?.id !== part.id) e.currentTarget.style.backgroundColor = 'rgba(12, 208, 205, 0.1)'; e.currentTarget.style.border = '1px solid rgba(12, 208, 205, 0.5)'; }}
              onMouseLeave={(e) => { if(selectedPart?.id !== part.id) e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
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
          backgroundColor: 'rgba(4, 21, 36, 0.95)',
          border: '1px solid #0cd0cd',
          padding: '1.5rem',
          zIndex: 50,
          boxShadow: '0 0 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(12,208,205,0.2)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #0cd0cd', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 5px #0cd0cd' }}>
              {selectedPart.name}
            </h3>
            <button 
              onClick={() => setSelectedPart(null)}
              style={{ background: 'none', border: 'none', color: '#0cd0cd', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
            >×</button>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#aeeeee', textAlign: 'justify' }}>
            {selectedPart.desc}
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(12,208,205,0.4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem' }}>
            <div>
              <div style={{ opacity: 0.6 }}>MATERIAL</div>
              <div>AEROSPACE GRADE</div>
            </div>
            <div>
              <div style={{ opacity: 0.6 }}>STATUS</div>
              <div style={{ color: '#0cd0cd', fontWeight: 'bold' }}>NOMINAL</div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', zIndex: 10 }}>
        {/* Bottom Left: Diagnostics / Legend */}
        <div style={{ border: '1px solid rgba(12,208,205,0.5)', padding: '10px', minWidth: '250px', fontSize: '0.7rem' }}>
          <div style={{ backgroundColor: '#0cd0cd', color: '#041524', display: 'inline-block', padding: '2px 5px', fontWeight: 'bold', marginBottom: '10px' }}>LEGEND</div>
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
      
    </div>
  );
}
