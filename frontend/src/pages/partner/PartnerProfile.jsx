import React, { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/api';

export default function PartnerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile().then(r => setProfile(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading profile...</div>;
  if (!profile) return <div style={styles.loading}>Profile not found.</div>;

  const fields = [
    { icon: '🏢', label: 'Company', value: profile.company_name },
    { icon: '📱', label: 'Phone', value: profile.phone },
    { icon: '💼', label: 'Business Type', value: profile.business_type },
    { icon: '📍', label: 'City', value: profile.city },
    { icon: '🗺️', label: 'State', value: profile.state },
    { icon: '📮', label: 'Pincode', value: profile.pincode },
    { icon: '🏦', label: 'Bank Account', value: profile.bank_account },
    { icon: '🔢', label: 'IFSC Code', value: profile.ifsc_code },
    { icon: '📋', label: 'PAN Number', value: profile.pan_number },
    { icon: '🧾', label: 'GST Number', value: profile.gst_number },
  ];

  return (
    <div>
      <h1 style={styles.title}>My Profile</h1>

      <div style={styles.profileCard}>
        <div style={styles.hero}>
          <div style={styles.avatar}>{profile.user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={styles.name}>{profile.user?.name}</div>
            <div style={styles.email}>{profile.user?.email}</div>
            <div style={styles.badge}>🤝 Business Partner</div>
          </div>
        </div>
        <div style={styles.joinDate}>
          Joined: {profile.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
        </div>
      </div>

      <div style={styles.grid}>
        {fields.filter(f => f.value).map(f => (
          <div key={f.label} style={styles.field}>
            <div style={styles.fieldIcon}>{f.icon}</div>
            <div>
              <div style={styles.fieldLabel}>{f.label}</div>
              <div style={styles.fieldValue}>{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {profile.address && (
        <div style={styles.addressCard}>
          <div style={styles.fieldLabel}>📍 Address</div>
          <div style={styles.addressVal}>{profile.address}</div>
        </div>
      )}

      {profile.notes && (
        <div style={styles.notesCard}>
          <div style={styles.fieldLabel}>📝 Notes from Admin</div>
          <div style={styles.addressVal}>{profile.notes}</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 18, color: '#718096' },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 24px' },
  profileCard: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
    borderRadius: 20, padding: 32, marginBottom: 24,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  hero: { display: 'flex', alignItems: 'center', gap: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 18,
    background: 'linear-gradient(135deg, #e2b04a, #c9953a)',
    color: '#fff', fontSize: 28, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 },
  email: { color: '#a0aec0', fontSize: 14, marginBottom: 10 },
  badge: { background: 'rgba(226,176,74,0.2)', color: '#e2b04a', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, display: 'inline-block' },
  joinDate: { color: '#a0aec0', fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 16 },
  field: { background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  fieldIcon: { fontSize: 24, flexShrink: 0 },
  fieldLabel: { fontSize: 11, color: '#a0aec0', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 },
  fieldValue: { fontSize: 15, color: '#2d3748', fontWeight: 600 },
  addressCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 16 },
  notesCard: { background: '#fffbf0', border: '1px solid #e2b04a', borderRadius: 12, padding: 20 },
  addressVal: { fontSize: 14, color: '#2d3748', marginTop: 8, lineHeight: 1.6 },
};
