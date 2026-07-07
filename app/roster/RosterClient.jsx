'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import SOIGenerator from './SOIGenerator';

export default function RosterClient({ allCadets, class1, class2, class3, soiRows }) {
  // Simple, user-friendly filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBOS, setSelectedBOS] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedBloodType, setSelectedBloodType] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedAllergyStatus, setSelectedAllergyStatus] = useState('ALL'); // ALL, NONE, HAS_ALLERGIES

  const [selectedCadet, setSelectedCadet] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const generatorRef = useRef(null);

  // Dynamic filter options
  const [bloodTypes, setBloodTypes] = useState([]);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    // Extract unique blood types
    const bt = allCadets
      .map(c => c['BLOOD TYPE'])
      .filter(v => v && String(v).trim() !== '')
      .map(v => String(v).trim().toUpperCase());
    setBloodTypes(Array.from(new Set(bt)).sort());

    // Extract unique regions
    const reg = allCadets
      .map(c => c['REGION'])
      .filter(v => v && String(v).trim() !== '')
      .map(v => String(v).trim().toUpperCase());
    setRegions(Array.from(new Set(reg)).sort());
  }, [allCadets]);

  // Apply Quick Presets
  const applyPreset = (presetName) => {
    resetFilters();
    if (presetName === 'NAVY') {
      setSelectedBOS('PN');
    } else if (presetName === 'ARMY') {
      setSelectedBOS('PA');
    } else if (presetName === 'AIRFORCE') {
      setSelectedBOS('PAF');
    } else if (presetName === 'FEMALE') {
      setSelectedGender('F');
    } else if (presetName === 'O_PLUS') {
      setSelectedBloodType('O+');
    } else if (presetName === 'ALLERGIES') {
      setSelectedAllergyStatus('HAS_ALLERGIES');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBOS('ALL');
    setSelectedClass('ALL');
    setSelectedGender('ALL');
    setSelectedBloodType('ALL');
    setSelectedRegion('ALL');
    setSelectedAllergyStatus('ALL');
  };

  // Check if any filter is active
  const hasActiveFilters = 
    searchTerm.trim() !== '' ||
    selectedBOS !== 'ALL' ||
    selectedClass !== 'ALL' ||
    selectedGender !== 'ALL' ||
    selectedBloodType !== 'ALL' ||
    selectedRegion !== 'ALL' ||
    selectedAllergyStatus !== 'ALL';

  // Perform filtration
  const filteredCadets = allCadets.filter(c => {
    // 1. Unified Search Term
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const match = 
        String(c.firstName || '').toLowerCase().includes(q) ||
        String(c.lastName || '').toLowerCase().includes(q) ||
        String(c.middleName || '').toLowerCase().includes(q) ||
        String(c.serialNo || '').toLowerCase().includes(q) ||
        String(c['REGION'] || '').toLowerCase().includes(q) ||
        String(c['RELIGION'] || '').toLowerCase().includes(q) ||
        String(c['ALLERGIES'] || '').toLowerCase().includes(q) ||
        String(c['HOBBIES'] || '').toLowerCase().includes(q) ||
        String(c['NAME OF COLLEGE/ UNIVERSITY'] || '').toLowerCase().includes(q) ||
        String(c['NAME OF HIGH SCHOOL'] || '').toLowerCase().includes(q) ||
        String(c['CLUBS AND ORGANIZATION MEMBERSHIP'] || '').toLowerCase().includes(q) ||
        String(c['CORPS SQUAD MEMBERSHIP'] || '').toLowerCase().includes(q);
      
      if (!match) return false;
    }

    // 2. BOS Filter
    if (selectedBOS !== 'ALL') {
      if (String(c.bos || '').trim().toUpperCase() !== selectedBOS.toUpperCase()) return false;
    }

    // 3. Class Filter
    if (selectedClass !== 'ALL') {
      if (String(c.class || '').trim().toUpperCase() !== selectedClass.toUpperCase()) return false;
    }

    // 4. Gender Filter
    if (selectedGender !== 'ALL') {
      if (String(c.gender || '').trim().toUpperCase() !== selectedGender.toUpperCase()) return false;
    }

    // 5. Blood Type Filter
    if (selectedBloodType !== 'ALL') {
      if (String(c['BLOOD TYPE'] || '').trim().toUpperCase() !== selectedBloodType.toUpperCase()) return false;
    }

    // 6. Region Filter
    if (selectedRegion !== 'ALL') {
      if (String(c['REGION'] || '').trim().toUpperCase() !== selectedRegion.toUpperCase()) return false;
    }

    // 7. Allergies Filter
    if (selectedAllergyStatus !== 'ALL') {
      const allergies = String(c['ALLERGIES'] || '').trim().toLowerCase();
      const hasAllergies = allergies !== '' && allergies !== 'none' && allergies !== 'n/a' && allergies !== 'nil';
      if (selectedAllergyStatus === 'NONE' && hasAllergies) return false;
      if (selectedAllergyStatus === 'HAS_ALLERGIES' && !hasAllergies) return false;
    }

    return true;
  });

  const selectCadetProfile = (cadet) => {
    // Find matching SOI row in main soiRows
    const found = soiRows.find(row => {
      const soiSerial = String(row['SERIAL NR'] || row['SERIAL NUMBER'] || '').trim();
      const cSerial = String(cadet.serialNo || '').trim();
      if (soiSerial && cSerial && soiSerial.toLowerCase() === cSerial.toLowerCase()) return true;

      const soiSurname = String(row['SURNAME'] || row['LAST NAME'] || '').trim().toLowerCase();
      const soiFirst = String(row['FIRST NAME'] || '').trim().toLowerCase();
      const cSurname = String(cadet.lastName || '').trim().toLowerCase();
      const cFirst = String(cadet.firstName || '').trim().toLowerCase();

      return soiSurname === cSurname && soiFirst === cFirst;
    });

    if (found) {
      setSelectedCadet(found);
      setShowCard(true);
      if (generatorRef.current) {
        generatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setSelectedCadet(cadet);
      setShowCard(true);
      if (generatorRef.current) {
        generatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Clipboard Copier formatted as: CADET (class) (FULL NAME) (SERIAL NUMBER) CCAFP
  // E.g. CADET 1CL KURT RANDLE JOSH MOLINA ANCHETA C-27011 CCAFP
  const copyListToClipboard = () => {
    let text = '';
    filteredCadets.forEach(c => {
      const nameParts = [c.firstName, c.middleName, c.lastName]
        .filter(p => p && String(p).trim() !== '')
        .map(p => String(p).trim().toUpperCase());
      const fullNameStr = nameParts.join(' ');
      const classStr = String(c.class || '').trim().toUpperCase();
      const serialStr = String(c.serialNo || '').trim().toUpperCase();
      text += `CADET ${classStr} ${fullNameStr} ${serialStr} CCAFP\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Filtered roster list copied to clipboard in CADET format!");
    }).catch(err => {
      console.error(err);
      alert("Failed to copy list.");
    });
  };

  const exportToCSV = () => {
    const headers = ['No.', 'Class', 'Serial No.', 'Full Name', 'Gender', 'BOS', 'Age', 'Blood Type', 'Religion', 'Region', 'Allergies', 'Hobbies'];
    const rows = filteredCadets.map((c, idx) => [
      idx + 1,
      c.class || '',
      c.serialNo || '',
      `${c.lastName || ''}, ${c.firstName || ''} ${c.middleName || ''}`,
      c.gender || '',
      c.bos || '',
      c.AGE || '',
      c['BLOOD TYPE'] || '',
      c['RELIGION'] || '',
      c['REGION'] || '',
      c['ALLERGIES'] || '',
      c['HOBBIES'] || ''
    ]);

    const csvString = '\ufeff' + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bravo_company_roster_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printList = () => {
    const printWindow = window.open('', '_blank');
    let filterSummary = [];
    if (searchTerm) filterSummary.push(`Search: "${searchTerm}"`);
    if (selectedBOS !== 'ALL') filterSummary.push(`BOS: ${selectedBOS}`);
    if (selectedClass !== 'ALL') filterSummary.push(`Class: ${selectedClass}`);
    if (selectedGender !== 'ALL') filterSummary.push(`Gender: ${selectedGender}`);
    if (selectedBloodType !== 'ALL') filterSummary.push(`Blood Type: ${selectedBloodType}`);
    if (selectedRegion !== 'ALL') filterSummary.push(`Region: ${selectedRegion}`);
    if (selectedAllergyStatus !== 'ALL') filterSummary.push(`Allergies: ${selectedAllergyStatus}`);
    
    const filterDescription = filterSummary.join(', ') || 'None (All Cadets)';

    const html = `
      <html>
        <head>
          <title>Bravo Company Filtered Roster</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; background: #fff; }
            h1 { font-size: 22px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
            .subtitle { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            .filters { background: #f1f5f9; padding: 12px 18px; border-radius: 6px; font-size: 13px; margin-bottom: 25px; border-left: 4px solid #d4af37; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
            th { background: #0f172a; color: white; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Bravo Company Filtered Roster</h1>
          <div class="subtitle">Bravo Company Personnel Directory | Generated on ${new Date().toLocaleDateString()}</div>
          <div class="filters">
            <strong>Active Filters:</strong> ${filterDescription} (${filteredCadets.length} matches found)
          </div>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Class</th>
                <th>Serial No.</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>BOS</th>
                <th>Age</th>
                <th>Blood Type</th>
                <th>Region</th>
                <th>Allergies</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCadets.map((c, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${c.class || ''}</td>
                  <td>${c.serialNo || ''}</td>
                  <td><strong>${c.lastName || ''}, ${c.firstName || ''} ${c.middleName || ''}</strong></td>
                  <td>${c.gender || ''}</td>
                  <td>${c.bos || ''}</td>
                  <td>${c.AGE || ''}</td>
                  <td>${c['BLOOD TYPE'] || ''}</td>
                  <td>${c['REGION'] || ''}</td>
                  <td>${c['ALLERGIES'] || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Bravo Company Online Bulletin Information System (Bravo Bulls)
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Target for smooth scrolling when profile is clicked */}
      <div ref={generatorRef} style={{ scrollMarginTop: '20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading SOI Generator...</div>}>
          <SOIGenerator
            soiData={soiRows}
            selectedCadet={selectedCadet}
            setSelectedCadet={setSelectedCadet}
            showCard={showCard}
            setShowCard={setShowCard}
          />
        </Suspense>
      </div>

      {/* User Friendly Filter Interface */}
      <div className="filter-system-container" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔍 SEARCH & FILTER ROSTER
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Search anything (e.g. eye color, allergies, hobbies, province) or use the dropdowns to quickly filter the roster.
          </p>
        </div>

        {/* Global Search input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Type any keyword (e.g., Brown eyes, Asthma, Cebu, Guitar, Regional Science...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          {/* Class filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={selectStyle}>
              <option value="ALL">All Classes</option>
              <option value="1CL">1st Class (1CL)</option>
              <option value="2CL">2nd Class (2CL)</option>
              <option value="3CL">3rd Class (3CL)</option>
            </select>
          </div>

          {/* BOS filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Branch of Service (BOS)</label>
            <select value={selectedBOS} onChange={(e) => setSelectedBOS(e.target.value)} style={selectStyle}>
              <option value="ALL">All Branches</option>
              <option value="PN">PN (Navy)</option>
              <option value="PA">PA (Army)</option>
              <option value="PAF">PAF (Air Force)</option>
            </select>
          </div>

          {/* Gender filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Gender</label>
            <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} style={selectStyle}>
              <option value="ALL">All Genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          {/* Blood Type filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Blood Type</label>
            <select value={selectedBloodType} onChange={(e) => setSelectedBloodType(e.target.value)} style={selectStyle}>
              <option value="ALL">All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Region filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Region</label>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={selectStyle}>
              <option value="ALL">All Regions</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Allergy Status filter */}
          <div style={filterColStyle}>
            <label style={labelStyle}>Allergies</label>
            <select value={selectedAllergyStatus} onChange={(e) => setSelectedAllergyStatus(e.target.value)} style={selectStyle}>
              <option value="ALL">All Cadets</option>
              <option value="NONE">No Allergies</option>
              <option value="HAS_ALLERGIES">Has Allergies</option>
            </select>
          </div>
        </div>

        {/* Preset Buttons & Reset Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.5rem' }}>QUICK FILTERS:</span>
            <button onClick={() => applyPreset('NAVY')} className="preset-chip-btn" style={presetChipStyle}>Navy (PN)</button>
            <button onClick={() => applyPreset('ARMY')} className="preset-chip-btn" style={presetChipStyle}>Army (PA)</button>
            <button onClick={() => applyPreset('AIRFORCE')} className="preset-chip-btn" style={presetChipStyle}>Air Force (PAF)</button>
            <button onClick={() => applyPreset('FEMALE')} className="preset-chip-btn" style={presetChipStyle}>Female</button>
            <button onClick={() => applyPreset('ALLERGIES')} className="preset-chip-btn" style={presetChipStyle}>Allergies</button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Output / Search Results Section */}
      {hasActiveFilters ? (
        <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.4s ease' }}>
          {/* Results Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--accent-gold)', paddingBottom: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                🔍 Filtered Results
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Found <strong>{filteredCadets.length}</strong> matching cadets in Bravo Company
              </div>
            </div>

            {/* List Utilities */}
            {filteredCadets.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={copyListToClipboard} style={utilityBtnStyle}>📋 Copy cadet list</button>
                <button onClick={printList} style={utilityBtnStyle}>🖨️ Print List</button>
                <button onClick={exportToCSV} style={{ ...utilityBtnStyle, background: 'var(--accent-gold)', color: 'white', borderColor: 'var(--accent-gold-dark)' }}>📥 Export CSV</button>
              </div>
            )}
          </div>

          {/* Results Table */}
          {filteredCadets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
              No cadets match the current search filters. Try typing a different keyword or resetting dropdowns.
            </div>
          ) : (
            <div className="table-container">
              <table className="mobile-card-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Class</th>
                    <th>Serial No.</th>
                    <th>Full Name</th>
                    <th>Gender</th>
                    <th>BOS</th>
                    <th>Allergies</th>
                    <th>Region</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCadets.map((c, idx) => (
                    <tr
                      key={idx}
                      onClick={() => selectCadetProfile(c)}
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      className="roster-row-interactive"
                    >
                      <td data-label="No." style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                      <td data-label="Class" style={{ fontWeight: 600 }}>{c.class}</td>
                      <td data-label="Serial No." style={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.serialNo}</td>
                      <td data-label="Full Name" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {c.lastName}, {c.firstName} {c.middleName}
                      </td>
                      <td data-label="Gender">{c.gender}</td>
                      <td data-label="BOS">
                        <span style={{
                          background: c.bos === 'PN' ? 'rgba(26,54,93,0.1)' : c.bos === 'PA' ? 'rgba(26,84,37,0.1)' : 'rgba(107,114,128,0.1)',
                          color: c.bos === 'PN' ? '#2b6cb0' : c.bos === 'PA' ? '#2f855a' : 'var(--text-primary)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {c.bos}
                        </span>
                      </td>
                      <td data-label="Allergies" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {c['ALLERGIES'] && String(c['ALLERGIES']).toLowerCase() !== 'none' ? (
                          <span style={{ color: '#e53e3e', fontWeight: 600 }}>{c['ALLERGIES']}</span>
                        ) : 'None'}
                      </td>
                      <td data-label="Region" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {c['REGION'] || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Default view (No active filters): Render 1CL, 2CL, 3CL Roster Sections */
        <div className="roster-sections" style={{ marginTop: '3rem', animation: 'fadeIn 0.4s ease' }}>
          <RosterSection title="1ST CLASS (1CL)" cadets={class1} color="var(--accent-gold)" onRowClick={selectCadetProfile} />
          <RosterSection title="2ND CLASS (2CL)" cadets={class2} color="#1a7a3a" onRowClick={selectCadetProfile} />
          <RosterSection title="3RD CLASS (3CL)" cadets={class3} color="#2d3748" onRowClick={selectCadetProfile} />
        </div>
      )}

      {/* Styled components inside file to avoid styling pollution */}
      <style jsx global>{`
        .roster-row-interactive:hover {
          background-color: rgba(212, 175, 55, 0.08) !important;
        }
        .preset-chip-btn {
          transition: all 0.2s;
        }
        .preset-chip-btn:hover {
          border-color: var(--accent-gold) !important;
          background: rgba(212, 175, 55, 0.1) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

function RosterSection({ title, cadets, color, onRowClick }) {
  if (!cadets || cadets.length === 0) return null;

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h2 style={{
        borderBottom: `2px solid ${color}`,
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        textTransform: 'uppercase'
      }}>
        {title}
      </h2>
      <div className="table-container">
        <table className="mobile-card-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Serial No.</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>BOS</th>
            </tr>
          </thead>
          <tbody>
            {cadets.map((c, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick(c)}
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                className="roster-row-interactive"
              >
                <td data-label="No." style={{ color: 'var(--text-secondary)' }}>{c.no}</td>
                <td data-label="Serial No." style={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.serialNo}</td>
                <td data-label="Full Name" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {c.lastName}, {c.firstName} {c.middleName}
                </td>
                <td data-label="Gender">{c.gender}</td>
                <td data-label="BOS">{c.bos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Inline styles
const filterColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const labelStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const selectStyle = {
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%'
};

const presetChipStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  padding: '0.35rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  outline: 'none'
};

const utilityBtnStyle = {
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  padding: '0.4rem 0.9rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  outline: 'none'
};
