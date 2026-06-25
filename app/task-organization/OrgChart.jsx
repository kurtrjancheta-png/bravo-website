'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrgChart({ 
  tacticalOfficer, 
  cmdr, 
  firstSgt, 
  exo, 
  sStaff, 
  specialStaff, 
  platoonLeaders,
  battalionStaff = [],
  regimentStaff = []
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('company'); // 'company', 'battalion', 'regiment'
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCardClick = (person) => {
    if (!person) return;
    
    // We navigate to /roster with the person's name as the 'soi' search param.
    // The SOIGenerator will pick this up and auto-search.
    if (person.name) {
       router.push(`/roster?soi=${encodeURIComponent(person.name)}`);
    }
  };

  const PersonCard = ({ person, customStyle = {}, noConnector = false }) => {
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

    const hasImage = person.picture && person.picture.length > 0;
    
    // Some placeholders depending on role
    let placeholder = '👤';
    if (person.designation?.toLowerCase().includes('commander') || person.isTacticalOfficer) placeholder = '⭐';
    if (person.designation?.toLowerCase().includes('first sergeant')) placeholder = '💂';

    return (
      <div className={`org-node-wrapper ${noConnector ? 'no-connector' : ''}`} style={customStyle.wrapper}>
        <div
          className="org-card"
          style={customStyle.card}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleCardClick(person)}
        >
          {hasImage ? (
            <img
              src={person.picture}
              alt={person.designation}
              className="avatar-image"
              style={customStyle.avatar}
            />
          ) : (
            <div className="avatar-placeholder" style={customStyle.placeholder}>
              {placeholder}
            </div>
          )}
          <div className="org-designation">{person.designation}</div>
          <div className="org-name" style={customStyle.name}>{person.name}</div>
        </div>
      </div>
    );
  };

  // Find Battalion Executive Officer and other Battalion staff
  const bnExo = battalionStaff.find(p => p.designation.toLowerCase().includes('executive officer'));
  const bnOtherStaff = battalionStaff.filter(p => !p.designation.toLowerCase().includes('executive officer'));

  return (
    <div className="org-chart-container" style={{ width: '100%' }}>
      {/* Tab Selectors */}
      <div className="taskorg-tabs">
        <button 
          className={`taskorg-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Bravo Company
        </button>
        <button 
          className={`taskorg-tab-btn ${activeTab === 'battalion' ? 'active' : ''}`}
          onClick={() => setActiveTab('battalion')}
        >
          Battalion Staff
        </button>
        <button 
          className={`taskorg-tab-btn ${activeTab === 'regiment' ? 'active' : ''}`}
          onClick={() => setActiveTab('regiment')}
        >
          Regiment Staff
        </button>
      </div>

      <div className="org-chart">
        {activeTab === 'company' && (
          <>
            {/* LEVEL 0: Tactical Officer */}
            {tacticalOfficer && (
              <div className="org-tier">
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
                  <PersonCard 
                     person={tacticalOfficer} 
                     customStyle={{
                       card: { borderColor: 'var(--accent-gold)', borderWidth: '2px', background: 'var(--bg-tertiary)', color: 'white' },
                       placeholder: { backgroundColor: 'var(--accent-gold)', color: 'white', borderColor: 'var(--accent-gold)' }
                     }} 
                  />
                </div>
                <div className="org-connector-down"></div>
              </div>
            )}

            {/* LEVEL 1: Commander & First Sgt */}
            {cmdr && (
              <div className="org-tier">
                {/* Use flex to center the CMDR. The First Sgt will be absolutely positioned off to the side so CMDR stays perfectly centered. */}
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  
                  {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
                      <PersonCard 
                        person={cmdr}
                        customStyle={{
                          card: { borderColor: 'var(--text-primary)', borderWidth: '2px' },
                          placeholder: { backgroundColor: 'var(--text-primary)', color: 'white', borderColor: 'var(--text-primary)' },
                          wrapper: { position: 'relative' }
                        }}
                      />
                      {firstSgt && (
                        <PersonCard 
                          person={firstSgt}
                          customStyle={{
                            card: { width: '220px' },
                            avatar: { width: '60px', height: '60px' },
                            placeholder: { width: '60px', height: '60px', fontSize: '1.5rem' },
                            name: { fontSize: '0.8rem' },
                            wrapper: { position: 'relative' } 
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <PersonCard 
                        person={cmdr}
                        customStyle={{
                          card: { borderColor: 'var(--text-primary)', borderWidth: '2px' },
                          placeholder: { backgroundColor: 'var(--text-primary)', color: 'white', borderColor: 'var(--text-primary)' },
                          wrapper: { position: 'relative' }
                        }}
                      />

                      {/* First Sergeant attached to the side */}
                      {firstSgt && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '50px',
                            left: '100%',
                            width: '3rem',
                            height: '2px',
                            backgroundColor: 'var(--border-color)',
                            zIndex: 0
                          }}></div>

                          <div style={{ 
                            position: 'absolute', 
                            left: 'calc(100% + 3rem)', 
                            top: '20px',
                            zIndex: 2 
                          }}>
                            <PersonCard 
                              person={firstSgt}
                              customStyle={{
                                card: { width: '220px' },
                                avatar: { width: '60px', height: '60px' },
                                placeholder: { width: '60px', height: '60px', fontSize: '1.5rem' },
                                name: { fontSize: '0.8rem' },
                                wrapper: { position: 'relative' } 
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
                <div className="org-connector-down"></div>
              </div>
            )}

            {/* LEVEL 2: EX-O */}
            {exo && (
              <div className="org-tier">
                <div style={{ display: 'flex', justifyContent: 'center', zIndex: 2 }}>
                  <PersonCard person={exo} />
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
          </>
        )}

        {activeTab === 'battalion' && (
          <div style={{ width: '100%' }}>
            {/* TIER 1: Battalion Executive Officer */}
            {bnExo && (
              <div className="org-tier">
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
                  <PersonCard 
                    person={bnExo} 
                    customStyle={{
                      card: { borderColor: 'var(--accent-gold)', borderWidth: '2px' },
                      placeholder: { backgroundColor: 'var(--accent-gold)', color: 'white' }
                    }} 
                    noConnector={true}
                  />
                </div>
                {bnOtherStaff.length > 0 && <div className="org-connector-down"></div>}
              </div>
            )}

            {/* TIER 2: Other Staff */}
            {bnOtherStaff.length > 0 && (
              <div className="org-tier">
                {bnOtherStaff.length > 1 && <div className="org-horizontal-line"></div>}
                <div className="org-nodes">
                  {bnOtherStaff.map((staff, i) => (
                    <PersonCard key={`bn-staff-${i}`} person={staff} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'regiment' && (
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <div className="org-nodes">
              {regimentStaff.map((staff, i) => (
                <PersonCard key={`reg-staff-${i}`} person={staff} noConnector={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
