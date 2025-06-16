
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { LogOut, Settings, User, Shield, MoreHorizontal } from 'lucide-react';
import { 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

export const UserNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const { state } = useSidebar();

  const isCollapsed = state === 'collapsed';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.user_metadata?.full_name || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {getInitials(user?.user_metadata?.full_name || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {user?.user_metadata?.full_name || 'Usuário'}
                  </p>
                  <p className="w-[180px] truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/superadmin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>SuperAdmin</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.user_metadata?.full_name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-0.5 leading-none text-left">
                <span className="font-medium text-sm truncate">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email}
                </span>
              </div>
              <MoreHorizontal className="h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/superadmin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>SuperAdmin</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
