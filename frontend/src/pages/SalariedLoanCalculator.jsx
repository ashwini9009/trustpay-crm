import React, { useState, useEffect } from 'react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatLakh = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return formatCurrency(val);
};

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

const emptyApplicant = (label) => ({
  label,
  basic: '', hra: '', others: '', medical: '', conveyance: '',
  miscSalary: '', tea: '', perform: '', misc: '',
  pt: '', pf: '', gpa: '', mealDed: '', loanEmi: '',
  loan1: '', esic: '', cant: '', othersDed: '',
  rent: '', bonus: '', mobile: '',
  ot: MONTHS.map(() => ''),
  incentives: MONTHS.map(() => ''),
});

export default function SalariedLoanCalculator() {
  const [applicants, setApplicants] = useState([emptyApplicant('Applicant')]);
  const [loanAmt, setLoanAmt] = useState('');
  const [term, setTerm] = useState('');
  const [roi, setRoi] = useState('');
  const [result, setResult] = useState(null);
  const [activeApplicant, setActiveApplicant] = useState(0);

  const updateApplicant = (idx, field, value) => {
    setApplicants(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const updateVariable = (idx, type, monthIdx, value) => {
    setApplicants(prev => {
      const updated = [...prev];
      const arr = [...updated[idx][type]];
      arr[monthIdx] = value;
      updated[idx] = { ...updated[idx], [type]: arr };
      return updated;
    });
  };

  const calcApplicant = (app, isCoApp = false) => {
    const n = (v) => parseFloat(v) || 0;
    //Gross Salary = Basic + HRA + Others + Medical + Conveyance + (Misc Salary + Tea + Performance + Misc) [if co-applicant]
    const grossSalary = n(app.basic) + n(app.hra) + n(app.others) + n(app.medical) + n(app.conveyance) +
      (isCoApp ? n(app.miscSalary) + n(app.tea) + n(app.perform) + n(app.misc) : 0);

     // Deductions = (PF + PT + ESIC + Canteen + Loan EMI + Others) [if co-applicant] OR (PT + PF + GPA + Meal Deduction + 50% of Loan EMI) [if applicant]
    const deductions = isCoApp
      ? n(app.pf) + n(app.pt) + n(app.esic) + n(app.cant) + n(app.loan1) + n(app.othersDed)
      : n(app.pt) + n(app.pf) + n(app.gpa) + n(app.mealDed) + n(app.loanEmi);

    const netSalary = grossSalary - deductions;

    // Annual components /2 
    const annualTotal = n(app.rent) + n(app.bonus) + n(app.mobile);
    const annualMonthly = annualTotal / 2;

    // Variable income
    const totalOT = app.ot.reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const totalIncentives = app.incentives.reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const monthlyOT = totalOT / 12;
    const monthlyIncentives = totalIncentives / 12;

    const totalNetIncome = netSalary + annualMonthly + monthlyOT + monthlyIncentives;

    return { grossSalary, deductions, netSalary, annualMonthly, monthlyOT, monthlyIncentives, totalNetIncome };
  };

  const calculate = () => {
    const appCalc = calcApplicant(applicants[0], false);
    const coAppCalc = applicants.length > 1 ? calcApplicant(applicants[1], true) : null;

    const combinedIncome = appCalc.totalNetIncome + (coAppCalc ? coAppCalc.totalNetIncome : 0);

    // EMI calculation
    const r = (parseFloat(roi) || 0) / 12 / 100;
    const n = (parseFloat(term) || 0) * 12;
    const P = parseFloat(loanAmt) || 0;

    let emi = 0;
    if (r > 0 && n > 0 && P > 0) {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const mlsc = combinedIncome > 0 ? emi / combinedIncome : 0;

    // Loan eligibility based on income (max 50% FOIR)
    const maxEmi = combinedIncome * 0.5;
    let eligibleLoan = 0;
    if (r > 0 && n > 0) {
      eligibleLoan = maxEmi * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    }

    setResult({ appCalc, coAppCalc, combinedIncome, emi, mlsc, eligibleLoan });
  };

  const addCoApplicant = () => {
    if (applicants.length < 2) {
      setApplicants([...applicants, emptyApplicant('Co-Applicant')]);
      setActiveApplicant(1);
    }
  };

  const removeCoApplicant = () => {
    setApplicants([applicants[0]]);
    setActiveApplicant(0);
  };

  const app = applicants[activeApplicant];
  const isCoApp = activeApplicant === 1;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💼 Salaried Loan Calculator</h1>
          <p style={styles.sub}>Calculate loan eligibility for salaried applicants based on salary slip</p>
        </div>
        <button style={styles.printBtn} onClick={() => window.print()}>📄 Print / PDF</button>
      </div>

      {/* Applicant Tabs */}
      <div style={styles.tabRow}>
        {applicants.map((a, i) => (
          <button key={i}
            style={{ ...styles.tab, ...(activeApplicant === i ? styles.tabActive : {}) }}
            onClick={() => setActiveApplicant(i)}>
            👤 {a.label}
          </button>
        ))}
        {applicants.length < 2 && (
          <button style={styles.addCoBtn} onClick={addCoApplicant}>+ Add Co-Applicant</button>
        )}
        {applicants.length > 1 && activeApplicant === 1 && (
          <button style={styles.removeBtn} onClick={removeCoApplicant}>✕ Remove Co-Applicant</button>
        )}
      </div>

      {/* Name Input */}
      <div style={styles.card}>
        <input
          style={styles.nameInput}
          placeholder={`Enter ${app.label} Name`}
          value={app.name || ''}
          onChange={e => updateApplicant(activeApplicant, 'name', e.target.value)}
        />
      </div>

      {/* Salary Section */}
      <div style={styles.twoGrid}>
        {/* Gross Salary */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💰 Gross Salary Components</h2>
          {[
            { label: 'Basic', field: 'basic' },
            { label: 'HRA', field: 'hra' },
            { label: 'Others', field: 'others' },
            { label: 'Medical', field: 'medical' },
            { label: 'Conveyance', field: 'conveyance' },
            ...(isCoApp ? [
              { label: 'Misc Salary', field: 'miscSalary' },
              { label: 'Tea', field: 'tea' },
              { label: 'Performance', field: 'perform' },
              { label: 'Misc', field: 'misc' },
            ] : []),
          ].map(row => (
            <div key={row.field} style={styles.fieldRow}>
              <label style={styles.fieldLabel}>{row.label}</label>
              <input type="number" style={styles.fieldInput} placeholder="0"
                value={app[row.field]}
                onChange={e => updateApplicant(activeApplicant, row.field, e.target.value)} />
            </div>
          ))}
          <div style={styles.totalRow}>
            <span>Total Gross</span>
            <span style={styles.totalAmt}>{formatCurrency(calcApplicant(app, isCoApp).grossSalary)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>➖ Deductions</h2>
          {(isCoApp ? [
            { label: 'PF', field: 'pf' },
            { label: 'PT', field: 'pt' },
            { label: 'ESIC', field: 'esic' },
            { label: 'Canteen', field: 'cant' },
            { label: 'Loan EMI', field: 'loan1' },
            { label: 'Others', field: 'othersDed' },
          ] : [
            { label: 'PT', field: 'pt' },
            { label: 'PF', field: 'pf' },
            { label: 'GPA', field: 'gpa' },
            { label: 'Meal Deduction', field: 'mealDed' },
            { label: '50% of Loan EMI', field: 'loanEmi' },
          ]).map(row => (
            <div key={row.field} style={styles.fieldRow}>
              <label style={styles.fieldLabel}>{row.label}</label>
              <input type="number" style={styles.fieldInput} placeholder="0"
                value={app[row.field]}
                onChange={e => updateApplicant(activeApplicant, row.field, e.target.value)} />
            </div>
          ))}
          <div style={styles.totalRow}>
            <span>Total Deductions</span>
            <span style={{ ...styles.totalAmt, color: '#e53e3e' }}>{formatCurrency(calcApplicant(app, isCoApp).deductions)}</span>
          </div>
          <div style={{ ...styles.totalRow, background: '#f0fff4', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Net Salary</span>
            <span style={{ ...styles.totalAmt, color: '#38a169' }}>{formatCurrency(calcApplicant(app, isCoApp).netSalary)}</span>
          </div>
        </div>
      </div>

      {/* Annual Components */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📅 Annual Components</h2>
        <div style={styles.threeGrid}>
          {[
            { label: 'Rent', field: 'rent' },
            { label: 'Bonus', field: 'bonus' },
            { label: 'Mobile', field: 'mobile' },
          ].map(row => (
            <div key={row.field}>
              <label style={styles.fieldLabel}>{row.label}</label>
              <input type="number" style={{ ...styles.fieldInput, width: '100%' }} placeholder="0"
                value={app[row.field]}
                onChange={e => updateApplicant(activeApplicant, row.field, e.target.value)} />
            </div>
          ))}
        </div>
        <div style={styles.totalRow}>
          <span>Annual Total / 2 (Monthly equivalent)</span>
          <span style={styles.totalAmt}>{formatCurrency(calcApplicant(app, isCoApp).annualMonthly)}</span>
        </div>
      </div>

      {/* Variable Income */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📊 Variable Income (Last 6 Months)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Sr</th>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>OT</th>
                <th style={styles.th}>Incentives</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{month}</td>
                  <td style={styles.td}>
                    <input type="number" style={styles.cellInput} placeholder="0"
                      value={app.ot[i]}
                      onChange={e => updateVariable(activeApplicant, 'ot', i, e.target.value)} />
                  </td>
                  <td style={styles.td}>
                    <input type="number" style={styles.cellInput} placeholder="0"
                      value={app.incentives[i]}
                      onChange={e => updateVariable(activeApplicant, 'incentives', i, e.target.value)} />
                  </td>
                </tr>
              ))}
              <tr style={{ ...styles.tr, background: '#f8f9ff' }}>
                <td colSpan={2} style={{ ...styles.td, fontWeight: 700 }}>Total</td>
                <td style={{ ...styles.td, fontWeight: 700 }}>{formatCurrency(app.ot.reduce((s, v) => s + (parseFloat(v) || 0), 0))}</td>
                <td style={{ ...styles.td, fontWeight: 700 }}>{formatCurrency(app.incentives.reduce((s, v) => s + (parseFloat(v) || 0), 0))}</td>
              </tr>
              <tr style={styles.tr}>
                <td colSpan={2} style={styles.td}>Monthly Average (÷12)</td>
                <td style={styles.td}>{formatCurrency(app.ot.reduce((s, v) => s + (parseFloat(v) || 0), 0) / 12)}</td>
                <td style={styles.td}>{formatCurrency(app.incentives.reduce((s, v) => s + (parseFloat(v) || 0), 0) / 12)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={styles.totalRow}>
          <span style={{ fontWeight: 700 }}>Total Net Income ({app.label})</span>
          <span style={{ ...styles.totalAmt, fontSize: 18, color: '#0f3460' }}>{formatCurrency(calcApplicant(app, isCoApp).totalNetIncome)}</span>
        </div>
      </div>

      {/* Loan Parameters */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⚙️ Loan Parameters</h2>
        <div style={styles.threeGrid}>
          <div>
            <label style={styles.fieldLabel}>Loan Amount (₹)</label>
            <input type="number" style={{ ...styles.fieldInput, width: '100%' }}
              placeholder="Enter loan amount"
              value={loanAmt} onChange={e => setLoanAmt(e.target.value)} />
          </div>
          <div>
            <label style={styles.fieldLabel}>Tenure (Years)</label>
            <input type="number" style={{ ...styles.fieldInput, width: '100%' }}
              placeholder="e.g. 20"
              value={term} onChange={e => setTerm(e.target.value)} />
          </div>
          <div>
            <label style={styles.fieldLabel}>Rate of Interest (% p.a.)</label>
            <input type="number" style={{ ...styles.fieldInput, width: '100%' }}
              placeholder="e.g. 8.5" step="0.1"
              value={roi} onChange={e => setRoi(e.target.value)} />
          </div>
        </div>
        <button style={styles.calcBtn} onClick={calculate}>🧮 Calculate Eligibility</button>
      </div>

      {/* Result */}
      {result && (
        <div style={styles.resultCard}>
          <h2 style={{ color: '#e2b04a', marginBottom: 20, fontSize: 18 }}>📊 Income & Eligibility Summary</h2>

          {/* Income Summary */}
          <div style={styles.resultGrid}>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Applicant Net Income</p>
              <p style={styles.resultValue}>{formatCurrency(result.appCalc.totalNetIncome)}</p>
            </div>
            {result.coAppCalc && (
              <div style={styles.resultItem}>
                <p style={styles.resultLabel}>Co-Applicant Net Income</p>
                <p style={styles.resultValue}>{formatCurrency(result.coAppCalc.totalNetIncome)}</p>
              </div>
            )}
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Combined Monthly Income</p>
              <p style={styles.resultValue}>{formatCurrency(result.combinedIncome)}</p>
            </div>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>EMI (for entered loan)</p>
              <p style={styles.resultValue}>{formatCurrency(result.emi)}</p>
            </div>
          </div>

          {/* MLSC */}
          <div style={{ ...styles.resultItem, margin: '16px 0', textAlign: 'center' }}>
            <p style={styles.resultLabel}>MLSC Ratio (EMI / Net Income)</p>
            <p style={{ ...styles.resultValue, fontSize: 28 }}>
              {(result.mlsc * 100).toFixed(1)}%
              <span style={{ fontSize: 13, color: result.mlsc <= 0.5 ? '#68d391' : '#fc8181', marginLeft: 8 }}>
                {result.mlsc <= 0.5 ? '✅ Eligible' : '❌ Exceeds 50% FOIR'}
              </span>
            </p>
          </div>

          {/* Eligibility Box */}
          <div style={styles.eligibilityBox}>
            <p style={styles.eligibilityLabel}>🏆 Maximum Loan Eligibility (50% FOIR)</p>
            <p style={styles.eligibilityAmount}>{formatLakh(result.eligibleLoan)}</p>
            <p style={styles.eligibilitySub}>
              Rate: {roi}% | Tenure: {term} years | Max EMI: {formatCurrency(result.combinedIncome * 0.5)}/month
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media print { button { display: none !important; } }
        input:focus { outline: 2px solid #e2b04a; border-color: #e2b04a !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { paddingBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0, fontSize: 14 },
  printBtn: { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  tabRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  tab: { padding: '10px 20px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#f8f9ff', color: '#718096', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  tabActive: { background: '#0f3460', color: '#fff', border: '2px solid #0f3460' },
  addCoBtn: { padding: '10px 20px', borderRadius: 10, border: '2px dashed #38a169', background: '#f0fff4', color: '#38a169', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  removeBtn: { padding: '10px 20px', borderRadius: 10, border: '1px solid #fc8181', background: '#fff5f5', color: '#e53e3e', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px' },
  nameInput: { width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontWeight: 600, boxSizing: 'border-box' },
  twoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 0 },
  threeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 },
  fieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 },
  fieldLabel: { fontSize: 13, color: '#4a5568', minWidth: 120 },
  fieldInput: { padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, width: 130, textAlign: 'right' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #e2e8f0', marginTop: 8 },
  totalAmt: { fontSize: 15, fontWeight: 700, color: '#0f3460' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#1a1a2e' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#fff' },
  tr: { borderBottom: '1px solid #f0f4f8' },
  td: { padding: '8px 14px', fontSize: 13, color: '#2d3748' },
  cellInput: { width: 110, padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12 },
  calcBtn: { width: '100%', padding: 16, background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  resultCard: { background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: 16, padding: 28, marginBottom: 20 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  resultItem: { background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, textAlign: 'center' },
  resultLabel: { color: '#a0aec0', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase' },
  resultValue: { color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 },
  eligibilityBox: { background: 'rgba(226,176,74,0.15)', border: '2px solid #e2b04a', borderRadius: 16, padding: 24, textAlign: 'center' },
  eligibilityLabel: { color: '#e2b04a', fontSize: 13, margin: '0 0 8px', fontWeight: 600 },
  eligibilityAmount: { color: '#fff', fontSize: 44, fontWeight: 800, margin: '0 0 8px' },
  eligibilitySub: { color: '#a0aec0', fontSize: 12, margin: 0 },
};