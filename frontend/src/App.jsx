import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Topbar from './components/Topbar';

import Login    from './pages/Login';
import Register from './pages/Register';

import AdminDashboard     from './pages/admin/Dashboard';
import AdminUsers         from './pages/admin/Users';
import AdminOrganizations from './pages/admin/Organizations';
import AdminFavours       from './pages/admin/Favours';
import AdminTransactions  from './pages/admin/Transactions';

import UserDashboard     from './pages/user/Dashboard';
import UserFavours       from './pages/user/Favours';
import UserTransactions  from './pages/user/Transactions';
import UserTransfer      from './pages/user/Transfer';
import UserProfile       from './pages/user/Profile';

import OrgDashboard    from './pages/org/Dashboard';
import OrgTransactions from './pages/org/Transactions';
import OrgProfile      from './pages/org/Profile';
import OrgReward       from './pages/org/Reward';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg text-white relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <Topbar />
      <main className="relative z-10 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'org')   return <Navigate to="/org" replace />;
  return <Navigate to="/user" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminUsers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/organizations" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminOrganizations /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/favours" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminFavours /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminTransactions /></AppLayout>
            </ProtectedRoute>
          } />

          {/* User routes */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['user']}>
              <AppLayout><UserDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/favours" element={
            <ProtectedRoute allowedRoles={['user']}>
              <AppLayout><UserFavours /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/transactions" element={
            <ProtectedRoute allowedRoles={['user']}>
              <AppLayout><UserTransactions /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/transfer" element={
            <ProtectedRoute allowedRoles={['user']}>
              <AppLayout><UserTransfer /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/profile" element={
            <ProtectedRoute allowedRoles={['user']}>
              <AppLayout><UserProfile /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Org routes */}
          <Route path="/org" element={
            <ProtectedRoute allowedRoles={['org']}>
              <AppLayout><OrgDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/org/reward" element={
            <ProtectedRoute allowedRoles={['org']}>
              <AppLayout><OrgReward /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/org/transactions" element={
            <ProtectedRoute allowedRoles={['org']}>
              <AppLayout><OrgTransactions /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/org/profile" element={
            <ProtectedRoute allowedRoles={['org']}>
              <AppLayout><OrgProfile /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#16161F', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
