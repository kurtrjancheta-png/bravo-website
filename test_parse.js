import { getSheetData } from './lib/googleSheets.js';

async function test() {
  const data = await getSheetData('1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk', 'ATTACHMENT');
  
  let currentDisposition = null;
  const parsedAttachments = [];

  data.forEach(row => {
    const vals = Object.values(row).map(v => typeof v === 'string' ? v.trim() : String(v || ''));
    
    // Attempt to identify a category header
    // e.g. "FAD (3)", "RESTRICTED", "AWOL"
    if (vals[0] && vals[0] !== 'ATTACHMENT' && !vals[0].includes('AS OF') && vals[0] !== 'NO.' && parseInt(vals[0]).toString() !== vals[0]) {
      // It's likely a category header
      if (vals[1] === '' || vals[1] === 'null' || !vals[1]) {
        currentDisposition = vals[0].replace(/\s*\(\d+\)$/, '').trim();
      }
    }

    const cadetClass = vals[1];
    const name = vals[2];
    const reason = vals[5];

    if (name && cadetClass && cadetClass.includes('CL') && name !== 'NAME') {
      parsedAttachments.push({
        disposition: currentDisposition,
        class: cadetClass,
        name: name,
        reason: reason
      });
    }
  });

  console.log(parsedAttachments);
}
test();
