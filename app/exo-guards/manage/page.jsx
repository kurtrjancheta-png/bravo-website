import EXOGuardsManagerClient from './EXOGuardsManagerClient';
import { getSheetData } from '../../../lib/googleSheets';
import { getCadetImageUrl } from '../../../lib/imageMatcher';

export const revalidate = 0; // Don't cache this page so the manager always sees fresh data

export default async function EXOGuardsManagePage() {
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
          Guard Posting Manager
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
          Assign and modify guard postings.
        </p>
      </div>
      <EXOGuardsManagerClient 
        data1CL={data1CL} 
        data2CL={data2CL}
        data3CL={data3CL} 
        soiData={soiData} 
        apiUrl1CL={SCRIPT_URL_1CL}
        apiUrl2CL={SCRIPT_URL_2CL}
        apiUrl3CL={SCRIPT_URL_3CL}
        sheetUrl1CL="https://docs.google.com/spreadsheets/d/15h750ppwsmx_Cps87ShLlRRr30NQXPjriL1YGW0WTSU/edit?gid=71321443#gid=71321443"
        sheetUrl2CL="https://docs.google.com/spreadsheets/d/1Ei-BrCARbEj2tIlH3Ben2wvoxRl2LRZFQWSN_wYzWYo/edit?usp=sharing"
        sheetUrl3CL="https://docs.google.com/spreadsheets/d/12_4BdfSWwmhPyXulMCgf3MAzWD7NpGvFe8Q-cMZq9GI/edit?usp=sharing"
      />
    </div>
  );
}
