import EXOGuardsClient from './EXOGuardsClient';
import { getSheetData } from '../../lib/googleSheets';
import { getCadetImageUrl } from '../../lib/imageMatcher';

export const revalidate = 60; // 1 minute

export default async function EXOGuardsPage() {
  const SCRIPT_URL_1CL = 'https://script.google.com/macros/s/AKfycbwNVo5buoeHliZfJ17yLduSCMEPfoHkuvXNnAT8ed-wIs0lVE6ucpkvItNZN2zv0SbtTw/exec';
  const SCRIPT_URL_2CL = 'https://script.google.com/macros/s/AKfycbx9slx3s4GRQCnR98HrUmSfRvJnKfbWoHjLq2avXeoNqYCthhUlOS1iYP1t-ORb_zLL/exec';
  const SCRIPT_URL_3CL = 'https://script.google.com/macros/s/AKfycbxs0fmHK3QikUCYBTSnD_xuh7sVoXF5urCISgtQvGz5QJHiRF94e0ajx0XwSoZ09X-3tg/exec';
  const SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
  
  let data1CL = [];
  let data2CL = [];
  let data3CL = [];
  let soiData = [];

  try {
    const res1 = await fetch(SCRIPT_URL_1CL, { cache: 'no-store' }).catch(() => ({ ok: false }));
    if (res1.ok) {
      const rawData = await res1.json();
      data1CL = rawData.map(item => ({
        ...item,
        localImageUrl: getCadetImageUrl((item.name || '').replace(' AS', '').trim(), '', (item.name || '').replace(' AS', '').trim())
      }));
    }
  } catch (err) {
    console.error("Failed to fetch 1CL API", err);
  }

  try {
    const res2 = await fetch(SCRIPT_URL_2CL, { cache: 'no-store' }).catch(() => ({ ok: false }));
    if (res2.ok) {
      const rawData = await res2.json();
      data2CL = rawData.map(item => ({
        ...item,
        localImageUrl: getCadetImageUrl((item.name || '').replace(' AS', '').trim(), '', (item.name || '').replace(' AS', '').trim())
      }));
    }
  } catch (err) {
    console.error("Failed to fetch 2CL API", err);
  }

  try {
    const res3 = await fetch(SCRIPT_URL_3CL, { cache: 'no-store' }).catch(() => ({ ok: false }));
    if (res3.ok) {
      const rawData = await res3.json();
      data3CL = rawData.map(item => ({
        ...item,
        localImageUrl: getCadetImageUrl((item.name || '').replace(' AS', '').trim(), '', (item.name || '').replace(' AS', '').trim())
      }));
    }
  } catch (err) {
    console.error("Failed to fetch 3CL API", err);
  }

  try {
    const rawSoiRows = await getSheetData(SHEET_ID, 'SOI');
    soiData = rawSoiRows || [];
  } catch (err) {
    console.error("Failed to fetch SOI Data", err);
  }
  
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guard Posting Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
          Real-time integration with the EX-O Posting Trackers
        </p>
      </div>
      <EXOGuardsClient data1CL={data1CL} data2CL={data2CL} data3CL={data3CL} soiData={soiData} />
    </div>
  );
}
