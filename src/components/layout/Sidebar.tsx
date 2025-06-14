
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  Settings,
  PlusCircle,
  BookOpen,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { can } = usePermissions();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: () => true,
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      permission: can.readClient,
    },
    {
      id: 'processes',
      label: 'Processos',
      icon: Briefcase,
      permission: can.readProcess,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: BookOpen,
      permission: can.readTemplate,
    },
    {
      id: 'petitions',
      label: 'Petições',
      icon: FileText,
      permission: can.readPetition,
    },
    {
      id: 'executions',
      label: 'Execuções',
      icon: Zap,
      permission: can.executePetition,
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      permission: can.manageWorkspace,
    },
  ];

  const visibleItems = menuItems.filter(item => item.permission());

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};
