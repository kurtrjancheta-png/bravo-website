import { getSheetData } from './lib/googleSheets.js';
async function test() {
  const data = await getSheetData('1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk', 'DISPOSITION');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
}
test();
