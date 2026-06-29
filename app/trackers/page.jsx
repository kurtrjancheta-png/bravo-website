import { getSheetData } from '../../lib/googleSheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

export default async function Trackers() {
  const trackers = await getSheetData(SHEET_ID, 'Trackers');
  const headers = trackers.length > 0 ? Object.keys(trackers[0]) : [];

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">ACTIVE TRACKERS</h1>
        <div className="section-subtitle">Live Data and Metrics</div>
      </div>

      {trackers.length > 0 ? (
        <div className="table-container">
          <table className="mobile-card-table">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackers.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex}>
                      {/* Highlight status fields with badges if possible, else render text */}
                      {header.toLowerCase() === 'status' ? (
                        <span className="tag" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold)' }}>
                          {row[header]}
                        </span>
                      ) : (
                        row[header]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No active trackers at the moment.</p>
      )}
    </div>
  );
}
