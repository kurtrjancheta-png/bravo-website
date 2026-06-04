'use client';

function PersonCard({ person }) {
  if (!person) return null;

  const handleMouseEnter = () => {
    if (person.navTarget) {
      const el = document.getElementById(person.navTarget);
      if (el) el.classList.add('nav-glow-gold');
    }
  };

  const handleMouseLeave = () => {
    if (person.navTarget) {
      const el = document.getElementById(person.navTarget);
      if (el) el.classList.remove('nav-glow-gold');
    }
  };

  return (
    <div className="org-node-wrapper">
      <div
        className="org-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="avatar-placeholder">👤</div>
        <div className="org-designation">{person.designation}</div>
        <div className="org-name">{person.name}</div>
      </div>
    </div>
  );
}

export default function OrgChart({ cmdr, firstSgt, exo, sStaff, specialStaff, platoonLeaders }) {
  return (
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
            <div className="org-connector-down" style={{ marginTop: '2rem' }}></div>
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
  );
}
