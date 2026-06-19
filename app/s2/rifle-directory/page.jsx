import { getRifleInventory } from './api';
import DirectoryClient from './DirectoryClient';

export default async function RifleDirectoryPage() {
  const inventory = await getRifleInventory();
  
  return (
    <div style={{ 
      backgroundColor: '#f5f5f7', // iOS light gray background
      minHeight: 'calc(100vh - 64px)', 
      padding: '3rem 4rem', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      color: '#1d1d1f' 
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .main-content {
          max-width: 100% !important;
          width: 100% !important;
          padding: 0 !important;
        }
        .main-wrapper {
          background-color: #f5f5f7 !important;
        }
      `}} />
      <div style={{ 
        width: '100%', 
        maxWidth: '1600px',
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          letterSpacing: '-0.5px', 
          color: '#1d1d1f' 
        }}>
          Rifle Directory
        </h1>
        <div style={{ 
          fontSize: '1rem', 
          color: '#86868b', // iOS secondary text
          marginTop: '0.2rem',
          fontWeight: '400'
        }}>
          Tactical Asset Management & Diagnostics
        </div>
      </div>
      
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        <DirectoryClient initialInventory={inventory} />
      </div>
    </div>
  );
}
