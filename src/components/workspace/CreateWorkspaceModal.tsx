
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ open, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da workspace é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.name.length < 2 || formData.name.length > 100) {
      toast({
        title: "Erro",
        description: "Nome deve ter entre 2 e 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createWorkspace(formData);
      
      // Reset form
      setFormData({ name: '', description: '' });
      onClose();
      
      toast({
        title: "Sucesso",
        description: "Workspace criada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar workspace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', description: '' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Workspace</DialogTitle>
          <DialogDescription>
            Crie uma nova workspace para organizar seus casos e equipe.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome da workspace"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
                required
              />
              <p className="text-sm text-gray-500">
                {formData.name.length}/100 caracteres
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da workspace (opcional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
