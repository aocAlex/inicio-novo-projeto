
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
import { Loader2, UserPlus, Users, Trash2, Mail, AlertTriangle, RefreshCw } from 'lucide-react';
import { cleanupOrphanedMembers } from '@/utils/membershipCleanup';
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
  const [orphanedCount, setOrphanedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
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
      
      // Usar a view valid_workspace_members para obter apenas membros válidos
      const { data: validMembersData, error: validMembersError } = await supabase
        .from('valid_workspace_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (validMembersError) {
        console.error('Error loading valid members:', validMembersError);
        throw validMembersError;
      }

      // Buscar total de membros para comparação
      const { data: allMembersData, error: allMembersError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (allMembersError) {
        console.error('Error loading all members:', allMembersError);
      }

      const totalMembers = allMembersData?.length || 0;
      const validMembers = validMembersData?.length || 0;
      const orphanedMembers = totalMembers - validMembers;

      setOrphanedCount(orphanedMembers);

      // Mapear membros válidos
      const mappedMembers: WorkspaceMember[] = validMembersData?.map(member => ({
        id: member.member_id,
        workspace_id: member.workspace_id,
        user_id: member.user_id,
        role: member.role as 'owner' | 'admin' | 'editor' | 'viewer',
        status: member.status as 'active' | 'pending' | 'suspended',
        permissions: typeof member.permissions === 'object' && member.permissions !== null ? member.permissions as Record<string, any> : {},
        last_activity: member.last_activity,
        created_at: member.created_at,
        profile: {
          id: member.user_id,
          email: member.email,
          full_name: member.full_name,
          avatar_url: member.avatar_url,
        },
      })) || [];

      console.log('Valid members loaded:', mappedMembers.length);
      console.log('Orphaned members detected:', orphanedMembers);

      setMembers(mappedMembers);

      // Mostrar aviso se há membros órfãos
      if (orphanedMembers > 0) {
        toast({
          title: "Membros órfãos detectados",
          description: `${orphanedMembers} membro(s) sem perfil válido foram encontrados`,
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

  const handleCleanupOrphaned = async () => {
    if (!currentWorkspace || orphanedCount === 0) return;

    try {
      setIsCleaningUp(true);
      
      const result = await cleanupOrphanedMembers(currentWorkspace.id);
      
      if (result.success) {
        toast({
          title: "Limpeza concluída",
          description: `${result.removedCount} membro(s) órfão(s) foram removidos`,
        });
        
        // Recarregar membros
        await loadMembers();
      } else {
        throw new Error('Falha na limpeza de membros órfãos');
      }
    } catch (error: any) {
      console.error('Error cleaning up orphaned members:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membros órfãos",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
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
      {orphanedCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Membros Órfãos Detectados
            </CardTitle>
            <CardDescription className="text-orange-700">
              {orphanedCount} membro(s) sem perfil válido encontrado(s). 
              Estes podem ser usuários que foram excluídos do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button 
                onClick={handleCleanupOrphaned}
                disabled={isCleaningUp}
                variant="outline" 
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {isCleaningUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Remover Membros Órfãos
                  </>
                )}
              </Button>
              <Button 
                onClick={loadMembers}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
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
