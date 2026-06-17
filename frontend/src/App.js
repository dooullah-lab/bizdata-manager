import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f1117' }}>
      <div className="spinner" />
    </div>
  );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const { user, isAdmin } = useAuth();
  return user && isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const PublicRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: '#1e2130', color: '#e2e8f0', border: '1px solid #2d3452', borderRadius: '8px' },
          success: { iconTheme: { primary: '#4ade80', secondary: '#1e2130' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1e2130' } },
        }}
      />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/records"   element={<RecordsPage />} />
            <Route path="/profile"   element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
