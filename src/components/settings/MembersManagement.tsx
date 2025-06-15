import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceMember } from '@/types/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Trash2, Mail, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const MembersManagement = () => {
  const { currentWorkspace, currentMember } = useWorkspace();
  const { can } = usePermissions();
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [orphanedMembers, setOrphanedMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer' as 'owner' | 'admin' | 'editor' | 'viewer',
  });

  const loadMembers = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      
      console.log('Loading members for workspace:', currentWorkspace.id);
      
      // First get workspace members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (membersError) {
        console.error('Error loading workspace members:', membersError);
        throw membersError;
      }

      console.log('Found workspace members:', membersData?.length || 0);

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        setOrphanedMembers([]);
        return;
      }

      // Get profiles for each member
      const memberIds = membersData.map(member => member.user_id);
      console.log('Looking for profiles for user IDs:', memberIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', memberIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        // Continue even if profiles fail to load
      }

      console.log('Found profiles:', profilesData?.length || 0);

      // Separate members with and without profiles
      const validMembers: WorkspaceMember[] = [];
      const orphaned: any[] = [];

      membersData.forEach(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        
        if (profile) {
          // Member has a valid profile
          validMembers.push({
            id: member.id,
            workspace_id: member.workspace_id,
            user_id: member.user_id,
            role: member.role as 'owner' | 'admin' | 'editor' | 'viewer',
            status: member.status as 'active' | 'pending' | 'suspended',
            permissions: typeof member.permissions === 'object' && member.permissions !== null ? member.permissions as Record<string, any> : {},
            last_activity: member.last_activity,
            created_at: member.created_at,
            profile: {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            },
          });
        } else {
          // Member doesn't have a profile (orphaned)
          console.warn('Orphaned member found:', member.user_id);
          orphaned.push({
            ...member,
            reason: 'Profile not found'
          });
        }
      });

      console.log('Valid members:', validMembers.length);
      console.log('Orphaned members:', orphaned.length);

      setMembers(validMembers);
      setOrphanedMembers(orphaned);

      // Show warning if there are orphaned members
      if (orphaned.length > 0) {
        toast({
          title: "Membros órfãos encontrados",
          description: `${orphaned.length} membro(s) sem perfil válido foram encontrados`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error loading members:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOrphanedMembers = async () => {
    if (!currentWorkspace || orphanedMembers.length === 0) return;

    try {
      const orphanedIds = orphanedMembers.map(member => member.id);
      
      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'suspended' })
        .in('id', orphanedIds);

      if (error) throw error;

      toast({
        title: "Membros órfãos removidos",
        description: `${orphanedMembers.length} membro(s) órfão(s) foram removidos`,
      });

      // Reload members
      loadMembers();
    } catch (error: any) {
      console.error('Error cleaning up orphaned members:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membros órfãos",
        variant: "destructive",
      });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !can.manageMembers()) return;

    try {
      setIsInviting(true);
      const { error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: currentWorkspace.id,
          email: inviteForm.email,
          role: inviteForm.role,
          invited_by: currentMember?.user_id,
        });

      if (error) throw error;

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteForm.email}`,
      });

      setInviteForm({ email: '', role: 'viewer' });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!can.removeMembers()) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'suspended' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "Membro foi removido do workspace",
      });

      loadMembers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
    }
  }, [currentWorkspace]);

  if (!can.manageMembers()) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Você não tem permissão para gerenciar membros.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orphaned Members Warning */}
      {orphanedMembers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Membros Órfãos Detectados
            </CardTitle>
            <CardDescription className="text-orange-700">
              {orphanedMembers.length} membro(s) sem perfil válido encontrado(s). 
              Estes podem ser usuários que foram excluídos do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-4">
              {orphanedMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-sm">ID: {member.user_id}</p>
                    <p className="text-xs text-gray-500">Função: {getRoleLabel(member.role)}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-700">
                    Órfão
                  </Badge>
                </div>
              ))}
            </div>
            <Button 
              onClick={cleanupOrphanedMembers}
              variant="outline" 
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Remover Membros Órfãos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Membro
          </CardTitle>
          <CardDescription>
            Convide novos membros para colaborar no workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Convite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros ({members.length})
          </CardTitle>
          <CardDescription>
            Gerencie os membros e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || 'Nome não informado'}
                      </p>
                      <p className="text-sm text-gray-500">{member.profile?.email || 'Email não disponível'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    {member.role !== 'owner' && can.removeMembers() && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover membro</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este membro? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
