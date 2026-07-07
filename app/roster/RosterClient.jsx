'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import SOIGenerator from './SOIGenerator';

// Configuration for all possible filters
const ALL_FILTERS = [
  { id: 'CLASS', label: 'Class', type: 'select', options: ['1CL', '2CL', '3CL'] },
  { id: 'BOS', label: 'Branch of Service (BOS)', type: 'select', options: ['PN', 'PA', 'PAF'] },
  { id: 'GENDER', label: 'Gender', type: 'select', options: ['M', 'F'], labels: { M: 'Male', F: 'Female' } },
  { id: 'AGE', label: 'Age', type: 'text' },
  { id: 'BLOOD TYPE', label: 'Blood Type', type: 'select', dynamicOptionsKey: 'bloodTypes' },
  { id: 'REGION', label: 'Region', type: 'select', dynamicOptionsKey: 'regions' },
  { id: 'ALLERGIES', label: 'Allergies', type: 'select', options: ['NONE', 'HAS_ALLERGIES'], labels: { NONE: 'No Allergies', HAS_ALLERGIES: 'Has Allergies' } },
  { id: 'RELIGION', label: 'Religion', type: 'select', dynamicOptionsKey: 'religions' },
  { id: 'ETHNIC GROUP', label: 'Ethnic Group', type: 'select', dynamicOptionsKey: 'ethnicGroups' },
  { id: 'COURSE BEFORE APPOINTMENT TO PMA', label: 'Pre-PMA Course', type: 'text' },
  { id: 'NAME OF COLLEGE/ UNIVERSITY', label: 'College/University', type: 'text' },
  { id: 'NAME OF HIGH SCHOOL', label: 'High School', type: 'text' },
  { id: 'CORPS SQUAD MEMBERSHIP', label: 'Corps Squad', type: 'text' },
  { id: 'CLUBS AND ORGANIZATION MEMBERSHIP', label: 'Clubs & Orgs', type: 'text' },
  { id: 'HOBBIES', label: 'Hobbies', type: 'text' },
  { id: 'OCCUPATION (FATHER)', label: 'Father\'s Occupation', type: 'text' },
  { id: 'OCCUPATION (MOTHER)', label: 'Mother\'s Occupation', type: 'text' },
  { id: 'EYES', label: 'Eye Color', type: 'text' },
  { id: 'HAIR', label: 'Hair Color', type: 'text' },
  { id: 'HEIGHT', label: 'Height (cm)', type: 'text' },
  { id: 'WEIGHT', label: 'Weight (kg)', type: 'text' },
  { id: 'ADDRESS', label: 'Address', type: 'text' }
];

const INITIAL_FILTER_VALUES = {
  CLASS: 'ALL',
  BOS: 'ALL',
  GENDER: 'ALL',
  AGE: '',
  'BLOOD TYPE': 'ALL',
  REGION: 'ALL',
  ALLERGIES: 'ALL',
  RELIGION: 'ALL',
  'ETHNIC GROUP': 'ALL',
  'COURSE BEFORE APPOINTMENT TO PMA': '',
  'NAME OF COLLEGE/ UNIVERSITY': '',
  'NAME OF HIGH SCHOOL': '',
  'CORPS SQUAD MEMBERSHIP': '',
  'CLUBS AND ORGANIZATION MEMBERSHIP': '',
  HOBBIES: '',
  'OCCUPATION (FATHER)': '',
  'OCCUPATION (MOTHER)': '',
  EYES: '',
  HAIR: '',
  HEIGHT: '',
  WEIGHT: '',
  ADDRESS: ''
};

// Maps uppercase filter IDs to the corresponding lowercase/camelCase property keys on the mapped cadet object.
const getCadetValue = (cadet, key) => {
  if (key === 'CLASS') return cadet.class;
  if (key === 'BOS') return cadet.bos;
  if (key === 'GENDER') return cadet.gender;
  if (key === 'SERIAL NO.') return cadet.serialNo;
  return cadet[key];
};

export default function RosterClient({ allCadets, class1, class2, class3, soiRows }) {
  // DRAFT states (inputs change these immediately)
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterIds, setActiveFilterIds] = useState(['CLASS', 'BOS', 'GENDER']);
  const [filterValues, setFilterValues] = useState({ ...INITIAL_FILTER_VALUES });

  // APPLIED states (the table filters by these)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedActiveFilterIds, setAppliedActiveFilterIds] = useState(['CLASS', 'BOS', 'GENDER']);
  const [appliedFilterValues, setAppliedFilterValues] = useState({ ...INITIAL_FILTER_VALUES });

  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [showCard, setShowCard] = useState(false);
  
  const generatorRef = useRef(null);
  const otherMenuRef = useRef(null);

  // Dynamic filter options extracted from the sheet database
  const [dynamicOptions, setDynamicOptions] = useState({
    bloodTypes: [],
    regions: [],
    religions: [],
    ethnicGroups: []
  });

  // Unique suggestions list for autocomplete
  const [fieldSuggestions, setFieldSuggestions] = useState({});
  const [globalSuggestionsList, setGlobalSuggestionsList] = useState([]);

  useEffect(() => {
    const extractUnique = (key) => {
      const vals = allCadets
        .map(c => getCadetValue(c, key))
        .filter(v => v && String(v).trim() !== '')
        .map(v => String(v).trim().toUpperCase());
      return Array.from(new Set(vals)).sort();
    };

    const bts = extractUnique('BLOOD TYPE');
    const regs = extractUnique('REGION');
    const rels = extractUnique('RELIGION');
    const eths = extractUnique('ETHNIC GROUP');

    setDynamicOptions({
      bloodTypes: bts,
      regions: regs,
      religions: rels,
      ethnicGroups: eths
    });

    // Build autocomplete suggestions lists
    const suggestionsObj = {};
    const globalSet = new Set();

    ALL_FILTERS.forEach(f => {
      const valuesSet = new Set();
      allCadets.forEach(c => {
        const val = getCadetValue(c, f.id);
        if (val && String(val).trim() !== '') {
          const sVal = String(val).trim();
          
          if (f.id === 'HOBBIES' || f.id === 'CLUBS AND ORGANIZATION MEMBERSHIP' || f.id === 'CORPS SQUAD MEMBERSHIP' || f.id === 'ALLERGIES') {
            sVal.split(/[,;&]/).forEach(term => {
              const trimmed = term.trim();
              if (trimmed && trimmed.toLowerCase() !== 'none' && trimmed.toLowerCase() !== 'n/a' && trimmed.toLowerCase() !== 'nil') {
                valuesSet.add(trimmed);
                globalSet.add(trimmed);
              }
            });
          } else {
            valuesSet.add(sVal);
            globalSet.add(sVal);
          }
        }
      });
      suggestionsObj[f.id] = Array.from(valuesSet).sort();
    });

    setFieldSuggestions(suggestionsObj);
    setGlobalSuggestionsList(Array.from(globalSet).sort());

  }, [allCadets]);

  // Click outside menu listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (otherMenuRef.current && !otherMenuRef.current.contains(event.target)) {
        setShowOtherMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set individual filter value in draft
  const handleFilterValueChange = (filterId, value) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }));
  };

  // Add a dynamic filter input to the layout
  const addFilter = (filterId) => {
    if (!activeFilterIds.includes(filterId)) {
      setActiveFilterIds([...activeFilterIds, filterId]);
    }
    setShowOtherMenu(false);
  };

  // Remove a filter input and reset its state
  const removeFilter = (filterId) => {
    setActiveFilterIds(activeFilterIds.filter(id => id !== filterId));
    const isSelect = ALL_FILTERS.find(f => f.id === filterId)?.type === 'select';
    handleFilterValueChange(filterId, isSelect ? 'ALL' : '');
  };

  // Helper to check if a specific cadet passes filters (reusable for draft & applied)
  const cadetPassesFilters = (c, searchVal, activeIds, valuesMap) => {
    if (searchVal.trim() !== '') {
      const q = searchVal.toLowerCase();
      const match = 
        String(c.firstName || '').toLowerCase().includes(q) ||
        String(c.lastName || '').toLowerCase().includes(q) ||
        String(c.middleName || '').toLowerCase().includes(q) ||
        String(c.serialNo || '').toLowerCase().includes(q) ||
        String(c.class || '').toLowerCase().includes(q) ||
        String(c.bos || '').toLowerCase().includes(q) ||
        String(c.gender || '').toLowerCase().includes(q) ||
        String(c.AGE || '').toLowerCase().includes(q) ||
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

    for (const filterId of activeIds) {
      const value = valuesMap[filterId];
      if (value === 'ALL' || value === '') continue;

      if (filterId === 'ALLERGIES' && (value === 'NONE' || value === 'HAS_ALLERGIES')) {
        const allergies = String(c['ALLERGIES'] || '').trim().toLowerCase();
        const hasAllergies = allergies !== '' && allergies !== 'none' && allergies !== 'n/a' && allergies !== 'nil';
        if (value === 'NONE' && hasAllergies) return false;
        if (value === 'HAS_ALLERGIES' && !hasAllergies) return false;
        continue;
      }

      const rawVal = getCadetValue(c, filterId);
      if (rawVal === undefined || rawVal === null) return false;

      const cadetValStr = String(rawVal).trim().toLowerCase();
      const filterValStr = String(value).trim().toLowerCase();

      if (filterId === 'GENDER') {
        const isCadetMale = cadetValStr.startsWith('m');
        const isFilterMale = filterValStr.startsWith('m');
        if (isCadetMale !== isFilterMale) return false;
        continue;
      }

      const filterConf = ALL_FILTERS.find(f => f.id === filterId);
      if (filterConf && filterConf.type === 'text') {
        if (!cadetValStr.includes(filterValStr)) return false;
      } else {
        if (cadetValStr !== filterValStr) return false;
      }
    }

    return true;
  };

  // Compute Draft Matches Count (in real time)
  const draftFilteredCadets = allCadets.filter(c => 
    cadetPassesFilters(c, searchTerm, activeFilterIds, filterValues)
  );

  // Compute Applied Matches List (only updates when Show Results is clicked)
  const filteredCadets = allCadets.filter(c => 
    cadetPassesFilters(c, appliedSearchTerm, appliedActiveFilterIds, appliedFilterValues)
  );

  // Check if any applied filter is active (to show Results Table vs Default Sections)
  const isAppliedSearchActive = appliedSearchTerm.trim() !== '';
  const hasAppliedFilterValues = appliedActiveFilterIds.some(id => {
    const val = appliedFilterValues[id];
    return val !== 'ALL' && val !== '';
  });
  const hasActiveAppliedFilters = isAppliedSearchActive || hasAppliedFilterValues;

  // Check if any draft or applied filter is currently active
  const isDraftSearchActive = searchTerm.trim() !== '';
  const hasDraftFilterValues = activeFilterIds.some(id => {
    const val = filterValues[id];
    return val !== 'ALL' && val !== '';
  });
  const hasActiveFilters = isDraftSearchActive || hasDraftFilterValues || hasActiveAppliedFilters;

  // Apply draft filters to the live table view
  const applyFilters = () => {
    setAppliedSearchTerm(searchTerm);
    setAppliedActiveFilterIds([...activeFilterIds]);
    setAppliedFilterValues({ ...filterValues });
  };

  // Reset both draft and applied states
  const resetFilters = () => {
    setSearchTerm('');
    setFilterValues({ ...INITIAL_FILTER_VALUES });
    setActiveFilterIds(['CLASS', 'BOS', 'GENDER']);

    setAppliedSearchTerm('');
    setAppliedFilterValues({ ...INITIAL_FILTER_VALUES });
    setAppliedActiveFilterIds(['CLASS', 'BOS', 'GENDER']);
  };

  // Quick preset loader (instantly sets drafts AND applies them for one-click action)
  const applyPreset = (presetName) => {
    resetFilters();
    
    // Set drafts
    let updatedActiveIds = ['CLASS', 'BOS', 'GENDER'];
    let updatedValues = { ...INITIAL_FILTER_VALUES };

    if (presetName === 'NAVY') {
      updatedValues.BOS = 'PN';
    } else if (presetName === 'ARMY') {
      updatedValues.BOS = 'PA';
    } else if (presetName === 'AIRFORCE') {
      updatedValues.BOS = 'PAF';
    } else if (presetName === 'FEMALE') {
      updatedValues.GENDER = 'F';
    } else if (presetName === 'O_PLUS') {
      if (!updatedActiveIds.includes('BLOOD TYPE')) updatedActiveIds.push('BLOOD TYPE');
      updatedValues['BLOOD TYPE'] = 'O+';
    } else if (presetName === 'ALLERGIES') {
      if (!updatedActiveIds.includes('ALLERGIES')) updatedActiveIds.push('ALLERGIES');
      updatedValues.ALLERGIES = 'HAS_ALLERGIES';
    }

    setFilterValues(updatedValues);
    setActiveFilterIds(updatedActiveIds);

    // Apply immediately
    setAppliedSearchTerm('');
    setAppliedActiveFilterIds(updatedActiveIds);
    setAppliedFilterValues(updatedValues);
  };

  // Check if draft inputs are different from applied values (pending changes)
  const isDraftDifferent = 
    searchTerm !== appliedSearchTerm ||
    JSON.stringify(activeFilterIds) !== JSON.stringify(appliedActiveFilterIds) ||
    JSON.stringify(filterValues) !== JSON.stringify(appliedFilterValues);

  const selectCadetProfile = (cadet) => {
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
  const copyListToClipboard = () => {
    let filterSummary = [];
    if (appliedSearchTerm) filterSummary.push(`Search: "${appliedSearchTerm}"`);
    appliedActiveFilterIds.forEach(id => {
      const val = appliedFilterValues[id];
      if (val !== 'ALL' && val !== '') filterSummary.push(`${id}: ${val}`);
    });
    
    const filterDescription = filterSummary.join(', ') || 'None';

    let text = `Bravo Company Roster Lookup List\n`;
    text += `Filters: ${filterDescription}\n`;
    text += `Total Count: ${filteredCadets.length} cadets\n\n`;

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
      alert("Filtered roster list copied to clipboard with metadata header!");
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
    if (appliedSearchTerm) filterSummary.push(`Search: "${appliedSearchTerm}"`);
    appliedActiveFilterIds.forEach(id => {
      const val = appliedFilterValues[id];
      if (val !== 'ALL' && val !== '') filterSummary.push(`${id}: ${val}`);
    });
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

  const remainingFilters = ALL_FILTERS.filter(f => !activeFilterIds.includes(f.id));

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
            Configure your filters and search keywords, then click "Show Results" to update the directory.
          </p>
        </div>

        {/* Global Search input with Autocomplete */}
        <div style={{ marginBottom: '1.25rem' }}>
          <AutocompleteInput
            placeholder="Type any keyword (e.g. Black eyes, Methodist, Cebu, Guitar, Regional Science...)"
            value={searchTerm}
            onChange={setSearchTerm}
            suggestionsList={globalSuggestionsList}
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

        {/* Filter Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          {activeFilterIds.map(filterId => {
            const config = ALL_FILTERS.find(f => f.id === filterId);
            if (!config) return null;

            const isSelect = config.type === 'select';
            const val = filterValues[filterId];

            // Resolve options for select inputs
            let selectOptions = [];
            if (isSelect) {
              if (config.options) {
                selectOptions = config.options;
              } else if (config.dynamicOptionsKey && dynamicOptions[config.dynamicOptionsKey]) {
                selectOptions = dynamicOptions[config.dynamicOptionsKey];
              }
            }

            return (
              <div key={filterId} style={filterColStyle} className="filter-input-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={labelStyle}>{config.label}</label>
                  <button
                    onClick={() => removeFilter(filterId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 700
                    }}
                    onMouseOver={(e) => e.target.style.color = '#ef4444'}
                    onMouseOut={(e) => e.target.style.color = '#94a3b8'}
                    title="Remove filter"
                  >
                    ✕ remove
                  </button>
                </div>

                {isSelect ? (
                  <select
                    value={val}
                    onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    style={selectStyle}
                  >
                    <option value="ALL">All {config.label}s</option>
                    {selectOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {config.labels && config.labels[opt] ? config.labels[opt] : opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <AutocompleteInput
                    placeholder={`Type ${config.label.toLowerCase()}...`}
                    value={val}
                    onChange={(newVal) => handleFilterValueChange(filterId, newVal)}
                    suggestionsList={fieldSuggestions[filterId] || []}
                    style={inputStyle}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem'
        }}>
          {/* Add Filter & Quick Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
            {/* Add Other Filters Button */}
            <div ref={otherMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOtherMenu(!showOtherMenu)}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                onMouseOut={(e) => e.target.style.borderColor = 'var(--border-color)'}
              >
                ➕ OTHER FILTERS {showOtherMenu ? '▴' : '▾'}
              </button>

              {/* Other Filters Dropdown Menu */}
              {showOtherMenu && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  zIndex: 99,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  width: '240px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '0.5rem'
                }}>
                  {remainingFilters.length === 0 ? (
                    <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      All filters are active.
                    </div>
                  ) : (
                    remainingFilters.map(f => (
                      <button
                        key={f.id}
                        onClick={() => addFilter(f.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '0.45rem 0.6rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(212,175,55,0.15)'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                      >
                        + {f.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <button onClick={() => applyPreset('NAVY')} className="preset-chip-btn" style={presetChipStyle}>Navy (PN)</button>
            <button onClick={() => applyPreset('ARMY')} className="preset-chip-btn" style={presetChipStyle}>Army (PA)</button>
            <button onClick={() => applyPreset('AIRFORCE')} className="preset-chip-btn" style={presetChipStyle}>Air Force (PAF)</button>
            <button onClick={() => applyPreset('FEMALE')} className="preset-chip-btn" style={presetChipStyle}>Female</button>
            <button onClick={() => applyPreset('ALLERGIES')} className="preset-chip-btn" style={presetChipStyle}>Allergies</button>
          </div>

          {/* Reset Filters & Show Results Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                Reset Filters
              </button>
            )}

            {/* Show Results Button */}
            <button
              onClick={applyFilters}
              disabled={!isDraftDifferent}
              style={{
                background: isDraftDifferent ? 'var(--accent-gold)' : 'var(--bg-secondary)',
                color: isDraftDifferent ? 'white' : 'var(--text-secondary)',
                border: isDraftDifferent ? '1px solid var(--accent-gold-dark)' : '1px solid var(--border-color)',
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: isDraftDifferent ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                boxShadow: isDraftDifferent ? '0 4px 12px rgba(212,175,55,0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (isDraftDifferent) e.target.style.background = 'var(--accent-gold-dark)';
              }}
              onMouseOut={(e) => {
                if (isDraftDifferent) e.target.style.background = 'var(--accent-gold)';
              }}
            >
              {isDraftDifferent 
                ? `⚡ Show Results (${draftFilteredCadets.length} matches)`
                : `✓ Results Up to Date`
              }
            </button>
          </div>
        </div>
      </div>

      {/* Output / Search Results Section with Stable Min-Height */}
      <div className="roster-results-wrapper" style={{
        minHeight: '600px',
        position: 'relative'
      }}>
        {hasActiveAppliedFilters ? (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Default view (No active filters): Render 1CL, 2CL, 3CL Roster Sections */
          <div className="roster-sections" style={{ marginTop: '3rem', animation: 'fadeIn 0.3s ease' }}>
            <RosterSection title="1ST CLASS (1CL)" cadets={class1} color="var(--accent-gold)" onRowClick={selectCadetProfile} />
            <RosterSection title="2ND CLASS (2CL)" cadets={class2} color="#1a7a3a" onRowClick={selectCadetProfile} />
            <RosterSection title="3RD CLASS (3CL)" cadets={class3} color="#2d3748" onRowClick={selectCadetProfile} />
          </div>
        )}
      </div>

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
        .filter-input-card {
          animation: filterCardFadeIn 0.2s ease-out;
        }
        @keyframes filterCardFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Autocomplete Input component to guide user text queries
function AutocompleteInput({ placeholder, value, onChange, suggestionsList, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (val.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const filtered = suggestionsList
      .filter(item => item.toLowerCase().includes(val.toLowerCase()) && item.toLowerCase() !== val.toLowerCase())
      .slice(0, 5); // limit to 5 suggestions

    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.trim() !== '' && suggestions.length > 0) {
            setShowDropdown(true);
          }
        }}
        style={style}
      />
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          maxHeight: '180px'
        }}>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(212,175,55,0.15)'}
              onMouseOut={(e) => e.target.style.background = 'none'}
              title={s}
            >
              💡 {s}
            </div>
          ))}
        </div>
      )}
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
  gap: '0.2rem',
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  padding: '0.6rem 0.8rem',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  position: 'relative'
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const selectStyle = {
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  cursor: 'pointer'
};

const inputStyle = {
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
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
