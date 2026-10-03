import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { Analytics } from './pages/Analytics';
import { Portfolio } from './pages/Portfolio';
import { CustomerPortal } from './pages/CustomerPortal';

import { CustomerProfile } from './pages/CustomerProfile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const OwnerRoute = ({ children }) => {
  const { isAuthenticated, loading, isCustomer } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>


          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

