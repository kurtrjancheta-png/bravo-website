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

export function getCadetImageUrl(surname, firstName, fullName, classLevel = '') {
  const targetSur = cleanStr(surname);
  const targetFirst = cleanStr(firstName).split(' ')[0];
  const fullLower = cleanStr(fullName);
  const targetClass = classLevel ? `/${classLevel.toLowerCase()}/` : '';

  // 1. Exact match for 1CL (LASTNAME.png)
  if (targetSur) {
    const exact1cl = `${targetSur}.png`;
    for (const filename of Object.keys(cadetImages)) {
      if (cleanStr(filename) === exact1cl) {
        if (!targetClass || cadetImages[filename].includes(targetClass)) {
          return cadetImages[filename];
        }
      }
    }
  }

  // 2. Custom manual fixes to guarantee matches for specific edge cases
  if (targetSur === 'auncionmh' || targetSur === 'auncion') {
    return cadetImages["Copy of Asuncion, Markin H-2844.jpg"];
  }
  if (targetSur === 'penaredondo') {
    return cadetImages["Copy of Penaredondo, Payapa L-103092.jpg"];
  }
  if (targetSur === 'balmera') {
    return cadetImages["Copy of Balmera, Jon Bence D-2742.jpg"];
  }
  if (targetSur === 'mamaed') {
    return null;
  }

  // 3. Exact match using fullName if surname is missing but fullName has the surname
  if (!targetSur && fullLower) {
    for (const filename of Object.keys(cadetImages)) {
      if (filename.endsWith('.png')) {
        const lastName = cleanStr(filename.replace('.png', ''));
        if (fullLower.includes(lastName)) {
           if (!targetClass || cadetImages[filename].includes(targetClass)) {
             return cadetImages[filename];
           }
        }
      }
    }
  }

  // 4. Fuzzy matching for 2CL/3CL files
  let fallbackMatch = null;
  for (const filename of Object.keys(cadetImages)) {
    const fnLower = cleanStr(filename);

    let cleanName = fnLower.replace('copy of ', '').split('-')[0].trim();
    const parts = cleanName.split(',');
    const ln = parts[0] ? parts[0].trim() : '';
    const fn = parts[1] ? parts[1].trim().split(' ')[0] : ''; 
    
    const isClassMatch = !targetClass || cadetImages[filename].includes(targetClass);

    if (targetSur && targetFirst) {
      if (fnLower.includes(targetSur) && fnLower.includes(targetFirst)) {
        if (isClassMatch) return cadetImages[filename];
        if (!fallbackMatch) fallbackMatch = cadetImages[filename];
      }
    } 
    else if (targetSur && !targetFirst) {
      if (ln && (targetSur === ln || targetSur.includes(ln) || ln.includes(targetSur))) {
         if (isClassMatch) return cadetImages[filename];
         if (!fallbackMatch) fallbackMatch = cadetImages[filename];
      }
      if (fnLower.includes(targetSur)) {
         if (isClassMatch) return cadetImages[filename];
         if (!fallbackMatch) fallbackMatch = cadetImages[filename];
      }
    }
    else if (fullLower) {
      if (ln && fn && fullLower.includes(ln) && fullLower.includes(fn)) {
        if (isClassMatch) return cadetImages[filename];
        if (!fallbackMatch) fallbackMatch = cadetImages[filename];
      }
    }
  }

  if (fallbackMatch) return fallbackMatch;

  return null;
}
