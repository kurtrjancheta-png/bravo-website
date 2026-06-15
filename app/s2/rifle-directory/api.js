export async function getRifleInventory() {
  const sheets = [
    { name: 'M14', gid: '0' },
    { name: 'M16', gid: '607076634' },
    { name: 'R4', gid: '901471089' },
    { name: '9MM', gid: '207511375' }
  ];

  const inventory = [];

  for (const sheet of sheets) {
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/1UGGxJCoQpetYtqGOCxI-PSMPY1at5O9b3ayFd1pzqRs/export?format=csv&gid=${sheet.gid}`, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error(`Failed to fetch ${sheet.name}`);
      const text = await res.text();
      
      const rows = text.split('\n').map(row => row.split(','));
      
      // Skip headers
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < 10) continue;
        
        const addEntry = (name, serial, cls) => {
          name = name?.trim();
          serial = serial?.trim();
          if (name && serial) {
            inventory.push({ 
              name, 
              serialNumber: serial, 
              class: cls,
              rifleType: sheet.name 
            });
          }
        };
        
        addEntry(cols[0], cols[1], '1CL');
        addEntry(cols[4], cols[5], '2CL');
        addEntry(cols[8], cols[9], '3CL');
      }
    } catch (error) {
      console.error(`Error fetching ${sheet.name}:`, error);
    }
  }

  return inventory;
}
