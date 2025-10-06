import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';
import { Action, Resource, can as canPermission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role | Role[];
  permission?: { action: Action; resource: Resource };
}

export function ProtectedRoute({ children, roles, permission }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if ((roles && !hasRole(roles)) || (permission && !canPermission(permission.action, permission.resource, user?.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}