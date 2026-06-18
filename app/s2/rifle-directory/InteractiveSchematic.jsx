'use client';
import { useState, useRef } from 'react';

// ----------------------------------------------------
// 1. ANIMATED TRACES (UNIFIED)
// ----------------------------------------------------

const M14AnimatedTrace = ({ color, isExploded }) => {
  // A springy, explosive transition
  const transition = 'transform 0.8s cubic-bezier(0.2, 1.2, 0.4, 1), opacity 0.5s ease';
  
  // Helper to manage transforms: (explodedX, explodedY, assembledX, assembledY)
  const t = (ex, ey, ax = 0, ay = 0) => 
    isExploded ? `translate(${ex}px, ${ey}px)` : `translate(${ax}px, ${ay}px)`;

  return (
    <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
      <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        
        {/* 1. UPPER ASSEMBLY (Receiver & Barrel) */}
        <g style={{ transform: t(-10, -80), transition }}>
          <path d="M 80 178 L 130 178 L 130 190 L 80 190 L 70 184 Z" />
          <line x1="90" y1="178" x2="90" y2="190" />
          <line x1="100" y1="178" x2="100" y2="190" />
          <line x1="110" y1="178" x2="110" y2="190" />
          <line x1="120" y1="178" x2="120" y2="190" />
          <path d="M 115 178 L 115 158 L 125 158 L 130 178" />
          <path d="M 120 158 L 120 168" />
          <path d="M 130 180 L 380 180 L 380 188 L 130 188 Z" />
          <path d="M 530 165 L 680 165 L 680 180 L 530 180 Z" />
          <path d="M 540 165 L 540 155 L 640 155 L 640 165" />
          <rect x="580" y="155" width="40" height="8" />
          <path d="M 660 165 L 660 145 L 685 145 L 685 165" />
          <circle cx="672" cy="150" r="6" />
          <circle cx="672" cy="150" r="2" />
          <path d="M 380 180 L 530 180 L 530 195 L 380 195 Z" />
        </g>

        {/* 2. CHASSIS / STOCK */}
        <g style={{ transform: t(10, 40), transition }}>
          <path d="M 230 195 L 380 195 L 380 208 L 230 208 Z" />
          <path d="M 380 195 L 530 195 L 530 215 L 680 215 L 710 240 L 740 250 L 830 240 L 940 270 L 950 270 L 950 185 L 940 185 L 700 195 L 530 195 Z" fill="rgba(134,134,139,0.05)" />
          <path d="M 950 185 L 960 185 L 960 272 L 950 270 Z" />
          <line x1="955" y1="190" x2="955" y2="265" strokeDasharray="2 2" />
          <path d="M 850 245 L 850 255 L 865 255 L 865 245" fill="none" />
        </g>

        {/* 3. TRIGGER GROUP */}
        <g style={{ transform: t(10, 110), transition }}>
          <path d="M 610 215 C 610 245, 650 245, 660 215" fill="none" />
          <path d="M 630 215 Q 630 230 640 235" fill="none" />
          <rect x="615" y="215" width="40" height="10" />
        </g>

        {/* 4. MAGAZINE */}
        <g style={{ transform: t(-10, 100), transition }}>
          <path d="M 545 215 L 585 215 L 583 236 L 543 235 Z" />
          <line x1="550" y1="220" x2="548" y2="232" />
        </g>

        {/* 5. GAS CYLINDER / OP ROD (Internal) */}
        <g style={{ transform: t(-40, -40, 0, 0), opacity: isExploded ? 1 : 0, transition }}>
          <path d="M 230 195 L 480 195 L 480 205 L 230 205 Z" fill="rgba(212,175,55,0.1)" />
          <rect x="440" y="190" width="10" height="20" />
          <circle cx="240" cy="200" r="4" />
        </g>

        {/* 6. BOLT & SPRING (Internal) */}
        <g style={{ transform: t(530, -30, 530, 0), opacity: isExploded ? 1 : 0, transition }}>
          <rect x="0" y="170" width="80" height="15" rx="3" fill="rgba(212,175,55,0.15)" />
          <line x1="10" y1="172" x2="10" y2="183" />
          <line x1="15" y1="172" x2="15" y2="183" />
          <path d="M 80 177 Q 85 170 90 177 T 100 177 T 110 177 T 120 177 T 130 177 T 140 177" fill="none" strokeDasharray="1 2" />
        </g>

        {/* 7. 7.62x51mm NATO BULLET */}
        <g style={{ transform: t(450, -220, 560, 185), opacity: isExploded ? 1 : 0, transition }}>
          <path d="M 0 10 L 30 10 L 35 13 L 40 13 L 40 27 L 35 27 L 30 30 L 0 30 Z" fill="rgba(212,175,55,0.2)" stroke={color} />
          <path d="M 40 14 L 60 16 L 65 20 L 60 24 L 40 26 Z" fill="rgba(134,134,139,0.3)" stroke={color} />
          <text x="32" y="50" fontSize="13" fontWeight="600" fill={color} textAnchor="middle" stroke="none">7.62×51mm NATO</text>
        </g>

      </g>
    </svg>
  );
};


const TacticalAnimatedTrace = ({ color, isExploded }) => {
  const transition = 'transform 0.8s cubic-bezier(0.2, 1.2, 0.4, 1), opacity 0.5s ease';
  const t = (ex, ey, ax = 0, ay = 0) => 
    isExploded ? `translate(${ex}px, ${ey}px)` : `translate(${ax}px, ${ay}px)`;

  return (
    <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
      <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        
        {/* 1. UPPER RECEIVER & BARREL */}
        <g style={{ transform: t(-10, -70), transition }}>
          <path d="M 80 178 L 110 178 L 110 190 L 80 190 Z" />
          <line x1="90" y1="178" x2="90" y2="190" />
          <line x1="100" y1="178" x2="100" y2="190" />
          <path d="M 110 182 L 280 182 L 280 186 L 110 186 Z" />
          <path d="M 230 182 L 230 175 L 280 175 L 280 182 Z" /> 
          <path d="M 250 182 L 250 135 L 265 135 L 275 182" />
          <circle cx="260" cy="150" r="4" />
          <path d="M 250 186 L 250 200 L 265 200 L 265 186" />
          <path d="M 280 170 L 480 170 L 480 205 L 280 195 Z" fill="rgba(134,134,139,0.05)" />
          <path d="M 290 170 L 290 195" /> <path d="M 310 170 L 310 196" /> <path d="M 330 170 L 330 197" /> <path d="M 350 170 L 350 198" /> <path d="M 370 170 L 370 200" /> <path d="M 390 170 L 390 201" /> <path d="M 410 170 L 410 202" /> <path d="M 430 170 L 430 203" /> <path d="M 450 170 L 450 204" /> <path d="M 470 170 L 470 205" />
          <path d="M 480 168 L 490 165 L 490 205 L 480 205 Z" />
          <path d="M 490 165 L 680 165 L 680 190 L 490 190 Z" />
          <path d="M 500 165 L 530 125 L 630 125 L 660 165 Z" />
          <path d="M 540 135 L 620 135 L 620 155 L 540 155 Z" fill="none" />
          <circle cx="645" cy="135" r="5" />
          <rect x="680" y="170" width="10" height="20" />
        </g>

        {/* 2. LOWER RECEIVER & STOCK */}
        <g style={{ transform: t(10, 40), transition }}>
          <path d="M 490 190 L 650 190 L 650 215 L 610 215 L 610 225 L 490 225 Z" />
          <circle cx="530" cy="205" r="3" />
          <circle cx="630" cy="200" r="4" />
          <path d="M 580 225 L 610 225 L 590 300 C 580 300, 570 290, 575 280 C 585 270, 570 250, 570 240 Z" />
          <path d="M 540 225 C 540 240, 570 240, 580 225" fill="none" />
          <path d="M 710 165 L 900 175 L 900 255 L 870 255 L 750 200 L 710 200 Z" fill="rgba(134,134,139,0.05)" />
          <path d="M 900 175 L 910 175 L 910 255 L 900 255 Z" />
          <rect x="650" y="175" width="60" height="20" />
        </g>

        {/* 3. MAGAZINE */}
        <g style={{ transform: t(10, 100), transition }}>
          <path d="M 495 225 L 540 225 L 535 340 L 485 330 C 485 330, 480 280, 495 225 Z" />
          <path d="M 505 235 C 495 280, 500 325, 500 325" fill="none" />
          <path d="M 525 235 C 515 280, 520 325, 520 325" fill="none" />
        </g>

        {/* 4. BOLT CARRIER GROUP (BCG) (Internal) */}
        <g style={{ transform: t(640, -50, 490, -10), opacity: isExploded ? 1 : 0, transition }}>
          <path d="M 0 175 L 80 175 L 80 188 L 0 188 Z" fill="rgba(212,175,55,0.15)" />
          <rect x="20" y="170" width="30" height="5" />
          <circle cx="10" cy="181.5" r="3" />
          <path d="M -15 178 L 0 178 L 0 185 L -15 185 Z" />
        </g>

        {/* 5. CHARGING HANDLE (Internal) */}
        <g style={{ transform: t(680, -90, 490, -5), opacity: isExploded ? 1 : 0, transition }}>
          <rect x="0" y="170" width="100" height="6" />
          <path d="M 100 165 L 110 165 L 110 180 L 100 180 Z" />
          <circle cx="110" cy="172.5" r="3" />
        </g>

        {/* 6. BUFFER SPRING (Internal) */}
        <g style={{ transform: t(800, -20, 710, -10), opacity: isExploded ? 1 : 0, transition }}>
          <path d="M 0 185 Q 10 175 20 185 T 40 185 T 60 185 T 80 185 T 100 185 T 120 185 T 140 185" fill="none" />
        </g>

        {/* 7. 5.56x45mm NATO BULLET */}
        <g style={{ transform: t(450, -220, 500, 205), opacity: isExploded ? 1 : 0, transition }}>
          <path d="M 0 10 L 25 10 L 30 13 L 35 13 L 35 27 L 30 27 L 25 30 L 0 30 Z" fill="rgba(212,175,55,0.2)" stroke={color} />
          <path d="M 35 14 L 50 15 L 55 20 L 50 25 L 35 26 Z" fill="rgba(134,134,139,0.3)" stroke={color} />
          <text x="27" y="50" fontSize="13" fontWeight="600" fill={color} textAnchor="middle" stroke="none">5.56×45mm NATO</text>
        </g>
      </g>
    </svg>
  );
};


// ----------------------------------------------------
// 2. CONFIGURATIONS & MAPPINGS
// ----------------------------------------------------

const weaponConfigs = {
  'M14': {
    AnimatedTraceComponent: M14AnimatedTrace,
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', targetPos: { x: 10.5, y: 48.66 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'A precision-machined, slotted flash suppressor with a National Match profile. It effectively reduces the visible muzzle flash to preserve the shooter\'s night vision, while also serving as a mounting point for bayonets or blank firing adapters during training operations.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', targetPos: { x: 67.2, y: 45.83 }, labelPos: { x: 95, y: 12, align: 'right' }, desc: 'A fully adjustable rear aperture sight, highly regarded for its precision. It features tactile click adjustments for both windage and elevation, allowing the shooter to dial in precise ranges up to 1,000 yards without requiring specialized tools.' },
      { id: 'stock_front', name: 'Walnut Forestock', targetPos: { x: 45, y: 49.58 }, labelPos: { x: 5, y: 19, align: 'left' }, desc: 'The robust forward section of the wooden chassis, typically carved from dense walnut. It provides a stable, heat-resistant gripping surface for the support hand and houses the lower sling swivel for steadying shots.' },
      { id: 'receiver', name: 'Forged Receiver', targetPos: { x: 60, y: 47.66 }, labelPos: { x: 95, y: 26, align: 'right' }, desc: 'The structural core of the M14. Forged from high-grade 8620 alloy steel and heat-treated for maximum durability, this massive receiver handles the intense chamber pressures of the 7.62mm cartridge and houses the bolt assembly.' },
      { id: 'barrel', name: '22" Match Barrel', targetPos: { x: 20, y: 48.66 }, labelPos: { x: 5, y: 33, align: 'left' }, desc: 'A heavy-contour 22-inch barrel designed for sustained accuracy. With a 1:12 right-hand twist rate, it is optimized to stabilize the 147-grain FMJ projectiles of standard M80 ball ammunition at extreme ranges.' },
      { id: 'buttplate', name: 'Hinged Buttplate', targetPos: { x: 95.5, y: 52.33 }, labelPos: { x: 95, y: 40, align: 'right' }, desc: 'A heavy-duty checkered steel buttplate fitted to the rear of the stock. It features a hinged shoulder rest that can be flipped up for better control during fully automatic fire or when shooting from the prone position.' },
      { id: 'front_sight', name: 'Front Sight', targetPos: { x: 12, y: 47.33 }, labelPos: { x: 5, y: 60, align: 'left' }, desc: 'A rugged, winged front sight post designed to withstand harsh field conditions. The protective steel wings shield the precision center post from drops or impacts that could otherwise disrupt the weapon\'s zero.' },
      { id: 'stock_rear', name: 'Fixed Buttstock', targetPos: { x: 80, y: 51.66 }, labelPos: { x: 95, y: 67, align: 'right' }, desc: 'The traditional sloping rear chassis, providing a comfortable cheek weld and housing the weapon\'s cleaning kit in a trapdoor compartment. Its solid wood construction adds necessary weight to tame recoil.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', targetPos: { x: 30, y: 50.08 }, labelPos: { x: 5, y: 74, align: 'left' }, desc: 'The heart of the M14\'s self-loading mechanism. This short-stroke gas piston system taps high-pressure expanding gases from the barrel to violently throw the operating rod backward, cycling the action.' },
      { id: 'trigger', name: 'Trigger Group', targetPos: { x: 63.5, y: 52.5 }, labelPos: { x: 95, y: 81, align: 'right' }, desc: 'A modular, self-contained two-stage military trigger mechanism. It provides a smooth, predictable break for accurate marksmanship and houses the safety lever inside the trigger guard for quick manipulation.' },
      { id: 'magazine', name: '20-Round Box', targetPos: { x: 56, y: 52.1 }, labelPos: { x: 5, y: 88, align: 'left' }, desc: 'A rugged, detachable 20-round double-stack box magazine. Constructed from stamped steel, it feeds the heavy 7.62x51mm NATO cartridges reliably into the chamber even in adverse, dirty environments.' },
    ],
    exploded: [
      { id: 'upper_assembly', name: 'Upper Assembly', targetPos: { x: 50, y: 41 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'The barrel, gas cylinder, and forged receiver separated as a single monolithic unit from the wooden chassis. This group handles all the explosive forces and mechanical cycling of the weapon.' },
      { id: 'bullet', name: '7.62×51mm', targetPos: { x: 48, y: 22 }, labelPos: { x: 95, y: 15, align: 'right' }, desc: 'The high-power 7.62x51mm NATO rimless bottlenecked rifle cartridge. Known for exceptional stopping power and barrier penetration, it hits significantly harder than modern intermediate cartridges.' },
      { id: 'op_rod', name: 'Operating Rod', targetPos: { x: 35, y: 47 }, labelPos: { x: 5, y: 25, align: 'left' }, desc: 'A heavy, reciprocating steel arm that connects the gas piston near the muzzle to the bolt assembly. When the weapon fires, gas pressure violently pushes this rod backward to unlock and cycle the action.' },
      { id: 'bolt', name: 'Bolt & Spring', targetPos: { x: 60, y: 47.5 }, labelPos: { x: 95, y: 35, align: 'right' }, desc: 'The rotating locking bolt and high-tension recoil spring assembly. The bolt features sturdy locking lugs that secure the cartridge in the chamber during detonation, before rotating to extract the spent casing.' },
      { id: 'stock_chassis', name: 'Wooden Chassis', targetPos: { x: 50, y: 55 }, labelPos: { x: 5, y: 65, align: 'left' }, desc: 'The one-piece wooden lower stock. Beyond providing an ergonomic interface for the shooter, it acts as a rigid bedding platform that aligns and tightly secures all mechanical components together.' },
      { id: 'trigger_assembly', name: 'Trigger Group', targetPos: { x: 63, y: 61 }, labelPos: { x: 95, y: 80, align: 'right' }, desc: 'The self-contained trigger mechanism, which drops out cleanly from the bottom of the stock. Its removal acts as the primary release mechanism for field-stripping the rest of the rifle.' },
      { id: 'magazine', name: '20-Rnd Magazine', targetPos: { x: 55, y: 60 }, labelPos: { x: 5, y: 85, align: 'left' }, desc: 'The stamped steel 20-round magazine box, spring, and follower. It utilizes a \'rock-and-lock\' insertion method, locking firmly into the bottom of the receiver.' },
    ],
    specs: {
      ammo: '7.62×51mm NATO',
      action: 'Gas-operated, rotating bolt',
      rateOfFire: '700–750 rounds/min',
      maxEffectiveRange: '460m (500 yd)',
      maxRange: '3,725m (4,074 yd)',
      weight: '9.2 lb (4.1 kg) empty',
      fireModes: 'Semi-Auto / Full-Auto'
    }
  },
  'M16': {
    AnimatedTraceComponent: TacticalAnimatedTrace,
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', targetPos: { x: 9.5, y: 48.66 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'The classic A2 "birdcage" flash hider. It disperses escaping muzzle gases to significantly reduce the blinding flash signature in low light, while its closed-bottom design prevents kicking up dust when firing from the prone position.' },
      { id: 'carry_handle', name: 'Detachable Carry Handle', targetPos: { x: 58, y: 45.41 }, labelPos: { x: 95, y: 13, align: 'right' }, desc: 'A rugged aluminum carry handle mounted securely to the upper receiver\'s Picatinny rail. It houses an integrated, fully adjustable dual-aperture rear sight designed for both close-quarters and long-range engagements.' },
      { id: 'handguard', name: 'Polymer Handguard', targetPos: { x: 38, y: 48.91 }, labelPos: { x: 5, y: 21, align: 'left' }, desc: 'A lightweight, ribbed polymer handguard system. It features internal aluminum heat shields to protect the operator\'s support hand from the intense barrel heat generated during sustained rapid fire.' },
      { id: 'upper', name: 'Upper Receiver', targetPos: { x: 55, y: 48.08 }, labelPos: { x: 95, y: 29, align: 'right' }, desc: 'A flat-top upper receiver forged from aerospace-grade 7075-T6 aluminum. It contains the bolt carrier group and features an integral Picatinny rail for mounting modern optics and accessories.' },
      { id: 'barrel', name: '20" Chrome-Lined Barrel', targetPos: { x: 18, y: 48.66 }, labelPos: { x: 5, y: 37, align: 'left' }, desc: 'A 20-inch 4150 CMV steel barrel, precisely rifled and hard-chrome lined for extended barrel life and corrosion resistance. It maximizes the muzzle velocity of the 5.56mm cartridge for superior long-range ballistics.' },
      { id: 'front_sight', name: 'A2 Front Sight Base', targetPos: { x: 26, y: 45.83 }, labelPos: { x: 5, y: 60, align: 'left' }, desc: 'A heavy-duty forged front sight base, permanently pinned to the barrel. In addition to housing the adjustable front sight post, it acts as the primary gas block that redirects gases back into the receiver.' },
      { id: 'stock', name: 'A2 Fixed Stock', targetPos: { x: 80, y: 50.83 }, labelPos: { x: 95, y: 68, align: 'right' }, desc: 'The iconic A2 profile fixed polymer buttstock. It provides a highly stable cheek weld, contains an internal storage compartment for cleaning kits, and houses the heavy rifle-length recoil buffer tube.' },
      { id: 'lower', name: 'Lower Receiver', targetPos: { x: 55, y: 50.41 }, labelPos: { x: 5, y: 76, align: 'left' }, desc: 'The serialized lower half of the weapon, forged from 7075-T6 aluminum. It houses the fire control group, magazine well, and all the primary operator controls including the safety selector and magazine release.' },
      { id: 'grip', name: 'A2 Pistol Grip', targetPos: { x: 59, y: 55.0 }, labelPos: { x: 95, y: 84, align: 'right' }, desc: 'The standard A2 profile polymer pistol grip. It features a textured surface and a distinctive finger groove, providing the operator with positive control and a comfortable, ergonomic grip angle.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 51.5, y: 56.66 }, labelPos: { x: 5, y: 92, align: 'left' }, desc: 'A standard NATO STANAG 30-round curved box magazine. Typically constructed from lightweight stamped aluminum, it feeds the 5.56mm cartridges upward into the chamber using an anti-tilt follower.' }
    ],
    exploded: [
      { id: 'bullet', name: '5.56×45mm', targetPos: { x: 48, y: 22 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'The intermediate 5.56x45mm NATO rifle cartridge. Characterized by high velocity and low recoil, it allows operators to carry a greater combat load and deliver rapid, highly controllable follow-up shots.' },
      { id: 'upper_rec', name: 'Upper Assembly', targetPos: { x: 50, y: 41 }, labelPos: { x: 95, y: 15, align: 'right' }, desc: 'The entire upper half of the weapon, pivoted away from the lower. It contains the barrel, gas tube, and the complex track system where the bolt carrier group reciprocates during firing.' },
      { id: 'charging_handle', name: 'Charging Handle', targetPos: { x: 74, y: 39.5 }, labelPos: { x: 5, y: 25, align: 'left' }, desc: 'A manual T-shaped actuator used to manipulate the bolt. It allows the operator to chamber the first round, clear complex malfunctions, or lock the bolt to the rear for inspection.' },
      { id: 'bcg', name: 'Bolt Carrier Group', targetPos: { x: 70, y: 44 }, labelPos: { x: 95, y: 35, align: 'right' }, desc: 'The internal mechanical heart of the M16. Driven by expanding gases channeled back through the gas tube, this massive carrier blows backward to extract casings and strips fresh rounds from the magazine upon return.' },
      { id: 'lower_rec', name: 'Lower Receiver', targetPos: { x: 55, y: 53.5 }, labelPos: { x: 5, y: 65, align: 'left' }, desc: 'The lower chassis containing the fire control group (trigger, hammer, sear). It attaches to the upper receiver via two push-pins, making field maintenance and modular swapping incredibly straightforward.' },
      { id: 'buffer', name: 'Buffer Spring', targetPos: { x: 88, y: 48 }, labelPos: { x: 95, y: 80, align: 'right' }, desc: 'The heavy recoil buffer and high-tension spring system. Located inside the buttstock, it absorbs the violent rearward impact of the bolt carrier and forcefully drives it back forward into battery.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 51, y: 62 }, labelPos: { x: 5, y: 85, align: 'left' }, desc: 'A high-capacity 30-round magazine dropping free from the magwell. Its standardized NATO design allows universal interoperability with allied forces\' weapons across the globe.' },
    ],
    specs: {
      ammo: '5.56×45mm NATO',
      action: 'Direct impingement, rotating bolt',
      rateOfFire: '700–950 rounds/min',
      maxEffectiveRange: '550m (point) / 800m (area)',
      maxRange: '3,600m (3,937 yd)',
      weight: '7.18 lb (3.26 kg) empty',
      fireModes: 'Safe / Semi / Burst'
    }
  }
};

export default function InteractiveSchematic({ rifle }) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [isExploded, setIsExploded] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = (part) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setSelectedPart(part);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setSelectedPart(null);
    }, 3000);
  };

  const type = weaponConfigs[rifle.rifleType] ? rifle.rifleType : 'M16';
  const config = weaponConfigs[type];
  
  const AnimatedTraceComponent = config.AnimatedTraceComponent;
  const currentParts = isExploded ? config.exploded : config.parts;

  // iOS-style refined color palette
  const colors = {
    base: '#86868b',      
    highlight: '#d4af37', 
    text: '#1d1d1f',      
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem',
      backgroundColor: 'transparent',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      minHeight: '600px',
    }}>
      
      {/* LEFT COLUMN: SCHEMATIC AREA */}
      <div style={{ 
        flex: '1 1 500px', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
      }}>
        
        {/* View Toggle Controller */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', zIndex: 60, position: 'relative' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(134,134,139,0.1)',
            borderRadius: '24px',
            padding: '4px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <button 
              onClick={() => { setIsExploded(false); setSelectedPart(null); }}
              style={{
                padding: '8px 24px',
                borderRadius: '20px',
                border: 'none',
                background: !isExploded ? '#ffffff' : 'transparent',
                color: !isExploded ? '#1d1d1f' : '#86868b',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: !isExploded ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Assembled View
            </button>
            <button 
              onClick={() => { setIsExploded(true); setSelectedPart(null); }}
              style={{
                padding: '8px 24px',
                borderRadius: '20px',
                border: 'none',
                background: isExploded ? '#ffffff' : 'transparent',
                color: isExploded ? colors.highlight : '#86868b',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isExploded ? '0 2px 8px rgba(212,175,55,0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Exploded Diagnostics
            </button>
          </div>
        </div>

        {/* Main Weapon Container */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: 'none',
          aspectRatio: '0.833', 
          zIndex: 10,
        }}>
          
          {/* NATIVE SVG RIFLE TRACE (Animated) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
            <AnimatedTraceComponent color={colors.base} isExploded={isExploded} />
          </div>

          {/* SVG Tracelines overlay */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
            {currentParts.map(part => {
              const isSelected = selectedPart?.id === part.id;
              const isFaded = selectedPart && !isSelected;
              return (
                <line 
                  key={`line-${part.id}-${isExploded}`}
                  x1={`${part.labelPos.x}%`} 
                  y1={`${part.labelPos.y}%`} 
                  x2={`${part.targetPos.x}%`} 
                  y2={`${part.targetPos.y}%`} 
                  stroke={colors.highlight} 
                  strokeWidth={isSelected ? '2' : '1.5'} 
                  strokeDasharray={isSelected ? 'none' : '4,4'}
                  style={{ 
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    opacity: isSelected ? 1 : (isFaded ? 0.2 : 0.65), 
                  }}
                />
              )
            })}
          </svg>

          {/* Interactive Text Labels */}
          {currentParts.map(part => {
             const isLeft = part.labelPos.align === 'left';
             const isRight = part.labelPos.align === 'right';
             return (
               <div 
                 key={`label-${part.id}-${isExploded}`}
                 onMouseEnter={() => handleMouseEnter(part)}
                 onMouseLeave={handleMouseLeave}
                 style={{
                   position: 'absolute',
                   ...(isLeft ? { left: `${part.labelPos.x}%` } : 
                       isRight ? { right: `${100 - part.labelPos.x}%` } : 
                       { left: `${part.labelPos.x}%` }),
                   top: `${part.labelPos.y}%`,
                   transform: isLeft ? 'translate(0%, -50%)' :
                              isRight ? 'translate(0%, -50%)' :
                              'translate(-50%, -50%)',
                   display: 'flex',
                   flexDirection: isRight ? 'row-reverse' : 'row',
                   alignItems: 'center',
                   gap: '8px',
                   cursor: 'pointer',
                   zIndex: 35,
                   animation: 'fadeIn 0.5s ease',
                   transition: 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                   opacity: selectedPart && selectedPart.id !== part.id ? 0.3 : 1
                 }}
               >
                 <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '16px', height: '16px', flexShrink: 0 }}>
                   <div style={{ 
                     width: '8px', 
                     height: '8px', 
                     backgroundColor: selectedPart?.id === part.id ? colors.highlight : '#ffffff',
                     border: `1.5px solid ${colors.highlight}`, 
                     borderRadius: '50%', 
                     transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                     boxShadow: selectedPart?.id === part.id ? `0 4px 12px rgba(212, 175, 55, 0.4)` : '0 2px 4px rgba(0,0,0,0.1)'
                   }} />
                 </div>
  
                 <div style={{
                   color: selectedPart?.id === part.id ? colors.highlight : colors.text,
                   fontSize: '0.85rem',
                   fontWeight: '600',
                   letterSpacing: '0.5px',
                   padding: '4px 10px',
                   backgroundColor: selectedPart?.id === part.id ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                   backdropFilter: 'blur(4px)',
                   borderRadius: '8px',
                   border: `1px solid ${selectedPart?.id === part.id ? 'rgba(212, 175, 55, 0.3)' : 'transparent'}`,
                   whiteSpace: 'nowrap',
                   boxShadow: selectedPart?.id === part.id ? `0 4px 12px rgba(0,0,0,0.05)` : 'none',
                   transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                 }}>
                   {part.name}
                 </div>
               </div>
             );
          })}

          {/* Target dots directly on the geometric trace */}
          {currentParts.map(part => (
             <div 
               key={`target-${part.id}-${isExploded}`}
               style={{
                 position: 'absolute',
                 left: `${part.targetPos.x}%`,
                 top: `${part.targetPos.y}%`,
                 transform: 'translate(-50%, -50%)',
                 width: '8px',
                 height: '8px',
                 backgroundColor: colors.highlight,
                 borderRadius: '50%',
                 pointerEvents: 'none',
                 zIndex: 30,
                 boxShadow: `0 0 0 3px rgba(212, 175, 55, 0.2)`,
                 animation: 'fadeIn 0.5s ease',
                 opacity: selectedPart?.id === part.id ? 1 : 0,
                 transition: 'opacity 0.3s ease'
               }}
             />
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: INFO PANELS */}
      <div style={{
        flex: '0 0 350px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        paddingTop: '3.5rem',
      }}>
        
        {/* DETAILED DESCRIPTION BUBBLE */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.4)',
          transition: 'all 0.3s ease',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: selectedPart ? 'flex-start' : 'center',
        }}>
          {selectedPart ? (
            <div style={{ animation: 'fadeIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.base, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ID • {selectedPart.id}
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: '700', color: '#1d1d1f', letterSpacing: '-0.5px' }}>
                {selectedPart.name}
              </h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#424245' }}>
                {selectedPart.desc}
              </div>
            </div>
          ) : (
            <div style={{ color: '#86868b', fontSize: '0.95rem', textAlign: 'center', fontWeight: '500', animation: 'fadeIn 0.3s ease' }}>
              Hover over a highlighted component to view detailed diagnostics.
            </div>
          )}
        </div>

        {/* SPECS PANEL */}
        {isExploded && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.4)',
            animation: 'fadeIn 0.4s ease'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '800', color: colors.text, letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>
              Technical Specifications
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Ammunition</span>
                <span style={{ color: colors.text, fontWeight: '700' }}>{config.specs.ammo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Action</span>
                <span style={{ color: colors.text, fontWeight: '600', textAlign: 'right', maxWidth: '160px' }}>{config.specs.action}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Rate of Fire</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{config.specs.rateOfFire}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Effective Range</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{config.specs.maxEffectiveRange}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Max Range</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{config.specs.maxRange}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Weight (Empty)</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{config.specs.weight}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.base, fontWeight: '600' }}>Fire Modes</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{config.specs.fireModes}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
