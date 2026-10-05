import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { Analytics } from './pages/Analytics';
import { CustomerPortal } from './pages/CustomerPortal';

import { CustomerProfile } from './pages/CustomerProfile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const OwnerRoute = ({ children }) => {
  const { isAuthenticated, loading, isCustomer } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0205] text-[#ecdcc9]">
        <div className="w-10 h-10 border-2 border-[rgba(245,230,211,0.15)] border-t-[#c8a47e] rounded-full animate-spin"></div>
        <span className="mt-4 font-editorial tracking-luxury text-xs text-[#baa293] uppercase">Aurelia Private Hub</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isCustomer) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

const CustomerRoute = ({ children }) => {
  const { isAuthenticated, loading, isOwner } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0205] text-[#ecdcc9]">
        <div className="w-10 h-10 border-2 border-[rgba(245,230,211,0.15)] border-t-[#c8a47e] rounded-full animate-spin"></div>
        <span className="mt-4 font-editorial tracking-luxury text-xs text-[#baa293] uppercase">Aurelia Private Hub</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { isCustomer } = useAuth();
  if (isCustomer) {
    return <Navigate to="/portal" replace />;
  }
  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Portal Routes */}
          <Route
            path="/portal"
            element={
              <CustomerRoute>
                <CustomerLayout />
              </CustomerRoute>
            }
          >
            <Route index element={<CustomerPortal />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          {/* Business Owner Layout Routes */}
          <Route
            path="/"
            element={
              <OwnerRoute>
                <Layout />
              </OwnerRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route path="customers" element={<Leads />} />
            <Route path="customers/:id" element={<LeadDetail />} />
            <Route path="leads" element={<Navigate to="/customers" replace />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>


          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

