
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Loader2 } from 'lucide-react';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isSuperAdmin, permissions, isLoading, superAdminData } = useSuperAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSuperAdmin, isLoading, navigate]);

  // Check specific permission if required
  const hasRequiredPermission = () => {
    if (!requiredPermission) return true;
    
    switch (requiredPermission) {
      case 'create_workspaces':
        return permissions.canCreateWorkspaces;
      case 'delete_workspaces':
        return permissions.canDeleteWorkspaces;
      case 'access_workspaces':
        return permissions.canAccessWorkspaces;
      case 'manage_users':
        return permissions.canManageUsers;
      case 'view_analytics':
        return permissions.canViewAnalytics;
      case 'modify_system_settings':
        return permissions.canModifySystemSettings;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
          <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasRequiredPermission()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Permissão Insuficiente</h1>
          <p className="mt-2 text-gray-600">
            Você não tem permissão para realizar esta ação.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
