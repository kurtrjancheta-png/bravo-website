import { getSheetData } from './lib/googleSheets.js';

async function test() {
  const data = await getSheetData('1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk', 'ATTACHMENT');
  console.log('Columns:', Object.keys(data[0] || {}));
  console.log('First 2 Rows:', data.slice(0, 2));
}
test();
