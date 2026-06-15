import { getRifleInventory } from './api';
import DirectoryClient from './DirectoryClient';

export default async function RifleDirectoryPage() {
  const inventory = await getRifleInventory();
  
  return (
    <div>
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-gold)' }}>🛡️</span> S2 Rifle Directory
        </h1>
        <div className="section-subtitle">Tactical Asset Management & Diagnostics</div>
      </div>
      <DirectoryClient initialInventory={inventory} />
    </div>
  );
}
