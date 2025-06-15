
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Scale, 
  FolderOpen, 
  Settings,
  Calendar,
  ClipboardList,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { UserNav } from './UserNav';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    badge: null,
    shortcut: '1'
  },
  { 
    name: 'Clientes', 
    href: '/clients', 
    icon: Users,
    badge: null,
    shortcut: '2'
  },
  { 
    name: 'Processos', 
    href: '/processes', 
    icon: Scale,
    badge: null,
    shortcut: '3'
  },
  { 
    name: 'Templates', 
    href: '/templates', 
    icon: FileText,
    badge: null,
    shortcut: '4'
  },
  { 
    name: 'Petições', 
    href: '/petitions', 
    icon: FolderOpen,
    badge: null,
    shortcut: '5'
  },
  { 
    name: 'Prazos', 
    href: '/deadlines', 
    icon: Calendar,
    badge: null,
    shortcut: '6'
  },
  { 
    name: 'Configurações', 
    href: '/settings', 
    icon: Settings,
    badge: null,
    shortcut: '7'
  },
];

export const ModernSidebar = () => {
  const location = useLocation();
  const { currentWorkspace } = useWorkspace();
  const { state } = useSidebar();

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ClipboardList className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 flex-col gap-0.5 leading-none">
              <span className="font-semibold text-sidebar-foreground">LegalSaaS</span>
              {currentWorkspace && (
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {currentWorkspace.name}
                </span>
              )}
            </div>
          )}
        </div>
        
        {!isCollapsed && currentWorkspace && (
          <div className="px-2 pb-2">
            <WorkspaceSelector />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                               (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      tooltip={isCollapsed ? `${item.name} (${item.shortcut})` : undefined}
                    >
                      <Link to={item.href} className="group flex items-center gap-2">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserNav />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
