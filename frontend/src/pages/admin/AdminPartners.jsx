import React, { useEffect, useState } from 'react';
import { getPartners, createPartner, updatePartner, deletePartner } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', email: '', password: '', company_name: '', phone: '',
  address: '', city: '', state: '', pincode: '', business_type: '',
  pan_number: '', gst_number: '', bank_account: '', ifsc_code: '', notes: '',
};

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewPartner, setViewPartner] = useState(null);
  const [search, setSearch] = useState('');

  const loadPartners = () => {
    getPartners().then(r => setPartners(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadPartners(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updatePartner(editId, form);
        toast.success('Partner updated successfully!');
      } else {
        await createPartner(form);
        toast.success('Partner added! Welcome email sent 📧');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditMode(false);
      loadPartners();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.user?.name || '', email: p.user?.email || '', password: '',
      company_name: p.company_name || '', phone: p.phone || '',
      address: p.address || '', city: p.city || '', state: p.state || '',
      pincode: p.pincode || '', business_type: p.business_type || '',
      pan_number: p.pan_number || '', gst_number: p.gst_number || '',
      bank_account: p.bank_account || '', ifsc_code: p.ifsc_code || '',
      notes: p.notes || '',
    });
    setEditId(p.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete partner "${name}"? This cannot be undone.`)) return;
    try {
      await deletePartner(id);
      toast.success('Partner deleted');
      loadPartners();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filtered = partners.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Business Partners</h1>
          <p style={styles.sub}>{partners.length} partners registered</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setForm(emptyForm); setEditMode(false); setShowModal(true); }}>
          + Add Partner
        </button>
      </div>

      <div style={styles.searchBar}>
        <input style={styles.searchInput} placeholder="🔍  Search by name, company, city..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={styles.empty}>Loading partners...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 48 }}>🤝</div>
          <p>No partners found. Add your first business partner!</p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Name', 'Company', 'Email', 'Phone', 'City', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={styles.avatar}>{p.user?.name?.[0]?.toUpperCase()}</div>
                      {p.user?.name}
                    </div>
                  </td>
                  <td style={styles.td}>{p.company_name || '—'}</td>
                  <td style={styles.td}>{p.user?.email}</td>
                  <td style={styles.td}>{p.phone || '—'}</td>
                  <td style={styles.td}>{p.city || '—'}</td>
                  <td style={styles.td}>{p.business_type || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: p.is_active ? '#f0fff4' : '#fff5f5', color: p.is_active ? '#38a169' : '#e53e3e' }}>
                      {p.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={styles.btnView} onClick={() => setViewPartner(p)}>View</button>
                      <button style={styles.btnEdit} onClick={() => handleEdit(p)}>Edit</button>
                      <button style={styles.btnDel} onClick={() => handleDelete(p.id, p.user?.name)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editMode ? '✏️ Edit Partner' : '➕ Add New Partner'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                {[
                  { key: 'name', label: 'Full Name *', type: 'text', required: true },
                  { key: 'email', label: 'Email *', type: 'email', required: !editMode },
                  { key: 'password', label: editMode ? 'New Password (leave blank to keep)' : 'Password *', type: 'password', required: !editMode },
                  { key: 'company_name', label: 'Company Name', type: 'text' },
                  { key: 'phone', label: 'Phone', type: 'text' },
                  { key: 'business_type', label: 'Business Type', type: 'text' },
                  { key: 'city', label: 'City', type: 'text' },
                  { key: 'state', label: 'State', type: 'text' },
                  { key: 'pincode', label: 'Pincode', type: 'text' },
                  { key: 'pan_number', label: 'PAN Number', type: 'text' },
                  { key: 'gst_number', label: 'GST Number', type: 'text' },
                  { key: 'bank_account', label: 'Bank Account', type: 'text' },
                  { key: 'ifsc_code', label: 'IFSC Code', type: 'text' },
                ].map(f => (
                  <div key={f.key} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{f.label}</label>
                    <input
                      style={styles.fieldInput}
                      type={f.type}
                      required={f.required}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
                <div style={{ ...styles.fieldGroup, gridColumn: 'span 2' }}>
                  <label style={styles.fieldLabel}>Address</label>
                  <input style={styles.fieldInput} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div style={{ ...styles.fieldGroup, gridColumn: 'span 2' }}>
                  <label style={styles.fieldLabel}>Notes</label>
                  <textarea style={{ ...styles.fieldInput, height: 70, resize: 'vertical' }} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>{editMode ? 'Update Partner' : 'Add Partner & Send Email'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewPartner && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 560 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>👤 Partner Details</h2>
              <button style={styles.closeBtn} onClick={() => setViewPartner(null)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={styles.viewHeader}>
                <div style={styles.viewAvatar}>{viewPartner.user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={styles.viewName}>{viewPartner.user?.name}</div>
                  <div style={styles.viewEmail}>{viewPartner.user?.email}</div>
                </div>
              </div>
              <div style={styles.detailGrid}>
                {[
                  ['Company', viewPartner.company_name],
                  ['Phone', viewPartner.phone],
                  ['Business Type', viewPartner.business_type],
                  ['City', viewPartner.city],
                  ['State', viewPartner.state],
                  ['Pincode', viewPartner.pincode],
                  ['PAN', viewPartner.pan_number],
                  ['GST', viewPartner.gst_number],
                  ['Bank Account', viewPartner.bank_account],
                  ['IFSC', viewPartner.ifsc_code],
                ].map(([k, v]) => v ? (
                  <div key={k} style={styles.detailItem}>
                    <div style={styles.detailKey}>{k}</div>
                    <div style={styles.detailVal}>{v}</div>
                  </div>
                ) : null)}
              </div>
              {viewPartner.notes && (
                <div style={{ marginTop: 16, background: '#f8f9ff', padding: 16, borderRadius: 10 }}>
                  <div style={styles.detailKey}>Notes</div>
                  <div style={styles.detailVal}>{viewPartner.notes}</div>
                </div>
              )}
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
  addBtn: {
    background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  searchBar: { marginBottom: 20 },
  searchInput: {
    width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
    border: '2px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  tableCard: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9ff' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f0f4f8', transition: 'background 0.1s' },
  td: { padding: '14px 16px', fontSize: 13, color: '#2d3748' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
    color: '#e2b04a', fontWeight: 700, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badge: { padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 },
  btnView: { padding: '6px 10px', borderRadius: 6, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontSize: 12, cursor: 'pointer' },
  btnEdit: { padding: '6px 10px', borderRadius: 6, border: '1px solid #fef3cd', background: '#fffbf0', color: '#c9953a', fontSize: 12, cursor: 'pointer' },
  btnDel: { padding: '6px 10px', borderRadius: 6, border: '1px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontSize: 12, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px', color: '#718096' },
  emptyCard: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 16, color: '#718096', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#718096' },
  modalForm: { padding: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#4a5568' },
  fieldInput: { padding: '10px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { padding: '12px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#718096', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  viewHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: 12 },
  viewAvatar: { width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  viewName: { color: '#fff', fontWeight: 700, fontSize: 18 },
  viewEmail: { color: '#a0aec0', fontSize: 13 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  detailItem: { background: '#f8f9ff', borderRadius: 8, padding: '12px 14px' },
  detailKey: { fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 },
  detailVal: { fontSize: 14, color: '#2d3748', fontWeight: 500 },
};
