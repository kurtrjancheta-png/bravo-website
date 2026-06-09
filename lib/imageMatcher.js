import cadetImages from './cadetImages.json';

/**
 * Robustly matches a cadet's name to a filename in the cadetImages map.
 * 
 * @param {string} surname - The cadet's surname (optional if fullName is provided)
 * @param {string} firstName - The cadet's first name (optional if fullName is provided)
 * @param {string} fullName - The full unstructured name string (from Task Org)
 * @returns {string|null} - The mapped relative image URL, or null if not found
 */
const cleanStr = (s) => {
  if (!s) return '';
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(?:JR|SR)\.?\b/gi, '').replace(/[~]/g, '').trim().toLowerCase();
};

export function getCadetImageUrl(surname, firstName, fullName) {
  const targetSur = cleanStr(surname);
  const targetFirst = cleanStr(firstName).split(' ')[0];
  const fullLower = cleanStr(fullName);

  // 1. Exact match for 1CL (LASTNAME.png)
  if (targetSur) {
    const exact1cl = `${targetSur}.png`;
    for (const filename of Object.keys(cadetImages)) {
      if (cleanStr(filename) === exact1cl) {
        return cadetImages[filename];
      }
    }
  }

  // 2. Custom manual fixes to guarantee matches for specific edge cases
  if (targetSur === 'auncionmh' || targetSur === 'auncion') {
    return cadetImages["Copy of Asuncion, Markin H-2844.jpg"];
  }
  if (targetSur === 'penaredondo') {
    return cadetImages["Copy of Pen~aredondo, Payapa L-103092.jpg"];
  }
  if (targetSur === 'balmera') {
    return cadetImages["Copy of Balmera, Jon Bence D-2742.jpg"];
  }

  // 3. Exact match using fullName if surname is missing but fullName has the surname
  if (!targetSur && fullLower) {
    for (const filename of Object.keys(cadetImages)) {
      if (filename.endsWith('.png')) {
        const lastName = cleanStr(filename.replace('.png', ''));
        if (fullLower.includes(lastName)) {
           return cadetImages[filename];
        }
      }
    }
  }

  // 3. Fuzzy matching for 2CL/3CL files
  for (const filename of Object.keys(cadetImages)) {
    const fnLower = cleanStr(filename);

    let cleanName = fnLower.replace('copy of ', '').split('-')[0].trim();
    const parts = cleanName.split(',');
    const ln = parts[0] ? parts[0].trim() : '';
    const fn = parts[1] ? parts[1].trim().split(' ')[0] : ''; 

    if (targetSur && targetFirst) {
      if (fnLower.includes(targetSur) && fnLower.includes(targetFirst)) {
        return cadetImages[filename];
      }
    } 
    else if (targetSur && !targetFirst) {
      if (ln && (targetSur === ln || targetSur.includes(ln) || ln.includes(targetSur))) {
         return cadetImages[filename];
      }
      if (fnLower.includes(targetSur)) {
         return cadetImages[filename];
      }
    }
    else if (fullLower) {
      if (ln && fn && fullLower.includes(ln) && fullLower.includes(fn)) {
        return cadetImages[filename];
      }
    }
  }

  return null;
}
