import React, { useState } from 'react';
import toast from 'react-hot-toast';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatLakh = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return formatCurrency(val);
};

const emptyApplicant = () => ({
  name: '',
  netProfit: ['', '', ''],
  depreciation: ['', '', ''],
  salary: ['', '', ''],
  rentalIncome: ['', '', ''],
  interestOnLoan: ['', '', ''],
  lessTax: ['', '', ''],
  yearsCount: 3,
});

export default function LoanCalculator() {
  const [applicants, setApplicants] = useState([emptyApplicant()]);
  const [obligations, setObligations] = useState('');
  const [foir, setFoir] = useState(75);
  const [tenure, setTenure] = useState(240);
  const [rate, setRate] = useState(8.5);
  const [result, setResult] = useState(null);
  const [years] = useState(['A.Y. 24-25', 'A.Y. 23-24', 'A.Y. 22-23']);

  const addApplicant = () => setApplicants([...applicants, emptyApplicant()]);
  const removeApplicant = (i) => setApplicants(applicants.filter((_, idx) => idx !== i));

  const updateApplicant = (idx, field, yearIdx, value) => {
    const updated = [...applicants];
    if (yearIdx !== null) {
      updated[idx][field][yearIdx] = value;
    } else {
      updated[idx][field] = value;
    }
    setApplicants(updated);
  };

  const avg = (arr, count) => {
    const vals = arr.slice(0, count).map(v => parseFloat(v) || 0);
    return vals.reduce((a, b) => a + b, 0) / count;
  };

  const calculate = () => {
    let totalAnnualIncome = 0;

    const applicantResults = applicants.map(app => {
      const n = parseInt(app.yearsCount);
      const netProfit = avg(app.netProfit, n);
      const depreciation = avg(app.depreciation, n);
      const salary = avg(app.salary, n);
      const rentalIncome = avg(app.rentalIncome, n) * 0.5;
      const interestOnLoan = avg(app.interestOnLoan, n);
      const lessTax = avg(app.lessTax, n);

      const eligibleIncome =
        netProfit * 1 +
        depreciation * 1 +
        salary * 1 +
        rentalIncome +
        interestOnLoan * 1 +
        lessTax * 1;

      totalAnnualIncome += eligibleIncome;

      return {
        name: app.name || 'Applicant',
        netProfit, depreciation, salary,
        rentalIncome: rentalIncome * 2,
        interestOnLoan, lessTax,
        eligibleIncome,
      };
    });

    const monthlyIncome = totalAnnualIncome / 12;
    const existingObligations = parseFloat(obligations) || 0;
    const foirDecimal = foir / 100;
    const maxEMI = monthlyIncome * foirDecimal - existingObligations;

    // EMI Factor = PMT(rate/12, tenure, -100000)
    const r = rate / 100 / 12;
    const emiPer100k = (r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1) * 100000;

    const eligibilityAmount = maxEMI / emiPer100k * 100000;

    // Also calculate standard EMI for eligible amount
    const emi = (eligibilityAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);

    setResult({
      applicantResults,
      totalAnnualIncome,
      monthlyIncome,
      existingObligations,
      maxEMI,
      emiPer100k,
      eligibilityAmount,
      emi,
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏦 Loan Eligibility Calculator</h1>
          <p style={styles.sub}>Calculate loan eligibility based on income assessment</p>
        </div>
        <button style={styles.printBtn} onClick={() => window.print()}>📄 Print / PDF</button>
      </div>

      {/* Applicants */}
      {applicants.map((app, idx) => (
        <div key={idx} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={styles.cardTitle}>
              👤 Applicant {idx + 1}
              {idx > 0 && (
                <button style={styles.removeBtn} onClick={() => removeApplicant(idx)}>✕ Remove</button>
              )}
            </h2>
            <div style={styles.yearsToggle}>
              <span style={{ fontSize: 13, color: '#718096', marginRight: 8 }}>Years of ITR:</span>
              {[2, 3].map(y => (
                <button key={y}
                  style={{ ...styles.toggleBtn, ...(parseInt(app.yearsCount) === y ? styles.toggleActive : {}) }}
                  onClick={() => updateApplicant(idx, 'yearsCount', null, y)}>
                  {y} Years
                </button>
              ))}
            </div>
          </div>

          <input
            style={styles.nameInput}
            placeholder="Applicant Name"
            value={app.name}
            onChange={e => updateApplicant(idx, 'name', null, e.target.value)}
          />

          {/* Income Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={{ ...styles.th, width: '30%' }}>Income Head</th>
                  {years.slice(0, app.yearsCount).map(y => (
                    <th key={y} style={styles.th}>{y}</th>
                  ))}
                  <th style={styles.th}>Average</th>
                  <th style={styles.th}>Eligibility %</th>
                  <th style={styles.th}>Eligible Income</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Net Profit', field: 'netProfit', factor: 1.0 },
                  { label: 'Depreciation', field: 'depreciation', factor: 1.0 },
                  { label: 'Salary', field: 'salary', factor: 1.0 },
                  { label: 'Rental Income', field: 'rentalIncome', factor: 0.5 },
                  { label: 'Interest on Loan', field: 'interestOnLoan', factor: 1.0 },
                  { label: 'Less: Tax', field: 'lessTax', factor: 1.0 },
                ].map(row => {
                  const average = avg(app[row.field], app.yearsCount);
                  const eligible = average * row.factor;
                  return (
                    <tr key={row.field} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{row.label}</td>
                      {years.slice(0, app.yearsCount).map((_, yi) => (
                        <td key={yi} style={styles.td}>
                          <input
                            style={styles.cellInput}
                            type="number"
                            placeholder="0"
                            value={app[row.field][yi]}
                            onChange={e => updateApplicant(idx, row.field, yi, e.target.value)}
                          />
                        </td>
                      ))}
                      <td style={{ ...styles.td, color: '#0f3460', fontWeight: 600 }}>
                        {formatCurrency(average)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {row.factor * 100}%
                      </td>
                      <td style={{ ...styles.td, color: '#38a169', fontWeight: 600 }}>
                        {formatCurrency(eligible)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ ...styles.tr, background: '#f8f9ff' }}>
                  <td style={{ ...styles.td, fontWeight: 800 }}>Total Income</td>
                  {years.slice(0, app.yearsCount).map((_, yi) => (
                    <td key={yi} style={{ ...styles.td, fontWeight: 700 }}>
                      {formatCurrency(
                        ['netProfit', 'depreciation', 'salary', 'rentalIncome', 'interestOnLoan', 'lessTax']
                          .reduce((sum, f) => sum + (parseFloat(app[f][yi]) || 0), 0)
                      )}
                    </td>
                  ))}
                  <td style={{ ...styles.td, fontWeight: 800, color: '#0f3460' }}>
                    {formatCurrency(
                      ['netProfit', 'depreciation', 'salary', 'rentalIncome', 'interestOnLoan', 'lessTax']
                        .reduce((sum, f) => sum + avg(app[f], app.yearsCount), 0)
                    )}
                  </td>
                  <td style={styles.td}></td>
                  <td style={{ ...styles.td, fontWeight: 800, color: '#38a169' }}>
                    {formatCurrency(
                      avg(app.netProfit, app.yearsCount) * 1 +
                      avg(app.depreciation, app.yearsCount) * 1 +
                      avg(app.salary, app.yearsCount) * 1 +
                      avg(app.rentalIncome, app.yearsCount) * 0.5 +
                      avg(app.interestOnLoan, app.yearsCount) * 1 +
                      avg(app.lessTax, app.yearsCount) * 1
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <button style={styles.addBtn} onClick={addApplicant}>+ Add Co-Applicant</button>

      {/* Loan Parameters */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⚙️ Loan Parameters</h2>
        <div style={styles.paramsGrid}>
          <div style={styles.paramField}>
            <label style={styles.label}>Existing EMI Obligations (₹/month)</label>
            <input type="number" style={styles.paramInput} placeholder="0"
              value={obligations} onChange={e => setObligations(e.target.value)} />
          </div>
          <div style={styles.paramField}>
            <label style={styles.label}>Max FOIR (%)</label>
            <input type="number" style={styles.paramInput} value={foir}
              onChange={e => setFoir(e.target.value)} />
          </div>
          <div style={styles.paramField}>
            <label style={styles.label}>Tenure (Months)</label>
            <input type="number" style={styles.paramInput} value={tenure}
              onChange={e => setTenure(e.target.value)} />
            <span style={styles.hint}>{(tenure / 12).toFixed(1)} years</span>
          </div>
          <div style={styles.paramField}>
            <label style={styles.label}>Rate of Interest (% per annum)</label>
            <input type="number" style={styles.paramInput} step="0.1" value={rate}
              onChange={e => setRate(e.target.value)} />
          </div>
        </div>

        <button style={styles.calcBtn} onClick={calculate}>
          🧮 Calculate Eligibility
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={styles.resultCard}>
          <h2 style={{ ...styles.cardTitle, color: '#fff' }}>📊 Eligibility Result</h2>

          <div style={styles.resultGrid}>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Total Annual Income</p>
              <p style={styles.resultValue}>{formatLakh(result.totalAnnualIncome)}</p>
            </div>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Appraised Monthly Income</p>
              <p style={styles.resultValue}>{formatCurrency(result.monthlyIncome)}</p>
            </div>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Existing Obligations</p>
              <p style={styles.resultValue}>{formatCurrency(result.existingObligations)}</p>
            </div>
            <div style={styles.resultItem}>
              <p style={styles.resultLabel}>Max EMI Capacity</p>
              <p style={styles.resultValue}>{formatCurrency(result.maxEMI)}</p>
            </div>
          </div>

          <div style={styles.eligibilityBox}>
            <p style={styles.eligibilityLabel}>🏆 Loan Eligibility</p>
            <p style={styles.eligibilityAmount}>{formatLakh(result.eligibilityAmount)}</p>
            <p style={styles.eligibilitySub}>
              EMI: {formatCurrency(result.emi)}/month | Rate: {rate}% | Tenure: {tenure} months ({(tenure/12).toFixed(0)} yrs)
            </p>
          </div>

          {/* Per Applicant Summary */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: '#e2b04a', marginBottom: 12 }}>Applicant wise Income Summary</h3>
            {result.applicantResults.map((a, i) => (
              <div key={i} style={styles.applicantSummary}>
                <span style={{ fontWeight: 700, color: '#fff' }}>{a.name}</span>
                <span style={{ color: '#a0aec0' }}>Annual: {formatLakh(a.eligibleIncome)}</span>
                <span style={{ color: '#e2b04a' }}>Monthly: {formatCurrency(a.eligibleIncome / 12)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media print { button { display: none !important; } }
        input:focus { outline: 2px solid #e2b04a; border-color: #e2b04a; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { paddingBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0, fontSize: 14 },
  printBtn: { padding: '10px 20px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 12 },
  removeBtn: { fontSize: 12, padding: '4px 10px', border: '1px solid #fc8181', background: '#fff5f5', color: '#e53e3e', borderRadius: 6, cursor: 'pointer', marginLeft: 12 },
  yearsToggle: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleBtn: { padding: '6px 14px', borderRadius: 8, border: '2px solid #e2e8f0', background: '#f8f9ff', color: '#718096', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  toggleActive: { background: '#0f3460', color: '#fff', border: '2px solid #0f3460' },
  nameInput: { width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontWeight: 600, marginBottom: 16, boxSizing: 'border-box' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#1a1a2e' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f0f4f8' },
  td: { padding: '10px 14px', fontSize: 13, color: '#2d3748' },
  cellInput: { width: '100%', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', minWidth: 100 },
  addBtn: { padding: '12px 24px', background: '#f0fff4', border: '2px dashed #38a169', color: '#38a169', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 20, width: '100%' },
  paramsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
  paramField: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#718096' },
  paramInput: { padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  hint: { fontSize: 11, color: '#a0aec0' },
  calcBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  resultCard: { background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: 16, padding: 28, marginBottom: 20 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
  resultItem: { background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' },
  resultLabel: { color: '#a0aec0', fontSize: 12, margin: '0 0 8px' },
  resultValue: { color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 },
  eligibilityBox: { background: 'rgba(226,176,74,0.15)', border: '2px solid #e2b04a', borderRadius: 16, padding: 24, textAlign: 'center' },
  eligibilityLabel: { color: '#e2b04a', fontSize: 14, margin: '0 0 8px', fontWeight: 600 },
  eligibilityAmount: { color: '#fff', fontSize: 48, fontWeight: 800, margin: '0 0 8px' },
  eligibilitySub: { color: '#a0aec0', fontSize: 13, margin: 0 },
  applicantSummary: { display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8 },
};