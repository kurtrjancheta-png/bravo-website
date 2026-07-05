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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const MONTH_NAMES = [
  'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'
];

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
        const imgUrl = getCadetImageUrl(name, '', '', className);

        return {
          name,
          coyNight,
          payments: monthlyPayments,
          imageUrl: imgUrl
        };
      }).filter(Boolean);

      data[className] = cadets;
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

  // 3. Stats Calculations for KPIs
  const currentMonthName = MONTH_NAMES[selectedMonthIdx];
  const trackerStats = useMemo(() => {
    if (currentCadets.length === 0) return { cdtPct: 0, coyPct: 0, unpaidCount: 0 };
    
    let cdtPaidCount = 0;
    let coyPaidCount = 0;
    let unpaidCount = 0;
    let coyApplicableCount = 0;

    currentCadets.forEach(c => {
      const p = c.payments[selectedMonthIdx];
      const isCdtPaid = p.cdtStatus === 'PAID';
      const isCoyPaid = p.coyStatus === 'PAID' || p.coyStatus === 'N/A';

      if (isCdtPaid) cdtPaidCount++;
      if (p.hasCoy) {
        coyApplicableCount++;
        if (p.coyStatus === 'PAID') coyPaidCount++;
      }
      
      if (!isCdtPaid || (!isCoyPaid && p.hasCoy)) {
        unpaidCount++;
      }
    });

    return {
      cdtPct: Math.round((cdtPaidCount / currentCadets.length) * 100),
      coyPct: coyApplicableCount > 0 ? Math.round((coyPaidCount / coyApplicableCount) * 100) : 100,
      unpaidCount
    };
  }, [currentCadets, selectedMonthIdx]);

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

  // Collection rates over time for the bar chart
  const collectionsHistoryChartData = useMemo(() => {
    // Collect stats from MAY, JUNE, etc. dynamically
    const data = [];
    MONTH_NAMES.forEach((mName, mIdx) => {
      // Find if we have records for this month
      let totalCdtPaid = 0;
      let totalCoyPaid = 0;
      let totalExpected = 0;

      // Count across all classes (1CL, 2CL, 3CL)
      let classesWithData = 0;
      Object.entries(parsedTrackers).forEach(([className, cadets]) => {
        if (cadets.length === 0) return;
        classesWithData++;
        cadets.forEach(c => {
          const p = c.payments[mIdx];
          totalCdtPaid += p.cdtPaid;
          totalCoyPaid += p.coyPaid;
        });
      });

      if (classesWithData > 0 && (totalCdtPaid > 0 || totalCoyPaid > 0)) {
        data.push({
          month: mName,
          'Cadet Fund': totalCdtPaid,
          'Company Fund': totalCoyPaid
        });
      }
    });
    return data;
  }, [parsedTrackers]);

  const COLORS_PIE = ['#c5a880', '#568f76', '#a26262', '#5d6f8a'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. TOP OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Net Cash Asset KPI */}
        <div className="info-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NET CASH ASSETS</span>
            <span style={{ fontSize: '1.25rem' }}>💰</span>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₱{activeMonthData ? activeMonthData.netAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            As of latest active report ({balanceMonth})
          </span>
        </div>

        {/* Cadet Fund Collections KPI */}
        <div className="info-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CADET FUND RATE</span>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {trackerStats.cdtPct}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Collected</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${trackerStats.cdtPct}%`, height: '100%', background: '#c5a880', borderRadius: '4px' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {selectedClass} for {currentMonthName}
          </span>
        </div>

        {/* Coy Fund Collections KPI */}
        <div className="info-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>COY FUND RATE</span>
            <span style={{ fontSize: '1.25rem' }}>🏰</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {trackerStats.coyPct}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Collected</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${trackerStats.coyPct}%`, height: '100%', background: '#568f76', borderRadius: '4px' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {selectedClass} for {currentMonthName}
          </span>
        </div>

        {/* Spend KPI */}
        <div className="info-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MONTHLY SPEND</span>
            <span style={{ fontSize: '1.25rem' }}>💸</span>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₱{activeMonthData ? activeMonthData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Total spent in {balanceMonth}
          </span>
        </div>

      </div>

      {/* 2. SUB-TAB VIEW SELECTOR PILLS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px', gap: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('tracker')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
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
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              {/* Class Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CLASS</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['1CL', '2CL', '3CL'].map(cls => (
                    <button
                      key={cls}
                      onClick={() => { setSelectedClass(cls); setStatusFilter('all'); }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selectedClass === cls ? 'none' : '1px solid var(--border-color)',
                        background: selectedClass === cls ? '#1e293b' : 'var(--bg-primary)',
                        color: selectedClass === cls ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MONTH</span>
                <select
                  value={selectedMonthIdx}
                  onChange={(e) => setSelectedMonthIdx(parseInt(e.target.value))}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>STATUS</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '180px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SEARCH SURNAME</span>
                <input 
                  type="text"
                  placeholder="Type surname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>

            </div>

            {/* Cadet checklist grid */}
            {currentCadets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No cadets configured in the sheet for this class yet.
              </div>
            ) : filteredCadets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No cadets match your search filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filteredCadets.map((cadet, index) => {
                  const paymentInfo = cadet.payments[selectedMonthIdx];
                  const cdtPaid = paymentInfo.cdtStatus === 'PAID';
                  const coyPaid = paymentInfo.coyStatus === 'PAID' || paymentInfo.coyStatus === 'N/A';

                  return (
                    <motion.div 
                      key={cadet.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                      className="info-card"
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Cadet Image */}
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
                          {cadet.imageUrl ? (
                            <img src={cadet.imageUrl} alt={cadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 'bold' }}>
                              {cadet.name.substring(0, 2)}
                            </span>
                          )}
                        </div>

                        {/* Cadet Info */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {cadet.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {selectedClass} Cadet
                          </span>
                        </div>
                      </div>

                      {/* Payment Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                        
                        {/* CDT Fund Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CDT:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: paymentInfo.cdtStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : (paymentInfo.cdtStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: paymentInfo.cdtStatus === 'PAID' ? '#10b981' : (paymentInfo.cdtStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                            border: `1px solid ${paymentInfo.cdtStatus === 'PAID' ? '#10b981' : (paymentInfo.cdtStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444')}`
                          }}>
                            ₱{paymentInfo.cdtPaid}
                          </span>
                        </div>

                        {/* COY Fund Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>COY:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: paymentInfo.coyStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : (paymentInfo.coyStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : (paymentInfo.coyStatus === 'N/A' ? 'rgba(156, 163, 175, 0.15)' : 'rgba(239, 68, 68, 0.15)')),
                            color: paymentInfo.coyStatus === 'PAID' ? '#10b981' : (paymentInfo.coyStatus === 'PARTIAL' ? '#f59e0b' : (paymentInfo.coyStatus === 'N/A' ? '#9ca3af' : '#ef4444')),
                            border: `1px solid ${paymentInfo.coyStatus === 'PAID' ? '#10b981' : (paymentInfo.coyStatus === 'PARTIAL' ? '#f59e0b' : (paymentInfo.coyStatus === 'N/A' ? '#9ca3af' : '#ef4444'))}`
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
                            fontSize: '0.7rem',
                            color: '#c5a880',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 0 0 0',
                            textDecoration: 'underline'
                          }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Month select row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {activeBalanceMonths.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No active balance sheets loaded yet.</div>
              ) : (
                activeBalanceMonths.map(mName => (
                  <button
                    key={mName}
                    onClick={() => setBalanceMonth(mName)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: balanceMonth === mName ? '#1e293b' : 'transparent',
                      color: balanceMonth === mName ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mName}
                  </button>
                ))
              )}
            </div>

            {activeMonthData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Visual grid - Left Assets/Liabilities, Right Expenses */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  
                  {/* Assets & Liabilities list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        🏦 Assets & Liabilities
                      </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>CURRENT ASSETS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {activeMonthData.assets.map((asset, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
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
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LIABILITIES</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {activeMonthData.liabilities.map((liab, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{liab.name}</span>
                                <span style={{ fontWeight: 700, color: '#ef4444' }}>
                                  ₱{liab.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', borderTop: '2px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Total Assets:</span>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>
                            ₱{activeMonthData.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Total Liabilities:</span>
                          <span style={{ fontWeight: 800, color: '#ef4444' }}>
                            ₱{activeMonthData.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Net Cash Assets:</span>
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
                      <span style={{ fontSize: '0.9rem', background: '#c0392b', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                        Total: ₱{activeMonthData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.50rem', paddingRight: '4px' }}>
                      {activeMonthData.expenses.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No expenses recorded for this month.</div>
                      ) : (
                        activeMonthData.expenses.map((exp, idx) => (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--bg-secondary)',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{exp.item}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {exp.date} • Spent by {exp.by}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              ₱{exp.amount.toLocaleString('en-US')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* 4. CHARTS SECTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                  
                  {/* Category Breakdown Pie Chart */}
                  <div className="pft-chart-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', height: '360px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
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
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {expenseChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Collections Bar Chart */}
                  <div className="pft-chart-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', height: '360px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      Bar Chart: Collections Over Time (All Classes)
                    </h3>
                    <div style={{ flex: 1, width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={collectionsHistoryChartData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                          <YAxis tickFormatter={(val) => `₱${val/1000}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                          <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="Cadet Fund" fill="#c5a880" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Company Fund" fill="#568f76" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* 5. SIGNATURE BLOCKS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>PREPARED BY</span>
                    <pre style={{
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: '1.4'
                    }}>
                      {activeMonthData.preparedBy.replace('Prepared by:', '').trim()}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '350px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>NOTED BY</span>
                    <pre style={{
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: '1.4'
                    }}>
                      {activeMonthData.notedBy.replace('Noted by:', '').trim() || 'JETHRO C. OLAVIDEZ\nLCDR, PN\nBravo Company Tactical Officer'}
                    </pre>
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
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                width: '100%',
                maxWidth: '650px',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
                    {selectedCadet.imageUrl ? (
                      <img src={selectedCadet.imageUrl} alt={selectedCadet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 'bold' }}>
                        {selectedCadet.name.substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                      {selectedCadet.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      12-Month Finance Ledger ({selectedClass})
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedCadet(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', maxHeight: '450px', overflowY: 'auto' }}>
                
                {/* Special collections (Coy Night) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Special Collections: Coy Night</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>One-time collection for company night events</span>
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: selectedCadet.coyNight >= 500 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: selectedCadet.coyNight >= 500 ? '#10b981' : '#ef4444',
                    border: `1px solid ${selectedCadet.coyNight >= 500 ? '#10b981' : '#ef4444'}`
                  }}>
                    {selectedCadet.coyNight >= 500 ? 'Paid ₱500' : 'Unpaid'}
                  </span>
                </div>

                {/* Ledger Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
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
                        padding: '0.5rem',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(255,255,255,0.03)'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.month}</span>
                      
                      {/* Cadet Fund paid */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: '4px',
                          background: p.cdtStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : (p.cdtStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                          color: p.cdtStatus === 'PAID' ? '#10b981' : (p.cdtStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                        }}>
                          ₱{p.cdtPaid}
                        </span>
                      </div>

                      {/* Coy Fund paid */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {p.hasCoy ? (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '4px',
                            background: p.coyStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : (p.coyStatus === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                            color: p.coyStatus === 'PAID' ? '#10b981' : (p.coyStatus === 'PARTIAL' ? '#f59e0b' : '#ef4444'),
                          }}>
                            ₱{p.coyPaid}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
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
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.01)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedCadet(null)}
                  style={{
                    padding: '0.4rem 1.2rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
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
