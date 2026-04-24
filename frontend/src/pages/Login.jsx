import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data);
      toast.success(`Welcome back, ${res.data.name}!`);
      navigate(res.data.role === 'admin' ? '/admin/dashboard' : '/partner/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>TP</div>
          <h1 style={styles.brand}>TrustPay Loans</h1>
          <p style={styles.tagline}>Partner CRM Portal</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="partner@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p style={styles.footer}>© 2025 TrustPay Loans. All rights reserved.</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
  },
  logoArea: { textAlign: 'center', marginBottom: 36 },
  logo: {
    width: 64, height: 64, borderRadius: 16,
    background: 'linear-gradient(135deg, #e2b04a, #c9953a)',
    color: '#fff', fontSize: 24, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  brand: { color: '#1a1a2e', fontSize: 24, fontWeight: 800, margin: '0 0 4px' },
  tagline: { color: '#718096', fontSize: 14, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#4a5568' },
  input: {
    padding: '12px 16px', borderRadius: 10, fontSize: 15,
    border: '2px solid #e2e8f0', outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  btn: {
    padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #e2b04a, #c9953a)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    transition: 'transform 0.1s',
    marginTop: 8,
  },
  footer: { textAlign: 'center', color: '#a0aec0', fontSize: 12, marginTop: 32, marginBottom: 0 },
};
