'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import SOIGenerator from './SOIGenerator';

const FILTER_FIELDS = [
  { id: 'BOS', label: 'Branch of Service (BOS)', type: 'select' },
  { id: 'CLASS', label: 'Class (e.g., 1CL)', type: 'select' },
  { id: 'GENDER', label: 'Gender', type: 'select' },
  { id: 'AGE', label: 'Age', type: 'number' },
  { id: 'BLOOD TYPE', label: 'Blood Type', type: 'select' },
  { id: 'EYES', label: 'Eye Color', type: 'select' },
  { id: 'HAIR', label: 'Hair Color', type: 'select' },
  { id: 'RELIGION', label: 'Religion', type: 'select' },
  { id: 'REGION', label: 'Region', type: 'select' },
  { id: 'ETHNIC GROUP', label: 'Ethnic Group', type: 'select' },
  { id: 'ALLERGIES', label: 'Allergies', type: 'text' },
  { id: 'COURSE BEFORE APPOINTMENT TO PMA', label: 'Pre-PMA Course', type: 'text' },
  { id: 'NAME OF COLLEGE/ UNIVERSITY', label: 'College/University', type: 'text' },
  { id: 'NAME OF HIGH SCHOOL', label: 'High School', type: 'text' },
  { id: 'CORPS SQUAD MEMBERSHIP', label: 'Corps Squad', type: 'text' },
  { id: 'CLUBS AND ORGANIZATION MEMBERSHIP', label: 'Clubs & Orgs', type: 'text' },
  { id: 'HOBBIES', label: 'Hobbies', type: 'text' },
  { id: 'OCCUPATION (FATHER)', label: 'Father\'s Occupation', type: 'text' },
  { id: 'OCCUPATION (MOTHER)', label: 'Mother\'s Occupation', type: 'text' }
];

export default function RosterClient({ allCadets, class1, class2, class3, soiRows }) {
  const [rules, setRules] = useState([]);
  const [matchType, setMatchType] = useState('AND');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const generatorRef = useRef(null);

  // Auto-extract unique options for select fields
  const [uniqueFieldOptions, setUniqueFieldOptions] = useState({});

  useEffect(() => {
    const options = {};
    FILTER_FIELDS.forEach(field => {
      if (field.type === 'select') {
        const vals = allCadets
          .map(c => c[field.id])
          .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
          .map(v => String(v).trim().toUpperCase());
        options[field.id] = Array.from(new Set(vals)).sort();
      }
    });
    setUniqueFieldOptions(options);
  }, [allCadets]);

  const addRule = (fieldId = 'BOS') => {
    const fieldConf = FILTER_FIELDS.find(f => f.id === fieldId) || FILTER_FIELDS[0];
    const isSelect = fieldConf.type === 'select';
    const firstOption = isSelect && uniqueFieldOptions[fieldId] && uniqueFieldOptions[fieldId].length > 0
      ? uniqueFieldOptions[fieldId][0]
      : '';
    
    setRules([...rules, {
      id: Date.now() + Math.random().toString(),
      field: fieldId,
      operator: isSelect ? 'equals' : 'contains',
      value: firstOption
    }]);
  };

  const updateRule = (id, updatedFields) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        const newRule = { ...r, ...updatedFields };
        // Reset operator and value if field changes
        if (updatedFields.field) {
          const fieldConf = FILTER_FIELDS.find(f => f.id === updatedFields.field);
          const isSelect = fieldConf.type === 'select';
          newRule.operator = isSelect ? 'equals' : 'contains';
          newRule.value = isSelect && uniqueFieldOptions[updatedFields.field] && uniqueFieldOptions[updatedFields.field].length > 0
            ? uniqueFieldOptions[updatedFields.field][0]
            : '';
        }
        return newRule;
      }
      return r;
    }));
  };

  const removeRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const applyPreset = (presetName) => {
    if (presetName === 'NAVY') {
      setRules([{ id: 'preset_navy', field: 'BOS', operator: 'equals', value: 'PN' }]);
      setMatchType('AND');
    } else if (presetName === 'ARMY') {
      setRules([{ id: 'preset_army', field: 'BOS', operator: 'equals', value: 'PA' }]);
      setMatchType('AND');
    } else if (presetName === 'AIRFORCE') {
      setRules([{ id: 'preset_af', field: 'BOS', operator: 'equals', value: 'PAF' }]);
      setMatchType('AND');
    } else if (presetName === 'FEMALE') {
      setRules([{ id: 'preset_female', field: 'GENDER', operator: 'equals', value: 'F' }]);
      setMatchType('AND');
    } else if (presetName === 'O_PLUS') {
      setRules([{ id: 'preset_oplus', field: 'BLOOD TYPE', operator: 'equals', value: 'O+' }]);
      setMatchType('AND');
    } else if (presetName === 'ALLERGIES') {
      setRules([{ id: 'preset_allergies', field: 'ALLERGIES', operator: 'is_not_empty', value: '' }]);
      setMatchType('AND');
    }
    setIsAdvancedOpen(true);
  };

  const clearFilters = () => {
    setRules([]);
  };

  const filterCadet = (cadet, rule) => {
    const { field, operator, value } = rule;
    const rawVal = cadet[field];

    if (operator === 'is_empty') {
      return rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
    }
    if (operator === 'is_not_empty') {
      const v = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
      if (!v) return false;
      // Also filter out 'none' or 'n/a'
      const s = String(rawVal).trim().toLowerCase();
      return s !== 'none' && s !== 'n/a' && s !== 'nil';
    }

    if (rawVal === undefined || rawVal === null) return false;

    const cadetValStr = String(rawVal).trim().toLowerCase();
    const filterValStr = String(value).trim().toLowerCase();

    if (operator === 'equals') {
      return cadetValStr === filterValStr;
    }
    if (operator === 'contains') {
      return cadetValStr.includes(filterValStr);
    }
    if (operator === 'starts_with') {
      return cadetValStr.startsWith(filterValStr);
    }
    if (operator === 'ends_with') {
      return cadetValStr.endsWith(filterValStr);
    }

    // Numbers
    const cadetNum = parseFloat(rawVal);
    const filterNum = parseFloat(value);
    if (isNaN(cadetNum) || isNaN(filterNum)) return false;

    if (operator === 'greater_than') return cadetNum > filterNum;
    if (operator === 'less_than') return cadetNum < filterNum;
    if (operator === 'greater_than_or_equal') return cadetNum >= filterNum;
    if (operator === 'less_than_or_equal') return cadetNum <= filterNum;

    return false;
  };

  // Compute filtered list
  const hasActiveFilters = rules.length > 0;
  const filteredCadets = allCadets.filter(cadet => {
    if (!hasActiveFilters) return true;
    if (matchType === 'AND') {
      return rules.every(rule => filterCadet(cadet, rule));
    } else {
      return rules.some(rule => filterCadet(cadet, rule));
    }
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
      // Fallback
      setSelectedCadet(cadet);
      setShowCard(true);
      if (generatorRef.current) {
        generatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Utility actions
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

  const copyListToClipboard = () => {
    const filterDescription = rules.map(r => `${r.field} ${r.operator} "${r.value || ''}"`).join(` ${matchType} `) || 'None';
    let text = `Bravo Company Roster Lookup List\nFilters: ${filterDescription}\nTotal Count: ${filteredCadets.length} cadets\n\n`;

    filteredCadets.forEach((c, idx) => {
      text += `${idx + 1}. ${c.lastName || ''}, ${c.firstName || ''} ${c.middleName || ''} (${c.serialNo || 'N/A'}) - Class ${c.class || ''} - BOS: ${c.bos || 'N/A'}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Formatted list copied to clipboard!");
    }).catch(err => {
      console.error(err);
      alert("Failed to copy list.");
    });
  };

  const printList = () => {
    const printWindow = window.open('', '_blank');
    const filterDescription = rules.map(r => `${r.field} ${r.operator} "${r.value || ''}"`).join(` ${matchType} `) || 'None';

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

      {/* Advanced Search & Filtering Interface */}
      <div className="filter-system-container" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '3rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {/* Toggle & Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔍 ADVANCED ROSTER LOOKUP
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Create custom lists by filtering cadets based on any data classification.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              style={{
                background: isAdvancedOpen ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                color: isAdvancedOpen ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {isAdvancedOpen ? 'Collapse Filters ▴' : 'Expand Filter Builder ▾'}
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.5rem' }}>QUICK PRESETS:</span>
          <button onClick={() => applyPreset('NAVY')} className="preset-chip-btn" style={presetChipStyle}>Navy (PN)</button>
          <button onClick={() => applyPreset('ARMY')} className="preset-chip-btn" style={presetChipStyle}>Army (PA)</button>
          <button onClick={() => applyPreset('AIRFORCE')} className="preset-chip-btn" style={presetChipStyle}>Air Force (PAF)</button>
          <button onClick={() => applyPreset('FEMALE')} className="preset-chip-btn" style={presetChipStyle}>Female Cadets</button>
          <button onClick={() => applyPreset('O_PLUS')} className="preset-chip-btn" style={presetChipStyle}>O+ Blood Type</button>
          <button onClick={() => applyPreset('ALLERGIES')} className="preset-chip-btn" style={presetChipStyle}>Allergies Recorded</button>
        </div>

        {/* Rules Builder Panel */}
        {isAdvancedOpen && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Match:</span>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="AND">ALL filters (AND)</option>
                  <option value="OR">ANY filter (OR)</option>
                </select>
              </div>
              {rules.length > 0 && (
                <button
                  onClick={clearFilters}
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
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Rules List */}
            {rules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                No active filter rules. Click "Add Filter Rule" or a Quick Preset to build your list.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rules.map((rule, idx) => {
                  const fieldConf = FILTER_FIELDS.find(f => f.id === rule.field) || FILTER_FIELDS[0];
                  const isSelect = fieldConf.type === 'select';
                  const isNumber = fieldConf.type === 'number';

                  return (
                    <div key={rule.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', minWidth: '20px' }}>#{idx + 1}</span>

                      {/* Field Selection */}
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                        style={selectStyle}
                      >
                        {FILTER_FIELDS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>

                      {/* Operator Selection */}
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                        style={selectStyle}
                      >
                        {isNumber ? (
                          <>
                            <option value="equals">equals</option>
                            <option value="greater_than">&gt; (greater than)</option>
                            <option value="less_than">&lt; (less than)</option>
                            <option value="greater_than_or_equal">&ge; (greater or equal)</option>
                            <option value="less_than_or_equal">&le; (less or equal)</option>
                          </>
                        ) : (
                          <>
                            <option value="contains">contains</option>
                            <option value="equals">equals</option>
                            <option value="starts_with">starts with</option>
                            <option value="ends_with">ends with</option>
                            <option value="is_empty">is empty</option>
                            <option value="is_not_empty">is not empty</option>
                          </>
                        )}
                      </select>

                      {/* Value Input */}
                      {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                        isSelect ? (
                          <select
                            value={rule.value}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            style={selectStyle}
                          >
                            <option value="">-- Select Option --</option>
                            {(uniqueFieldOptions[rule.field] || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={isNumber ? 'number' : 'text'}
                            placeholder={isNumber ? 'e.g. 21' : 'Search value...'}
                            value={rule.value}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            style={{
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              flex: '1 1 150px',
                              outline: 'none'
                            }}
                          />
                        )
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeRule(rule.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.15s',
                          marginLeft: 'auto'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#fca5a5'}
                        onMouseOut={(e) => e.target.style.background = '#fee2e2'}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => addRule()}
              style={{
                marginTop: '1rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px dashed var(--accent-gold)',
                padding: '0.5rem 1.2rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'block',
                width: '100%',
                textAlign: 'center'
              }}
              onMouseOver={(e) => { e.target.style.background = 'var(--accent-gold)'; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.color = 'var(--text-primary)'; }}
            >
              + Add Filter Rule
            </button>
          </div>
        )}
      </div>

      {/* Output / Search Results Section */}
      {hasActiveFilters ? (
        <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.4s ease' }}>
          {/* Results Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--accent-gold)', paddingBottom: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                🔍 Filtered Roster Results
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Found <strong>{filteredCadets.length}</strong> matching cadets in Bravo Company
              </div>
            </div>

            {/* List Utilities */}
            {filteredCadets.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={copyListToClipboard} style={utilityBtnStyle}>📋 Copy List</button>
                <button onClick={printList} style={utilityBtnStyle}>🖨️ Print List</button>
                <button onClick={exportToCSV} style={{ ...utilityBtnStyle, background: 'var(--accent-gold)', color: 'white', borderColor: 'var(--accent-gold-dark)' }}>📥 Export CSV</button>
              </div>
            )}
          </div>

          {/* Results Table */}
          {filteredCadets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
              No cadets match the current filter criteria. Check your operators or try clearing rules.
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
                    {rules.map(r => {
                      const fConf = FILTER_FIELDS.find(f => f.id === r.field);
                      return fConf ? <th key={r.id}>{fConf.label}</th> : null;
                    })}
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
                      {rules.map(r => {
                        const fConf = FILTER_FIELDS.find(f => f.id === r.field);
                        if (!fConf) return null;
                        const rawVal = c[r.field];
                        const valString = rawVal !== undefined && rawVal !== null ? String(rawVal) : '--';
                        return (
                          <td key={r.id} data-label={fConf.label} style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>
                            {valString}
                          </td>
                        );
                      })}
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

const selectStyle = {
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  fontWeight: 500,
  outline: 'none',
  flex: '1 1 120px'
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
