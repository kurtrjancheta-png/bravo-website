'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCadetImageUrl } from '../../lib/imageMatcher';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const MONTH_NAMES = [
  'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'
];

const CLASS_MAP = {
  '2027': '1CL',
  '2028': '2CL',
  '2029': '3CL',
  '2030': '4CL'
};

export default function FinanceDashboard({ trackers = {}, monthlySheets = {} }) {
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' or 'balance'
  const [selectedClass, setSelectedClass] = useState('1CL'); // '1CL', '2CL', '3CL'
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(1); // Default to June (index 1) since May Coy wasn't collected
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unpaid_any', 'unpaid_coy', 'unpaid_cdt', 'paid_both'
  const [selectedCadet, setSelectedCadet] = useState(null); // For history modal
  const [balanceMonth, setBalanceMonth] = useState('JUNE'); // Default active month for balance sheet

  // 1. Parse Monthly Balance Sheets
  const parsedMonths = useMemo(() => {
    const monthsData = {};
    
    Object.entries(monthlySheets).forEach(([monthName, rows]) => {
      if (!rows || rows.length === 0) return;
      
      const uniqueColumns = Object.keys(rows[0] || {});
      const labelKey = uniqueColumns[1];
      const debitKey = uniqueColumns[3];
      
      // Find expense columns
      const dateKey = uniqueColumns.find(c => c.toUpperCase().includes('DATE')) || uniqueColumns[7];
      const itemKey = uniqueColumns.find(c => c.toUpperCase() === 'ITEM') || uniqueColumns[8];
      const amountKey = uniqueColumns.find(c => c.toUpperCase() === 'AMOUNT') || uniqueColumns[9];
      const byKey = uniqueColumns.find(c => c.toUpperCase() === 'BY') || uniqueColumns[10];

      const assets = [];
      const liabilities = [];
      let totalAssets = 0;
      let totalLiabilities = 0;
      let netAssets = 0;
      const expenses = [];
      
      let currentSection = 'ASSETS';
      let preparedBy = '';
      let notedBy = '';

      rows.forEach(row => {
        const label = (row[labelKey] || '').toString().trim();
        const debitVal = parseFloat(row[debitKey]) || 0;

        if (label) {
          const upperLabel = label.toUpperCase();
          if (upperLabel === 'ASSETS' || upperLabel === 'CURRENT ASSETS') {
            currentSection = 'ASSETS';
          } else if (upperLabel === 'LIABILITIES') {
            currentSection = 'LIABILITIES';
          } else if (upperLabel.startsWith('TOTAL ASSETS')) {
            totalAssets = debitVal;
          } else if (upperLabel.startsWith('TOTAL LIABILITIES')) {
            totalLiabilities = debitVal;
          } else if (upperLabel.startsWith('NET ASSETS')) {
            netAssets = debitVal;
          } else if (upperLabel.startsWith('PREPARED BY:')) {
            preparedBy = label;
          } else if (upperLabel.startsWith('NOTED BY:')) {
            notedBy = label;
          } else {
            // General Asset / Liability Row
            if (currentSection === 'ASSETS' && !upperLabel.includes('ASSETS')) {
              assets.push({ name: label, amount: debitVal });
            } else if (currentSection === 'LIABILITIES' && !upperLabel.includes('LIABILITIES')) {
              liabilities.push({ name: label, amount: debitVal });
            }
          }
        }

        // Parse Expense Row
        const expDateStr = (row[dateKey] || '').toString().trim();
        const expItem = (row[itemKey] || '').toString().trim();
        const expAmount = parseFloat(row[amountKey]) || 0;
        const expBy = (row[byKey] || '').toString().trim();

        if (expDateStr && expItem && expAmount > 0) {
          let formattedDate = expDateStr;
          if (expDateStr.includes('Date(')) {
            const match = expDateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (match) {
              const year = parseInt(match[1]);
              const month = parseInt(match[2]) + 1; // 0-indexed in sheet
              const day = parseInt(match[3]);
              formattedDate = `${month}/${day}/${year}`;
            }
          }
          expenses.push({
            date: formattedDate,
            item: expItem,
            amount: expAmount,
            by: expBy
          });
        }
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      // Only add months that contain actual balance data
      if (totalAssets > 0 || totalExpenses > 0) {
        monthsData[monthName] = {
          assets,
          liabilities,
          totalAssets,
          totalLiabilities,
          netAssets,
          expenses,
          totalExpenses,
          preparedBy,
          notedBy
        };
      }
    });

    return monthsData;
  }, [monthlySheets]);

  // Active months for balance sheet tab (past months only)
  const activeBalanceMonths = useMemo(() => Object.keys(parsedMonths), [parsedMonths]);

  // 2. Parse Cadet Payments
  const parsedTrackers = useMemo(() => {
    const data = {};

    Object.entries(trackers).forEach(([className, rows]) => {
      if (!rows || rows.length === 0) return;

      const uniqueColumns = Object.keys(rows[0] || {});
      const nameKey = uniqueColumns.find(k => k.endsWith('CL') || k.trim().endsWith('CL')) || uniqueColumns[0];
      
      const cadets = rows.map(row => {
        const name = (row[nameKey] || '').toString().trim();
        // Skip summary and empty rows
        if (!name || name === 'TOTAL COLLECTED' || name === 'BALANCE' || name.toUpperCase().includes('TOTAL')) {
          return null;
        }

        const coyNight = parseFloat(row[uniqueColumns[1]]) || 0;
        
        // Parse monthly payments
        const monthlyPayments = MONTH_NAMES.map((mName, idx) => {
          const cdtIndex = 3 + 2 * idx;
          const coyIndex = 2 + 2 * idx;

          const cdtPaid = parseFloat(row[uniqueColumns[cdtIndex]]) || 0;
          let coyPaid = 0;
          let hasCoy = true;

          if (idx === 0) {
            // May: No Coy Fund collected
            hasCoy = false;
          } else {
            coyPaid = parseFloat(row[uniqueColumns[coyIndex]]) || 0;
          }

          const cdtStatus = cdtPaid >= 400 ? 'PAID' : (cdtPaid > 0 ? 'PARTIAL' : 'UNPAID');
          const coyStatus = !hasCoy ? 'N/A' : (coyPaid >= 300 ? 'PAID' : (coyPaid > 0 ? 'PARTIAL' : 'UNPAID'));

          return {
            month: mName,
            cdtPaid,
            coyPaid,
            cdtStatus,
            coyStatus,
            hasCoy
          };
        });

        // Resolve profile image
        const mappedClassName = CLASS_MAP[className] || className;
        const imgUrl = getCadetImageUrl(name, '', '', mappedClassName);

        return {
          name,
          coyNight,
          payments: monthlyPayments,
          imageUrl: imgUrl
        };
      }).filter(Boolean);

      const targetKey = CLASS_MAP[className] || className;
      data[targetKey] = cadets;
    });

    return data;
  }, [trackers]);

  // Get current active cadets based on class filter
  const currentCadets = parsedTrackers[selectedClass] || [];

  // Filtered Cadets list based on search and status filters
  const filteredCadets = useMemo(() => {
    return currentCadets.filter(cadet => {
      const matchesSearch = cadet.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const paymentInfo = cadet.payments[selectedMonthIdx];
      const cdtPaid = paymentInfo.cdtStatus === 'PAID';
      const coyPaid = paymentInfo.coyStatus === 'PAID' || paymentInfo.coyStatus === 'N/A';

      let matchesStatus = true;
      if (statusFilter === 'unpaid_any') {
        matchesStatus = !cdtPaid || (!coyPaid && paymentInfo.hasCoy);
      } else if (statusFilter === 'unpaid_coy') {
        matchesStatus = !coyPaid && paymentInfo.hasCoy;
      } else if (statusFilter === 'unpaid_cdt') {
        matchesStatus = !cdtPaid;
      } else if (statusFilter === 'paid_both') {
        matchesStatus = cdtPaid && coyPaid;
      }

      return matchesSearch && matchesStatus;
    });
  }, [currentCadets, searchQuery, statusFilter, selectedMonthIdx]);

  // 3. Global Stats Calculations for 1CL to 3CL Cadets Combined
  const currentMonthName = MONTH_NAMES[selectedMonthIdx];
  const globalTrackerStats = useMemo(() => {
    let totalCdtCount = 0;
    let totalCoyCount = 0;
    let paidCdtCount = 0;
    let paidCoyCount = 0;
    let coyApplicableCount = 0;

    // Aggregate across 1CL, 2CL, and 3CL trackers
    ['1CL', '2CL', '3CL'].forEach(className => {
      const cadets = parsedTrackers[className] || [];
      cadets.forEach(c => {
        const p = c.payments[selectedMonthIdx];
        if (!p) return;
        
        totalCdtCount++;
        if (p.cdtStatus === 'PAID') {
          paidCdtCount++;
        }
        
        if (p.hasCoy) {
          coyApplicableCount++;
          if (p.coyStatus === 'PAID') {
            paidCoyCount++;
          }
        }
      });
    });

    return {
      cdtPct: totalCdtCount > 0 ? Math.round((paidCdtCount / totalCdtCount) * 100) : 0,
      coyPct: coyApplicableCount > 0 ? Math.round((paidCoyCount / coyApplicableCount) * 100) : 0
    };
  }, [parsedTrackers, selectedMonthIdx]);

  // Get current active balance sheet month details
  const activeMonthData = parsedMonths[balanceMonth] || null;

  // Grouped expenses for the charts
  const expenseChartData = useMemo(() => {
    if (!activeMonthData || !activeMonthData.expenses) return [];

    const categories = {
      'Coy Night / Food': 0,
      'Tarpaulins': 0,
      'Event Decors & Utensils': 0,
      'Others': 0
    };

    activeMonthData.expenses.forEach(e => {
      const desc = e.item.toLowerCase();
      if (desc.includes('beef') || desc.includes('pork') || desc.includes('lettuce') || desc.includes('softdrinks') || desc.includes('food') || desc.includes('night')) {
        categories['Coy Night / Food'] += e.amount;
      } else if (desc.includes('tarpaulin') || desc.includes('tarp')) {
        categories['Tarpaulins'] += e.amount;
      } else if (desc.includes('utensils') || desc.includes('decorations') || desc.includes('bouquet') || desc.includes('flower') || desc.includes('disposable')) {
        categories['Event Decors & Utensils'] += e.amount;
      } else {
        categories['Others'] += e.amount;
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [activeMonthData]);

  // Monthly Budget vs Expenses over time (for the Line Graph)
  const monthlyTrendData = useMemo(() => {
    const data = [];
    MONTH_NAMES.forEach(mName => {
      const monthData = parsedMonths[mName];
      if (monthData) {
        data.push({
          month: mName,
          Budget: monthData.totalAssets,
          Expenses: monthData.totalExpenses
        });
      }
    });
    return data;
  }, [parsedMonths]);

  const COLORS_PIE = ['#c5a880', '#568f76', '#a26262', '#5d6f8a'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Page global styles injection to maximize layout & scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: `
        .main-content {
          max-width: 1600px !important;
        }
        .finance-card-hover {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .finance-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.4);
          border-color: rgba(197, 168, 128, 0.4) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(197, 168, 128, 0.4);
        }
      `}} />

      {/* 1. TOP OVERVIEW KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        {/* Coy Fund Collections KPI (1st place) */}
        <div className="info-card finance-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>COY FUND RATE</span>
            <span style={{ fontSize: '1.35rem' }}>🏰</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {globalTrackerStats.coyPct}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>Collected</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginTop: '0.1rem' }}>
            <div style={{ width: `${globalTrackerStats.coyPct}%`, height: '100%', background: 'linear-gradient(90deg, #568f76, #3b7a57)', borderRadius: '6px' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            1CL to 3CL for {currentMonthName}
          </span>
        </div>

        {/* Cadet Fund Collections KPI (2nd place) */}
        <div className="info-card finance-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>CADET FUND RATE</span>
            <span style={{ fontSize: '1.35rem' }}>🛡️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {globalTrackerStats.cdtPct}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>Collected</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginTop: '0.1rem' }}>
            <div style={{ width: `${globalTrackerStats.cdtPct}%`, height: '100%', background: 'linear-gradient(90deg, #c5a880, #a08155)', borderRadius: '6px' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            1CL to 3CL for {currentMonthName}
          </span>
        </div>

        {/* Net Cash Asset KPI (3rd place) */}
        <div className="info-card finance-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>NET CASH ASSETS</span>
            <span style={{ fontSize: '1.35rem' }}>💰</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
            ₱{activeMonthData ? activeMonthData.netAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.6rem' }}>
            As of latest active report ({balanceMonth})
          </span>
        </div>

        {/* Spend KPI (4th place) */}
        <div className="info-card finance-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>MONTHLY SPEND</span>
            <span style={{ fontSize: '1.35rem' }}>💸</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
            ₱{activeMonthData ? activeMonthData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.6rem' }}>
            Total spent in {balanceMonth}
          </span>
        </div>

      </div>

      {/* 2. SUB-TAB VIEW SELECTOR PILLS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px', gap: '2rem' }}>
        <button 
          onClick={() => setActiveTab('tracker')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 0.25rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'tracker' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'tracker' ? '3px solid #c5a880' : '3px solid transparent',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          👤 Cadet Payment Checklist
        </button>
        <button 
          onClick={() => setActiveTab('balance')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 0.25rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'balance' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'balance' ? '3px solid #c5a880' : '3px solid transparent',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          📊 Monthly Balance Sheets
        </button>
      </div>

      {/* 3. SUB-TAB CONTENTS */}
      <div>
        
        {/* A. CADET PAYMENTS TAB */}
        {activeTab === 'tracker' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filter controls row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              {/* Class Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>CLASS</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['1CL', '2CL', '3CL'].map(cls => (
                    <button
                      key={cls}
                      onClick={() => { setSelectedClass(cls); setStatusFilter('all'); }}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: selectedClass === cls ? '1px solid #c5a880' : '1px solid var(--border-color)',
                        background: selectedClass === cls ? 'rgba(197, 168, 128, 0.12)' : 'var(--bg-primary)',
                        color: selectedClass === cls ? '#c5a880' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>MONTH</span>
                <select
                  value={selectedMonthIdx}
                  onChange={(e) => setSelectedMonthIdx(parseInt(e.target.value))}
                  style={{
                    padding: '0.45rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>STATUS</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Cadets</option>
                  <option value="unpaid_any">Unpaid (Any Fund)</option>
                  <option value="unpaid_cdt">Unpaid Cadet Fund</option>
                  <option value="unpaid_coy">Unpaid Coy Fund</option>
                  <option value="paid_both">Fully Paid</option>
                </select>
              </div>

              {/* Search Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '220px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>SEARCH SURNAME</span>
                <input 
                  type="text"
                  placeholder="Type surname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.45rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

            </div>

            {/* Cadet checklist grid */}
            {currentCadets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                No cadets configured in the sheet for this class yet.
              </div>
            ) : filteredCadets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                No cadets match your search filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {filteredCadets.map((cadet, index) => {
                  const paymentInfo = cadet.payments[selectedMonthIdx];

                  return (
                    <motion.div 
                      key={cadet.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.2) }}
                      className="info-card finance-card-hover"
                      style={{
                        padding: '1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* Cadet Image */}
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
                          {cadet.imageUrl ? (
                            <img src={cadet.imageUrl} alt={cadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'bold' }}>
                              {cadet.name.substring(0, 2)}
                            </span>
                          )}
                        </div>

                        {/* Cadet Info */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            {cadet.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {selectedClass} Cadet
                          </span>
                        </div>
                      </div>

                      {/* Payment Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-end' }}>
                        
                        {/* CDT Fund Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>CDT</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: paymentInfo.cdtStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : (paymentInfo.cdtStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                            color: paymentInfo.cdtStatus === 'PAID' ? '#10b981' : (paymentInfo.cdtStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                            border: `1px solid ${paymentInfo.cdtStatus === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : (paymentInfo.cdtStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`
                          }}>
                            ₱{paymentInfo.cdtPaid}
                          </span>
                        </div>

                        {/* COY Fund Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>COY</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: paymentInfo.coyStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : (paymentInfo.coyStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : (paymentInfo.coyStatus === 'N/A' ? 'rgba(156, 163, 175, 0.12)' : 'rgba(239, 68, 68, 0.12)')),
                            color: paymentInfo.coyStatus === 'PAID' ? '#10b981' : (paymentInfo.coyStatus === 'PARTIAL' ? '#f59e0b' : (paymentInfo.coyStatus === 'N/A' ? '#9ca3af' : '#ef4444')),
                            border: `1px solid ${paymentInfo.coyStatus === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : (paymentInfo.coyStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.3)' : (paymentInfo.coyStatus === 'N/A' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(239, 68, 68, 0.3)'))}`
                          }}>
                            {paymentInfo.coyStatus === 'N/A' ? 'N/A' : `₱${paymentInfo.coyPaid}`}
                          </span>
                        </div>

                        {/* History button */}
                        <button 
                          onClick={() => setSelectedCadet(cadet)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.75rem',
                            color: '#c5a880',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 0 0 0',
                            textDecoration: 'underline',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#dfc8a5'}
                          onMouseLeave={(e) => e.target.style.color = '#c5a880'}
                        >
                          View History
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* B. MONTHLY BALANCE SHEETS TAB */}
        {activeTab === 'balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Month select row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {activeBalanceMonths.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No active balance sheets loaded yet.</div>
              ) : (
                activeBalanceMonths.map(mName => (
                  <button
                    key={mName}
                    onClick={() => setBalanceMonth(mName)}
                    style={{
                      padding: '0.45rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: balanceMonth === mName ? '#c5a880' : 'transparent',
                      color: balanceMonth === mName ? '#1e293b' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {mName}
                  </button>
                ))
              )}
            </div>

            {activeMonthData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* Visual grid - Left Assets/Liabilities, Right Expenses */}
                <div className="finance-grid">
                  
                  {/* Assets & Liabilities list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        🏦 Assets & Liabilities
                      </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c5a880', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>CURRENT ASSETS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {activeMonthData.assets.map((asset, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                              <span style={{ color: 'var(--text-primary)' }}>{asset.name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                ₱{asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {activeMonthData.liabilities.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>LIABILITIES</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {activeMonthData.liabilities.map((liab, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{liab.name}</span>
                                <span style={{ fontWeight: 700, color: '#ef4444' }}>
                                  ₱{liab.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Assets:</span>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>
                            ₱{activeMonthData.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Liabilities:</span>
                          <span style={{ fontWeight: 800, color: '#ef4444' }}>
                            ₱{activeMonthData.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', background: 'rgba(197, 168, 128, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(197, 168, 128, 0.25)', marginTop: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: '#c5a880', letterSpacing: '-0.01em' }}>Net Cash Assets</span>
                          <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>
                            ₱{activeMonthData.netAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Expense Items Breakdown list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        💸 Monthly Expenses
                      </h2>
                      <span style={{ fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 10px', borderRadius: '6px', color: '#f87171', fontWeight: 800 }}>
                        Total: ₱{activeMonthData.totalExpenses.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="custom-scrollbar" style={{ maxHeight: '370px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '6px' }}>
                      {activeMonthData.expenses.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                          No expenses recorded for this month.
                        </div>
                      ) : (
                        activeMonthData.expenses.map((exp, idx) => (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--bg-secondary)',
                              padding: '0.85rem 1.15rem',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                {exp.item}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {exp.date} &bull; Spent by {exp.by}
                              </span>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              ₱{exp.amount.toLocaleString('en-US')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* 4. CHARTS SECTIONS (Desktop/Laptop Optimized) */}
                <div className="finance-grid" style={{ marginTop: '1.5rem' }}>
                  
                  {/* Category Breakdown Pie Chart */}
                  <div className="pft-chart-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '14px', height: '380px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
                      Pie Chart: Expense Categories ({balanceMonth})
                    </h3>
                    {expenseChartData.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        No chart data available
                      </div>
                    ) : (
                      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseChartData}
                              cx="50%"
                              cy="45%"
                              innerRadius={65}
                              outerRadius={95}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {expenseChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Premium Donut Center Hole Text Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '41%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none'
                        }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>TOTAL SPENT</span>
                          <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 900, marginTop: '2px', display: 'block' }}>
                            ₱{activeMonthData.totalExpenses.toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monthly Budget vs Expenses Line Chart */}
                  <div className="pft-chart-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '14px', height: '380px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
                      Line Chart: Budget vs Expenses Over Time
                    </h3>
                    <div style={{ flex: 1, width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={monthlyTrendData}
                          margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} />
                          <YAxis tickFormatter={(val) => `₱${val/1000}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} />
                          <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                          <Legend iconType="circle" />
                          <Line type="monotone" name="Total Budget" dataKey="Budget" stroke="#10b981" strokeWidth={3} activeDot={{ r: 7 }} dot={{ strokeWidth: 2, r: 4 }} />
                          <Line type="monotone" name="Total Expenses" dataKey="Expenses" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 7 }} dot={{ strokeWidth: 2, r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* 6. CADET PAYMENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedCadet && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                width: '100%',
                maxWidth: '650px',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
                    {selectedCadet.imageUrl ? (
                      <img src={selectedCadet.imageUrl} alt={selectedCadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.95rem', color: '#9ca3af', fontWeight: 'bold' }}>
                        {selectedCadet.name.substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      {selectedCadet.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      12-Month Finance Ledger ({selectedClass})
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedCadet(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="custom-scrollbar" style={{ padding: '1.5rem', maxHeight: '420px', overflowY: 'auto' }}>
                
                {/* Special collections (Coy Night) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Special Collections: Coy Night</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>One-time collection for company night events</span>
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: selectedCadet.coyNight >= 500 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: selectedCadet.coyNight >= 500 ? '#10b981' : '#ef4444',
                    border: `1px solid ${selectedCadet.coyNight >= 500 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                  }}>
                    {selectedCadet.coyNight >= 500 ? 'Paid ₱500' : 'Unpaid'}
                  </span>
                </div>

                {/* Ledger Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '0.35rem 0.5rem', borderBottom: '1.5px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                    <span>MONTH</span>
                    <span style={{ textAlign: 'center' }}>CADET FUND (400)</span>
                    <span style={{ textAlign: 'center' }}>COY FUND (300)</span>
                  </div>
                  
                  {selectedCadet.payments.map((p) => (
                    <div 
                      key={p.month}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr',
                        padding: '0.65rem 0.5rem',
                        alignItems: 'center',
                        fontSize: '0.88rem',
                        borderBottom: '1px solid rgba(255,255,255,0.03)'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.month}</span>
                      
                      {/* Cadet Fund paid */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '5px',
                          background: p.cdtStatus === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : (p.cdtStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                          color: p.cdtStatus === 'PAID' ? '#10b981' : (p.cdtStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                        }}>
                          ₱{p.cdtPaid}
                        </span>
                      </div>

                      {/* Coy Fund paid */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {p.hasCoy ? (
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: '5px',
                            background: p.coyStatus === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : (p.coyStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                            color: p.coyStatus === 'PAID' ? '#10b981' : (p.coyStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                          }}>
                            ₱{p.coyPaid}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 500 }}>
                            N/A
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1.15rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.01)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedCadet(null)}
                  style={{
                    padding: '0.5rem 1.4rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#334155'}
                  onMouseLeave={(e) => e.target.style.background = '#1e293b'}
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
