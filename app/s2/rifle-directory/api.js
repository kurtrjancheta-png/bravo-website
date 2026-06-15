export async function getRifleInventory() {
  try {
    const res = await fetch('https://docs.google.com/spreadsheets/d/1UGGxJCoQpetYtqGOCxI-PSMPY1at5O9b3ayFd1pzqRs/export?format=csv&gid=0', { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch spreadsheet');
    const text = await res.text();
    
    // Parse CSV rows
    const rows = text.split('\n').map(row => row.split(','));
    const inventory = [];
    
    // Skip the first row (headers)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length < 10) continue;
      
      const addEntry = (name, serial, cls) => {
        name = name?.trim();
        serial = serial?.trim();
        if (name && serial) {
          inventory.push({ name, serialNumber: serial, class: cls });
        }
      };
      
      addEntry(cols[0], cols[1], '1CL');
      addEntry(cols[4], cols[5], '2CL');
      addEntry(cols[8], cols[9], '3CL');
    }
    
    return inventory;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}
