
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

  console.log('Sidebar - Current location:', location.pathname);

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">LegalSaaS</span>
          </div>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            console.log(`Sidebar - Checking ${item.name}: href=${item.href}, current=${location.pathname}, isActive=${isActive}`);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => console.log(`Sidebar - Navigating to ${item.href}`)}
                className={({ isActive: navIsActive }) => {
                  const active = navIsActive || isActive;
                  console.log(`Sidebar - NavLink ${item.name}: navIsActive=${navIsActive}, computed=${active}`);
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
      </div>
    </div>
  );
};
