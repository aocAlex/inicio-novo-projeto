
import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useSimplifiedPermissions } from '@/hooks/useSimplifiedPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, AlertTriangle, Eye } from 'lucide-react';
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

export const WorkspaceSettings = () => {
  const { currentWorkspace, updateWorkspace, isOwner } = useWorkspace();
  const { can } = useSimplifiedPermissions();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentWorkspace?.name || '',
    description: currentWorkspace?.description || '',
    logo_url: currentWorkspace?.logo_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !can.manageWorkspace()) return;

    try {
      setIsLoading(true);
      await updateWorkspace(currentWorkspace.id, formData);
      toast({
        title: "Configurações salvas",
        description: "As configurações da workspace foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Nenhuma workspace selecionada.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Informações da Workspace
          </CardTitle>
          <CardDescription>
            Visualização das informações (apenas proprietário pode editar)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Workspace</Label>
            <Input value={currentWorkspace.name} disabled />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={currentWorkspace.description || ''} disabled rows={3} />
          </div>

          <div className="space-y-2">
            <Label>URL do Logo</Label>
            <Input value={currentWorkspace.logo_url || ''} disabled />
          </div>

          <div className="text-sm text-gray-500 mt-4">
            Apenas o proprietário da workspace pode alterar essas configurações.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Workspace</CardTitle>
          <CardDescription>
            Gerencie as informações básicas da sua workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Workspace</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome da workspace"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrição da workspace"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>

            <Separator />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente sua workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Deletar Workspace</h4>
            <p className="text-sm text-red-600 mb-4">
              Esta ação não pode ser desfeita. Todos os dados, membros e configurações serão permanentemente removidos.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar workspace permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os dados da workspace "{currentWorkspace.name}" 
                    serão permanentemente removidos, incluindo:
                    <br />• Todos os clientes e processos
                    <br />• Templates e execuções
                    <br />• Configurações e membros
                    <br />• Histórico e relatórios
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      toast({
                        title: "Funcionalidade em desenvolvimento",
                        description: "A deleção de workspace será implementada em breve",
                        variant: "destructive",
                      });
                    }}
                  >
                    Sim, deletar permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
