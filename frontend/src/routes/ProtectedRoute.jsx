import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function getHomeRouteForRole(role) {
  switch (role) {
    case 'SuperAdmin':
      return '/superadmin/dashboard';
    case 'House Holder':
      return '/householder/dashboard';
    case 'Engineer':
      return '/engineer/dashboard';
    case 'Manager':
      return '/manager/dashboard';
    case 'Admin':
    default:
      return '/admin/dashboard';
  }
}

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs font-semibold">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target = getHomeRouteForRole(user.role);
    if (location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
