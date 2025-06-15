
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContractTemplates, ContractTemplate, CreateContractTemplateData } from '@/hooks/useContractTemplates';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ContractTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: ContractTemplate | null;
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({ 
  open, 
  onClose, 
  template 
}) => {
  const { createTemplate, updateTemplate } = useContractTemplates();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    template_name: '',
    contract_name: '',
    contract_type: '',
    contract_value: '',
    default_status: 'pending' as const,
    notes: ''
  });

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name,
        contract_name: template.contract_name,
        contract_type: template.contract_type || '',
        contract_value: template.contract_value ? template.contract_value.toString() : '',
        default_status: template.default_status,
        notes: template.notes || ''
      });
    } else {
      setFormData({
        template_name: '',
        contract_name: '',
        contract_type: '',
        contract_value: '',
        default_status: 'pending' as const,
        notes: ''
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.template_name.trim() || !formData.contract_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do template e nome do contrato são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const templateData: CreateContractTemplateData = {
        template_name: formData.template_name,
        contract_name: formData.contract_name,
        contract_type: formData.contract_type || undefined,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
        default_status: formData.default_status,
        notes: formData.notes || undefined
      };

      if (template) {
        await updateTemplate(template.id, templateData);
      } else {
        await createTemplate(templateData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template de Contrato' : 'Novo Template de Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">Nome do Template *</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                placeholder="Ex: Contrato Padrão de Serviços"
                required
              />
            </div>

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
              <Label htmlFor="contract_type">Tipo de Contrato</Label>
              <Input
                id="contract_type"
                value={formData.contract_type}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
                placeholder="Ex: Prestação de Serviços"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_value">Valor Padrão (R$)</Label>
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="default_status">Status Padrão</Label>
              <Select
                value={formData.default_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, default_status: value as any }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre este template..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                template ? 'Atualizar Template' : 'Criar Template'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
