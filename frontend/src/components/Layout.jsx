import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/partners', icon: '🤝', label: 'Partners' },
  { to: '/admin/targets', icon: '🎯', label: 'Targets' },
  { to: '/admin/chat', icon: '🤖', label: 'AI Assistant' },
  { to: '/calculator', icon: '🏦', label: 'Loan Calculator' }, // ✅ added
  { to: '/salaried-calculator', icon: '💼', label: 'Salaried Calculator' },
];

const partnerLinks = [
  { to: '/partner/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/partner/targets', icon: '🎯', label: 'My Targets' },
  { to: '/partner/profile', icon: '👤', label: 'My Profile' },
  { to: '/partner/chat', icon: '🤖', label: 'AI Assistant' },
  { to: '/calculator', icon: '🏦', label: 'Loan Calculator' }, // ✅ added
  { to: '/salaried-calculator', icon: '💼', label: 'Salaried Calculator' },

];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : partnerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 72 : 240 }}>
        <div style={styles.sideTop}>
          <div style={styles.logoRow}>
<div style={styles.logoBox}>
  <img 
    src="/logo.jpeg" 
    alt="TrustPay" 
    style={{ width: '100%', height: '100%', objectFit: 'contain' , transform:'scale(1.1)' }} 
  />
</div>
            {!collapsed && (
              <div>
                <div style={styles.brandName}>TrustPayLoans</div>
                <div style={styles.brandSub}>Loans CRM</div>
              </div>
            )}
          </div>
          <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        {!collapsed && (
          <div style={styles.roleChip}>
            {user?.role === 'admin' ? '🛡️ Admin' : '🤝 Partner'}
          </div>
        )}

        <nav style={styles.nav}>
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                <div style={{ ...styles.navItem, ...(active ? styles.navActive : {}) }}>
                  <span style={styles.navIcon}>{link.icon}</span>
                  {!collapsed && <span style={styles.navLabel}>{link.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sideBottom}>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={styles.userName}>{user?.name}</div>
                <div style={styles.userRole}>{user?.role}</div>
              </div>
            </div>
          )}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            {collapsed ? '🚪' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ ...styles.main, marginLeft: collapsed ? 72 : 240 }}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#f4f7fb' },
  sidebar: {
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0,
    transition: 'width 0.3s ease', zIndex: 100, overflow: 'hidden',
  },
  sideTop: { padding: '24px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
logoBox: {
  width: 56, height: 56, borderRadius: 12,
  background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  overflow: 'hidden',
  padding: 2,

  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
},
  brandName: { color: '#e2b04a', fontSize: 15, fontWeight: 800, lineHeight: 1.2 },
  brandSub: { color: '#718096', fontSize: 11 },
  collapseBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#a0aec0',
    borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  roleChip: {
    margin: '0 16px 16px',
    background: 'rgba(226,176,74,0.15)', border: '1px solid rgba(226,176,74,0.3)',
    borderRadius: 8, padding: '6px 12px', color: '#e2b04a', fontSize: 12, fontWeight: 600,
  },
  nav: { flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 12px', borderRadius: 10, cursor: 'pointer',
    transition: 'background 0.2s', color: '#a0aec0',
  },
  navActive: { background: 'rgba(226,176,74,0.2)', color: '#e2b04a' },
  navIcon: { fontSize: 18, flexShrink: 0 },
  navLabel: { fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' },
  sideBottom: { padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #e2b04a, #c9953a)',
    color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 120 },
  userRole: { color: '#718096', fontSize: 11, textTransform: 'capitalize' },
  logoutBtn: {
    width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: 'rgba(239,68,68,0.15)', color: '#fc8181', fontSize: 13, fontWeight: 600,
  },
  main: { flex: 1, padding: '32px', minHeight: '100vh', transition: 'margin-left 0.3s' },
};