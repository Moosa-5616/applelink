import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-text-secondary">Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page while saving the attempt link
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !role && location.pathname !== '/select-role') {
    // Authenticated but role not chosen yet
    return <Navigate to="/select-role" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role not authorized, send back to home/dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
