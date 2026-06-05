import cadetImages from './cadetImages.json';

/**
 * Robustly matches a cadet's name to a filename in the cadetImages map.
 * 
 * @param {string} surname - The cadet's surname (optional if fullName is provided)
 * @param {string} firstName - The cadet's first name (optional if fullName is provided)
 * @param {string} fullName - The full unstructured name string (from Task Org)
 * @returns {string|null} - The mapped relative image URL, or null if not found
 */
export function getCadetImageUrl(surname, firstName, fullName) {
  // 1. Exact match for 1CL (LASTNAME.png)
  if (surname) {
    const exact1cl = `${surname.toUpperCase()}.png`;
    if (cadetImages[exact1cl]) return cadetImages[exact1cl];
  }

  // 2. Exact match using fullName if surname is missing but fullName has the surname
  if (!surname && fullName) {
    for (const filename of Object.keys(cadetImages)) {
      if (filename.endsWith('.png')) {
        const lastName = filename.replace('.png', '').toUpperCase();
        if (fullName.toUpperCase().includes(lastName)) {
           return cadetImages[filename];
        }
      }
    }
  }

  // 3. Fuzzy matching for 2CL/3CL files (e.g. "Copy of Aday, Kent Anthony-50164 copy.jpg")
  const targetSur = surname ? surname.toLowerCase() : '';
  const targetFirst = firstName ? firstName.toLowerCase().split(' ')[0] : ''; // just use the very first name
  const fullLower = fullName ? fullName.toLowerCase() : '';

  for (const filename of Object.keys(cadetImages)) {
    const fnLower = filename.toLowerCase();

    // If we have strict structured data
    if (targetSur && targetFirst) {
      if (fnLower.includes(targetSur) && fnLower.includes(targetFirst)) {
        return cadetImages[filename];
      }
    } 
    // If we only have an unstructured full name
    else if (fullLower) {
      // Extract the name part from the filename
      // "copy of aday, kent anthony-50164 copy.jpg" -> "aday, kent anthony"
      let cleanName = fnLower.replace('copy of ', '').split('-')[0].trim();
      const parts = cleanName.split(',');
      if (parts.length === 2) {
        const ln = parts[0].trim();
        const fn = parts[1].trim().split(' ')[0]; // first word of first name
        if (fullLower.includes(ln) && fullLower.includes(fn)) {
          return cadetImages[filename];
        }
      }
    }
  }

  return null;
}
