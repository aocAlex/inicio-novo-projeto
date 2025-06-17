
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ProcessClientModalProps {
  open: boolean;
  onClose: () => void;
  processId: string;
  onSuccess: () => void;
}

export const ProcessClientModal: React.FC<ProcessClientModalProps> = ({
  open,
  onClose,
  processId,
  onSuccess
}) => {
  const { clients, loadClients } = useClients();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    role: 'plaintiff' as 'plaintiff' | 'defendant' | 'witness' | 'other'
  });

  useEffect(() => {
    if (open) {
      loadClients();
      setFormData({
        client_id: '',
        role: 'plaintiff'
      });
    }
  }, [open, loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('process_clients')
        .insert({
          process_id: processId,
          client_id: formData.client_id,
          role: formData.role
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Cliente vinculado",
        description: "Cliente foi vinculado ao processo com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao vincular cliente:', error);
      toast({
        title: "Erro ao vincular cliente",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'plaintiff': return 'Requerente';
      case 'defendant': return 'Requerido';
      case 'witness': return 'Testemunha';
      case 'other': return 'Outro';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Cliente ao Processo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel no Processo</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'plaintiff' | 'defendant' | 'witness' | 'other') => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plaintiff">{getRoleLabel('plaintiff')}</SelectItem>
                <SelectItem value="defendant">{getRoleLabel('defendant')}</SelectItem>
                <SelectItem value="witness">{getRoleLabel('witness')}</SelectItem>
                <SelectItem value="other">{getRoleLabel('other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Vinculando...' : 'Vincular Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
