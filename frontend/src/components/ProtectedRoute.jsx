import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user }   = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    const isAdminPath = pathname.startsWith('/admin');
    return <Navigate to={isAdminPath ? '/admin/login' : '/login'} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'org')   return <Navigate to="/org" replace />;
    return <Navigate to="/user" replace />;
  }
  return children;
}
