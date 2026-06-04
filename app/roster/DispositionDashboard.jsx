'use client';

export default function DispositionDashboard({ dispositionData }) {
  if (!dispositionData || dispositionData.length === 0) return null;

  // We only care about the specific status and the TOTAL column.
  // We'll iterate through rows and categorize them based on the layout.
  // Based on the sheet structure:
  // - Category (EFFECTIVE / INEFFECTIVE) is in the first column key.
  // - The Specific Status (FULL DUTY, LEAVE, etc.) is in the second column (index 1).
  // - The TOTAL for that status is in the 'TOTAL' column.
  
  const effectiveItems = [];
  const ineffectiveItems = [];
  
  let currentCategory = 'EFFECTIVE'; // Default starting point based on sheet

  // Find the exact keys
  const keys = Object.keys(dispositionData[0]);
  const categoryKey = keys[0]; // e.g., "DISPOSITION OF TROOPS..."
  const statusKey = keys[1]; // usually empty string or "Column 2"
  const totalKey = 'TOTAL';

  let grandEffective = 0;
  let grandIneffective = 0;

  dispositionData.forEach((row) => {
    const rawCategory = row[categoryKey] ? String(row[categoryKey]).trim().toUpperCase() : '';
    const rawStatus = row[statusKey] ? String(row[statusKey]).trim().toUpperCase() : '';
    const totalVal = parseFloat(row[totalKey]) || 0;

    // Track category headers
    if (rawCategory === 'EFFECTIVE') currentCategory = 'EFFECTIVE';
    if (rawCategory === 'INEFFECTIVE') currentCategory = 'INEFFECTIVE';

    // Skip empty status or header rows like "TOTAL" that are summary rows in the sheet
    if (!rawStatus || rawStatus === 'TOTAL') {
      return;
    }

    if (currentCategory === 'EFFECTIVE') {
      effectiveItems.push({ label: rawStatus, value: totalVal });
      grandEffective += totalVal;
    } else if (currentCategory === 'INEFFECTIVE') {
      ineffectiveItems.push({ label: rawStatus, value: totalVal });
      grandIneffective += totalVal;
    }
  });

  return (
    <div className="disposition-dashboard" style={{ marginBottom: '3rem' }}>
      <h2 style={{ 
        borderBottom: `2px solid var(--border-color)`, 
        paddingBottom: '0.5rem', 
        marginBottom: '1.5rem',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        textTransform: 'uppercase'
      }}>
        DISPOSITION OF TROOPS
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* EFFECTIVE CARD */}
        <div style={{
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ background: '#1a7a3a', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '1px' }}>EFFECTIVE</h3>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{grandEffective}</span>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {effectiveItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx !== effectiveItems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INEFFECTIVE CARD */}
        <div style={{
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ background: '#c0392b', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '1px' }}>INEFFECTIVE</h3>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{grandIneffective}</span>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {ineffectiveItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx !== ineffectiveItems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
