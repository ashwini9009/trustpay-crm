import React, { useEffect, useState } from 'react';
import { getPartnerStats } from '../../services/api';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

export default function PartnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnerStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading your dashboard...</div>;

  return (
    <div>
      <div style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.greeting}>Welcome back! 👋</div>
          <h1 style={styles.heroName}>{stats?.partner_name}</h1>
          <p style={styles.heroCompany}>{stats?.company || 'Business Partner'}</p>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}>
              <div style={styles.heroStatNum}>{stats?.total_targets}</div>
              <div style={styles.heroStatLabel}>Total Targets</div>
            </div>
            <div style={styles.heroStat}>
              <div style={{ ...styles.heroStatNum, color: '#38a169' }}>{stats?.completed_targets}</div>
              <div style={styles.heroStatLabel}>Completed</div>
            </div>
            <div style={styles.heroStat}>
              <div style={{ ...styles.heroStatNum, color: '#e2b04a' }}>{stats?.in_progress}</div>
              <div style={styles.heroStatLabel}>In Progress</div>
            </div>
          </div>
        </div>
        <div style={styles.heroRight}>
          <div style={styles.motivationBox}>
            <div style={styles.motivationIcon}>🏆</div>
            <p style={styles.motivationText}>
              {stats?.completed_targets > 0
                ? `Amazing! You've completed ${stats.completed_targets} target${stats.completed_targets > 1 ? 's' : ''}!`
                : 'Keep pushing! Your first target achievement is just around the corner!'}
            </p>
          </div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>🎯 My Targets</h2>

      {!stats?.targets?.length ? (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 48 }}>🎯</div>
          <p>No targets assigned yet. Check back soon!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {stats.targets.map(t => (
            <div key={t.id} style={{ ...styles.targetCard, border: t.is_completed ? '2px solid #38a169' : '2px solid #f0f4f8' }}>
              {t.is_completed && (
                <div style={styles.completedBanner}>🏆 Target Achieved!</div>
              )}
              <h3 style={styles.targetTitle}>{t.title}</h3>
              <div style={styles.progressSection}>
                <div style={styles.progressNums}>
                  <span style={styles.achieved}>{t.achieved_value.toLocaleString()}</span>
                  <span style={styles.target}> / {t.target_value.toLocaleString()}</span>
                </div>
                <div style={styles.pct}>{t.percentage}%</div>
              </div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${t.percentage}%`,
                  background: t.is_completed ? '#38a169' : 'linear-gradient(90deg, #e2b04a, #f6d365)'
                }} />
              </div>
              {t.reward && (
                <div style={styles.rewardBox}>
                  <span style={styles.rewardIcon}>🎁</span>
                  <span style={styles.rewardText}>{t.reward}</span>
                </div>
              )}
              {t.end_date && (
                <div style={styles.deadline}>
                  ⏰ Due: {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 18, color: '#718096' },
  heroCard: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    borderRadius: 20, padding: 36, marginBottom: 32, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', gap: 24,
    boxShadow: '0 8px 32px rgba(15,52,96,0.3)',
  },
  heroLeft: { flex: 1 },
  greeting: { color: '#a0aec0', fontSize: 14, marginBottom: 6 },
  heroName: { color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 4px' },
  heroCompany: { color: '#e2b04a', fontSize: 16, margin: '0 0 24px' },
  heroStats: { display: 'flex', gap: 32 },
  heroStat: { textAlign: 'center' },
  heroStatNum: { color: '#fff', fontSize: 28, fontWeight: 800 },
  heroStatLabel: { color: '#a0aec0', fontSize: 12, marginTop: 2 },
  heroRight: { flexShrink: 0 },
  motivationBox: {
    background: 'rgba(226,176,74,0.15)', border: '1px solid rgba(226,176,74,0.3)',
    borderRadius: 16, padding: '20px 24px', maxWidth: 260, textAlign: 'center',
  },
  motivationIcon: { fontSize: 36, marginBottom: 10 },
  motivationText: { color: '#e2b04a', fontSize: 13, lineHeight: 1.6, margin: 0, fontWeight: 500 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  targetCard: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative' },
  completedBanner: { background: '#f0fff4', color: '#38a169', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 },
  targetTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px' },
  progressSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  progressNums: { fontSize: 14 },
  achieved: { fontWeight: 700, color: '#1a1a2e', fontSize: 18 },
  target: { color: '#718096' },
  pct: { fontWeight: 800, fontSize: 20, color: '#e2b04a' },
  progressBar: { height: 10, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 100, transition: 'width 0.8s ease' },
  rewardBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#fffbf0', border: '1px solid #e2b04a', borderRadius: 8, padding: '8px 12px', marginBottom: 8 },
  rewardIcon: { fontSize: 16 },
  rewardText: { fontSize: 13, color: '#c9953a', fontWeight: 600 },
  deadline: { fontSize: 12, color: '#a0aec0' },
  emptyCard: { background: '#fff', borderRadius: 16, padding: '60px', textAlign: 'center', color: '#718096', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
};
