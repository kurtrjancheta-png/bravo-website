import EXOGuardsClient from './EXOGuardsClient';

export const revalidate = 60; // 1 minute

export default async function EXOGuardsPage() {
  const SCRIPT_URL_1CL = 'https://script.google.com/macros/s/AKfycbwNVo5buoeHliZfJ17yLduSCMEPfoHkuvXNnAT8ed-wIs0lVE6ucpkvItNZN2zv0SbtTw/exec';
  const SCRIPT_URL_3CL = 'https://script.google.com/macros/s/AKfycbxs0fmHK3QikUCYBTSnD_xuh7sVoXF5urCISgtQvGz5QJHiRF94e0ajx0XwSoZ09X-3tg/exec';
  
  let data1CL = [];
  let data3CL = [];
  try {
    const [res1, res2] = await Promise.all([
      fetch(SCRIPT_URL_1CL, { cache: 'no-store' }),
      fetch(SCRIPT_URL_3CL, { cache: 'no-store' })
    ]);
    if (res1.ok) data1CL = await res1.json();
    if (res2.ok) data3CL = await res2.json();
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
          Real-time integration with the EX-O 1CL and 3CL Posting Trackers
        </p>
      </div>
      <EXOGuardsClient data1CL={data1CL} data3CL={data3CL} />
    </div>
  );
}
