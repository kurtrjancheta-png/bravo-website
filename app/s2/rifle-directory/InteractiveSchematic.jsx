'use client';
import { useState } from 'react';

const weaponConfigs = {
  'M14': {
    title: 'M14 GARAND',
    image: '/weapons/m14.png',
    caliber: '7.62x51mm NATO',
    rateOfFire: '700 RPM',
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', hitbox: { left: '5%', top: '38%', width: '10%', height: '10%' }, desc: 'Long, slotted flash suppressor to reduce muzzle flash and recoil.' },
      { id: 'barrel', name: '22" Barrel', hitbox: { left: '15%', top: '38%', width: '25%', height: '10%' }, desc: '22-inch barrel designed for maximum accuracy with the 7.62x51mm NATO cartridge.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', hitbox: { left: '20%', top: '48%', width: '15%', height: '8%' }, desc: 'Short-stroke gas piston system located below the barrel.' },
      { id: 'front_sight', name: 'Front Sight', hitbox: { left: '10%', top: '32%', width: '5%', height: '6%' }, desc: 'Winged front sight post.' },
      { id: 'receiver', name: 'Receiver & Bolt', hitbox: { left: '40%', top: '35%', width: '15%', height: '15%' }, desc: 'The core of the M14, housing the rotating bolt and operating rod assembly.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', hitbox: { left: '50%', top: '30%', width: '5%', height: '8%' }, desc: 'Fully adjustable rear peep sight for windage and elevation.' },
      { id: 'trigger', name: 'Trigger Group', hitbox: { left: '45%', top: '50%', width: '10%', height: '15%' }, desc: 'Contains the trigger, hammer, and safety latch.' },
      { id: 'magazine', name: '20-Round Magazine', hitbox: { left: '40%', top: '65%', width: '10%', height: '20%' }, desc: 'Detachable 20-round double-stack box magazine feeding 7.62x51mm ammunition.' },
      { id: 'stock_front', name: 'Forestock', hitbox: { left: '25%', top: '42%', width: '15%', height: '10%' }, desc: 'The front section of the wooden chassis.' },
      { id: 'stock_rear', name: 'Wooden Buttstock', hitbox: { left: '55%', top: '40%', width: '35%', height: '20%' }, desc: 'A traditional sloping wooden chassis that provides exceptional durability.' },
      { id: 'buttplate', name: 'Hinged Buttplate', hitbox: { left: '90%', top: '40%', width: '5%', height: '20%' }, desc: 'Steel buttplate with a hinged door for the cleaning kit.' }
    ]
  },
  'M16': {
    title: 'M16A4',
    image: '/weapons/m16.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-950 RPM',
    parts: [
      { id: 'flash_hider', name: 'Birdcage Flash Hider', hitbox: { left: '5%', top: '40%', width: '5%', height: '10%' }, desc: 'Standard A2 birdcage flash hider to dissipate muzzle flash.' },
      { id: 'barrel', name: '20" Barrel', hitbox: { left: '10%', top: '40%', width: '20%', height: '8%' }, desc: '20-inch barrel maximizing the ballistic potential of the 5.56mm round.' },
      { id: 'front_sight', name: 'Front Sight Base', hitbox: { left: '20%', top: '30%', width: '5%', height: '15%' }, desc: 'A2 profile front sight base with bayonet lug and gas block.' },
      { id: 'handguard', name: 'Ribbed Handguard', hitbox: { left: '25%', top: '38%', width: '25%', height: '12%' }, desc: 'Ribbed polymer handguard protecting the gas tube.' },
      { id: 'upper', name: 'Upper Receiver', hitbox: { left: '50%', top: '35%', width: '15%', height: '10%' }, desc: 'Forged aluminum upper receiver housing the bolt carrier group.' },
      { id: 'carry_handle', name: 'Carry Handle / Rear Sight', hitbox: { left: '50%', top: '25%', width: '15%', height: '10%' }, desc: 'Integrated carry handle with adjustable rear sights.' },
      { id: 'ejection_port', name: 'Ejection Port Cover', hitbox: { left: '55%', top: '40%', width: '5%', height: '5%' }, desc: 'Dust cover protecting the bolt carrier group from debris.' },
      { id: 'forward_assist', name: 'Forward Assist', hitbox: { left: '60%', top: '38%', width: '5%', height: '5%' }, desc: 'Plunger to manually force the bolt carrier forward.' },
      { id: 'charging_handle', name: 'Charging Handle', hitbox: { left: '65%', top: '32%', width: '5%', height: '5%' }, desc: 'T-shaped handle used to manually chamber a round.' },
      { id: 'lower', name: 'Lower Receiver', hitbox: { left: '50%', top: '45%', width: '15%', height: '10%' }, desc: 'Contains the fire control group and magazine well.' },
      { id: 'trigger', name: 'Trigger Assembly', hitbox: { left: '52%', top: '55%', width: '5%', height: '10%' }, desc: 'Standard mil-spec trigger group.' },
      { id: 'grip', name: 'Pistol Grip', hitbox: { left: '58%', top: '55%', width: '8%', height: '20%' }, desc: 'A2 profile pistol grip.' },
      { id: 'magazine', name: '30-Round Magazine', hitbox: { left: '48%', top: '65%', width: '10%', height: '25%' }, desc: 'Standard STANAG 30-round curved box magazine.' },
      { id: 'buffer', name: 'Buffer Tube', hitbox: { left: '65%', top: '40%', width: '10%', height: '8%' }, desc: 'Houses the rifle-length recoil buffer spring system.' },
      { id: 'stock', name: 'Fixed Polymer Stock', hitbox: { left: '75%', top: '35%', width: '20%', height: '20%' }, desc: 'A2 profile fixed polymer stock providing a stable cheek weld.' }
    ]
  },
  'R4': {
    title: 'R4 CARBINE',
    image: '/weapons/r4.png',
    caliber: '5.56x45mm NATO',
    rateOfFire: '700-900 RPM',
    parts: [
      { id: 'flash_hider', name: 'Flash Hider', hitbox: { left: '10%', top: '40%', width: '5%', height: '10%' }, desc: 'Standard A2 flash hider.' },
      { id: 'barrel', name: '14.5" Barrel', hitbox: { left: '15%', top: '40%', width: '15%', height: '8%' }, desc: 'Short 14.5-inch carbine barrel.' },
      { id: 'handguard', name: 'Quad Rail System', hitbox: { left: '30%', top: '35%', width: '20%', height: '15%' }, desc: 'Quad-rail handguard system for mounting tactical accessories.' },
      { id: 'optic', name: 'Optic Sight', hitbox: { left: '45%', top: '25%', width: '10%', height: '10%' }, desc: 'Close-quarters red dot optic mounted on the upper rail.' },
      { id: 'upper', name: 'Upper Receiver', hitbox: { left: '50%', top: '35%', width: '15%', height: '10%' }, desc: 'Flat-top upper receiver.' },
      { id: 'charging_handle', name: 'Charging Handle', hitbox: { left: '62%', top: '32%', width: '5%', height: '5%' }, desc: 'Used to chamber a round.' },
      { id: 'lower', name: 'Lower Receiver', hitbox: { left: '50%', top: '45%', width: '15%', height: '10%' }, desc: 'Contains the trigger assembly.' },
      { id: 'trigger', name: 'Trigger Assembly', hitbox: { left: '52%', top: '55%', width: '5%', height: '10%' }, desc: 'Mil-spec trigger group.' },
      { id: 'grip', name: 'Pistol Grip', hitbox: { left: '58%', top: '55%', width: '8%', height: '20%' }, desc: 'Ergonomic pistol grip.' },
      { id: 'magazine', name: 'PMAG Magazine', hitbox: { left: '48%', top: '60%', width: '10%', height: '25%' }, desc: 'Polymer 30-round magazine.' },
      { id: 'stock', name: 'Telescopic Stock', hitbox: { left: '65%', top: '35%', width: '25%', height: '20%' }, desc: 'Adjustable 6-position telescopic carbine stock.' }
    ]
  },
  '9MM': {
    title: '9MM TACTICAL',
    image: '/weapons/9mm.png',
    caliber: '9x19mm Parabellum',
    rateOfFire: 'SEMI-AUTO',
    parts: [
      { id: 'slide', name: 'Slide', hitbox: { left: '20%', top: '30%', width: '40%', height: '15%' }, desc: 'The upper slide housing the recoil spring and firing pin.' },
      { id: 'sights', name: 'Iron Sights', hitbox: { left: '20%', top: '25%', width: '40%', height: '5%' }, desc: 'Front and rear aiming sights.' },
      { id: 'barrel', name: 'Barrel', hitbox: { left: '25%', top: '35%', width: '30%', height: '5%' }, desc: 'Internal 9mm barrel.' },
      { id: 'ejection_port', name: 'Ejection Port', hitbox: { left: '45%', top: '32%', width: '10%', height: '10%' }, desc: 'Where spent casings are ejected.' },
      { id: 'frame', name: 'Lower Frame', hitbox: { left: '20%', top: '45%', width: '30%', height: '15%' }, desc: 'The polymer chassis and accessory rail.' },
      { id: 'trigger', name: 'Trigger', hitbox: { left: '40%', top: '55%', width: '10%', height: '10%' }, desc: 'Double/Single action trigger.' },
      { id: 'slide_catch', name: 'Slide Catch', hitbox: { left: '45%', top: '45%', width: '5%', height: '5%' }, desc: 'Locks the slide back when empty.' },
      { id: 'mag_release', name: 'Magazine Release', hitbox: { left: '48%', top: '55%', width: '5%', height: '5%' }, desc: 'Button to drop the magazine.' },
      { id: 'grip', name: 'Pistol Grip', hitbox: { left: '50%', top: '45%', width: '20%', height: '35%' }, desc: 'Ergonomic grip housing the magazine.' },
      { id: 'magazine', name: '15-Round Magazine', hitbox: { left: '55%', top: '75%', width: '10%', height: '15%' }, desc: 'Double-stack 15-round magazine.' }
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
      <div style={{ 
        flex: 1, 
        marginTop: '4rem', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        // Moving mix-blend-mode to a container that doesn't create a stacking context blocking blending with the document!
      }}>
        
        {/* Background Decorative Wireframes (Mimicking Blueprint) */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '80%', height: '70%', pointerEvents: 'none', opacity: 0.3, zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '10%', left: '20%', width: '60%', height: '40%', border: '2px solid #0cd0cd', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '30%', width: '40%', height: '30%', border: '2px solid #0cd0cd', borderTop: 'none' }} />
          <div style={{ position: 'absolute', top: '45%', left: '25%', width: '50%', height: '1px', backgroundColor: '#0cd0cd' }} />
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '20px', height: '20px', border: '1px solid #0cd0cd', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '60%', left: '75%', width: '20px', height: '20px', border: '1px solid #0cd0cd', borderRadius: '50%' }} />
        </div>

        {/* Main Weapon Image Container with mixBlendMode applied to the entire box */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '900px', 
          aspectRatio: '16/9', 
          zIndex: 10,
          mixBlendMode: 'screen', // Apply screen blending here to drop the black background of the image
        }}>
          <img 
            src={config.image} 
            alt="Rifle"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              // Add a heavy contrast and brightness filter to ensure the AI's "dark gray" background becomes pure black for the screen blend
              filter: 'drop-shadow(0 0 15px rgba(12, 208, 205, 0.4)) contrast(1.5) brightness(1.2)'
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
                backgroundColor: selectedPart?.id === part.id ? 'rgba(12, 208, 205, 0.3)' : 'transparent',
                border: selectedPart?.id === part.id ? '1px dashed #0cd0cd' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if(selectedPart?.id !== part.id) e.currentTarget.style.backgroundColor = 'rgba(12, 208, 205, 0.15)'; e.currentTarget.style.border = '1px solid rgba(12, 208, 205, 0.5)'; }}
              onMouseLeave={(e) => { if(selectedPart?.id !== part.id) e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
            >
              {/* Optional glowing dot indicating interactivity */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 4, backgroundColor: '#0cd0cd', borderRadius: '50%', opacity: 0.5 }} />
            </div>
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
