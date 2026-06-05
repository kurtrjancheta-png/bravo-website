import { getCadetImageUrl } from './lib/imageMatcher.js';

console.log('1CL Match:', getCadetImageUrl('TIMAJO', 'TIMAJO', 'CDT 1CL TIMAJO C-27187'));
console.log('2CL Match strict:', getCadetImageUrl('Aday', 'Kent Anthony', null));
console.log('2CL Match fuzzy:', getCadetImageUrl(null, null, "CDT S/SGT 2CL KENT ANTHONY C ADAY C-28006 'B' CO"));
console.log('3CL Match strict:', getCadetImageUrl('Ascura', 'Alex Huan Karl', null));
