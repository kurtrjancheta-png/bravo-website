import { getSheetData } from '../../lib/googleSheets';
import SOIGenerator from './SOIGenerator';
import DispositionDashboard from './DispositionDashboard';
import { Suspense } from 'react';

const SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';

export const revalidate = 30;

export default async function RosterPage() {
  const [rosterRows, soiRows, dispositionRows] = await Promise.all([
    getSheetData(SHEET_ID, 'ROSTER'),
    getSheetData(SHEET_ID, 'SOI'),
    getSheetData(SHEET_ID, 'DISPOSITION')
  ]);

  // Group by class based on requested row indices.
  // The first data row (row 2 in sheet) is index 0 in the returned array.
  // 1CL: Rows 2-31 (Index 0-29)
  // 2CL: Rows 32-68 (Index 30-66)
  // 3CL: Rows 69-106 (Index 67-104)

  const class1 = [];
  const class2 = [];
  const class3 = [];

  rosterRows.forEach((row, i) => {
    // Basic extraction
    const values = Object.values(row);
    if (!values[1]) return; // Skip empty rows

    const cadetClass = (typeof values[1] === 'string' ? values[1] : '').trim().toUpperCase();
    const name = (typeof values[8] === 'string' ? values[8] : '').trim(); // FULL NAME or similar

    const cadet = {
      no: values[0] || i + 1,
      class: cadetClass,
      firstName: values[2] || '',
      middleName: values[3] || '',
      lastName: values[4] || '',
      serialNo: values[5] || '',
      gender: values[6] || '',
      coy: values[7] || '',
      bos: values[8] || '', // Branch of Service
      fullName: values[9] || name
    };

    if (i >= 0 && i <= 29) {
      class1.push(cadet);
    } else if (i >= 30 && i <= 66) {
      class2.push(cadet);
    } else if (i >= 67 && i <= 104) {
      class3.push(cadet);
    }
  });

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">COMPANY ROSTER</h1>
        <div className="section-subtitle">Bravo Company Personnel Directory</div>
      </div>

      {/* SOI Generator at the top */}
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading SOI Generator...</div>}>
        <SOIGenerator soiData={soiRows} />
      </Suspense>

      {/* Disposition Dashboard */}
      <DispositionDashboard dispositionData={dispositionRows} />

      {/* Roster Sections */}
      <div className="roster-sections" style={{ marginTop: '3rem' }}>
        <RosterSection title="1ST CLASS (1CL)" cadets={class1} color="var(--accent-gold)" />
        <RosterSection title="2ND CLASS (2CL)" cadets={class2} color="#1a7a3a" />
        <RosterSection title="3RD CLASS (3CL)" cadets={class3} color="#2d3748" />
      </div>
    </div>
  );
}

function RosterSection({ title, cadets, color }) {
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
        <table>
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
              <tr key={idx}>
                <td style={{ color: 'var(--text-secondary)' }}>{c.no}</td>
                <td style={{ fontWeight: 600 }}>{c.serialNo}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {c.lastName}, {c.firstName} {c.middleName}
                </td>
                <td>{c.gender}</td>
                <td>{c.bos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
