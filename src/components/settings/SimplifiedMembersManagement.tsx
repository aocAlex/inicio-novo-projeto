
import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { WorkspaceMember, WorkspaceInvitation } from '@/types/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Trash2, Mail, Crown, AlertTriangle } from 'lucide-react';
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

export const SimplifiedMembersManagement = () => {
  const { currentWorkspace, isOwner } = useWorkspace();
  const { loading, loadMembers, addMember, removeMember, loadInvitations, cancelInvitation } = useWorkspaceMembers();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<(WorkspaceMember & { profile: any })[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const loadData = async () => {
    if (!currentWorkspace) return;

    try {
      const [membersData, invitationsData] = await Promise.all([
        loadMembers(currentWorkspace.id),
        loadInvitations(currentWorkspace.id)
      ]);
      
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !isOwner || !inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      await addMember(currentWorkspace.id, inviteEmail.trim(), currentWorkspace.owner_id);
      setInviteEmail('');
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Nenhuma workspace selecionada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Member - Only for Owners */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Membro
            </CardTitle>
            <CardDescription>
              Convide pessoas para colaborar na sua workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do membro</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Adicionar Membro
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations - Only for Owners */}
      {isOwner && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convites Pendentes ({invitations.length})
            </CardTitle>
            <CardDescription>
              Convites enviados aguardando aceitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Enviado em {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pendente</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros ({members.length + 1}) {/* +1 para o owner */}
          </CardTitle>
          <CardDescription>
            {isOwner ? 'Gerencie os membros da workspace' : 'Membros da workspace'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Owner sempre aparece primeiro */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Crown className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Proprietário</p>
                    <p className="text-sm text-gray-500">Controle total da workspace</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">OWNER</Badge>
              </div>

              {/* Membros */}
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
                      <p className="text-sm text-gray-500">{member.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">MEMBER</Badge>
                    {isOwner && (
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
                              Tem certeza que deseja remover este membro? Ele perderá acesso à workspace.
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

              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Nenhum membro ainda</p>
                  {isOwner && (
                    <p className="text-sm">Adicione membros para colaborar na workspace</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Workspace - Only for Members */}
      {!isOwner && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Sair da Workspace
            </CardTitle>
            <CardDescription>
              Remover seu acesso a esta workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Ao sair, você perderá acesso a todos os dados desta workspace.
            </p>
            <Button variant="destructive">
              Sair da Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
