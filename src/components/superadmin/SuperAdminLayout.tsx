
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  FileText,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/superadmin/workspaces', icon: Building2 },
  { name: 'Usuários', href: '/superadmin/users', icon: Users },
  { name: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { name: 'Configurações', href: '/superadmin/settings', icon: Settings },
  { name: 'Logs', href: '/superadmin/logs', icon: FileText },
];

export const SuperAdminLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Shield className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-xl font-bold text-white">SuperAdmin</span>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <Link
              to="/dashboard"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            >
              <ArrowLeft className="mr-3 h-5 w-5" />
              Voltar ao Sistema
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
