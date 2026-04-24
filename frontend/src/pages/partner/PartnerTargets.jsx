// PartnerTargets.jsx
import React, { useEffect, useState } from 'react';
import { getMyTargets } from '../../services/api';

export function PartnerTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTargets().then(r => setTargets(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading your targets...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>My Targets</h1>
        <p style={styles.sub}>{targets.length} targets assigned to you</p>
      </div>

      {targets.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 56 }}>🎯</div>
          <p>No targets assigned yet. Check back with your admin!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {targets.map(t => {
            const pct = t.target_value > 0 ? Math.min((t.achieved_value / t.target_value) * 100, 100) : 0;
            return (
              <div key={t.id} style={{ ...styles.card, borderTop: `4px solid ${t.is_completed ? '#38a169' : '#e2b04a'}` }}>
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.status, background: t.is_completed ? '#f0fff4' : '#fffbf0', color: t.is_completed ? '#38a169' : '#c9953a' }}>
                    {t.is_completed ? '✅ Completed' : '🔄 In Progress'}
                  </span>
                  <span style={styles.typeTag}>{t.target_type?.replace('_', ' ')}</span>
                </div>
                <h3 style={styles.cardTitle}>{t.title}</h3>
                {t.description && <p style={styles.desc}>{t.description}</p>}
                {t.reward_image && (
                  <img src={`http://localhost:8000/${t.reward_image}`} alt="reward" style={styles.rewardImg} />
                )}
                <div style={styles.numRow}>
                  <div>
                    <div style={styles.numLabel}>Achieved</div>
                    <div style={styles.numVal}>{t.achieved_value.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={styles.pct}>{pct.toFixed(1)}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.numLabel}>Target</div>
                    <div style={styles.numVal}>{t.target_value.toLocaleString()}</div>
                  </div>
                </div>
                <div style={styles.bar}>
                  <div style={{ ...styles.fill, width: `${pct}%`, background: t.is_completed ? '#38a169' : 'linear-gradient(90deg,#e2b04a,#f6d365)' }} />
                </div>
                {t.reward && (
                  <div style={styles.reward}>🎁 <strong>Reward:</strong> {t.reward}</div>
                )}
                {t.end_date && (
                  <div style={styles.date}>⏰ Deadline: {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 18, color: '#718096' },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  status: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 },
  typeTag: { fontSize: 11, color: '#a0aec0', textTransform: 'capitalize' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' },
  desc: { fontSize: 13, color: '#718096', margin: '0 0 12px', lineHeight: 1.6 },
  rewardImg: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 16 },
  numRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  numLabel: { fontSize: 11, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 2 },
  numVal: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  pct: { fontSize: 28, fontWeight: 800, color: '#e2b04a' },
  bar: { height: 10, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden', marginBottom: 16 },
  fill: { height: '100%', borderRadius: 100, transition: 'width 0.8s ease' },
  reward: { fontSize: 13, color: '#c9953a', background: '#fffbf0', padding: '8px 12px', borderRadius: 8, marginBottom: 8 },
  date: { fontSize: 12, color: '#a0aec0' },
  empty: { background: '#fff', borderRadius: 16, padding: '60px', textAlign: 'center', color: '#718096', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
};

export default PartnerTargets;
