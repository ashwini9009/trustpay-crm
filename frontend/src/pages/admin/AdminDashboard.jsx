import React, { useEffect, useState } from 'react';
import { getAdminStats, downloadReport } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#e2b04a', '#0f3460', '#16213e', '#38a169', '#e53e3e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const res = await downloadReport(format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `partners_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading('');
    }
  };

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;

  const pieData = [
    { name: 'Completed', value: stats?.completed_targets || 0 },
    { name: 'In Progress', value: (stats?.total_targets - stats?.completed_targets) || 0 },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.sub}>Welcome back! Here's your overview.</p>
          </div>

          {/* ✅ Download Buttons */}
          <div style={styles.downloadSection}>
            <span style={styles.downloadLabel}>📥 Download Report:</span>
            <div style={styles.downloadButtons}>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading === 'pdf'}
                style={{ ...styles.downloadBtn, background: '#e53e3e' }}>
                {downloading === 'pdf' ? '⏳...' : '📄 PDF'}
              </button>
              
              <button
                onClick={() => handleDownload('csv')}
                disabled={downloading === 'csv'}
                style={{ ...styles.downloadBtn, background: '#0f3460' }}>
                {downloading === 'csv' ? '⏳...' : '📋 EXCEL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.grid4}>
        {[
          { label: 'Total Partners', value: stats?.total_partners, icon: '🤝', color: '#0f3460' },
          { label: 'Active Partners', value: stats?.active_partners, icon: '✅', color: '#38a169' },
          { label: 'Total Targets', value: stats?.total_targets, icon: '🎯', color: '#e2b04a' },
          { label: 'Completed Targets', value: stats?.completed_targets, icon: '🏆', color: '#9f7aea' },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.card, borderTop: `4px solid ${s.color}` }}>
            <div style={styles.cardIcon}>{s.icon}</div>
            <div style={{ ...styles.cardValue, color: s.color }}>{s.value ?? 0}</div>
            <div style={styles.cardLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        {/* Top Performers */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>🏅 Top Performers</h2>
          {stats?.top_performers?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.top_performers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="completion_pct" fill="#e2b04a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.empty}>No partner data yet</div>
          )}
        </div>

        {/* Targets Pie */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>🎯 Target Completion</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 16 }}>
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={75} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
            </PieChart>
            <div>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i] }} />
                  <span style={{ fontSize: 13, color: '#4a5568' }}>{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '8px 16px', background: '#f0fff4', borderRadius: 8 }}>
                <span style={{ color: '#38a169', fontWeight: 700, fontSize: 18 }}>{stats?.completion_rate}%</span>
                <span style={{ color: '#718096', fontSize: 12, marginLeft: 4 }}>completion rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Table */}
      <div style={styles.chartCard}>
        <h2 style={styles.chartTitle}>📋 Partner Performance Summary</h2>
        {stats?.top_performers?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Partner</th>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Targets</th>
                <th style={styles.th}>Completed</th>
                <th style={styles.th}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_performers.map((p) => (
                <tr key={p.partner_id} style={styles.tr}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.company || '—'}</td>
                  <td style={styles.td}>{p.targets_count}</td>
                  <td style={styles.td}>{p.completed}</td>
                  <td style={styles.td}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${p.completion_pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#718096' }}>{p.completion_pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>Add partners and assign targets to see data here.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 18, color: '#718096' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0 },
  downloadSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  downloadLabel: { fontSize: 13, color: '#718096', fontWeight: 600 },
  downloadButtons: { display: 'flex', gap: 10 },
  downloadBtn: {
    padding: '10px 18px', border: 'none', borderRadius: 10,
    color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    transition: 'opacity 0.2s', opacity: 1,
  },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  cardIcon: { fontSize: 28, marginBottom: 12 },
  cardValue: { fontSize: 36, fontWeight: 800, lineHeight: 1 },
  cardLabel: { color: '#718096', fontSize: 13, marginTop: 6 },
  chartCard: { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px' },
  empty: { color: '#a0aec0', textAlign: 'center', padding: '40px 0', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9ff' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f0f4f8' },
  td: { padding: '14px 16px', fontSize: 14, color: '#2d3748' },
  progressBar: { height: 6, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden', marginBottom: 4, width: 100 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #e2b04a, #f6d365)', borderRadius: 100, transition: 'width 0.5s' },
};