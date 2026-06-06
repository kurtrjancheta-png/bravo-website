import { getSheetData } from './lib/googleSheets.js';
getSheetData('1NuHPJjABd_kkDGCZYyxEucN_JE15_FQyXm18E1bfaBY', 'CONDUCT')
  .then(data => console.log(JSON.stringify(data.slice(0, 5), null, 2)))
  .catch(err => console.error(err));
