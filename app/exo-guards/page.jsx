import EXOGuardsClient from './EXOGuardsClient';

export const revalidate = 60; // 1 minute

export default async function EXOGuardsPage() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNVo5buoeHliZfJ17yLduSCMEPfoHkuvXNnAT8ed-wIs0lVE6ucpkvItNZN2zv0SbtTw/exec';
  
  let data = [];
  try {
    const res = await fetch(SCRIPT_URL, { cache: 'no-store' });
    data = await res.json();
  } catch (err) {
    console.error("Failed to fetch EXO Guards API", err);
  }
  
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guard Posting Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
          Real-time integration with the EX-O 1CL Posting Tracker
        </p>
      </div>
      <EXOGuardsClient initialData={data} />
    </div>
  );
}
