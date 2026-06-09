import { getSheetData } from '../../../lib/googleSheets';
import { Suspense } from 'react';
import CouncilAdminForms from '../CouncilAdminForms';
import ImageGallery from '../ImageGallery';

const SHEET_ID = '1YeaoloRz4REe_iVomGfFI9WugalrDFsHiz04eOcD0a8';

const councilData = {
  taco: { title: "Tac O's Corner", sheetTab: 'TACO', overview: "Official announcements and activities direct from the Tactical Officer." },
  s1: { title: 'S1 Personnel', sheetTab: 'S1', overview: 'Responsible for personnel administration, maintaining unit strength, processing leaves, and managing the company roster and task organizations.' },
  s2: { title: 'S2 Security', sheetTab: 'S2', overview: 'Responsible for intelligence and security, managing security clearances, enforcing physical security, and ensuring information protection.' },
  s3: { title: 'S3 Operations', sheetTab: 'S3', overview: 'Responsible for training, operations, and plans. Coordinates all unit activities, exercises, and training schedules.' },
  s4: { title: 'S4 Logistics', sheetTab: 'S4', overview: 'Responsible for supply, maintenance, transportation, and services. Ensures the unit has all necessary equipment and facilities.' },
  s5: { title: 'S5 Plans & Programs', sheetTab: 'S5', overview: 'Responsible for civil-military operations, public affairs, and managing long-term strategic plans and programs.' },
  s6: { title: 'S6 Signal', sheetTab: 'S6', overview: 'Responsible for communications, information systems, and managing the digital bulletin board and smartphone racks.' },
  s7: { title: 'S7 Civil-Military', sheetTab: 'S7', overview: 'Responsible for civil-military operations, community relations, and coordinating with civilian organizations.' },
  s8: { title: 'S8 Education & Training', sheetTab: 'S8', overview: 'Responsible for academic excellence, managing the Academic Council, and overseeing educational programs.' },
  s10: { title: 'S10 Finance', sheetTab: 'S10', overview: 'Responsible for financial management, unit funds, budgets, and financial planning.' },
  athletic: { title: 'Athletic Council', sheetTab: 'ATHLETIC', overview: 'Responsible for physical fitness training, sports programs, and maintaining the PFT Tracker.' },
  gad: { title: 'GAD (Gender & Dev)', sheetTab: 'GAD', overview: 'Responsible for promoting gender equality, women empowerment, and managing related development programs.' },
  'honor-comm': { title: 'Honor Committee', sheetTab: 'HONOR COMM', overview: 'Responsible for educating the corps on the Honor Code and investigating suspected violations to maintain the integrity of the institution.' },
  ccpb: { title: 'CCPB', sheetTab: 'CCPB', overview: 'Responsible for internal discipline, enforcing regulations, and monitoring the conduct of personnel.' }
};

const urgencyStyles = {
  'LIGHT': { bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', color: '#4ade80', animation: 'none', label: 'FOR INFO' },
  'MODERATE': { bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', color: '#facc15', animation: 'none', label: 'ATTENTION' },
  'EMERGENCY': { bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171', color: '#f87171', animation: 'pulse-red 1.5s infinite', label: 'URGENT' },
  'FOR IMMEDIATE COMPLIANCE': { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', color: '#fb923c', animation: 'pulse-orange 1.5s infinite', label: 'FOR IMMEDIATE COMPLIANCE' }
};

export const revalidate = 30; // revalidate every 30 seconds

async function DisseminationCards({ councilId }) {
  const data = councilData[councilId];
  if (!data) return <div>Invalid Council</div>;

  let disseminations = [];
  try {
    disseminations = await getSheetData(SHEET_ID, data.sheetTab);
  } catch (error) {
    console.error('Failed to fetch disseminations:', error);
  }

  // Filter out empty rows or rows that just have the dropdown default text "TYPE" or "URGENCY"
  const validCards = disseminations.filter(d => {
    const type = String(d['TYPE'] || '').trim().toUpperCase();
    const urgency = String(d['URGENCY'] || '').trim().toUpperCase();
    const content = String(d['CONTENT'] || '').trim();
    
    // If it's just the default dropdown label, or there's no actual content, skip it
    if (type === 'TYPE' || urgency.startsWith('URGE') || !content) {
      return false;
    }
    return true;
  });

  if (validCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
        No active disseminations at this time.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
      {validCards.map((card, i) => {
        const urgency = String(card['URGENCY'] || '').trim().toUpperCase();
        const style = urgencyStyles[urgency] || urgencyStyles['LIGHT'];
        
        let dateAnnounced = String(card['DATE ANNOUNCED'] || '');
        if (dateAnnounced.includes('Date(')) {
          const match = dateAnnounced.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (match) {
            const dateObj = new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
            dateAnnounced = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        
        let eventMonth = '';
        let eventDay = '';
        if (String(card['TYPE'] || '').trim().toUpperCase() === 'ACTIVITY' && card['EVENT DATE']) {
          try {
            const d = new Date(card['EVENT DATE']);
            if (!isNaN(d.getTime())) {
              eventMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              eventDay = d.getDate();
            } else {
              const parts = card['EVENT DATE'].split(' ');
              if (parts.length >= 2) {
                eventMonth = parts[0].substring(0, 3).toUpperCase();
                eventDay = parts[1].replace(/[^0-9]/g, '');
              }
            }
          } catch (e) {}
        }

        return (
          <div key={i} style={{
            background: 'var(--bg-secondary)',
            border: `2px solid ${style.border}`,
            borderTop: `12px solid ${style.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            animation: style.animation,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: style.border, textTransform: 'uppercase' }}>
                {card['TYPE'] || 'ANNOUNCEMENT'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {eventDay && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    border: `2px solid ${style.border}`, borderRadius: '6px', overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: 'white',
                    minWidth: '50px'
                  }}>
                    <div style={{ background: style.border, color: 'white', width: '100%', textAlign: 'center', fontSize: '0.6rem', fontWeight: 'bold', padding: '0.1rem 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {eventMonth}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', padding: '0.1rem 0.25rem', lineHeight: '1' }}>
                      {eventDay}
                    </div>
                  </div>
                )}
                <div style={{ 
                  background: style.bg, 
                  color: style.color, 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {style.label}
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-wrap' }}>
              {card['CONTENT'] || 'No content provided.'}
            </div>
            
            {/* If the Google API parses the header as "Column 6", we should check both keys */}
            {((card['ATTACHMENT'] && card['ATTACHMENT'].trim() !== '') || (card['Column 6'] && card['Column 6'].trim() !== '')) && (
              <ImageGallery urls={(card['ATTACHMENT'] || card['Column 6']).split(',')} />
            )}
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <strong>Date Announced:</strong> {dateAnnounced || 'N/A'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CouncilDisseminationPage({ params }) {
  const councilId = params.council.toLowerCase();
  const data = councilData[councilId];

  if (!data) {
    return (
      <div className="dashboard-container">
        <h1>Council Not Found</h1>
        <p>The council "{councilId}" does not exist.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      {/* Header section */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 100%)', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '16px', 
        padding: '2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'var(--gold-primary)', fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {data.title} Disseminations
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.6 }}>
            <strong>Welcome.</strong> {data.overview}
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '-20%',
          fontSize: '12rem',
          opacity: 0.03,
          fontWeight: 900,
          pointerEvents: 'none'
        }}>
          {data.sheetTab}
        </div>
      </div>

      <CouncilAdminForms councilName={data.sheetTab} />

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading disseminations...</div>}>
        <DisseminationCards councilId={councilId} />
      </Suspense>
    </div>
  );
}
