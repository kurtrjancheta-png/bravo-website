import { getRifleInventory } from './api';
import DirectoryClient from './DirectoryClient';

export default async function RifleDirectoryPage() {
  const inventory = await getRifleInventory();
  
  return (
    <div style={{ backgroundColor: '#020a14', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace', color: '#0cd0cd' }}>
      <div style={{ borderBottom: '2px solid #0cd0cd', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.8rem', backgroundColor: '#0cd0cd', color: '#041524', padding: '2px 8px', alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: '0.5rem' }}>SYSTEM: S2_SEC</div>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 10px #0cd0cd', letterSpacing: '2px', textTransform: 'uppercase' }}>
          S2 Rifle Directory
        </h1>
        <div style={{ fontSize: '1rem', letterSpacing: '2px', opacity: 0.8, marginTop: '0.5rem' }}>TACTICAL ASSET MANAGEMENT & DIAGNOSTICS</div>
      </div>
      <DirectoryClient initialInventory={inventory} />
    </div>
  );
}
