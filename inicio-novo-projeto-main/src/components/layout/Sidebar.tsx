
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Scale, 
  FolderOpen, 
  Settings,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Processos', href: '/processes', icon: Scale },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Petições', href: '/petitions', icon: FolderOpen },
  { name: 'Prazos', href: '/deadlines', icon: Calendar },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🧭 Sidebar - Current location:', location.pathname);

  const handleNavigation = (href: string, name: string) => {
    console.log(`🔗 Sidebar - Navigating to ${name} (${href})`);
    try {
      navigate(href);
    } catch (error) {
      console.error(`❌ Sidebar - Navigation error for ${href}:`, error);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        {/* Logo */}
        <div className="flex flex-shrink-0 items-center px-4 mb-8">
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">LegalSaaS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            console.log(`🧭 Sidebar - ${item.name}: current=${location.pathname}, target=${item.href}, active=${isActive}`);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: navIsActive }) => {
                  const active = navIsActive || isActive;
                  console.log(`🔗 NavLink ${item.name}: navIsActive=${navIsActive}, computed=${active}`);
                  return cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  );
                }}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
            <div>Current: {location.pathname}</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
