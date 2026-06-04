import { getSheetData } from '../../lib/googleSheets';

const TASK_ORG_SHEET_ID = '1HoTX11Y0Ojx_Ow99J93mRxNAOBpcGods55bpggYxAdk';
const SHEET_NAME = process.env.TASK_ORG_SHEET_NAME || 'TASK ORGANIZATION';

// The Person Card Component
function PersonCard({ person }) {
  if (!person) return null;
  return (
    <div className="org-node-wrapper">
      <div className="org-card">
        <div className="avatar-placeholder">👤</div>
        <div className="org-designation">{person.designation}</div>
        <div className="org-name">{person.name}</div>
      </div>
    </div>
  );
}

export default async function TaskOrganization() {
  const allRows = await getSheetData(TASK_ORG_SHEET_ID, SHEET_NAME);
  
  let cmdr = null;
  let firstSgt = null;
  let exo = null;
  const sStaff = [];
  const specialStaff = [];
  const platoonLeaders = [];

  const allowedSpecialStaff = [
    'values, ethics, and standards officer', 
    'academic officer', 
    'honor committee representative', 
    'mess officer', 
    'ccpb representative', 
    'safety officer', 
    'military training officer', 
    'responsible supply officer', 
    'gender awareness and development', 
    'spiritual development'
  ];

  for (const row of allRows) {
    const values = Object.values(row);
    const designationStr = (typeof values[0] === 'string' ? values[0] : '').trim();
    const nameStr = (typeof values[1] === 'string' ? values[1] : '').trim();
    const desLower = designationStr.toLowerCase();

    if (!desLower || !nameStr) continue;

    const person = { designation: designationStr, name: nameStr };

    if (desLower.includes('company commander')) {
      cmdr = person;
    } else if (desLower === 'first sergeant') {
      firstSgt = person;
    } else if (desLower.includes('company executive officer')) {
      exo = person;
    } else if (desLower.match(/\(s[1-9]0?\)/)) {
      sStaff.push(person);
    } else if (desLower.includes('platoon leader')) {
      platoonLeaders.push(person);
    } else {
      const isSpecial = allowedSpecialStaff.some(s => desLower.includes(s));
      if (isSpecial) {
        specialStaff.push(person);
      }
    }
    
    // Stop processing if we hit First Sergeant, according to the previous rule,
    // BUT the data actually has Platoon Leaders ABOVE First Sergeant.
    // So we just process all rows and categorize them.
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '3rem' }}>
        <h1 className="section-title">TASK ORGANIZATION</h1>
        <div className="section-subtitle">Bravo Company Hierarchy</div>
      </div>

      <div className="org-chart">
        
        {/* LEVEL 1: Commander & First Sgt */}
        {cmdr && (
          <div className="org-tier">
            <div className="command-tier">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="org-card" style={{ borderColor: 'var(--text-primary)', borderWidth: '2px' }}>
                  <div className="avatar-placeholder" style={{ backgroundColor: 'var(--text-primary)', color: 'white' }}>⭐</div>
                  <div className="org-designation">{cmdr.designation}</div>
                  <div className="org-name">{cmdr.name}</div>
                </div>
              </div>
              
              {firstSgt && (
                <>
                  <div className="command-attached-line"></div>
                  <div style={{ position: 'relative', zIndex: 2, marginTop: '20px' }}>
                    <div className="org-card" style={{ width: '220px' }}>
                      <div className="avatar-placeholder" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>💂</div>
                      <div className="org-designation">{firstSgt.designation}</div>
                      <div className="org-name" style={{ fontSize: '0.8rem' }}>{firstSgt.name}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="org-connector-down"></div>
          </div>
        )}

        {/* LEVEL 2: EX-O */}
        {exo && (
          <div className="org-tier">
            <div className="org-card" style={{ zIndex: 2 }}>
              <div className="avatar-placeholder">👤</div>
              <div className="org-designation">{exo.designation}</div>
              <div className="org-name">{exo.name}</div>
            </div>
            {sStaff.length > 0 && <div className="org-connector-down"></div>}
          </div>
        )}

        {/* LEVEL 3: S-Staff */}
        {sStaff.length > 0 && (
          <div className="org-tier">
            {sStaff.length > 1 && <div className="org-horizontal-line"></div>}
            <div className="org-nodes">
              {sStaff.map((staff, i) => (
                <PersonCard key={`sstaff-${i}`} person={staff} />
              ))}
            </div>
            {specialStaff.length > 0 && (
              <>
                {/* Need a connector down from the center. Since nodes wrap, we just draw a central line from top of this tier to next tier */}
                <div className="org-connector-down" style={{ marginTop: '2rem' }}></div>
              </>
            )}
          </div>
        )}

        {/* LEVEL 4: Special Staff */}
        {specialStaff.length > 0 && (
          <div className="org-tier">
            {specialStaff.length > 1 && <div className="org-horizontal-line"></div>}
            <div className="org-nodes">
              {specialStaff.map((staff, i) => (
                <PersonCard key={`special-${i}`} person={staff} />
              ))}
            </div>
            {platoonLeaders.length > 0 && (
              <div className="org-connector-down" style={{ marginTop: '2rem' }}></div>
            )}
          </div>
        )}

        {/* LEVEL 5: Platoon Leaders */}
        {platoonLeaders.length > 0 && (
          <div className="org-tier">
            {platoonLeaders.length > 1 && <div className="org-horizontal-line"></div>}
            <div className="org-nodes">
              {platoonLeaders.map((platoon, i) => (
                <PersonCard key={`platoon-${i}`} person={platoon} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
