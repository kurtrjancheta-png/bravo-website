'use client';
import { useState } from 'react';

// ----------------------------------------------------
// 1. ASSEMBLED TRACES
// ----------------------------------------------------

// Highly Accurate M14 Silhouette
const M14Trace = ({ color }) => (
  <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
    <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M 80 178 L 130 178 L 130 190 L 80 190 L 70 184 Z" />
      <line x1="90" y1="178" x2="90" y2="190" />
      <line x1="100" y1="178" x2="100" y2="190" />
      <line x1="110" y1="178" x2="110" y2="190" />
      <line x1="120" y1="178" x2="120" y2="190" />
      <path d="M 115 178 L 115 158 L 125 158 L 130 178" />
      <path d="M 120 158 L 120 168" />
      <path d="M 130 180 L 380 180 L 380 188 L 130 188 Z" />
      <path d="M 230 195 L 380 195 L 380 208 L 230 208 Z" />
      <circle cx="240" cy="201" r="3" />
      <path d="M 380 180 L 530 180 L 530 195 L 700 195 L 940 185 L 950 185 L 950 270 L 940 270 L 830 240 L 740 250 L 710 240 L 680 215 L 530 215 L 380 205 Z" fill="rgba(134,134,139,0.05)" />
      <path d="M 530 165 L 680 165 L 680 180 L 530 180 Z" />
      <path d="M 540 165 L 540 155 L 640 155 L 640 165" />
      <rect x="580" y="155" width="40" height="8" />
      <path d="M 660 165 L 660 145 L 685 145 L 685 165" />
      <circle cx="672" cy="150" r="6" />
      <circle cx="672" cy="150" r="2" />
      <path d="M 545 215 L 585 215 L 583 236 L 543 235 Z" />
      <line x1="550" y1="220" x2="548" y2="232" />
      <path d="M 610 215 C 610 245, 650 245, 660 215" fill="none" />
      <path d="M 630 215 Q 630 230 640 235" fill="none" />
      <path d="M 950 185 L 960 185 L 960 272 L 950 270 Z" />
      <line x1="955" y1="190" x2="955" y2="265" strokeDasharray="2 2" />
      <path d="M 400 205 L 400 215 L 415 215 L 415 205" fill="none" />
      <path d="M 850 245 L 850 255 L 865 255 L 865 245" fill="none" />
    </g>
  </svg>
);

// Highly Accurate M16 Silhouette
const TacticalTrace = ({ color }) => (
  <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
    <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M 80 178 L 110 178 L 110 190 L 80 190 Z" />
      <line x1="90" y1="178" x2="90" y2="190" />
      <line x1="100" y1="178" x2="100" y2="190" />
      <path d="M 110 182 L 280 182 L 280 186 L 110 186 Z" />
      <path d="M 230 182 L 230 175 L 280 175 L 280 182 Z" /> 
      <path d="M 250 182 L 250 135 L 265 135 L 275 182" />
      <circle cx="260" cy="150" r="4" />
      <path d="M 250 186 L 250 200 L 265 200 L 265 186" />
      <path d="M 280 170 L 480 170 L 480 205 L 280 195 Z" fill="rgba(134,134,139,0.05)" />
      <path d="M 290 170 L 290 195" />
      <path d="M 310 170 L 310 196" />
      <path d="M 330 170 L 330 197" />
      <path d="M 350 170 L 350 198" />
      <path d="M 370 170 L 370 200" />
      <path d="M 390 170 L 390 201" />
      <path d="M 410 170 L 410 202" />
      <path d="M 430 170 L 430 203" />
      <path d="M 450 170 L 450 204" />
      <path d="M 470 170 L 470 205" />
      <path d="M 480 168 L 490 165 L 490 205 L 480 205 Z" />
      <path d="M 490 165 L 680 165 L 680 190 L 490 190 Z" />
      <path d="M 500 165 L 530 125 L 630 125 L 660 165 Z" />
      <path d="M 540 135 L 620 135 L 620 155 L 540 155 Z" fill="none" />
      <circle cx="645" cy="135" r="5" />
      <path d="M 490 190 L 650 190 L 650 215 L 610 215 L 610 225 L 490 225 Z" />
      <circle cx="530" cy="205" r="3" />
      <circle cx="630" cy="200" r="4" />
      <path d="M 495 225 L 540 225 L 535 340 L 485 330 C 485 330, 480 280, 495 225 Z" />
      <path d="M 505 235 C 495 280, 500 325, 500 325" fill="none" />
      <path d="M 525 235 C 515 280, 520 325, 520 325" fill="none" />
      <path d="M 580 225 L 610 225 L 590 300 C 580 300, 570 290, 575 280 C 585 270, 570 250, 570 240 Z" />
      <path d="M 540 225 C 540 240, 570 240, 580 225" fill="none" />
      <path d="M 565 225 C 565 235, 560 235, 560 235" fill="none" />
      <rect x="680" y="170" width="30" height="20" />
      <path d="M 710 165 L 900 175 L 900 255 L 870 255 L 750 200 L 710 200 Z" fill="rgba(134,134,139,0.05)" />
      <path d="M 900 175 L 910 175 L 910 255 L 900 255 Z" />
    </g>
  </svg>
);


// ----------------------------------------------------
// 2. EXPLODED TRACES (NEW)
// ----------------------------------------------------

const M14ExplodedTrace = ({ color }) => (
  <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
    <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      
      {/* 1. UPPER ASSEMBLY (Receiver & Barrel) - shifted UP and LEFT */}
      <g transform="translate(-10, -80)">
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

      {/* 2. CHASSIS / STOCK - shifted DOWN and RIGHT */}
      <g transform="translate(10, 40)">
        <path d="M 230 195 L 380 195 L 380 208 L 230 208 Z" />
        <path d="M 380 195 L 530 195 L 530 215 L 680 215 L 710 240 L 740 250 L 830 240 L 940 270 L 950 270 L 950 185 L 940 185 L 700 195 L 530 195 Z" fill="rgba(134,134,139,0.05)" />
        <path d="M 950 185 L 960 185 L 960 272 L 950 270 Z" />
        <line x1="955" y1="190" x2="955" y2="265" strokeDasharray="2 2" />
        <path d="M 850 245 L 850 255 L 865 255 L 865 245" fill="none" />
      </g>

      {/* 3. TRIGGER GROUP - shifted far DOWN */}
      <g transform="translate(10, 110)">
        <path d="M 610 215 C 610 245, 650 245, 660 215" fill="none" />
        <path d="M 630 215 Q 630 230 640 235" fill="none" />
        <rect x="615" y="215" width="40" height="10" />
      </g>

      {/* 4. MAGAZINE - shifted far DOWN and LEFT */}
      <g transform="translate(-10, 100)">
        <path d="M 545 215 L 585 215 L 583 236 L 543 235 Z" />
        <line x1="550" y1="220" x2="548" y2="232" />
      </g>

      {/* 5. GAS CYLINDER / OP ROD (Internal) - shifted LEFT and slightly down from upper */}
      <g transform="translate(-40, -40)">
        <path d="M 230 195 L 480 195 L 480 205 L 230 205 Z" fill="rgba(212,175,55,0.1)" />
        <rect x="440" y="190" width="10" height="20" />
        <circle cx="240" cy="200" r="4" />
      </g>

      {/* 6. BOLT & SPRING (Internal) - drawn cleanly below the receiver */}
      <g transform="translate(530, -30)">
        <rect x="0" y="170" width="80" height="15" rx="3" fill="rgba(212,175,55,0.15)" />
        <line x1="10" y1="172" x2="10" y2="183" />
        <line x1="15" y1="172" x2="15" y2="183" />
        <path d="M 80 177 Q 85 170 90 177 T 100 177 T 110 177 T 120 177 T 130 177 T 140 177" fill="none" strokeDasharray="1 2" />
      </g>

      {/* 7. 7.62x51mm NATO BULLET - Anchored prominently */}
      <g transform="translate(450, -220)">
        <path d="M 0 10 L 30 10 L 35 13 L 40 13 L 40 27 L 35 27 L 30 30 L 0 30 Z" fill="rgba(212,175,55,0.2)" stroke={color} />
        <path d="M 40 14 L 60 16 L 65 20 L 60 24 L 40 26 Z" fill="rgba(134,134,139,0.3)" stroke={color} />
        <text x="32" y="50" fontSize="13" fontWeight="600" fill={color} textAnchor="middle" stroke="none">7.62×51mm NATO</text>
      </g>

    </g>
  </svg>
);


const TacticalExplodedTrace = ({ color }) => (
  <svg viewBox="0 0 1000 1200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
    <g transform="translate(0, 400)" fill="rgba(212, 175, 55, 0.05)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      
      {/* 1. UPPER RECEIVER & BARREL - Shifted UP and pivoted slightly */}
      <g transform="translate(-10, -70)">
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

      {/* 2. LOWER RECEIVER & STOCK - Anchored in middle slightly down */}
      <g transform="translate(10, 40)">
        <path d="M 490 190 L 650 190 L 650 215 L 610 215 L 610 225 L 490 225 Z" />
        <circle cx="530" cy="205" r="3" />
        <circle cx="630" cy="200" r="4" />
        <path d="M 580 225 L 610 225 L 590 300 C 580 300, 570 290, 575 280 C 585 270, 570 250, 570 240 Z" />
        <path d="M 540 225 C 540 240, 570 240, 580 225" fill="none" />
        <path d="M 710 165 L 900 175 L 900 255 L 870 255 L 750 200 L 710 200 Z" fill="rgba(134,134,139,0.05)" />
        <path d="M 900 175 L 910 175 L 910 255 L 900 255 Z" />
        <rect x="650" y="175" width="60" height="20" />
      </g>

      {/* 3. MAGAZINE - Shifted DOWN */}
      <g transform="translate(10, 100)">
        <path d="M 495 225 L 540 225 L 535 340 L 485 330 C 485 330, 480 280, 495 225 Z" />
        <path d="M 505 235 C 495 280, 500 325, 500 325" fill="none" />
        <path d="M 525 235 C 515 280, 520 325, 520 325" fill="none" />
      </g>

      {/* 4. BOLT CARRIER GROUP (BCG) (Internal) - Pulled backward and up */}
      <g transform="translate(640, -50)">
        <path d="M 0 175 L 80 175 L 80 188 L 0 188 Z" fill="rgba(212,175,55,0.15)" />
        <rect x="20" y="170" width="30" height="5" />
        <circle cx="10" cy="181.5" r="3" />
        <path d="M -15 178 L 0 178 L 0 185 L -15 185 Z" />
      </g>

      {/* 5. CHARGING HANDLE (Internal) - Pulled backward, above BCG */}
      <g transform="translate(680, -90)">
        <rect x="0" y="170" width="100" height="6" />
        <path d="M 100 165 L 110 165 L 110 180 L 100 180 Z" />
        <circle cx="110" cy="172.5" r="3" />
      </g>

      {/* 6. BUFFER SPRING (Internal) - Pulled backward out of the stock */}
      <g transform="translate(800, -20)">
        <path d="M 0 185 Q 10 175 20 185 T 40 185 T 60 185 T 80 185 T 100 185 T 120 185 T 140 185" fill="none" />
      </g>

      {/* 7. 5.56x45mm NATO BULLET */}
      <g transform="translate(450, -220)">
        <path d="M 0 10 L 25 10 L 30 13 L 35 13 L 35 27 L 30 27 L 25 30 L 0 30 Z" fill="rgba(212,175,55,0.2)" stroke={color} />
        <path d="M 35 14 L 50 15 L 55 20 L 50 25 L 35 26 Z" fill="rgba(134,134,139,0.3)" stroke={color} />
        <text x="27" y="50" fontSize="13" fontWeight="600" fill={color} textAnchor="middle" stroke="none">5.56×45mm NATO</text>
      </g>
    </g>
  </svg>
);


// ----------------------------------------------------
// 3. CONFIGURATIONS & MAPPINGS
// ----------------------------------------------------

const weaponConfigs = {
  'M14': {
    TraceComponent: M14Trace,
    ExplodedComponent: M14ExplodedTrace,
    parts: [
      { id: 'flash_hider', name: 'Flash Suppressor', targetPos: { x: 10.5, y: 48.66 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'National Match profile slotted flash suppressor.' },
      { id: 'rear_sight', name: 'Rear Peep Sight', targetPos: { x: 67.2, y: 45.83 }, labelPos: { x: 95, y: 12, align: 'right' }, desc: 'Fully adjustable rear aperture sight.' },
      { id: 'stock_front', name: 'Walnut Forestock', targetPos: { x: 45, y: 49.58 }, labelPos: { x: 5, y: 19, align: 'left' }, desc: 'The front section of the chassis.' },
      { id: 'receiver', name: 'Forged Receiver', targetPos: { x: 60, y: 47.66 }, labelPos: { x: 95, y: 26, align: 'right' }, desc: 'The core of the M14. Forged from 8620 alloy steel.' },
      { id: 'barrel', name: '22" Match Barrel', targetPos: { x: 20, y: 48.66 }, labelPos: { x: 5, y: 33, align: 'left' }, desc: '22-inch heavy barrel. 1:12 RH twist rate.' },
      { id: 'buttplate', name: 'Hinged Buttplate', targetPos: { x: 95.5, y: 52.33 }, labelPos: { x: 95, y: 40, align: 'right' }, desc: 'Checkered steel buttplate.' },
      { id: 'front_sight', name: 'Front Sight', targetPos: { x: 12, y: 47.33 }, labelPos: { x: 5, y: 60, align: 'left' }, desc: 'Winged front sight post.' },
      { id: 'stock_rear', name: 'Fixed Buttstock', targetPos: { x: 80, y: 51.66 }, labelPos: { x: 95, y: 67, align: 'right' }, desc: 'A traditional sloping wooden chassis.' },
      { id: 'gas_cylinder', name: 'Gas Cylinder', targetPos: { x: 30, y: 50.08 }, labelPos: { x: 5, y: 74, align: 'left' }, desc: 'Short-stroke gas piston system.' },
      { id: 'trigger', name: 'Trigger Group', targetPos: { x: 63.5, y: 52.5 }, labelPos: { x: 95, y: 81, align: 'right' }, desc: 'Two-stage military trigger.' },
      { id: 'magazine', name: '20-Round Box', targetPos: { x: 56, y: 52.1 }, labelPos: { x: 5, y: 88, align: 'left' }, desc: 'Detachable 20-round double-stack magazine.' },
    ],
    exploded: [
      { id: 'upper_assembly', name: 'Upper Assembly', targetPos: { x: 50, y: 41 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'The heavy barrel and forged receiver separated from the chassis.' },
      { id: 'bullet', name: '7.62×51mm', targetPos: { x: 48, y: 22 }, labelPos: { x: 95, y: 15, align: 'right' }, desc: 'High-power 7.62x51mm NATO cartridge utilized by the M14.' },
      { id: 'op_rod', name: 'Operating Rod', targetPos: { x: 35, y: 47 }, labelPos: { x: 5, y: 25, align: 'left' }, desc: 'The heavy gas piston operating rod that cycles the rotating bolt.' },
      { id: 'bolt', name: 'Bolt & Spring', targetPos: { x: 60, y: 47.5 }, labelPos: { x: 95, y: 35, align: 'right' }, desc: 'The locking bolt and recoil spring assembly extracted from the receiver.' },
      { id: 'stock_chassis', name: 'Wooden Chassis', targetPos: { x: 50, y: 55 }, labelPos: { x: 5, y: 65, align: 'left' }, desc: 'The wooden lower stock providing the main bedding for the weapon.' },
      { id: 'trigger_assembly', name: 'Trigger Group', targetPos: { x: 63, y: 61 }, labelPos: { x: 95, y: 80, align: 'right' }, desc: 'Two-stage trigger mechanism detached and dropped out from the chassis.' },
      { id: 'magazine', name: '20-Rnd Magazine', targetPos: { x: 55, y: 60 }, labelPos: { x: 5, y: 85, align: 'left' }, desc: 'Detachable 20-round double-stack box magazine.' },
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
    TraceComponent: TacticalTrace,
    ExplodedComponent: TacticalExplodedTrace,
    parts: [
      { id: 'flash_hider', name: 'A2 Flash Hider', targetPos: { x: 9.5, y: 48.66 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'Standard A2 birdcage flash hider.' },
      { id: 'carry_handle', name: 'Detachable Carry Handle', targetPos: { x: 58, y: 45.41 }, labelPos: { x: 95, y: 13, align: 'right' }, desc: 'Detachable A2 carry handle mounted to the Picatinny rail.' },
      { id: 'handguard', name: 'Polymer Handguard', targetPos: { x: 38, y: 48.91 }, labelPos: { x: 5, y: 21, align: 'left' }, desc: 'Standard ribbed polymer handguard.' },
      { id: 'upper', name: 'Upper Receiver', targetPos: { x: 55, y: 48.08 }, labelPos: { x: 95, y: 29, align: 'right' }, desc: 'Forged 7075-T6 aluminum flat-top upper receiver.' },
      { id: 'barrel', name: '20" Chrome-Lined Barrel', targetPos: { x: 18, y: 48.66 }, labelPos: { x: 5, y: 37, align: 'left' }, desc: '20-inch 4150 CMV steel barrel.' },
      { id: 'front_sight', name: 'A2 Front Sight Base', targetPos: { x: 26, y: 45.83 }, labelPos: { x: 5, y: 60, align: 'left' }, desc: 'Forged A2 profile front sight base.' },
      { id: 'stock', name: 'A2 Fixed Stock', targetPos: { x: 80, y: 50.83 }, labelPos: { x: 95, y: 68, align: 'right' }, desc: 'A2 profile fixed polymer stock.' },
      { id: 'lower', name: 'Lower Receiver', targetPos: { x: 55, y: 50.41 }, labelPos: { x: 5, y: 76, align: 'left' }, desc: 'Forged 7075-T6 aluminum lower receiver.' },
      { id: 'grip', name: 'A2 Pistol Grip', targetPos: { x: 59, y: 55.0 }, labelPos: { x: 95, y: 84, align: 'right' }, desc: 'Standard A2 profile polymer pistol grip.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 51.5, y: 56.66 }, labelPos: { x: 5, y: 92, align: 'left' }, desc: 'Standard NATO STANAG 30-round curved box magazine.' }
    ],
    exploded: [
      { id: 'bullet', name: '5.56×45mm', targetPos: { x: 48, y: 22 }, labelPos: { x: 5, y: 5, align: 'left' }, desc: 'Intermediate 5.56x45mm rifle cartridge standard for NATO forces.' },
      { id: 'upper_rec', name: 'Upper Assembly', targetPos: { x: 50, y: 41 }, labelPos: { x: 95, y: 15, align: 'right' }, desc: 'Barrel and upper receiver pivoted off the takedown pin.' },
      { id: 'charging_handle', name: 'Charging Handle', targetPos: { x: 74, y: 39.5 }, labelPos: { x: 5, y: 25, align: 'left' }, desc: 'T-handle used to manually cycle the action.' },
      { id: 'bcg', name: 'Bolt Carrier Group', targetPos: { x: 70, y: 44 }, labelPos: { x: 95, y: 35, align: 'right' }, desc: 'The BCG extracted backward from the upper receiver.' },
      { id: 'lower_rec', name: 'Lower Receiver', targetPos: { x: 55, y: 53.5 }, labelPos: { x: 5, y: 65, align: 'left' }, desc: 'The serialized lower holding the fire control group and stock.' },
      { id: 'buffer', name: 'Buffer Spring', targetPos: { x: 88, y: 48 }, labelPos: { x: 95, y: 80, align: 'right' }, desc: 'Recoil buffer system extracted from inside the fixed stock.' },
      { id: 'magazine', name: 'STANAG Magazine', targetPos: { x: 51, y: 62 }, labelPos: { x: 5, y: 85, align: 'left' }, desc: '30-round 5.56 box magazine.' },
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

  const type = weaponConfigs[rifle.rifleType] ? rifle.rifleType : 'M16';
  const config = weaponConfigs[type];
  
  const TraceComponent = isExploded ? config.ExplodedComponent : config.TraceComponent;
  const currentParts = isExploded ? config.exploded : config.parts;

  // iOS-style refined color palette
  const colors = {
    base: '#86868b',      
    highlight: '#d4af37', 
    text: '#1d1d1f',      
  };

  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'transparent',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
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

      {/* CENTRAL SCHEMATIC AREA */}
      <div style={{ 
        flex: 1, 
        marginTop: '0rem', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative',
        padding: '0'
      }}>
        
        {/* Main Weapon Container */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: 'none',
          aspectRatio: '0.833', 
          zIndex: 10,
        }}>
          
          {/* NATIVE SVG RIFLE TRACE */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, transition: 'all 0.4s ease' }}>
            <TraceComponent color={colors.base} />
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
                 onMouseEnter={() => setSelectedPart(part)}
                 onMouseLeave={() => setSelectedPart(null)}
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
                   transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                   opacity: selectedPart && selectedPart.id !== part.id ? 0.3 : 1
                 }}
               >
                 <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '16px', height: '16px', flexShrink: 0 }}>
                   <div style={{ 
                     width: selectedPart?.id === part.id ? '12px' : '6px', 
                     height: selectedPart?.id === part.id ? '12px' : '6px', 
                     backgroundColor: selectedPart?.id === part.id ? colors.highlight : '#ffffff',
                     border: `1.5px solid ${selectedPart?.id === part.id ? colors.highlight : colors.highlight}`, 
                     borderRadius: '50%', 
                     transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                     boxShadow: selectedPart?.id === part.id ? `0 4px 12px rgba(212, 175, 55, 0.4)` : '0 2px 4px rgba(0,0,0,0.1)'
                   }} />
                 </div>
  
                 <div style={{
                   color: selectedPart?.id === part.id ? colors.highlight : colors.text,
                   fontSize: '0.85rem',
                   fontWeight: selectedPart?.id === part.id ? '700' : '600',
                   letterSpacing: '0.5px',
                   padding: '2px 8px',
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
                 opacity: selectedPart?.id === part.id ? 1 : 0,
                 transition: 'opacity 0.3s ease'
               }}
             />
          ))}
        </div>
      </div>

      {/* SPECS PANEL - Shown only in Exploded View */}
      {isExploded && (
        <div style={{
          position: 'absolute',
          bottom: '2%',
          left: '5%',
          width: '320px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '1.5rem',
          zIndex: 40,
          pointerEvents: 'none',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'slideInLeft 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
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

      {/* DETAILED DESCRIPTION OVERLAY - Minimalist iOS floating panel */}
      {selectedPart && (
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '320px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '1.5rem',
          zIndex: 50,
          pointerEvents: 'none',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}>
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
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}} />
    </div>
  );
}
