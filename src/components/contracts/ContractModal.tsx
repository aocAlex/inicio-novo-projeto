
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Contract, CreateContractData } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ open, onClose, contract }) => {
  const { createContract, updateContract } = useContracts();
  const { clients } = useClients();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    contract_name: '',
    contract_code: '',
    contract_type: '',
    zapsign_open_id: 0,
    zapsign_token: '',
    status: 'pending' as const,
    client_id: '',
    notes: ''
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        contract_name: contract.contract_name,
        contract_code: contract.contract_code || '',
        contract_type: contract.contract_type || '',
        zapsign_open_id: contract.zapsign_open_id,
        zapsign_token: contract.zapsign_token,
        status: contract.status,
        client_id: contract.client_id || '',
        notes: contract.notes || ''
      });
    } else {
      setFormData({
        contract_name: '',
        contract_code: '',
        contract_type: '',
        zapsign_open_id: 0,
        zapsign_token: '',
        status: 'pending',
        client_id: '',
        notes: ''
      });
    }
  }, [contract, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contract_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do contrato é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (contract) {
        // Atualizar contrato existente
        await updateContract(contract.id, {
          contract_name: formData.contract_name,
          contract_code: formData.contract_code,
          contract_type: formData.contract_type,
          status: formData.status,
          client_id: formData.client_id || undefined,
          notes: formData.notes
        });
      } else {
        // Criar novo contrato
        const createData: CreateContractData = {
          contract_name: formData.contract_name,
          contract_code: formData.contract_code,
          contract_type: formData.contract_type,
          zapsign_open_id: formData.zapsign_open_id || Math.floor(Math.random() * 1000000),
          zapsign_token: formData.zapsign_token || `token_${Date.now()}`,
          status: formData.status,
          client_id: formData.client_id || undefined,
          notes: formData.notes
        };
        
        await createContract(createData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_name">Nome do Contrato *</Label>
              <Input
                id="contract_name"
                value={formData.contract_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_name: e.target.value }))}
                placeholder="Ex: Contrato de Prestação de Serviços"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_code">Código do Contrato</Label>
              <Input
                id="contract_code"
                value={formData.contract_code}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_code: e.target.value }))}
                placeholder="Ex: CTR-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">Tipo de Contrato</Label>
              <Input
                id="contract_type"
                value={formData.contract_type}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
                placeholder="Ex: Prestação de Serviços"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="signed">Assinado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente selecionado</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!contract && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="zapsign_open_id">ZapSign Open ID</Label>
                  <Input
                    id="zapsign_open_id"
                    type="number"
                    value={formData.zapsign_open_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, zapsign_open_id: parseInt(e.target.value) || 0 }))}
                    placeholder="ID do ZapSign (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zapsign_token">ZapSign Token</Label>
                  <Input
                    id="zapsign_token"
                    value={formData.zapsign_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, zapsign_token: e.target.value }))}
                    placeholder="Token do ZapSign (opcional)"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o contrato..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : contract ? 'Atualizar' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
