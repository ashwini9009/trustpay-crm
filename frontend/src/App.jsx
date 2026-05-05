import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPartners from './pages/admin/AdminPartners';
import AdminTargets from './pages/admin/AdminTargets';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerTargets from './pages/partner/PartnerTargets';
import PartnerProfile from './pages/partner/PartnerProfile';
import AIChat from './pages/AIChat';
import LoanCalculator from './pages/LoanCalculator';

import SalariedLoanCalculator from './pages/SalariedLoanCalculator';


function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Segoe UI', fontSize: 18, color: '#718096' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/partner/dashboard'} replace />;
  }
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/partner/dashboard'} replace /> : <Login />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/partners" element={<ProtectedRoute requiredRole="admin"><AdminPartners /></ProtectedRoute>} />
      <Route path="/admin/targets" element={<ProtectedRoute requiredRole="admin"><AdminTargets /></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute requiredRole="admin"><AIChat /></ProtectedRoute>} />

      {/* Partner Routes */}
      <Route path="/partner/dashboard" element={<ProtectedRoute requiredRole="partner"><PartnerDashboard /></ProtectedRoute>} />
      <Route path="/partner/targets" element={<ProtectedRoute requiredRole="partner"><PartnerTargets /></ProtectedRoute>} />
      <Route path="/partner/profile" element={<ProtectedRoute requiredRole="partner"><PartnerProfile /></ProtectedRoute>} />
      <Route path="/partner/chat" element={<ProtectedRoute requiredRole="partner"><AIChat /></ProtectedRoute>} />

      {/* ✅ Loan Calculator - accessible by both admin and partner */}
      <Route path="/calculator" element={<ProtectedRoute><LoanCalculator /></ProtectedRoute>} />
      <Route path="/salaried-calculator" element={<ProtectedRoute><SalariedLoanCalculator /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontFamily: 'Segoe UI, sans-serif', fontSize: 14 } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}