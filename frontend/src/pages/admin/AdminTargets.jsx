import React, { useEffect, useState } from 'react';
import { getTargets, getPartners, createTargetWithImage, updateTarget, deleteTarget } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  partner_id: '', title: '', description: '', target_type: 'loan_amount',
  target_value: '', start_date: '', end_date: '', reward: '',
};

export default function AdminTargets() {
  const [targets, setTargets] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [achievedInput, setAchievedInput] = useState('');

  const load = () => {
    Promise.all([getTargets(), getPartners()]).then(([t, p]) => {
      setTargets(t.data);
      setPartners(p.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      if (imageFile) fd.append('reward_image', imageFile);
      await createTargetWithImage(fd);
      toast.success('Target created! 🎯');
      setShowModal(false);
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create target');
    }
  };

  const handleUpdateAchieved = async () => {
    if (!achievedInput && achievedInput !== 0) return;
    try {
      await updateTarget(updateModal.id, { achieved_value: parseFloat(achievedInput) });
      toast.success('Progress updated! Email sent to partner 📧');
      setUpdateModal(null);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this target?')) return;
    try {
      await deleteTarget(id);
      toast.success('Target deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const getPartnerName = (partnerId) => {
    const p = partners.find(p => p.id === partnerId);
    return p?.user?.name || '—';
  };

  const typeLabels = { loan_amount: '💰 Loan Amount', loans_count: '📋 Loans Count', revenue: '📈 Revenue' };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Targets Management</h1>
          <p style={styles.sub}>{targets.length} targets assigned</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setForm(emptyForm); setEditMode(false); setShowModal(true); }}>
          + Assign Target
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading targets...</div>
      ) : targets.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 48 }}>🎯</div>
          <p>No targets assigned yet. Assign a target to a partner!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {targets.map(t => {
            const pct = t.target_value > 0 ? Math.min((t.achieved_value / t.target_value) * 100, 100) : 0;
            return (
              <div key={t.id} style={{ ...styles.card, border: t.is_completed ? '2px solid #38a169' : '2px solid transparent' }}>
                {t.is_completed && <div style={styles.completedBadge}>🏆 COMPLETED</div>}
                <div style={styles.cardTop}>
                  <div style={styles.typeChip}>{typeLabels[t.target_type] || t.target_type}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={styles.btnSm} onClick={() => { setUpdateModal(t); setAchievedInput(t.achieved_value); }}>Update</button>
                    <button style={{ ...styles.btnSm, color: '#e53e3e', borderColor: '#fed7d7' }} onClick={() => handleDelete(t.id)}>Del</button>
                  </div>
                </div>

                <h3 style={styles.cardTitle}>{t.title}</h3>
                <div style={styles.partnerTag}>👤 {getPartnerName(t.partner_id)}</div>
                {t.description && <p style={styles.desc}>{t.description}</p>}

                {t.reward_image && (
                  <img src={`http://localhost:8000/${t.reward_image}`} alt="reward" style={styles.rewardImg} />
                )}

                <div style={styles.progressSection}>
                  <div style={styles.progressLabels}>
                    <span style={{ fontSize: 13, color: '#4a5568' }}>
                      {t.achieved_value.toLocaleString()} / {t.target_value.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? '#38a169' : '#e2b04a' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${pct}%`, background: pct === 100 ? '#38a169' : 'linear-gradient(90deg, #e2b04a, #f6d365)' }} />
                  </div>
                </div>

                {t.reward && (
                  <div style={styles.rewardTag}>🎁 Reward: {t.reward}</div>
                )}

                {(t.start_date || t.end_date) && (
                  <div style={styles.dateRow}>
                    {t.start_date && <span>📅 From: {new Date(t.start_date).toLocaleDateString('en-IN')}</span>}
                    {t.end_date && <span>⏰ Due: {new Date(t.end_date).toLocaleDateString('en-IN')}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Target Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🎯 Assign New Target</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Partner *</label>
                  <select style={styles.fi} required value={form.partner_id}
                    onChange={e => setForm({ ...form, partner_id: e.target.value })}>
                    <option value="">Select Partner</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.user?.name} — {p.company_name}</option>)}
                  </select>
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Target Type *</label>
                  <select style={styles.fi} value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value })}>
                    <option value="loan_amount">💰 Loan Amount (₹)</option>
                    <option value="loans_count">📋 Loans Count</option>
                    <option value="revenue">📈 Revenue (₹)</option>
                  </select>
                </div>
                <div style={{ ...styles.fg, gridColumn: 'span 2' }}>
                  <label style={styles.fl}>Title *</label>
                  <input style={styles.fi} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q2 Home Loan Target" />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Target Value *</label>
                  <input style={styles.fi} type="number" required value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} placeholder="e.g. 5000000" />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Reward (e.g. Phuket Trip ✈️)</label>
                  <input style={styles.fi} value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} placeholder="Phuket Trip, Cash Prize..." />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Start Date</label>
                  <input style={styles.fi} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>End Date</label>
                  <input style={styles.fi} type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div style={{ ...styles.fg, gridColumn: 'span 2' }}>
                  <label style={styles.fl}>Description</label>
                  <textarea style={{ ...styles.fi, height: 60, resize: 'vertical' }} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ ...styles.fg, gridColumn: 'span 2' }}>
                  <label style={styles.fl}>🖼️ Reward Image (e.g. Phuket trip photo)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fi} />
                  {imagePreview && <img src={imagePreview} alt="preview" style={{ marginTop: 8, height: 120, borderRadius: 8, objectFit: 'cover' }} />}
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Assign Target 🎯</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {updateModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 440 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📈 Update Progress</h2>
              <button style={styles.closeBtn} onClick={() => setUpdateModal(null)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: '#4a5568', marginBottom: 16 }}>
                Updating <strong>{updateModal.title}</strong> for <strong>{getPartnerName(updateModal.partner_id)}</strong>
              </p>
              <p style={{ color: '#718096', fontSize: 13, marginBottom: 16 }}>
                Target: {updateModal.target_value.toLocaleString()} | Current: {updateModal.achieved_value.toLocaleString()}
              </p>
              <label style={styles.fl}>New Achieved Value</label>
              <input style={{ ...styles.fi, marginTop: 6, marginBottom: 20 }} type="number"
                value={achievedInput} onChange={e => setAchievedInput(e.target.value)} />
              <p style={{ fontSize: 12, color: '#a0aec0', marginBottom: 20 }}>
                💡 An automated progress email will be sent to the partner.
                If target is reached, a reward email will be sent!
              </p>
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={() => setUpdateModal(null)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleUpdateAchieved}>Update & Notify 📧</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0 },
  addBtn: { background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative' },
  completedBadge: { position: 'absolute', top: 12, right: 12, background: '#f0fff4', color: '#38a169', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeChip: { background: '#f0f4ff', color: '#4a5568', fontSize: 11, padding: '4px 10px', borderRadius: 100, fontWeight: 600 },
  btnSm: { padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#4a5568', fontSize: 12, cursor: 'pointer' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' },
  partnerTag: { fontSize: 12, color: '#718096', marginBottom: 8 },
  desc: { fontSize: 13, color: '#718096', marginBottom: 12 },
  rewardImg: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12 },
  progressSection: { marginBottom: 12 },
  progressLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  progressBar: { height: 8, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 100, transition: 'width 0.5s' },
  rewardTag: { fontSize: 12, color: '#c9953a', fontWeight: 600, marginBottom: 8 },
  dateRow: { display: 'flex', gap: 12, fontSize: 11, color: '#a0aec0' },
  empty: { textAlign: 'center', padding: '40px', color: '#718096' },
  emptyCard: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 16, color: '#718096', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#718096' },
  modalForm: { padding: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fg: { display: 'flex', flexDirection: 'column', gap: 6 },
  fl: { fontSize: 12, fontWeight: 600, color: '#4a5568' },
  fi: { padding: '10px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { padding: '12px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#718096', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
};
