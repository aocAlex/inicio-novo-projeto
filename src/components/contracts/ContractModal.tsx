
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { useClients } from '@/hooks/useClients';
import { Contract, CreateContractData } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
  templateId?: string | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ 
  open, 
  onClose, 
  contract, 
  templateId 
}) => {
  const { createContract, updateContract } = useContracts();
  const { getTemplate } = useContractTemplates();
  const { clients, loadClients } = useClients();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    contract_name: '',
    contract_code: '',
    contract_type: '',
    contract_value: '',
    zapsign_open_id: 0,
    zapsign_token: '',
    status: 'pending' as Contract['status'],
    client_id: '',
    notes: ''
  });

  // Carregar clientes quando o modal abrir
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open, loadClients]);

  useEffect(() => {
    const loadTemplateData = async () => {
      if (templateId && open) {
        const template = await getTemplate(templateId);
        if (template) {
          setFormData({
            contract_name: template.contract_name,
            contract_code: '',
            contract_type: template.contract_type || '',
            contract_value: template.contract_value ? template.contract_value.toString() : '',
            zapsign_open_id: 0,
            zapsign_token: '',
            status: template.default_status,
            client_id: '',
            notes: template.notes || ''
          });
        }
      } else if (contract) {
        setFormData({
          contract_name: contract.contract_name,
          contract_code: contract.contract_code || '',
          contract_type: contract.contract_type || '',
          contract_value: contract.contract_value ? contract.contract_value.toString() : '',
          zapsign_open_id: contract.zapsign_open_id,
          zapsign_token: contract.zapsign_token,
          status: contract.status,
          client_id: contract.client_id || '',
          notes: contract.notes || ''
        });
      } else if (!templateId) {
        setFormData({
          contract_name: '',
          contract_code: '',
          contract_type: '',
          contract_value: '',
          zapsign_open_id: 0,
          zapsign_token: '',
          status: 'pending' as Contract['status'],
          client_id: '',
          notes: ''
        });
      }
    };

    loadTemplateData();
  }, [contract, templateId, open, getTemplate]);

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

    if (!formData.client_id) {
      toast({
        title: "Erro", 
        description: "Cliente é obrigatório",
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
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
          status: formData.status,
          client_id: formData.client_id,
          notes: formData.notes
        });
      } else {
        // Criar novo contrato
        const createData: CreateContractData = {
          contract_name: formData.contract_name,
          contract_code: formData.contract_code,
          contract_type: formData.contract_type,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
          zapsign_open_id: formData.zapsign_open_id || Math.floor(Math.random() * 1000000),
          zapsign_token: formData.zapsign_token || `token_${Date.now()}`,
          status: formData.status,
          client_id: formData.client_id,
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

  const getModalTitle = () => {
    if (contract) return 'Editar Contrato';
    if (templateId) return 'Novo Contrato a partir do Template';
    return 'Novo Contrato';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {getModalTitle()}
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
              <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
              <Input
                id="contract_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.contract_value}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_value: e.target.value }))}
                placeholder="Ex: 15000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Contract['status'] }))}
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

            {!contract && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="zapsign_open_id">Open ID</Label>
                  <Input
                    id="zapsign_open_id"
                    type="number"
                    value={formData.zapsign_open_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, zapsign_open_id: parseInt(e.target.value) || 0 }))}
                    placeholder="ID da assinatura (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zapsign_token">Token</Label>
                  <Input
                    id="zapsign_token"
                    value={formData.zapsign_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, zapsign_token: e.target.value }))}
                    placeholder="Token da assinatura (opcional)"
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
