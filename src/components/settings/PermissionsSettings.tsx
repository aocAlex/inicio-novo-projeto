
import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Save } from 'lucide-react';

interface PermissionConfig {
  id: string;
  label: string;
  description: string;
  category: string;
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  // Clients
  { id: 'clients.create', label: 'Criar Clientes', description: 'Permitir criação de novos clientes', category: 'Clientes' },
  { id: 'clients.read', label: 'Visualizar Clientes', description: 'Permitir visualização de clientes', category: 'Clientes' },
  { id: 'clients.update', label: 'Editar Clientes', description: 'Permitir edição de informações de clientes', category: 'Clientes' },
  { id: 'clients.delete', label: 'Excluir Clientes', description: 'Permitir exclusão de clientes', category: 'Clientes' },
  
  // Processes
  { id: 'processes.create', label: 'Criar Processos', description: 'Permitir criação de novos processos', category: 'Processos' },
  { id: 'processes.read', label: 'Visualizar Processos', description: 'Permitir visualização de processos', category: 'Processos' },
  { id: 'processes.update', label: 'Editar Processos', description: 'Permitir edição de processos', category: 'Processos' },
  { id: 'processes.delete', label: 'Excluir Processos', description: 'Permitir exclusão de processos', category: 'Processos' },
  
  // Templates
  { id: 'templates.create', label: 'Criar Templates', description: 'Permitir criação de novos templates', category: 'Templates' },
  { id: 'templates.read', label: 'Visualizar Templates', description: 'Permitir visualização de templates', category: 'Templates' },
  { id: 'templates.update', label: 'Editar Templates', description: 'Permitir edição de templates', category: 'Templates' },
  { id: 'templates.delete', label: 'Excluir Templates', description: 'Permitir exclusão de templates', category: 'Templates' },
  
  // Petitions
  { id: 'petitions.execute', label: 'Executar Petições', description: 'Permitir execução de petições', category: 'Petições' },
  { id: 'petitions.read', label: 'Visualizar Execuções', description: 'Permitir visualização de execuções', category: 'Petições' },
  
  // Members
  { id: 'members.invite', label: 'Convidar Membros', description: 'Permitir convite de novos membros', category: 'Membros' },
  { id: 'members.remove', label: 'Remover Membros', description: 'Permitir remoção de membros', category: 'Membros' },
  
  // Workspace
  { id: 'workspace.settings', label: 'Configurações', description: 'Permitir acesso às configurações do workspace', category: 'Workspace' },
];

export const PermissionsSettings = () => {
  const { currentWorkspace, currentMember } = useWorkspace();
  const { can } = usePermissions();
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadMembers = async () => {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profile:profiles(id, email, full_name)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error loading members:', error);
    }
  };

  const loadMemberPermissions = async (memberId: string) => {
    try {
      setIsLoading(true);
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const memberPermissions = member.permissions || {};
      const permissionsMap: Record<string, boolean> = {};

      PERMISSION_CONFIGS.forEach(config => {
        permissionsMap[config.id] = memberPermissions[config.id] || false;
      });

      setPermissions(permissionsMap);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedMemberId || !can.manageMembers()) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('workspace_members')
        .update({ permissions })
        .eq('id', selectedMemberId);

      if (error) throw error;

      toast({
        title: "Permissões salvas",
        description: "As permissões foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = (permissionId: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permissionId]: value }));
  };

  const groupedPermissions = PERMISSION_CONFIGS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, PermissionConfig[]>);

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (selectedMemberId) {
      loadMemberPermissions(selectedMemberId);
    }
  }, [selectedMemberId, members]);

  if (!can.manageMembers()) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Você não tem permissão para gerenciar permissões.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Permissões
          </CardTitle>
          <CardDescription>
            Configure permissões específicas para cada membro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label>Selecionar Membro</Label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione um membro</option>
              {members.filter(m => m.role !== 'owner').map((member) => (
                <option key={member.id} value={member.id}>
                  {member.profile?.full_name || member.profile?.email} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {selectedMemberId && (
            <>
              <Separator />
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-medium">{category}</h3>
                      <div className="space-y-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor={permission.id}>{permission.label}</Label>
                              <p className="text-sm text-gray-500">{permission.description}</p>
                            </div>
                            <Switch
                              id={permission.id}
                              checked={permissions[permission.id] || false}
                              onCheckedChange={(value) => handlePermissionChange(permission.id, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <Button onClick={handleSavePermissions} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Permissões
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
